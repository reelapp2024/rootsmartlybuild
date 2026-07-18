/**
 * Live section-generation progress for admin Project List + sockets.
 * In-memory while a job runs; also mirrored onto UserProject.contentGeneration.
 */

const progressByProjectId = new Map();
let ioRef = null;

const DEFAULT_PARALLEL = Math.max(
  1,
  Math.min(12, Number(process.env.SECTION_GENERATION_CONCURRENCY || 6) || 6)
);

function setSectionGenerationIo(io) {
  ioRef = io || null;
}

function emptyProgress(projectId) {
  return {
    projectId: String(projectId || ""),
    status: "idle",
    total: 0,
    done: 0,
    failed: 0,
    skipped: 0,
    pending: 0,
    percent: 0,
    parallelWorkers: DEFAULT_PARALLEL,
    activeWorkers: 0,
    currentSections: [],
    recentEvents: [],
    startedAt: null,
    updatedAt: new Date().toISOString(),
    finishedAt: null,
    message: "",
  };
}

function computePercent(row) {
  const total = Number(row.total || 0);
  if (!total) return row.status === "completed" ? 100 : 0;
  const finished =
    Number(row.done || 0) + Number(row.failed || 0) + Number(row.skipped || 0);
  return Math.max(0, Math.min(100, Math.round((finished / total) * 100)));
}

function normalizeProgress(row) {
  const next = { ...emptyProgress(row?.projectId), ...(row || {}) };
  next.pending = Math.max(
    0,
    Number(next.total || 0) -
      Number(next.done || 0) -
      Number(next.failed || 0) -
      Number(next.skipped || 0)
  );
  next.percent = computePercent(next);
  next.updatedAt = new Date().toISOString();
  return next;
}

function emitProgress(projectId, payload) {
  if (!ioRef || !projectId) return;
  try {
    ioRef.to(`project_${projectId}`).emit("sectionGenerationProgress", payload);
  } catch (err) {
    console.warn("[sectionGenerationProgress] socket emit failed:", err?.message || err);
  }
}

function getLiveProgress(projectId) {
  const id = String(projectId || "").trim();
  if (!id) return null;
  return progressByProjectId.get(id) || null;
}

function getLiveProgressMap(projectIds = []) {
  const out = {};
  for (const raw of projectIds || []) {
    const id = String(raw || "").trim();
    if (!id) continue;
    const live = progressByProjectId.get(id);
    if (live) out[id] = live;
  }
  return out;
}

function startProgress(projectId, { total = 0, parallelWorkers = DEFAULT_PARALLEL, message = "" } = {}) {
  const id = String(projectId || "").trim();
  if (!id) return null;
  const row = normalizeProgress({
    ...emptyProgress(id),
    status: "generating",
    total: Number(total) || 0,
    parallelWorkers: Number(parallelWorkers) || DEFAULT_PARALLEL,
    activeWorkers: 0,
    currentSections: [],
    recentEvents: [],
    startedAt: new Date().toISOString(),
    message: message || "Section generation started",
  });
  progressByProjectId.set(id, row);
  emitProgress(id, row);
  return row;
}

function patchProgress(projectId, patch = {}) {
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
    ].slice(0, 40);
  }
  const { event: _ignored, ...rest } = patch;
  const row = normalizeProgress({
    ...prev,
    ...rest,
    recentEvents,
  });
  progressByProjectId.set(id, row);
  emitProgress(id, row);
  return row;
}

function finishProgress(projectId, { status = "completed", message = "" } = {}) {
  const id = String(projectId || "").trim();
  if (!id) return null;
  const prev = progressByProjectId.get(id) || emptyProgress(id);
  const row = normalizeProgress({
    ...prev,
    status,
    activeWorkers: 0,
    currentSections: [],
    finishedAt: new Date().toISOString(),
    message:
      message ||
      (status === "completed" ? "Section generation complete" : "Section generation finished"),
  });
  progressByProjectId.set(id, row);
  emitProgress(id, row);
  return row;
}

function clearProgress(projectId) {
  const id = String(projectId || "").trim();
  if (!id) return;
  progressByProjectId.delete(id);
}

function getDefaultParallelWorkers() {
  return DEFAULT_PARALLEL;
}

/**
 * Run async tasks with a fixed concurrency pool.
 */
async function mapWithConcurrency(items, concurrency, worker) {
  const list = Array.isArray(items) ? items : [];
  const limit = Math.max(1, Number(concurrency) || 1);
  const results = new Array(list.length);
  let nextIndex = 0;

  async function runOne() {
    while (nextIndex < list.length) {
      const i = nextIndex++;
      results[i] = await worker(list[i], i);
    }
  }

  const runners = Array.from({ length: Math.min(limit, Math.max(list.length, 1)) }, () =>
    runOne()
  );
  await Promise.all(runners);
  return results;
}

module.exports = {
  setSectionGenerationIo,
  getLiveProgress,
  getLiveProgressMap,
  startProgress,
  patchProgress,
  finishProgress,
  clearProgress,
  getDefaultParallelWorkers,
  mapWithConcurrency,
  emptyProgress,
  normalizeProgress,
};
