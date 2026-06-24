// ─────────────────────────────────────────────────────────────────────────
// Translation-pipeline integration (platform side).
//
// The ACTUAL translation runs OFF-PLATFORM on the user's LAN (per the spec):
//
//   HD staging ──> Codex FOREMAN ──> Codex WORKER ──> HeyGen ──> stitch ──┐
//   (Lecture_NN.mp4)  (orchestrates)   (per-lecture)  (translate)         │
//                                                                          ▼
//                                        platform ingestion  <── worker POSTs status
//
// This module is the platform's half: it (1) defines the pipeline stages that
// mirror the worker's 5 steps, (2) maps an incoming worker/foreman status
// payload onto a TranslationJob (the ingestion CONTRACT — see
// applyWorkerPayload), (3) computes the Foreman-Dashboard rollups
// (progress / HeyGen budget / errors / throughput / ETA), and (4) provides a
// deterministic-ish demo SIMULATOR so the dashboard is alive without the LAN.
//
// In live mode, a Base44 backend function receives the worker POST and calls the
// same applyWorkerPayload() before saving — see functions/translationWebhook.example.js.
// ─────────────────────────────────────────────────────────────────────────

const env = (typeof import.meta !== "undefined" && import.meta.env) || {};

/** Total HeyGen budget for the whole course (USD). Overridable via env. */
export const HEYGEN_BUDGET_USD = Number(env.VITE_HEYGEN_BUDGET_USD) || 600;

/** Worker cuts lectures into 5-15 min chunks; we model ~6 min. */
export const CHUNK_MINUTES = 6;
const COST_PER_CHUNK_USD = 0.8;
const CREDITS_PER_CHUNK = 50;
const SECONDS_PER_CHUNK_WALL = 70; // simulated wall-clock per chunk, for ETA

/** Ordered pipeline stages (worker step 1-5 → stitched → publish). `error` is a side state. */
export const STAGES = [
  "queued",
  "chunking",
  "uploading",
  "processing",
  "downloading",
  "stitching",
  "ready",
  "published",
];

/** Stages where a worker is actively doing something (foreman "worker status"). */
export const ACTIVE_STAGES = new Set([
  "chunking",
  "uploading",
  "processing",
  "downloading",
  "stitching",
]);

/** Maps each stage to the worker step shown in the spec screenshot. */
export const STAGE_TO_STEP = {
  queued: 0,
  chunking: 1, // ✂  cut into chunks
  uploading: 2, // ⬆  upload to HeyGen
  processing: 3, // ⟳  poll for completion (+ budget)
  downloading: 5, // ⬇  download
  stitching: 5, // 🧵 stitch
  ready: 5,
  published: 6, // ▶  publish / YouTube
};

export function chunksForDuration(seconds) {
  if (!seconds) return 1;
  return Math.max(1, Math.ceil(seconds / 60 / CHUNK_MINUTES));
}

export function stageIndex(status) {
  const i = STAGES.indexOf(status);
  return i === -1 ? 0 : i;
}

/** 0-100 progress for a single job, blending stage + within-stage chunk progress. */
export function jobProgress(job) {
  if (!job) return 0;
  if (job.status === "published") return 100;
  if (job.status === "error") {
    // Hold progress at the stage it failed in.
    return Math.round((stageIndex("processing") / (STAGES.length - 1)) * 100);
  }
  const base = stageIndex(job.status) / (STAGES.length - 1);
  // During processing, weight by chunk completion for a lively bar.
  if (job.status === "processing" && job.chunks_total) {
    const within = (job.chunks_done || 0) / job.chunks_total;
    const span = 1 / (STAGES.length - 1);
    return Math.round((base + within * span) * 100);
  }
  return Math.round(base * 100);
}

/** Foreman-Dashboard rollups across all jobs. */
export function computeOverall(jobs = []) {
  const total = jobs.length;
  const published = jobs.filter((j) => j.status === "published").length;
  const errors = jobs.filter((j) => j.status === "error");
  const active = jobs.filter((j) => ACTIVE_STAGES.has(j.status));
  const queued = jobs.filter((j) => j.status === "queued").length;
  const ready = jobs.filter((j) => j.status === "ready").length;

  const costUsed = round2(jobs.reduce((s, j) => s + (j.heygen_cost_usd || 0), 0));
  const creditsUsed = jobs.reduce((s, j) => s + (j.heygen_credits_used || 0), 0);
  const retries = jobs.reduce((s, j) => s + (j.retries || 0), 0);

  // Course ETA = latest per-job ETA among everything not yet published.
  let etaCourse = null;
  for (const j of jobs) {
    if (j.status === "published") continue;
    if (j.eta && (!etaCourse || new Date(j.eta) > new Date(etaCourse))) etaCourse = j.eta;
  }

  return {
    total,
    published,
    queued,
    ready,
    activeCount: active.length,
    activeJobs: active,
    errorCount: errors.length,
    errorJobs: errors,
    retries,
    costUsed,
    creditsUsed,
    budget: HEYGEN_BUDGET_USD,
    budgetPct: Math.min(100, Math.round((costUsed / HEYGEN_BUDGET_USD) * 100)),
    overallPct: total ? Math.round((published / total) * 100) : 0,
    etaCourse,
  };
}

// ─────────────────────────── Ingestion contract ───────────────────────────
//
// Shape the off-LAN foreman/worker POSTs to the platform on every status change.
// Anything omitted is left unchanged. `lecture_code` (or `lecture_id`) routes it.
//
//   {
//     "lecture_code":        "L09",
//     "worker_id":           "worker-1",
//     "status":              "processing",   // one of STAGES or "error"
//     "chunks_total":        6,
//     "chunks_done":         3,
//     "heygen_cost_usd":     8.4,
//     "heygen_credits_used": 420,
//     "throughput":          "2.1x realtime",
//     "eta":                 "2026-06-19T14:00:00Z",
//     "retries":             0,
//     "error":               null,
//     "output_url":          null            // set when stitched/ready
//   }
//
/** Apply a worker payload to an existing job, returning the entity patch to save. */
export function applyWorkerPayload(job, payload, now = new Date()) {
  const patch = { updated_date: now.toISOString() };
  const copy = [
    "status",
    "worker_id",
    "chunks_total",
    "chunks_done",
    "heygen_cost_usd",
    "heygen_credits_used",
    "throughput",
    "eta",
    "retries",
    "output_url",
    "youtube_url",
  ];
  for (const k of copy) if (payload[k] !== undefined) patch[k] = payload[k];

  if (payload.error !== undefined) patch.last_error = payload.error || "";
  if (payload.status && payload.status !== "error" && !job?.started_at && payload.status !== "queued") {
    patch.started_at = now.toISOString();
  }
  if (payload.status === "published") patch.completed_at = now.toISOString();
  return patch;
}

/** Patch to apply to the *Lecture* when an admin publishes a finished job. */
export function publishPatchForLecture(job) {
  return {
    video_en_source: job.output_url || job.video_en_source || "",
    translation_status: "done",
    is_published: true,
  };
}

// ───────────────────── Lecture ⇄ TranslationJob sync ─────────────────────
//
// The Lectures-tab edits a coarse `Lecture.translation_status`; the Translation
// tab owns the detailed pipeline. These keep the two views consistent without
// clobbering mid-pipeline detail: editing a lecture only nudges the job's coarse
// state, and only when it actually contradicts the lecture.

/** A blank job for a lecture that doesn't have one yet. */
export function defaultJobForLecture(lecture) {
  return {
    lecture_id: lecture.id,
    lecture_code: lecture.code,
    lecture_order: lecture.order,
    source_file: `Lecture_${String(lecture.order || 0).padStart(2, "0")}.mp4`,
    source_size_gb: 0.5,
    worker_id: "",
    status: "queued",
    chunks_total: chunksForDuration(lecture.duration_seconds),
    chunks_done: 0,
    heygen_credits_used: 0,
    heygen_cost_usd: 0,
    retries: 0,
    last_error: "",
    output_url: "",
    throughput: "",
    eta: null,
    started_at: null,
    completed_at: null,
  };
}

/**
 * Compute the patch to bring `job` in line with `lecture.translation_status`.
 * Returns null when already consistent (so saving an unrelated field is a no-op).
 * Preserves active/ready/error stages when the lecture merely says "in_progress".
 */
export function reconcileJobForLecture(lecture, job, now = new Date()) {
  const total = (job && job.chunks_total) || chunksForDuration(lecture.duration_seconds);
  const ts = lecture.translation_status;

  if (ts === "done") {
    if (job && job.status === "published") {
      // Keep the published job's output in sync if the EN source changed.
      if (lecture.video_en_source && lecture.video_en_source !== job.output_url) {
        return { output_url: lecture.video_en_source };
      }
      return null;
    }
    return {
      status: "published",
      chunks_total: total,
      chunks_done: total,
      output_url: lecture.video_en_source || (job && job.output_url) || "",
      last_error: "",
      completed_at: now.toISOString(),
    };
  }

  if (ts === "pending") {
    if (job && job.status === "queued") return null;
    if (!job) return { status: "queued" };
    // Admin explicitly reset to pending → return job to staging.
    return { status: "queued", chunks_done: 0, output_url: "", completed_at: null, last_error: "" };
  }

  // in_progress: don't disturb a job that's already underway / finished a stage.
  if (job && (ACTIVE_STAGES.has(job.status) || job.status === "ready" || job.status === "error")) {
    return null;
  }
  return { status: "processing", chunks_total: total, completed_at: null };
}

// ─────────────────────────────── Simulator ───────────────────────────────
//
// Emulates the foreman/worker for DEMO mode: produces the next worker payload
// for a job, exactly as the real worker would POST it. The dashboard feeds the
// result back through applyWorkerPayload(), so the demo exercises the real path.

const COURSE_RETRY_RATE = 0.07;

export function simulateNext(job, now = new Date()) {
  if (!job || job.status === "published" || job.status === "ready") return null;

  const worker = job.worker_id || `worker-${(job.lecture_order % 2) + 1}`;
  const total = job.chunks_total || chunksForDuration(job.duration_seconds || 600);
  const etaFor = (chunksLeft) =>
    new Date(now.getTime() + chunksLeft * SECONDS_PER_CHUNK_WALL * 1000).toISOString();

  // Recover from an error: resume processing.
  if (job.status === "error") {
    return {
      worker_id: worker,
      status: "processing",
      error: null,
      retries: (job.retries || 0) + 1,
      eta: etaFor(total - (job.chunks_done || 0)),
      throughput: "1.8x realtime",
    };
  }

  switch (job.status) {
    case "queued":
      return { worker_id: worker, status: "chunking", chunks_total: total, chunks_done: 0, eta: etaFor(total + 2) };
    case "chunking":
      return { worker_id: worker, status: "uploading", chunks_total: total, eta: etaFor(total + 1) };
    case "uploading":
      return { worker_id: worker, status: "processing", chunks_done: 0, eta: etaFor(total), throughput: "2.0x realtime" };
    case "processing": {
      // Occasionally HeyGen errors out mid-render.
      if (Math.random() < COURSE_RETRY_RATE) {
        return { worker_id: worker, status: "error", error: "HeyGen render timeout on chunk " + ((job.chunks_done || 0) + 1) };
      }
      const done = Math.min(total, (job.chunks_done || 0) + 1);
      const cost = round2((job.heygen_cost_usd || 0) + COST_PER_CHUNK_USD);
      const credits = (job.heygen_credits_used || 0) + CREDITS_PER_CHUNK;
      if (done >= total) {
        return { worker_id: worker, status: "downloading", chunks_done: done, heygen_cost_usd: cost, heygen_credits_used: credits, eta: etaFor(1) };
      }
      return { worker_id: worker, status: "processing", chunks_done: done, heygen_cost_usd: cost, heygen_credits_used: credits, eta: etaFor(total - done) };
    }
    case "downloading":
      return { worker_id: worker, status: "stitching", eta: etaFor(1) };
    case "stitching":
      return {
        worker_id: worker,
        status: "ready",
        output_url:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        eta: null,
      };
    default:
      return null;
  }
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
