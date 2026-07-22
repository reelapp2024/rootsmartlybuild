/**
 * Fake review generation progress — admin /admin/fake-reviews.
 * Persisted on Blog.fakeReviewsGeneration; sockets to blog_ / user_ / project_ rooms.
 */

const Blog = require("../models/blogs");

const progressByBlogId = new Map();
let ioRef = null;

const DEFAULT_PARALLEL = Math.max(
  1,
  Math.min(12, Number(process.env.FAKE_REVIEWS_CONCURRENCY || 6) || 6)
);

function setFakeReviewsGenerationIo(io) {
  ioRef = io || null;
}

function emptyProgress(blogId) {
  return {
    blogId: String(blogId || ""),
    userId: "",
    projectId: "",
    blogTitle: "",
    status: "idle",
    total: 0,
    done: 0,
    failed: 0,
    pending: 0,
    percent: 0,
    parallelWorkers: DEFAULT_PARALLEL,
    activeWorkers: 0,
    jobIds: [],
    recentEvents: [],
    startedAt: null,
    updatedAt: new Date().toISOString(),
    finishedAt: null,
    message: "",
  };
}

function computePercent(row) {
  const total = Number(row.total || 0);
  if (!total) {
    return row.status === "completed" || row.status === "completed_with_errors" ? 100 : 0;
  }
  const finished = Number(row.done || 0) + Number(row.failed || 0);
  return Math.max(0, Math.min(100, Math.round((finished / total) * 100)));
}

function normalizeProgress(row) {
  const next = { ...emptyProgress(row?.blogId), ...(row || {}) };
  next.pending = Math.max(
    0,
    Number(next.total || 0) - Number(next.done || 0) - Number(next.failed || 0)
  );
  next.percent = computePercent(next);
  next.updatedAt = new Date().toISOString();
  return next;
}

function finalizeRow(row, { message } = {}) {
  const failed = Number(row.failed || 0);
  row.status = failed > 0 ? "completed_with_errors" : "completed";
  row.activeWorkers = 0;
  row.pending = 0;
  row.percent = 100;
  row.finishedAt = row.finishedAt || new Date().toISOString();
  row.updatedAt = new Date().toISOString();
  row.message =
    message ||
    (failed > 0
      ? `Finished with ${failed} failed of ${row.total}`
      : `All ${row.total} review(s) generated`);
  console.log(
    `[fakeReviewsGeneration] ✔ FINISH blog=${row.blogId} done=${row.done} failed=${row.failed}`
  );
  return row;
}

function emitProgress(row) {
  if (!ioRef || !row?.blogId) return;
  try {
    const slim = {
      ...row,
      recentEvents: Array.isArray(row.recentEvents) ? row.recentEvents.slice(0, 10) : [],
    };
    ioRef.to(`blog_${row.blogId}`).emit("fakeReviewsGenerationProgress", slim);
    if (row.userId) {
      ioRef.to(`user_${row.userId}`).emit("fakeReviewsGenerationProgress", slim);
    }
    if (row.projectId) {
      ioRef.to(`project_${row.projectId}`).emit("fakeReviewsGenerationProgress", slim);
    }
  } catch (err) {
    console.warn("[fakeReviewsGeneration] socket emit failed:", err?.message || err);
  }
}

async function persistProgress(blogId, row) {
  try {
    const slim = {
      ...row,
      recentEvents: Array.isArray(row.recentEvents) ? row.recentEvents.slice(0, 10) : [],
    };
    await Blog.updateOne({ _id: blogId }, { $set: { fakeReviewsGeneration: slim } });
  } catch (err) {
    console.warn("[fakeReviewsGeneration] persist failed:", err?.message || err);
  }
}

function getLiveProgress(blogId) {
  const id = String(blogId || "").trim();
  if (!id) return null;
  return progressByBlogId.get(id) || null;
}

async function hydrateFromDb(blogId) {
  const id = String(blogId || "").trim();
  if (!id) return null;
  const existing = progressByBlogId.get(id);
  if (existing) return existing;
  try {
    const blog = await Blog.findById(id).select("fakeReviewsGeneration").lean();
    const raw = blog?.fakeReviewsGeneration;
    if (!raw || typeof raw !== "object") return null;
    const row = normalizeProgress({ ...raw, blogId: id });
    progressByBlogId.set(id, row);
    return row;
  } catch (err) {
    console.warn("[fakeReviewsGeneration] hydrate failed:", err?.message || err);
    return null;
  }
}

async function ensureRow(blogId) {
  const id = String(blogId || "").trim();
  if (!id) return emptyProgress("");
  const live = progressByBlogId.get(id);
  if (live) return live;
  const hydrated = await hydrateFromDb(id);
  if (hydrated) return hydrated;
  const blank = emptyProgress(id);
  progressByBlogId.set(id, blank);
  return blank;
}

function startBatch(
  blogId,
  {
    userId = "",
    projectId = "",
    blogTitle = "",
    total = 0,
    parallelWorkers = DEFAULT_PARALLEL,
    jobIds = [],
    message = "",
  } = {}
) {
  const id = String(blogId || "").trim();
  if (!id) return null;
  const row = normalizeProgress({
    ...emptyProgress(id),
    status: "generating",
    userId: String(userId || ""),
    projectId: String(projectId || ""),
    blogTitle: String(blogTitle || ""),
    total: Number(total) || 0,
    parallelWorkers: Number(parallelWorkers) || DEFAULT_PARALLEL,
    activeWorkers: 0,
    jobIds: Array.isArray(jobIds) ? jobIds.map(String) : [],
    recentEvents: [],
    startedAt: new Date().toISOString(),
    message:
      message ||
      `Generating ${total} review(s) with ${parallelWorkers || DEFAULT_PARALLEL} parallel workers`,
  });
  progressByBlogId.set(id, row);
  emitProgress(row);
  void persistProgress(id, row);
  console.log(
    `[fakeReviewsGeneration] ▶ START blog=${id} total=${row.total} workers=${row.parallelWorkers}`
  );
  return row;
}

function patchBatch(blogId, patch = {}) {
  const id = String(blogId || "").trim();
  if (!id) return null;
  const prev = progressByBlogId.get(id) || emptyProgress(id);
  let recentEvents = Array.isArray(prev.recentEvents) ? [...prev.recentEvents] : [];
  if (patch.event) {
    recentEvents = [
      {
        at: new Date().toISOString(),
        ...(typeof patch.event === "object" ? patch.event : { message: String(patch.event) }),
      },
      ...recentEvents,
    ].slice(0, 12);
  }
  const { event: _ignored, ...rest } = patch;
  let row = normalizeProgress({
    ...prev,
    ...rest,
    recentEvents,
  });

  if (
    row.status === "generating" &&
    Number(row.total) > 0 &&
    Number(row.done) + Number(row.failed) >= Number(row.total)
  ) {
    finalizeRow(row);
  }

  progressByBlogId.set(id, row);
  emitProgress(row);
  void persistProgress(id, row);
  return row;
}

async function markChunkStarted(blogId, { jobId, chunkSize } = {}) {
  const id = String(blogId || "").trim();
  await ensureRow(id);
  const prev = progressByBlogId.get(id) || emptyProgress(id);
  return patchBatch(id, {
    status: "generating",
    activeWorkers: Math.min(
      Number(prev.parallelWorkers || DEFAULT_PARALLEL),
      Number(prev.activeWorkers || 0) + 1
    ),
    event: {
      type: "chunk_started",
      jobId,
      message: `Worker started (batch of ${chunkSize || 1})`,
    },
    message: `Generating reviews… ${prev.done}/${prev.total}`,
  });
}

async function markChunkDone(blogId, { jobId, saved = 0, names = [] } = {}) {
  const id = String(blogId || "").trim();
  await ensureRow(id);
  const prev = progressByBlogId.get(id) || emptyProgress(id);
  const add = Math.max(0, Number(saved) || 0);
  const label = names.length ? names.slice(0, 2).join(", ") : `${add} review(s)`;
  return patchBatch(id, {
    status: "generating",
    done: Number(prev.done || 0) + add,
    activeWorkers: Math.max(0, Number(prev.activeWorkers || 0) - 1),
    event: {
      type: "chunk_done",
      jobId,
      saved: add,
      message: `Saved: ${label}`,
    },
    message: `Saved ${Number(prev.done || 0) + add}/${prev.total}`,
  });
}

async function markChunkFailed(blogId, { jobId, failed = 0, error, adjustActive = true } = {}) {
  const id = String(blogId || "").trim();
  await ensureRow(id);
  const prev = progressByBlogId.get(id) || emptyProgress(id);
  const add = Math.max(0, Number(failed) || 0);
  return patchBatch(id, {
    status: "generating",
    failed: Number(prev.failed || 0) + add,
    activeWorkers: adjustActive
      ? Math.max(0, Number(prev.activeWorkers || 0) - 1)
      : Number(prev.activeWorkers || 0),
    event: {
      type: "chunk_failed",
      jobId,
      message: `Failed ${add}: ${error || "error"}`,
    },
    message: `Failed some reviews (${Number(prev.failed || 0) + add} total failed)`,
  });
}

/**
 * Reconcile generating state — if no queue jobs left, close the batch.
 */
async function reconcileWithQueue(blogId, queue) {
  const id = String(blogId || "").trim();
  if (!id || !queue) return null;
  let row = await hydrateFromDb(id);
  if (!row) return null;
  if (row.status !== "generating") {
    const normalized = normalizeProgress(row);
    progressByBlogId.set(id, normalized);
    return normalized;
  }

  const jobIds = Array.isArray(row.jobIds) ? row.jobIds.map(String) : [];
  let stillRunning = 0;
  for (const jid of jobIds) {
    try {
      const job = await queue.getJob(jid);
      if (!job) continue;
      const state = await job.getState();
      if (["waiting", "active", "delayed", "paused"].includes(state)) stillRunning += 1;
    } catch {
      /* ignore */
    }
  }

  if (stillRunning === 0 && Number(row.done) + Number(row.failed) < Number(row.total)) {
    const leftover = Math.max(0, Number(row.total) - Number(row.done) - Number(row.failed));
    row = normalizeProgress({
      ...row,
      failed: Number(row.failed || 0) + leftover,
      pending: 0,
      activeWorkers: 0,
    });
    finalizeRow(row, {
      message: `Batch closed — queue empty (${row.done} saved, ${row.failed} unfinished)`,
    });
    progressByBlogId.set(id, row);
    emitProgress(row);
    void persistProgress(id, row);
    return row;
  }

  if (
    stillRunning === 0 &&
    Number(row.done) + Number(row.failed) >= Number(row.total) &&
    Number(row.total) > 0
  ) {
    finalizeRow(row);
    progressByBlogId.set(id, row);
    emitProgress(row);
    void persistProgress(id, row);
  }

  return row;
}

function getDefaultParallelWorkers() {
  return DEFAULT_PARALLEL;
}

function getChunkSize() {
  return Math.max(1, Math.min(5, Number(process.env.FAKE_REVIEWS_CHUNK || 2) || 2));
}

module.exports = {
  setFakeReviewsGenerationIo,
  getLiveProgress,
  hydrateFromDb,
  reconcileWithQueue,
  startBatch,
  patchBatch,
  markChunkStarted,
  markChunkDone,
  markChunkFailed,
  getDefaultParallelWorkers,
  getChunkSize,
  emptyProgress,
  normalizeProgress,
};
