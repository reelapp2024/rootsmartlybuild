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
const User = require("../models/users");
const aiblogsQueue = require("../queue/aiblogsQueue");
const { normalizeBlogType } = require("../sections/aiblogs");
const { normalizeBlogSeoMode } = require("../services/blogSeoService");
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

/** Owner or super-admin may manage AI blogs for a project. */
async function assertCanAccessProject(userId, projectId) {
  if (!projectId || !mongoose.isValidObjectId(String(projectId))) return null;
  const project = await UserProject.findById(projectId).select("_id userId").lean();
  if (!project) return null;
  if (String(project.userId) === String(userId)) return project;
  const user = await User.findById(userId).select("isSuper").lean();
  if (Number(user?.isSuper || 0) === 1) return project;
  return null;
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
        seoMode,
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

      const project = await assertCanAccessProject(userId, projectId);
      if (!project) {
        return res
          .status(404)
          .json({ message: "Project not found or you do not have permission" });
      }

      // Author: logged-in user (super) or project owner
      const author = await Author.findOne({
        _id: authorId,
        $or: [{ userId }, { userId: project.userId }],
      })
        .select("_id name")
        .lean();
      if (!author) {
        return res.status(404).json({
          message:
            "Author not found. Create or select an author under your account, then try again.",
        });
      }

      const blogType = normalizeBlogType(type);
      const blogSeoMode = normalizeBlogSeoMode(seoMode);
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

      // Stamp blogs with project owner so ownership stays with the project account
      const blogOwnerUserId = String(project.userId || userId);

      console.log(
        `[AiblogsControllerV2] queueing ${scheduleItems.length} blog(s) type=${blogType} seoMode=${blogSeoMode} workers=${workers} project=${projectId} owner=${blogOwnerUserId} actor=${userId}`
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
          userId: blogOwnerUserId,
          actorUserId: String(userId),
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
          seoMode: blogSeoMode,
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
        seoMode: blogSeoMode,
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
        const owned = await assertCanAccessProject(userId, projectId);
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

      const project = await assertCanAccessProject(userId, projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Reconcile vs Bull so refresh / poll / re-login never shows zombie "generating"
      let data = await reconcileWithQueue(projectId, aiblogsQueue);
      // Fall back to in-memory if Mongo had nothing yet (just queued)
      if (!data) data = getLiveProgress(projectId);

      if (data) {
        const jobs =
          data.jobs && typeof data.jobs === "object" ? data.jobs : {};
        data = {
          ...data,
          jobs,
          recentEvents: Array.isArray(data.recentEvents)
            ? data.recentEvents.slice(0, 12)
            : [],
          currentBlogs: Array.isArray(data.currentBlogs)
            ? data.currentBlogs.slice(0, 12)
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
