/**
 * Fake Reviews Queue — Redis/Bull
 * Parallel workers generate AI reviews in chunks for /admin/fake-reviews.
 */

const Bull = require("bull");
require("dotenv").config();

const User = require("../models/users");
const Review = require("../models/reviews");
const { fetchJSONFromOpenAI } = require("../additional/openaiHelpers");
const {
  markChunkStarted,
  markChunkDone,
  markChunkFailed,
  getDefaultParallelWorkers,
  getChunkSize,
} = require("../services/fakeReviewsGenerationProgress");

const redisHost = process.env.redisHost;
const redisPort = process.env.redisPort;
const WORKERS = getDefaultParallelWorkers();
const CHUNK = getChunkSize();
const MODEL =
  String(process.env.FAKE_REVIEWS_MODEL || process.env.AIBLOGS_MODEL || "gpt-4o-mini").trim() ||
  "gpt-4o-mini";

const fakeReviewsQueue = new Bull("fakeReviewsQueue", {
  redis: { host: redisHost, port: redisPort },
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
    if (vals.length && vals.every((v) => v && typeof v === "object" && (v.reviewText || v.fullName))) {
      return vals;
    }
  }
  return [];
}

function slugEmailLocal(name) {
  return String(name || "reviewer")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40) || "reviewer";
}

function normalizeReviewRow(r, fallbackName, index) {
  const fullName =
    String(r?.fullName || r?.name || fallbackName || `Reader ${index + 1}`)
      .replace(/\s+/g, " ")
      .trim() || `Reader ${index + 1}`;
  let email = String(r?.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    email = `${slugEmailLocal(fullName)}.${Date.now().toString(36)}${index}@example.com`;
  }
  let rating = Number(r?.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) rating = 4 + (index % 2);
  rating = Math.round(rating);
  const reviewText = String(r?.reviewText || r?.text || r?.comment || "").trim();
  const image = r?.image ? String(r.image).trim() : "";
  return { fullName, email, rating, reviewText, image };
}

function buildPrompt({ title, namesArr, needed }) {
  return `Generate exactly ${needed} natural-looking blog reviews for the article titled "${title}".

RULES (strict):
- Reviews must feel relevant to the blog topic: "${title}".
- Prefer these names when possible: ${namesArr.join(", ")}.
- If more names are needed, invent realistic human names (no placeholders).
- Return ONLY a JSON array of ${needed} objects. No markdown fences, no prose.
- Each object schema: { "fullName": string, "email": string, "rating": 1-5, "reviewText": string, "image": null }
- fullName must be unique within this array.
- email must be realistic lowercase (e.g. jane.doe@example.com).
- rating must be an integer 1–5.
- reviewText must be 1–3 human sentences that show the reviewer read "${title}".
- image: null (always).`;
}

async function saveOneReview({ userId, blogId, row }) {
  if (!row.reviewText || row.reviewText.length < 8) {
    throw new Error("Empty review text from AI");
  }

  let user = await User.findOne({ email: row.email });
  if (!user) {
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
      // Race: another worker created same email
      if (err?.code === 11000) {
        user = await User.findOne({ email: row.email });
        if (!user) throw err;
      } else {
        throw err;
      }
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
  `[fakeReviewsQueue] registering ${WORKERS} parallel workers · chunk=${CHUNK} · model=${MODEL} (Redis ${redisHost}:${redisPort})`
);

fakeReviewsQueue.process(WORKERS, async (job) => {
  const {
    userId,
    blogId,
    projectId,
    title,
    exampleNames,
    chunkSize,
    chunkIndex,
  } = job.data || {};

  const jobId = String(job.id);
  const needed = Math.max(1, Number(chunkSize) || CHUNK);
  const namesArr = Array.isArray(exampleNames) && exampleNames.length
    ? exampleNames.map((n) => String(n).trim()).filter(Boolean)
    : ["Alex", "Jordan", "Sam", "Taylor", "Casey"];

  await markChunkStarted(blogId, { jobId, chunkSize: needed });
  log(jobId, `▶ chunk#${chunkIndex || 0} need=${needed} blog=${blogId} title="${title}"`);

  try {
    await job.progress(10);
    const prompt = buildPrompt({ title: String(title || "Blog"), namesArr, needed });
    const raw = await fetchJSONFromOpenAI(prompt, "getreviewsfake", {
      userId,
      projectId,
      pageId: `blogreviews_${blogId}`,
      promptFrom: "fakeReviewsQueue",
      promptFor: `fake_reviews::${title}::chunk${chunkIndex || 0}`,
      model: MODEL,
    });

    await job.progress(55);
    let rows = extractReviewsArray(raw)
      .map((r, i) => normalizeReviewRow(r, namesArr[i % namesArr.length], i))
      .filter((r) => r.reviewText);

    if (!rows.length) {
      throw new Error("OpenAI returned no usable reviews");
    }
    if (rows.length > needed) rows = rows.slice(0, needed);

    // If short, pad with a second attempt for the deficit only
    if (rows.length < needed) {
      log(jobId, `partial ${rows.length}/${needed} — retrying deficit`);
      const deficit = needed - rows.length;
      const raw2 = await fetchJSONFromOpenAI(
        buildPrompt({ title: String(title || "Blog"), namesArr, needed: deficit }),
        "getreviewsfake",
        {
          userId,
          projectId,
          pageId: `blogreviews_${blogId}_retry`,
          promptFrom: "fakeReviewsQueue",
          promptFor: `fake_reviews::${title}::retry${chunkIndex || 0}`,
          model: MODEL,
        }
      );
      const extra = extractReviewsArray(raw2)
        .map((r, i) => normalizeReviewRow(r, namesArr[(rows.length + i) % namesArr.length], rows.length + i))
        .filter((r) => r.reviewText);
      rows = rows.concat(extra).slice(0, needed);
    }

    await job.progress(75);
    const saved = [];
    const names = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const doc = await saveOneReview({ userId, blogId, row: rows[i] });
        saved.push(doc);
        names.push(rows[i].fullName);
        log(jobId, `saved review ${i + 1}/${rows.length} — ${rows[i].fullName}`);
      } catch (saveErr) {
        console.warn(`[fakeReviewsQueue:${jobId}] save skip:`, saveErr?.message || saveErr);
      }
    }

    if (!saved.length) {
      throw new Error("Failed to save any reviews from this chunk");
    }

    // Count shortfall as failed for this chunk so totals close
    const shortfall = Math.max(0, needed - saved.length);
    await markChunkDone(blogId, {
      jobId,
      saved: saved.length,
      names,
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
    log(jobId, `✔ done saved=${saved.length} shortfall=${shortfall}`);
    return { ok: true, saved: saved.length, shortfall };
  } catch (err) {
    console.error(`[fakeReviewsQueue:${jobId}] ✖`, err?.message || err);
    // Final attempt only counted in "failed" event below
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
