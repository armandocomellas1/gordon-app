// ─────────────────────────────────────────────────────────────────────────
// Base44 backend function — translation pipeline ingestion endpoint (EXAMPLE).
//
// Deploy as a Base44 backend function (Deno runtime). The off-LAN Codex
// foreman/worker POSTs here on every status change for a lecture; this function
// upserts the matching TranslationJob and, on completion, publishes the English
// track onto the Lecture.
//
// Endpoint (set in the frontend .env as VITE… not needed; the WORKER calls this):
//   POST https://<your-app>.base44.app/functions/translationWebhook
//   Header: Authorization: Bearer <PIPELINE_SHARED_SECRET>
//
// Body = the worker payload (see src/lib/translationPipeline.js → "Ingestion contract"):
//   { lecture_code, worker_id, status, chunks_total, chunks_done,
//     heygen_cost_usd, heygen_credits_used, throughput, eta, retries,
//     error, output_url }
//
// This mirrors applyWorkerPayload() from the frontend so demo and live share one
// contract. Keep them in sync.
// ─────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from "npm:@base44/sdk";

const SHARED_SECRET = Deno.env.get("PIPELINE_SHARED_SECRET");

export default async function handler(req) {
  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  // Authenticate the worker (machine-to-machine; not a logged-in user).
  const auth = req.headers.get("authorization") || "";
  if (!SHARED_SECRET || auth !== `Bearer ${SHARED_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const p = await req.json();
  if (!p.lecture_code) {
    return Response.json({ error: "lecture_code_required" }, { status: 400 });
  }

  // Service-role client bypasses per-user RLS for trusted server writes.
  const base44 = createClientFromRequest(req).asServiceRole;

  // Find (or create) the job for this lecture.
  const existing = await base44.entities.TranslationJob.filter({ lecture_code: p.lecture_code });
  const job = existing[0];

  const now = new Date().toISOString();
  const patch = mapPayloadToJob(job, p, now);

  let saved;
  if (job) {
    saved = await base44.entities.TranslationJob.update(job.id, patch);
  } else {
    // First time we hear about this lecture — link it to its Lecture if present.
    const lec = (await base44.entities.Lecture.filter({ code: p.lecture_code }))[0];
    saved = await base44.entities.TranslationJob.create({
      lecture_code: p.lecture_code,
      lecture_id: lec?.id,
      lecture_order: lec?.order ?? 0,
      ...patch,
    });
  }

  // On completion, publish the English track onto the Lecture.
  if (p.status === "published" && saved.lecture_id) {
    await base44.entities.Lecture.update(saved.lecture_id, {
      video_en_source: saved.output_url,
      translation_status: "done",
      is_published: true,
    });
  }

  return Response.json({ ok: true, job_id: saved.id, status: saved.status });
}

function mapPayloadToJob(job, p, now) {
  const patch = { updated_date: now };
  const copy = [
    "status", "worker_id", "chunks_total", "chunks_done", "heygen_cost_usd",
    "heygen_credits_used", "throughput", "eta", "retries", "output_url", "youtube_url",
  ];
  for (const k of copy) if (p[k] !== undefined) patch[k] = p[k];
  if (p.error !== undefined) patch.last_error = p.error || "";
  if (p.status && p.status !== "queued" && p.status !== "error" && !job?.started_at) {
    patch.started_at = now;
  }
  if (p.status === "published") patch.completed_at = now;
  return patch;
}
