/**
 * Fake Reviews Queue — Redis/Bull
 * Parallel workers generate AI reviews in chunks for /admin/fake-reviews.
 *
 * Names are PRE-ASSIGNED at enqueue time (unique first + last across the whole batch).
 * Workers force those names onto every saved review — AI cannot create duplicates.
 */

const Bull = require("bull");
require("dotenv").config();

const User = require("../models/users");
const Review = require("../models/reviews");
const { fetchJSONFromOpenAI } = require("../additional/openaiHelpers");
const {
  buildFakeReviewsPrompt,
  applyAssignedNames,
  allocateUniqueReviewerNames,
  normalizePersonName,
} = require("../sections/aiblogreviews");
const {
  markChunkStarted,
  markChunkDone,
  markChunkFailed,
  getDefaultParallelWorkers,
  getChunkSize,
} = require("../services/fakeReviewsGenerationProgress");

const {
  getBullRedisConfig,
  getRedisConnectionLabel,
} = require("../config/bullRedis");
const WORKERS = getDefaultParallelWorkers();
const CHUNK = getChunkSize();
const MODEL =
  String(process.env.FAKE_REVIEWS_MODEL || process.env.AIBLOGS_MODEL || "gpt-4o-mini").trim() ||
  "gpt-4o-mini";

const fakeReviewsQueue = new Bull("fakeReviewsQueue", {
  redis: getBullRedisConfig(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "fixed", delay: 10000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

function log(jobId, ...args) {
  console.log(`[fakeReviewsQueue:${jobId}]`, ...args);
}

function extractReviewsArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.reviews)) return raw.reviews;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (raw && typeof raw === "object") {
    const vals = Object.values(raw);
    if (
      vals.length &&
      vals.every((v) => v && typeof v === "object" && (v.reviewText || v.fullName))
    ) {
      return vals;
    }
  }
  return [];
}

function normalizeReviewContent(r, index) {
  let rating = Number(r?.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) rating = 4 + (index % 2);
  rating = Math.round(rating);
  const reviewText = String(r?.reviewText || r?.text || r?.comment || "").trim();
  const image = r?.image ? String(r.image).trim() : "";
  return {
    fullName: normalizePersonName(r?.fullName || r?.name || ""),
    email: String(r?.email || "").trim().toLowerCase(),
    rating,
    reviewText,
    image,
  };
}

async function saveOneReview({ blogId, row }) {
  if (!row.reviewText || row.reviewText.length < 8) {
    throw new Error("Empty review text from AI");
  }
  if (!row.fullName) throw new Error("Missing assigned reviewer name");

  let user = await User.findOne({ email: row.email });
  if (!user) {
    // Prefer matching by exact fullName+type reviewer if email missing/collision risk
    user = new User({
      fullName: row.fullName,
      email: row.email,
      type: 2,
      image: row.image || undefined,
      emailVerified: true,
    });
    try {
      await user.save();
    } catch (err) {
      if (err?.code === 11000) {
        user = await User.findOne({ email: row.email });
        if (!user) throw err;
      } else {
        throw err;
      }
    }
  } else if (row.fullName && user.fullName !== row.fullName) {
    user.fullName = row.fullName;
    try {
      await user.save();
    } catch {
      /* non-fatal */
    }
  }

  const review = new Review({
    user: user._id,
    blog: blogId,
    rating: row.rating,
    reviewText: row.reviewText,
    verified: true,
    status: 1,
  });
  await review.save();
  return review;
}

console.log(
  `[fakeReviewsQueue] registering ${WORKERS} parallel workers · chunk=${CHUNK} · model=${MODEL} (Redis ${getRedisConnectionLabel()})`
);

fakeReviewsQueue.process(WORKERS, async (job) => {
  const {
    userId,
    blogId,
    projectId,
    title,
    exampleNames,
    assignedNames,
    chunkSize,
    chunkIndex,
    totalChunks,
  } = job.data || {};

  const jobId = String(job.id);
  const needed = Math.max(1, Number(chunkSize) || CHUNK);
  const chunkIdx = Number(chunkIndex) || 0;
  const chunksTotal = Math.max(1, Number(totalChunks) || 1);

  const referenceNames =
    Array.isArray(exampleNames) && exampleNames.length
      ? exampleNames.map((n) => String(n).trim()).filter(Boolean)
      : [];

  // Assigned names from enqueue (disjoint across parallel jobs)
  let names = Array.isArray(assignedNames)
    ? assignedNames.map((n) => String(n || "").trim()).filter(Boolean)
    : [];

  // Safety: if an old job has no assignedNames, allocate locally (still unique within chunk)
  if (names.length < needed) {
    const extra = allocateUniqueReviewerNames(needed - names.length, {
      referenceNames: [...referenceNames, ...names],
      salt: chunkIdx * 1000 + Date.now() % 1000,
    });
    names = names.concat(extra).slice(0, needed);
  } else if (names.length > needed) {
    names = names.slice(0, needed);
  }

  await markChunkStarted(blogId, { jobId, chunkSize: needed });
  log(
    jobId,
    `▶ chunk#${chunkIdx}/${chunksTotal} need=${needed} blog=${blogId} names=[${names.join(" | ")}]`
  );

  try {
    await job.progress(10);
    const prompt = buildFakeReviewsPrompt({
      title: String(title || "Blog"),
      assignedNames: names,
      referenceNames,
      needed: names.length,
      chunkIndex: chunkIdx,
      totalChunks: chunksTotal,
    });

    const raw = await fetchJSONFromOpenAI(prompt, "getreviewsfake", {
      userId,
      projectId,
      pageId: `blogreviews_${blogId}`,
      promptFrom: "fakeReviewsQueue",
      promptFor: `fake_reviews::${title}::chunk${chunkIdx}`,
      model: MODEL,
    });

    await job.progress(55);
    let aiRows = extractReviewsArray(raw).map((r, i) => normalizeReviewContent(r, i));

    // Pad with empty content objects if AI returned fewer — names still assigned
    while (aiRows.length < names.length) {
      aiRows.push({
        fullName: "",
        email: "",
        rating: 4,
        reviewText: "",
        image: "",
      });
    }

    // CRITICAL: overwrite whatever names AI invented with pre-assigned unique names
    let rows = applyAssignedNames(aiRows, names);

    // If some reviewText empty, one retry for text only (names stay fixed)
    const missingText = rows.filter((r) => !r.reviewText || r.reviewText.length < 8).length;
    if (missingText > 0) {
      log(jobId, `retrying ${missingText} empty review texts (names locked)`);
      const raw2 = await fetchJSONFromOpenAI(
        buildFakeReviewsPrompt({
          title: String(title || "Blog"),
          assignedNames: names,
          referenceNames,
          needed: names.length,
          chunkIndex: chunkIdx,
          totalChunks: chunksTotal,
        }),
        "getreviewsfake",
        {
          userId,
          projectId,
          pageId: `blogreviews_${blogId}_retry`,
          promptFrom: "fakeReviewsQueue",
          promptFor: `fake_reviews::${title}::retry${chunkIdx}`,
          model: MODEL,
        }
      );
      const retryRows = applyAssignedNames(
        extractReviewsArray(raw2).map((r, i) => normalizeReviewContent(r, i)),
        names
      );
      rows = rows.map((row, i) => {
        if (row.reviewText && row.reviewText.length >= 8) return row;
        const alt = retryRows[i];
        if (alt?.reviewText && alt.reviewText.length >= 8) {
          return { ...row, reviewText: alt.reviewText, rating: alt.rating || row.rating };
        }
        // Last-resort generic text so the unique name still gets saved
        return {
          ...row,
          reviewText: `Really useful read on “${String(title || "this topic").trim()}” — clear, practical, and worth bookmarking.`,
          rating: row.rating || 5,
        };
      });
    }

    // Final lock: names must stay exactly as assigned
    rows = applyAssignedNames(rows, names).filter((r) => r.reviewText && r.reviewText.length >= 8);

    if (!rows.length) {
      throw new Error("OpenAI returned no usable review text");
    }

    await job.progress(75);
    const saved = [];
    const savedNames = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const doc = await saveOneReview({ blogId, row: rows[i] });
        saved.push(doc);
        savedNames.push(rows[i].fullName);
        log(jobId, `saved review ${i + 1}/${rows.length} — ${rows[i].fullName}`);
      } catch (saveErr) {
        console.warn(`[fakeReviewsQueue:${jobId}] save skip:`, saveErr?.message || saveErr);
      }
    }

    if (!saved.length) {
      throw new Error("Failed to save any reviews from this chunk");
    }

    const shortfall = Math.max(0, needed - saved.length);
    await markChunkDone(blogId, {
      jobId,
      saved: saved.length,
      names: savedNames,
    });
    if (shortfall > 0) {
      await markChunkFailed(blogId, {
        jobId: `${jobId}-short`,
        failed: shortfall,
        error: `Only saved ${saved.length}/${needed} in chunk`,
        adjustActive: false,
      });
    }

    await job.progress(100);
    log(jobId, `✔ done saved=${saved.length} names=[${savedNames.join(" | ")}]`);
    return { ok: true, saved: saved.length, shortfall, names: savedNames };
  } catch (err) {
    console.error(`[fakeReviewsQueue:${jobId}] ✖`, err?.message || err);
    throw err;
  }
});

fakeReviewsQueue.on("failed", (job, err) => {
  const attempts = Number(job?.opts?.attempts || 1);
  const made = Number(job?.attemptsMade || 0);
  console.error(
    `[fakeReviewsQueue] failed job=${job?.id} attempt=${made}/${attempts}:`,
    err?.message || err
  );
  if (job?.data?.blogId && made >= attempts) {
    const failed = Math.max(1, Number(job.data.chunkSize) || CHUNK);
    void markChunkFailed(String(job.data.blogId), {
      jobId: String(job.id),
      failed,
      error: err?.message || job.failedReason || String(err),
    });
  }
});

fakeReviewsQueue.on("error", (err) => {
  console.error("[fakeReviewsQueue] queue error:", err?.message || err);
});

module.exports = fakeReviewsQueue;
module.exports.CHUNK = CHUNK;
module.exports.WORKERS = WORKERS;
