/**
 * AI Blogs Queue V2 — Redis/Bull
 *
 * Rich content-only article BODY HTML (old-style depth, no CSS templates).
 * 6+ parallel workers + socket progress for admin Blog Posts page.
 */

const Bull = require("bull");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const Blog = require("../models/blogs");
const Author = require("../models/authors");
const User = require("../models/users");
const Review = require("../models/reviews");
const UserProject = require("../models/userProjects");
const Service = require("../models/service");
const slugify = require("../additional/slugify");
const { fetchJSONFromOpenAI } = require("../additional/openaiHelpers");
const {
  buildBlogContentPrompt,
  normalizeBlogType,
  normalizeAiPayload,
} = require("../sections/aiblogs");
const {
  normalizeBlogSeoMode,
  buildBlogSeoMeta,
} = require("../services/blogSeoService");
const {
  markJobStarted,
  markJobStep,
  markJobDone,
  markJobFailed,
  getDefaultParallelWorkers,
} = require("../services/aiBlogGenerationProgress");

const redisHost = process.env.redisHost;
const redisPort = process.env.redisPort;
const WORKERS = getDefaultParallelWorkers();
const AIBLOGS_MODEL =
  String(process.env.AIBLOGS_MODEL || "gpt-4o-mini").trim() || "gpt-4o-mini";
/** Extra OpenAI review seed doubles latency — off by default. */
const SEED_REVIEWS =
  String(process.env.AIBLOGS_SEED_REVIEWS || "0").trim() === "1";

const aiblogsQueue = new Bull("aiblogsQueue", {
  redis: { host: redisHost, port: redisPort },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "fixed", delay: 12000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

function log(jobId, ...args) {
  console.log(`[aiblogsQueue:${jobId}]`, ...args);
}

async function resolveProjectContext(projectId) {
  const project = await UserProject.findById(projectId).lean();
  if (!project) throw new Error("Project not found");

  let serviceType = "";
  try {
    const svc = await Service.findOne({ projectId }).select("name serviceName title").lean();
    serviceType =
      String(svc?.name || svc?.serviceName || svc?.title || "").trim() ||
      String(project.serviceType || project.projectType || "").trim();
  } catch {
    /* optional */
  }

  return {
    project,
    projectName: String(project.projectName || project.name || "Business").trim(),
    serviceType:
      serviceType ||
      String(project.projectName || project.name || "professional services").trim(),
  };
}

async function ensureUniqueSlug(projectId, baseTitle) {
  let base = slugify(String(baseTitle || "blog-post").trim()) || "blog-post";
  base = base.slice(0, 80);
  let slug = base;
  let n = 2;
  while (await Blog.exists({ projectId, slug })) {
    slug = `${base}-${n}`;
    n += 1;
    if (n > 50) {
      slug = `${base}-${Date.now().toString(36)}`;
      break;
    }
  }
  return slug;
}

async function seedDynamicReviews({ blogId, title, userId, projectId, count = 3 }) {
  const names = ["Alex Morgan", "Jordan Lee", "Sam Rivera", "Taylor Brooks", "Casey Nguyen"];
  const prompt = `
Generate exactly ${count} short blog reader reviews for the article titled "${title}".

Return STRICT JSON array ONLY:
[
  { "fullName": "string", "email": "string", "rating": 4 or 5, "reviewText": "1-2 sentences" }
]

Rules:
- Use realistic names (prefer variety from: ${names.join(", ")}).
- email lowercase matching the name (e.g. alex.morgan@example.com).
- reviewText must feel like the person read "${title}".
- rating integer 4 or 5 only.
- No HTML. No extra keys.
`.trim();

  let reviews = [];
  try {
    reviews = await fetchJSONFromOpenAI(prompt, "AI_BLOG_SEED_REVIEWS", {
      userId,
      projectId,
      pageId: `blogreviews_${blogId}`,
      promptFrom: "aiblogsQueueV2",
      promptFor: `reviews::${title}`,
    });
  } catch (err) {
    console.warn("[aiblogsQueue] review seed LLM failed:", err?.message || err);
    return [];
  }

  if (!Array.isArray(reviews)) return [];

  const saved = [];
  for (const r of reviews.slice(0, count)) {
    const fullName = String(r?.fullName || "").trim();
    const email = String(r?.email || "")
      .trim()
      .toLowerCase();
    const rating = Math.min(5, Math.max(1, Number(r?.rating) || 5));
    const reviewText = String(r?.reviewText || "").trim();
    if (!fullName || !email || !reviewText) continue;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        fullName,
        email,
        type: 2,
      });
    }

    const review = await Review.create({
      user: user._id,
      blog: blogId,
      rating,
      reviewText,
      verified: true,
      status: 1,
    });
    saved.push(review);
  }
  return saved;
}

async function pingSitemap(projectId) {
  try {
    await axios.post(
      "https://apis.smartlybuild.dev/admin/v1/updateHostingSitemap",
      { projectId },
      { timeout: 10000 }
    );
  } catch (e) {
    console.warn("[aiblogsQueue] sitemap update failed:", e?.response?.data || e.message);
  }
}

console.log(
  `[aiblogsQueue] registering ${WORKERS} parallel workers · model=${AIBLOGS_MODEL} · seedReviews=${SEED_REVIEWS} (Redis ${redisHost}:${redisPort})`
);

aiblogsQueue.process(WORKERS, async (job) => {
  const {
    userId,
    projectId,
    type,
    authorId,
    status,
    title,
    slug: requestedSlug,
    isSchedule,
    scheduleTime,
    locations,
    seoMode: jobSeoMode,
  } = job.data || {};

  const jobId = String(job.id);
  const normTitle = String(title || "").replace(/\s+/g, " ").trim();
  const blogSeoMode = normalizeBlogSeoMode(jobSeoMode);

  const step = async (pct, label) => {
    try {
      await job.progress(pct);
    } catch {
      /* ignore */
    }
    log(jobId, `${pct}% — ${label} — "${normTitle}"`);
    await markJobStep(projectId, {
      jobId,
      title: normTitle,
      step: label,
      jobPercent: pct,
      message: `${normTitle}: ${label}`,
    });
  };

  await markJobStarted(projectId, { jobId, title: normTitle });
  log(jobId, `▶ START type=${type} title="${normTitle}" project=${projectId}`);

  try {
    if (!userId || !projectId || !normTitle) {
      throw new Error("userId, projectId, and title are required");
    }
    if (!authorId || !mongoose.isValidObjectId(String(authorId))) {
      throw new Error("valid authorId is required");
    }

    await step(8, "Validating author");
    // Author may belong to the acting super-admin while blog userId is the project owner
    const author = await Author.findById(authorId).lean();
    if (!author) throw new Error("Author not found");
    log(jobId, `author ok → ${author.name || authorId}`);

    await step(18, "Loading project context");
    const { projectName, serviceType } = await resolveProjectContext(projectId);
    const blogType = normalizeBlogType(type);
    const locList = Array.isArray(locations)
      ? locations.map((l) => String(l || "").trim()).filter(Boolean)
      : [];
    log(jobId, `context → project="${projectName}" service="${serviceType}" locations=${locList.length}`);

    await step(35, "Generating rich article content (OpenAI)");
    const prompt = buildBlogContentPrompt({
      type: blogType,
      title: normTitle,
      projectName,
      serviceType,
      locations: locList,
      seoMode: blogSeoMode,
    });
    log(jobId, `prompt built (${blogType}) seoMode=${blogSeoMode} length=${prompt.length}`);

    const raw = await fetchJSONFromOpenAI(prompt, "AI_BLOG_CONTENT_V2", {
      userId,
      projectId,
      pageId: `aiblog_${blogType}`,
      promptFrom: "aiblogsQueueV2",
      promptFor: `${blogType}::${normTitle}`,
      model: AIBLOGS_MODEL,
    });

    const payload = normalizeAiPayload(raw, normTitle);
    if (!payload.content_html || payload.content_html.length < 120) {
      throw new Error("AI returned empty or too-short article HTML");
    }
    log(
      jobId,
      `content ready → htmlChars=${payload.content_html.length} excerpt="${payload.information.slice(0, 60)}…"`
    );

    await step(70, "Saving blog to database");
    let finalSlug = slugify(requestedSlug || normTitle) || (await ensureUniqueSlug(projectId, normTitle));
    if (await Blog.exists({ projectId, slug: finalSlug })) {
      finalSlug = await ensureUniqueSlug(projectId, normTitle);
    }

    const publishStatus = Number(status);
    const finalStatus = [0, 1, 2].includes(publishStatus)
      ? publishStatus
      : isSchedule
        ? 0
        : 1;

    if (blogSeoMode === 2) {
      await step(78, "Building premium blog JSON-LD schemas");
    } else if (blogSeoMode === 1) {
      await step(78, "Applying basic SEO meta");
    } else {
      await step(78, "Skipping AI SEO (manual mode)");
    }

    const seoMeta = buildBlogSeoMeta({
      mode: blogSeoMode,
      payload,
      title: normTitle,
      slug: finalSlug,
      contentHtml: payload.content_html,
      authorName: author.name || "",
      projectName,
      coverImageUrl: "",
      datePublished: new Date(),
      dateModified: new Date(),
    });

    const blogDoc = {
      userId,
      projectId,
      title: normTitle,
      information: payload.information,
      content: payload.content_html,
      status: finalStatus,
      type: blogType,
      authorId,
      slug: finalSlug,
      coverImage: { url: "", alt: payload.cover_alt || normTitle },
      seoMeta,
      isSchedule: Boolean(isSchedule),
      scheduleTime: scheduleTime ? new Date(scheduleTime) : null,
    };

    const saved = await Blog.findOneAndUpdate(
      { projectId, title: normTitle, type: blogType },
      { $set: blogDoc },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!saved?._id) throw new Error("Blog save returned no document");
    log(jobId, `saved blogId=${saved._id} slug=${finalSlug} status=${finalStatus}`);

    // Optional review seed (slow second OpenAI call) — disabled by default
    if (SEED_REVIEWS) {
      await step(88, "Seeding dynamic reviews");
      try {
        const existingReviews = await Review.countDocuments({ blog: saved._id });
        if (existingReviews === 0) {
          const seeded = await seedDynamicReviews({
            blogId: saved._id,
            title: normTitle,
            userId,
            projectId,
            count: 3,
          });
          log(jobId, `reviews seeded=${seeded.length}`);
        }
      } catch (revErr) {
        console.warn(`[aiblogsQueue:${jobId}] review seed skipped:`, revErr?.message || revErr);
      }
    }

    if (finalStatus === 1) {
      // Fire-and-forget — do not block job completion
      void pingSitemap(projectId);
    }

    await step(100, "Done");
    await markJobDone(projectId, {
      jobId,
      title: normTitle,
      blogId: String(saved._id),
    });
    log(jobId, `✔ COMPLETE blogId=${saved._id}`);

    return {
      ok: true,
      blogId: String(saved._id),
      title: normTitle,
      slug: finalSlug,
      type: blogType,
    };
  } catch (err) {
    console.error(`[aiblogsQueue:${jobId}] ✖ FAILED "${normTitle}":`, err?.message || err);
    // Do NOT markJobFailed here — Bull retries; final failure handled in "failed" event
    throw err;
  }
});

aiblogsQueue.on("active", (job) => {
  console.log(`[aiblogsQueue] active job=${job.id} title="${job.data?.title || ""}"`);
});

aiblogsQueue.on("completed", (job) => {
  console.log(`[aiblogsQueue] completed job=${job.id}`);
});

aiblogsQueue.on("failed", (job, err) => {
  const attempts = Number(job?.opts?.attempts || 1);
  const made = Number(job?.attemptsMade || 0);
  console.error(
    `[aiblogsQueue] failed job=${job?.id} attempt=${made}/${attempts}:`,
    err?.message || err
  );
  // Only count as failed after all retries are exhausted
  if (job?.data?.projectId && made >= attempts) {
    void markJobFailed(String(job.data.projectId), {
      jobId: String(job.id),
      title: String(job.data?.title || "").trim(),
      error: err?.message || job.failedReason || String(err),
    });
  }
});

aiblogsQueue.on("error", (err) => {
  console.error("[aiblogsQueue] queue error:", err?.message || err);
});

module.exports = aiblogsQueue;
