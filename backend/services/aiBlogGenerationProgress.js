/**
 * Live AI blog generation progress for admin Blog Posts page + sockets.
 * Durable in UserProject.aiBlogGeneration so re-login / refresh shows truth.
 * Reconciles against Bull when jobs die, Redis restarts, or workers stall.
 */

const UserProject = require("../models/userProjects");

const progressByProjectId = new Map();
let ioRef = null;

const DEFAULT_PARALLEL = Math.max(
  1,
  Math.min(12, Number(process.env.AIBLOGS_CONCURRENCY || 6) || 6)
);

/** If generating with no queue activity past this age, force-finalize leftovers. */
const STALE_MS = Math.max(
  15 * 60 * 1000,
  Number(process.env.AIBLOGS_STALE_MS || 90 * 60 * 1000) || 90 * 60 * 1000
);

const TERMINAL = new Set(["done", "failed"]);
const RUNNING_STATES = new Set(["active", "waiting", "delayed", "paused"]);

function setAiBlogGenerationIo(io) {
  ioRef = io || null;
}

function emptyProgress(projectId) {
  return {
    projectId: String(projectId || ""),
    status: "idle",
    total: 0,
    done: 0,
    failed: 0,
    pending: 0,
    percent: 0,
    parallelWorkers: DEFAULT_PARALLEL,
    activeWorkers: 0,
    currentBlogs: [],
    recentEvents: [],
    jobIds: [],
    /** Per-job truth: { [jobId]: { jobId, title, status, step, jobPercent, blogId, error } } */
    jobs: {},
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

function jobsList(row) {
  const jobs = row?.jobs && typeof row.jobs === "object" ? row.jobs : {};
  return Object.values(jobs);
}

function recomputeFromJobs(row) {
  const list = jobsList(row);
  const total = list.length > 0 ? list.length : Number(row.total || 0);
  const done = list.filter((j) => j.status === "done").length;
  const failed = list.filter((j) => j.status === "failed").length;
  const active = list.filter((j) => j.status === "active").length;
  const pending = Math.max(0, total - done - failed);

  row.total = total;
  row.done = done;
  row.failed = failed;
  row.pending = pending;
  row.activeWorkers = active;
  row.currentBlogs = list
    .filter((j) => j.status === "active")
    .slice(0, 6)
    .map((j) => ({
      jobId: j.jobId,
      title: j.title,
      step: j.step || "active",
      jobPercent: Number(j.jobPercent) || 0,
    }));
  row.percent = computePercent(row);
  row.updatedAt = new Date().toISOString();

  if (
    row.status === "generating" &&
    total > 0 &&
    done + failed >= total
  ) {
    finalizeRow(row);
  }
  return row;
}

function finalizeRow(row, { message } = {}) {
  const failed = Number(row.failed || 0);
  row.status = failed > 0 ? "completed_with_errors" : "completed";
  row.activeWorkers = 0;
  row.currentBlogs = [];
  row.pending = 0;
  row.percent = 100;
  row.finishedAt = row.finishedAt || new Date().toISOString();
  row.updatedAt = new Date().toISOString();
  row.message =
    message ||
    (failed > 0
      ? `Finished with ${failed} failed of ${row.total}`
      : `All ${row.total} AI blog(s) generated`);
  console.log(
    `[aiBlogGeneration] ✔ FINISH project=${row.projectId} done=${row.done} failed=${row.failed}`
  );
  return row;
}

function normalizeProgress(row) {
  const next = { ...emptyProgress(row?.projectId), ...(row || {}) };
  if (!next.jobs || typeof next.jobs !== "object") next.jobs = {};
  if (!Array.isArray(next.jobIds)) next.jobIds = [];
  // Legacy batches: only counters, no jobs map — keep counter math
  if (Object.keys(next.jobs).length === 0) {
    next.pending = Math.max(
      0,
      Number(next.total || 0) - Number(next.done || 0) - Number(next.failed || 0)
    );
    next.percent = computePercent(next);
    next.updatedAt = new Date().toISOString();
    if (
      next.status === "generating" &&
      Number(next.total) > 0 &&
      Number(next.done) + Number(next.failed) >= Number(next.total)
    ) {
      finalizeRow(next);
    }
    return next;
  }
  return recomputeFromJobs(next);
}

function emitProgress(projectId, payload) {
  if (!ioRef || !projectId) return;
  try {
    const slim = {
      ...payload,
      recentEvents: Array.isArray(payload?.recentEvents)
        ? payload.recentEvents.slice(0, 8)
        : [],
      currentBlogs: Array.isArray(payload?.currentBlogs)
        ? payload.currentBlogs.slice(0, 6)
        : [],
      // Keep jobs map for UI/debug but cap size in socket payload
      jobs: payload?.jobs || {},
    };
    ioRef.to(`project_${projectId}`).emit("aiBlogGenerationProgress", slim);
  } catch (err) {
    console.warn("[aiBlogGenerationProgress] socket emit failed:", err?.message || err);
  }
}

async function persistProgress(projectId, row) {
  try {
    const slim = {
      ...row,
      recentEvents: Array.isArray(row.recentEvents) ? row.recentEvents.slice(0, 8) : [],
      currentBlogs: Array.isArray(row.currentBlogs) ? row.currentBlogs.slice(0, 6) : [],
    };
    await UserProject.updateOne(
      { _id: projectId },
      { $set: { aiBlogGeneration: slim } }
    );
  } catch (err) {
    console.warn("[aiBlogGenerationProgress] persist failed:", err?.message || err);
  }
}

function getLiveProgress(projectId) {
  const id = String(projectId || "").trim();
  if (!id) return null;
  return progressByProjectId.get(id) || null;
}

/**
 * Load Map from Mongo when process restarted (or first request after deploy).
 */
async function hydrateFromDb(projectId) {
  const id = String(projectId || "").trim();
  if (!id) return null;
  const existing = progressByProjectId.get(id);
  if (existing) return existing;

  try {
    const proj = await UserProject.findById(id).select("aiBlogGeneration").lean();
    const raw = proj?.aiBlogGeneration;
    if (!raw || typeof raw !== "object") return null;
    const row = normalizeProgress({ ...raw, projectId: id });
    progressByProjectId.set(id, row);
    return row;
  } catch (err) {
    console.warn("[aiBlogGenerationProgress] hydrate failed:", err?.message || err);
    return null;
  }
}

function ensureJobEntry(row, jobId, title) {
  const id = String(jobId || "");
  if (!id) return null;
  if (!row.jobs) row.jobs = {};
  if (!row.jobs[id]) {
    row.jobs[id] = {
      jobId: id,
      title: String(title || ""),
      status: "queued",
      step: "queued",
      jobPercent: 0,
    };
  } else if (title && !row.jobs[id].title) {
    row.jobs[id].title = String(title);
  }
  if (!row.jobIds.includes(id)) row.jobIds.push(id);
  return row.jobs[id];
}

function startBatch(
  projectId,
  {
    total = 0,
    parallelWorkers = DEFAULT_PARALLEL,
    jobIds = [],
    jobsMeta = [],
    message = "",
  } = {}
) {
  const id = String(projectId || "").trim();
  if (!id) return null;

  const jobs = {};
  const ids = Array.isArray(jobIds) ? jobIds.map(String) : [];
  const meta = Array.isArray(jobsMeta) ? jobsMeta : [];
  ids.forEach((jid, i) => {
    const m = meta[i] || {};
    jobs[jid] = {
      jobId: jid,
      title: String(m.title || ""),
      status: "queued",
      step: "queued",
      jobPercent: 0,
    };
  });

  const row = normalizeProgress({
    ...emptyProgress(id),
    status: "generating",
    total: Number(total) || ids.length || 0,
    parallelWorkers: Number(parallelWorkers) || DEFAULT_PARALLEL,
    activeWorkers: 0,
    currentBlogs: [],
    recentEvents: [],
    jobIds: ids,
    jobs,
    startedAt: new Date().toISOString(),
    message:
      message ||
      `Generating ${total} AI blog(s) with ${parallelWorkers || DEFAULT_PARALLEL} parallel workers`,
  });
  progressByProjectId.set(id, row);
  emitProgress(id, row);
  void persistProgress(id, row);
  console.log(
    `[aiBlogGeneration] ▶ START project=${id} total=${row.total} workers=${row.parallelWorkers}`
  );
  return row;
}

function patchBatch(projectId, patch = {}) {
  const id = String(projectId || "").trim();
  if (!id) return null;
  const prev = progressByProjectId.get(id) || emptyProgress(id);
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
  let row = {
    ...prev,
    ...rest,
    recentEvents,
    jobs: rest.jobs || prev.jobs || {},
  };
  row = normalizeProgress(row);

  progressByProjectId.set(id, row);
  emitProgress(id, row);
  void persistProgress(id, row);
  return row;
}

/** Prefer live Map, else Mongo — never invent a blank batch over a persisted one. */
async function ensureRow(projectId) {
  const id = String(projectId || "").trim();
  if (!id) return emptyProgress("");
  const live = progressByProjectId.get(id);
  if (live) return live;
  const hydrated = await hydrateFromDb(id);
  if (hydrated) return hydrated;
  const blank = emptyProgress(id);
  progressByProjectId.set(id, blank);
  return blank;
}

async function markJobStarted(projectId, { jobId, title } = {}) {
  const id = String(projectId || "").trim();
  const prev = await ensureRow(id);
  // Resume batch after process restart if Mongo still says generating
  if (prev.status === "idle" && Number(prev.total || 0) > 0) {
    prev.status = "generating";
  }
  if (prev.status === "idle") {
    prev.status = "generating";
  }
  const jobs = { ...(prev.jobs || {}) };
  const entry = ensureJobEntry({ ...prev, jobs }, jobId, title);
  if (!entry) return getLiveProgress(id);
  if (TERMINAL.has(entry.status)) return getLiveProgress(id);
  jobs[String(jobId)] = {
    ...entry,
    status: "active",
    step: "started",
    jobPercent: 0,
    title: title || entry.title,
  };
  return patchBatch(id, {
    status: prev.status === "completed" || prev.status === "completed_with_errors"
      ? prev.status
      : "generating",
    jobs,
    event: { type: "job_started", jobId, title, message: `Started: ${title}` },
    message: `Working on “${title}”…`,
  });
}

async function markJobStep(projectId, { jobId, title, step, jobPercent, message } = {}) {
  const id = String(projectId || "").trim();
  const prev = await ensureRow(id);
  const jobs = { ...(prev.jobs || {}) };
  const entry = ensureJobEntry({ ...prev, jobs }, jobId, title);
  if (!entry) return getLiveProgress(id);
  if (TERMINAL.has(entry.status)) return getLiveProgress(id);
  jobs[String(jobId)] = {
    ...entry,
    status: "active",
    step: String(step || entry.step || ""),
    jobPercent: Number(jobPercent) || 0,
    title: title || entry.title,
  };
  return patchBatch(id, {
    jobs,
    event: {
      type: "job_step",
      jobId,
      title,
      step,
      message: message || `${title}: ${step}`,
    },
    message: message || `${title}: ${step}`,
  });
}

async function markJobDone(projectId, { jobId, title, blogId } = {}) {
  const id = String(projectId || "").trim();
  const prev = await ensureRow(id);
  const jobs = { ...(prev.jobs || {}) };
  const entry = ensureJobEntry({ ...prev, jobs }, jobId, title);
  if (!entry) return getLiveProgress(id);
  if (entry.status === "done") return getLiveProgress(id);
  jobs[String(jobId)] = {
    ...entry,
    status: "done",
    step: "Done",
    jobPercent: 100,
    blogId: blogId ? String(blogId) : entry.blogId,
    title: title || entry.title,
  };
  return patchBatch(id, {
    // Always recompute from jobs; finalizeRow promotes to completed when done+failed >= total
    status: "generating",
    jobs,
    event: {
      type: "job_done",
      jobId,
      title,
      blogId,
      message: `Saved: ${title}`,
    },
    message: `Saved “${title}”`,
  });
}

async function markJobFailed(projectId, { jobId, title, error } = {}) {
  const id = String(projectId || "").trim();
  const prev = await ensureRow(id);
  const jobs = { ...(prev.jobs || {}) };
  const entry = ensureJobEntry({ ...prev, jobs }, jobId, title);
  if (!entry) return getLiveProgress(id);
  if (entry.status === "failed") return getLiveProgress(id);
  if (entry.status === "done") return getLiveProgress(id);
  jobs[String(jobId)] = {
    ...entry,
    status: "failed",
    step: "Failed",
    jobPercent: 0,
    error: error ? String(error).slice(0, 300) : "",
    title: title || entry.title,
  };
  return patchBatch(id, {
    status: "generating",
    jobs,
    event: {
      type: "job_failed",
      jobId,
      title,
      message: `Failed: ${title} — ${error || "error"}`,
    },
    message: `Failed “${title}”`,
  });
}

/**
 * Reconcile in-memory/DB progress with Bull job states.
 * Call on every progress API hydrate so closed windows / restarts show truth.
 *
 * @param {string} projectId
 * @param {import('bull').Queue} queue
 */
async function reconcileWithQueue(projectId, queue) {
  const id = String(projectId || "").trim();
  if (!id || !queue) return null;

  let row = await hydrateFromDb(id);
  if (!row) return null;

  // Already finished — still return normalized copy (no zombie generating)
  if (row.status !== "generating") {
    const normalized = normalizeProgress(row);
    progressByProjectId.set(id, normalized);
    return normalized;
  }

  const jobIds =
    Array.isArray(row.jobIds) && row.jobIds.length
      ? row.jobIds.map(String)
      : Object.keys(row.jobs || {});

  let stillInQueue = 0;
  const jobs = { ...(row.jobs || {}) };

  for (const jid of jobIds) {
    if (!jobs[jid]) {
      jobs[jid] = {
        jobId: jid,
        title: "",
        status: "queued",
        step: "queued",
        jobPercent: 0,
      };
    }
    const prevStatus = jobs[jid].status;
    if (TERMINAL.has(prevStatus)) continue;

    let bullJob = null;
    try {
      bullJob = await queue.getJob(jid);
    } catch {
      bullJob = null;
    }

    if (!bullJob) {
      // removeOnComplete: true → missing job usually means success
      jobs[jid] = {
        ...jobs[jid],
        status: "done",
        step: "Done",
        jobPercent: 100,
      };
      continue;
    }

    let state = "unknown";
    try {
      state = await bullJob.getState();
    } catch {
      state = "unknown";
    }

    if (state === "completed") {
      jobs[jid] = {
        ...jobs[jid],
        status: "done",
        step: "Done",
        jobPercent: 100,
        title: jobs[jid].title || bullJob.data?.title || "",
        blogId: jobs[jid].blogId || bullJob.returnvalue?.blogId || undefined,
      };
    } else if (state === "failed") {
      jobs[jid] = {
        ...jobs[jid],
        status: "failed",
        step: "Failed",
        error: String(bullJob.failedReason || "failed").slice(0, 300),
        title: jobs[jid].title || bullJob.data?.title || "",
      };
    } else if (RUNNING_STATES.has(state)) {
      stillInQueue += 1;
      jobs[jid] = {
        ...jobs[jid],
        status: state === "active" ? "active" : "queued",
        step: state === "active" ? jobs[jid].step || "active" : "queued",
        title: jobs[jid].title || bullJob.data?.title || "",
      };
    } else {
      // unknown / stuck — treat as still pending unless stale below
      stillInQueue += 1;
    }
  }

  let next = normalizeProgress({
    ...row,
    jobs,
    jobIds: jobIds.length ? jobIds : row.jobIds,
  });

  const ageMs = (() => {
    const t = Date.parse(next.updatedAt || next.startedAt || "");
    return Number.isFinite(t) ? Date.now() - t : 0;
  })();

  // No Bull work left but counters still pending → orphaned (worker crash / Redis wipe)
  if (stillInQueue === 0 && next.status === "generating") {
    for (const jid of Object.keys(next.jobs || {})) {
      if (!TERMINAL.has(next.jobs[jid].status)) {
        next.jobs[jid] = {
          ...next.jobs[jid],
          status: "failed",
          step: "Failed",
          error: "Job no longer in queue (worker stopped or Redis cleared)",
        };
      }
    }
    next = normalizeProgress(next);
    if (next.status === "generating") {
      finalizeRow(next, {
        message: `Batch closed — queue empty (${next.done} saved, ${next.failed} failed)`,
      });
    }
  } else if (
    stillInQueue > 0 &&
    ageMs >= STALE_MS &&
    next.status === "generating"
  ) {
    // Stale long-running batch with zombie waiting jobs
    for (const jid of Object.keys(next.jobs || {})) {
      if (!TERMINAL.has(next.jobs[jid].status)) {
        next.jobs[jid] = {
          ...next.jobs[jid],
          status: "failed",
          step: "Failed",
          error: "Timed out — generation stalled",
        };
      }
    }
    next = normalizeProgress(next);
    if (next.status === "generating") {
      finalizeRow(next, {
        message: `Timed out after stall (${next.done} saved, ${next.failed} failed)`,
      });
    }
    console.warn(
      `[aiBlogGeneration] ⚠ STALE finalize project=${id} ageMs=${ageMs} stillInQueue=${stillInQueue}`
    );
  }

  // Legacy: generating with counters only (no jobIds) and nothing running → finish from counters
  if (
    next.status === "generating" &&
    jobIds.length === 0 &&
    stillInQueue === 0
  ) {
    if (Number(next.done) + Number(next.failed) >= Number(next.total) && Number(next.total) > 0) {
      finalizeRow(next);
    } else if (ageMs >= STALE_MS) {
      next.failed =
        Number(next.failed || 0) +
        Math.max(0, Number(next.total) - Number(next.done) - Number(next.failed));
      next.pending = 0;
      finalizeRow(next, {
        message: `Timed out — ${next.done} saved, ${next.failed} unfinished`,
      });
    }
  }

  progressByProjectId.set(id, next);
  emitProgress(id, next);
  void persistProgress(id, next);
  return next;
}

function getDefaultParallelWorkers() {
  return DEFAULT_PARALLEL;
}

module.exports = {
  setAiBlogGenerationIo,
  getLiveProgress,
  hydrateFromDb,
  reconcileWithQueue,
  startBatch,
  patchBatch,
  markJobStarted,
  markJobStep,
  markJobDone,
  markJobFailed,
  getDefaultParallelWorkers,
  emptyProgress,
  normalizeProgress,
};
