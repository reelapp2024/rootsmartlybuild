/**
 * AiblogsControllerV2 — AI blog generation for /admin/create-post-ai
 *
 * Queues Redis/Bull jobs (6+ workers) that generate rich article BODY HTML.
 * Progress streams over sockets to the Blog Posts page (same room pattern as project gen).
 */

const mongoose = require("mongoose");
const slugify = require("../additional/slugify");
const Author = require("../models/authors");
const UserProject = require("../models/userProjects");
const aiblogsQueue = require("../queue/aiblogsQueue");
const { normalizeBlogType } = require("../sections/aiblogs");
const {
  startBatch,
  getLiveProgress,
  reconcileWithQueue,
  getDefaultParallelWorkers,
} = require("../services/aiBlogGenerationProgress");

function toArray(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p;
    } catch {
      /* fall through */
    }
    return v
      .split(/\n+/)
      .map((s) => String(s).trim())
      .filter(Boolean);
  }
  return [v].filter(Boolean);
}

function normalizeLocations(locations) {
  return toArray(locations)
    .map((l) => String(l || "").trim())
    .filter(Boolean);
}

module.exports = {
  /**
   * POST /create_ai_blog
   */
  create_ai_blog: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: user missing" });
      }

      const {
        projectId,
        type,
        authorId,
        status,
        title,
        titlesWithSchedule,
        locations,
      } = req.body || {};

      if (!projectId || !mongoose.isValidObjectId(String(projectId))) {
        return res.status(400).json({ message: "valid projectId is required" });
      }
      if (!type || !String(type).trim()) {
        return res.status(400).json({ message: "type is required" });
      }
      if (!authorId || !mongoose.isValidObjectId(String(authorId))) {
        return res.status(400).json({ message: "valid authorId is required" });
      }

      const project = await UserProject.findOne({ _id: projectId, userId })
        .select("_id")
        .lean();
      if (!project) {
        return res
          .status(404)
          .json({ message: "Project not found or you do not have permission" });
      }

      const author = await Author.findOne({ _id: authorId, userId })
        .select("_id name")
        .lean();
      if (!author) {
        return res.status(404).json({ message: "Author not found" });
      }

      const blogType = normalizeBlogType(type);
      const locList = normalizeLocations(locations);
      const workers = getDefaultParallelWorkers();

      const titlesArr = toArray(title)
        .map((s) => String(s || "").trim())
        .filter(Boolean);

      const scheduleItems =
        Array.isArray(titlesWithSchedule) && titlesWithSchedule.length
          ? titlesWithSchedule
              .map((row) => ({
                title: String(row?.title || "").trim(),
                scheduledAt: row?.scheduledAt || null,
                scheduleKey: row?.scheduleKey || null,
              }))
              .filter((row) => row.title)
          : titlesArr.map((t) => ({
              title: t,
              scheduledAt: null,
              scheduleKey: null,
            }));

      if (!scheduleItems.length) {
        return res
          .status(400)
          .json({ message: "title (string or array) is required" });
      }
      if (scheduleItems.length > 20) {
        return res
          .status(400)
          .json({ message: "Maximum 20 blogs per request" });
      }

      console.log(
        `[AiblogsControllerV2] queueing ${scheduleItems.length} blog(s) type=${blogType} workers=${workers} project=${projectId}`
      );
      console.log(
        `[AiblogsControllerV2] titles:`,
        scheduleItems.map((s) => s.title)
      );

      const requestedStatus = Number(status);
      const jobs = [];

      for (const item of scheduleItems) {
        const scheduledAt = item.scheduledAt
          ? new Date(item.scheduledAt)
          : null;
        const isSchedule = Boolean(
          scheduledAt && !Number.isNaN(scheduledAt.getTime())
        );

        let finalStatus = 1;
        if (isSchedule) finalStatus = 0;
        else if ([0, 1, 2].includes(requestedStatus)) finalStatus = requestedStatus;

        const job = await aiblogsQueue.add({
          userId: String(userId),
          projectId: String(projectId),
          type: blogType,
          authorId: String(authorId),
          status: finalStatus,
          title: item.title,
          slug: slugify(item.title),
          isSchedule,
          scheduleTime: isSchedule ? scheduledAt.toISOString() : null,
          scheduleKey: item.scheduleKey || null,
          locations: locList,
          version: 2,
        });
        jobs.push(job);
        console.log(
          `[AiblogsControllerV2] enqueued job=${job.id} title="${item.title}"`
        );
      }

      const jobIds = jobs.map((j) => String(j.id));
      const progress = startBatch(String(projectId), {
        total: jobs.length,
        parallelWorkers: workers,
        jobIds,
        jobsMeta: jobs.map((j, i) => ({
          title: scheduleItems[i]?.title || j.data?.title || "",
        })),
        message: `Queued ${jobs.length} AI blog(s) · ${workers} parallel workers`,
      });

      return res.status(202).json({
        message: "Queued AI blog generation (V2)",
        count: jobs.length,
        jobIds,
        type: blogType,
        locations: locList,
        parallelWorkers: workers,
        progress,
      });
    } catch (err) {
      console.error("[AiblogsControllerV2.create_ai_blog] error:", err);
      return res.status(500).json({
        message: err?.message || "Failed to queue AI blogs",
      });
    }
  },

  /**
   * POST /ai_blog_job_status
   * Body: { jobIds?: string[], projectId?: string }
   */
  ai_blog_job_status: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: user missing" });
      }

      const projectId = String(req.body?.projectId || "").trim();
      if (projectId) {
        const owned = await UserProject.findOne({ _id: projectId, userId })
          .select("_id")
          .lean();
        if (!owned) {
          return res.status(404).json({ message: "Project not found" });
        }
        const batch = await reconcileWithQueue(projectId, aiblogsQueue);
        return res.status(200).json({
          message: "OK",
          data: {
            batch: batch || getLiveProgress(projectId) || null,
            jobs: [],
          },
        });
      }

      const jobIds = toArray(req.body?.jobIds).map(String).filter(Boolean);
      if (!jobIds.length) {
        return res
          .status(400)
          .json({ message: "projectId or jobIds array is required" });
      }

      const results = [];
      for (const id of jobIds.slice(0, 50)) {
        const job = await aiblogsQueue.getJob(id);
        if (!job) {
          results.push({ id, state: "unknown" });
          continue;
        }
        const state = await job.getState();
        const progress = job.progress();
        results.push({
          id,
          state,
          progress: typeof progress === "number" ? progress : 0,
          failedReason: job.failedReason || null,
          returnvalue: job.returnvalue || null,
          title: job.data?.title || null,
        });
      }

      return res.status(200).json({ message: "OK", data: { jobs: results } });
    } catch (err) {
      console.error("[AiblogsControllerV2.ai_blog_job_status] error:", err);
      return res.status(500).json({ message: "Failed to read job status" });
    }
  },

  /**
   * POST /ai_blog_generation_progress
   * Body: { projectId }
   */
  ai_blog_generation_progress: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: user missing" });
      }
      const projectId = String(req.body?.projectId || "").trim();
      if (!projectId || !mongoose.isValidObjectId(projectId)) {
        return res.status(400).json({ message: "valid projectId is required" });
      }

      const project = await UserProject.findOne({ _id: projectId, userId })
        .select("_id")
        .lean();
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Reconcile vs Bull so refresh / re-login never shows a zombie "generating" batch
      let data = await reconcileWithQueue(projectId, aiblogsQueue);
      if (data) {
        data = {
          ...data,
          recentEvents: Array.isArray(data.recentEvents)
            ? data.recentEvents.slice(0, 8)
            : [],
          currentBlogs: Array.isArray(data.currentBlogs)
            ? data.currentBlogs.slice(0, 6)
            : [],
        };
      }

      return res.status(200).json({
        message: "OK",
        data,
      });
    } catch (err) {
      console.error(
        "[AiblogsControllerV2.ai_blog_generation_progress] error:",
        err
      );
      return res.status(500).json({ message: "Failed to read progress" });
    }
  },
};
