import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play, Pause, StepForward, Upload, RefreshCw, RotateCcw, AlertTriangle, CheckCircle2, DollarSign,
  Clock, Cpu, Server, Scissors, CloudUpload, Loader2, Download, Combine, Send,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { IS_DEMO, base44 } from "@/api/base44Client";
import { Lecture, TranslationJob } from "@/api/entities";
import {
  STAGE_TO_STEP, computeOverall, jobProgress, simulateNext, applyWorkerPayload,
  publishPatchForLecture,
} from "@/lib/translationPipeline";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Spinner } from "./ui/misc";

const STAGE_TONE = {
  queued: "muted",
  chunking: "primary",
  uploading: "primary",
  processing: "warning",
  downloading: "primary",
  stitching: "primary",
  ready: "accent",
  published: "success",
  error: "danger",
};

const STAGE_ICON = {
  queued: Server,
  chunking: Scissors,
  uploading: CloudUpload,
  processing: Loader2,
  downloading: Download,
  stitching: Combine,
  ready: Send,
  published: CheckCircle2,
  error: AlertTriangle,
};

const TERMINAL = new Set(["published", "ready"]); // not auto-advanced by the simulator

function fmtEta(iso, lang) {
  if (!iso) return "—";
  try {
    const locales = { he: "he-IL", fr: "fr-FR", ru: "ru-RU" };
    return new Date(iso).toLocaleString(locales[lang] || "en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function TranslationDashboard() {
  const { t, lang, pick } = useI18n();
  const [jobs, setJobs] = useState(null);
  const [lecturesById, setLecturesById] = useState({});
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const runningRef = useRef(false);

  const load = useCallback(async () => {
    const [j, l] = await Promise.all([
      TranslationJob.list("lecture_order"),
      Lecture.list("order"),
    ]);
    const map = {};
    for (const lec of l) map[lec.id] = lec;
    setLecturesById(map);
    setJobs(j);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // One simulation step: fetch fresh, advance every active job, persist, reload.
  const step = useCallback(async () => {
    try {
      const current = await TranslationJob.list("lecture_order");
      const active = current.filter((j) => !TERMINAL.has(j.status));
      if (active.length === 0) {
        setRunning(false);
        runningRef.current = false;
        return false;
      }
      await Promise.all(
        active.map((j) => {
          const payload = simulateNext(j);
          return payload ? TranslationJob.update(j.id, applyWorkerPayload(j, payload)) : null;
        })
      );
      setJobs(await TranslationJob.list("lecture_order"));
      return true;
    } catch (e) {
      setError(String(e?.message || e));
      setRunning(false);
      runningRef.current = false;
      return false;
    }
  }, []);

  // Replay: re-derive jobs from the current lectures (demo only).
  async function reseedPipeline() {
    setError(null);
    setRunning(false);
    runningRef.current = false;
    if (base44._reseedPipeline) base44._reseedPipeline();
    await load();
  }

  // Run loop while `running`.
  useEffect(() => {
    runningRef.current = running;
    if (!running) return;
    let cancelled = false;
    const loop = async () => {
      while (!cancelled && runningRef.current) {
        const more = await step();
        if (!more) break;
        await new Promise((r) => setTimeout(r, 1100));
      }
    };
    loop();
    return () => {
      cancelled = true;
    };
  }, [running, step]);

  async function publish(job) {
    setBusy(job.id);
    try {
      if (job.lecture_id) await Lecture.update(job.lecture_id, publishPatchForLecture(job));
      await TranslationJob.update(job.id, { status: "published", completed_at: new Date().toISOString() });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function retry(job) {
    setBusy(job.id);
    try {
      const payload = simulateNext(job) || { status: "processing", error: null, retries: (job.retries || 0) + 1 };
      await TranslationJob.update(job.id, applyWorkerPayload(job, payload));
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (jobs === null) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const o = computeOverall(jobs);
  // Nothing left for the simulator to advance (all jobs ready/published, or none).
  const noActive = jobs.every((j) => TERMINAL.has(j.status));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-bold">{t("pipe.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("pipe.subtitle")}</p>
        <p className="mt-1 text-xs text-muted-foreground/80">{t("pipe.flow")}</p>
      </div>

      {/* Overall rollups (the Foreman Dashboard cards) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={CheckCircle2}
          label={t("pipe.overall.published")}
          value={`${o.published}/${o.total}`}
          bar={o.overallPct}
          barTone="bg-emerald-500"
        />
        <Stat
          icon={DollarSign}
          label={t("pipe.overall.budget")}
          value={t("pipe.budget.used", { used: o.costUsed.toFixed(0), budget: o.budget })}
          bar={o.budgetPct}
          barTone={o.budgetPct > 85 ? "bg-red-500" : "bg-primary"}
        />
        <Stat
          icon={AlertTriangle}
          label={t("pipe.overall.errors")}
          value={`${o.errorCount} / ${o.retries}`}
          tone={o.errorCount ? "text-red-600" : ""}
        />
        <Stat icon={Clock} label={t("pipe.overall.eta")} value={fmtEta(o.etaCourse, lang)} />
      </div>

      {/* Worker status */}
      <Card className="p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <Cpu className="h-3.5 w-3.5" />
          {t("pipe.overall.workers")} · {o.activeCount} {t("pipe.overall.active")}
        </p>
        {o.activeJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {o.activeJobs.map((j) => (
              <span key={j.id} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                <span className="font-bold">{j.worker_id}</span>
                <span className="text-muted-foreground">·</span>
                {j.lecture_code}
                <span className="text-muted-foreground">·</span>
                {t(`pipe.stage.${j.status}`)}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Demo simulator controls / live note */}
      {IS_DEMO ? (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold">
                <Server className="h-4 w-4 text-goldink" />
                {t("pipe.sim.title")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("pipe.sim.note")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={running ? "outline" : "default"}
                onClick={() => setRunning((v) => !v)}
                disabled={noActive}
              >
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {running ? t("pipe.sim.pause") : t("pipe.sim.run")}
              </Button>
              <Button variant="outline" onClick={step} disabled={running || noActive}>
                <StepForward className="h-4 w-4" />
                {t("pipe.sim.step")}
              </Button>
              <Button variant="ghost" onClick={reseedPipeline} disabled={running} title={t("pipe.sim.reset")}>
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">{t("pipe.sim.reset")}</span>
              </Button>
            </div>
          </div>
          {noActive && jobs.length > 0 && (
            <p className="mt-3 rounded-md bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              {t("pipe.sim.allDone")}
            </p>
          )}
          {jobs.length === 0 && (
            <p className="mt-3 rounded-md bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800">
              {t("pipe.sim.noJobs")}
            </p>
          )}
          {error && (
            <p className="mt-3 flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-2 text-xs font-medium text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
        </Card>
      ) : (
        <Card className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Server className="h-4 w-4 shrink-0 text-goldink" />
          {t("pipe.live.note")}
        </Card>
      )}

      {/* Per-lecture pipeline rows */}
      <Card className="p-2 md:p-3">
        {jobs.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t("pipe.none")}</p>
        ) : (
          <div className="divide-y divide-border">
            {jobs.map((j) => {
              const lec = lecturesById[j.lecture_id];
              const title = lec ? pick(lec, "title") : j.lecture_code;
              const Icon = STAGE_ICON[j.status] || Server;
              const pct = jobProgress(j);
              const spinning = ["processing", "uploading", "downloading", "stitching", "chunking"].includes(j.status);
              return (
                <div key={j.id} className="grid grid-cols-1 gap-3 p-3 md:grid-cols-12 md:items-center">
                  {/* lecture */}
                  <div className="md:col-span-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-secondary text-xs font-bold">
                        {j.lecture_order}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {j.source_file} · {j.source_size_gb}GB · step {STAGE_TO_STEP[j.status] ?? 0}/5
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* stage + progress */}
                  <div className="md:col-span-4">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge tone={STAGE_TONE[j.status]}>
                        <Icon className={`h-3 w-3 ${spinning ? "animate-spin" : ""}`} />
                        {t(`pipe.stage.${j.status}`)}
                      </Badge>
                      {j.status === "processing" && (
                        <span className="text-[11px] text-muted-foreground">
                          {t("pipe.chunks", { done: j.chunks_done || 0, total: j.chunks_total || 0 })}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${j.status === "error" ? "bg-red-400" : j.status === "published" ? "bg-emerald-500" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {j.last_error && (
                      <p className="mt-1 truncate text-[11px] text-red-600" title={j.last_error}>
                        {j.last_error}
                      </p>
                    )}
                  </div>

                  {/* cost */}
                  <div className="text-xs md:col-span-1">
                    <span className="font-semibold">${(j.heygen_cost_usd || 0).toFixed(1)}</span>
                  </div>

                  {/* eta */}
                  <div className="text-[11px] text-muted-foreground md:col-span-2">
                    {fmtEta(j.eta, lang)}
                  </div>

                  {/* actions */}
                  <div className="flex items-center justify-end gap-1.5 md:col-span-1">
                    {j.status === "ready" && (
                      <Button size="sm" onClick={() => publish(j)} disabled={busy === j.id} title={t("pipe.publish")}>
                        {busy === j.id ? <Spinner className="text-white" /> : <Upload className="h-4 w-4" />}
                        <span className="hidden lg:inline">{t("pipe.publish")}</span>
                      </Button>
                    )}
                    {j.status === "error" && (
                      <Button size="sm" variant="outline" onClick={() => retry(j)} disabled={busy === j.id} title={t("pipe.retry")}>
                        {busy === j.id ? <Spinner /> : <RefreshCw className="h-4 w-4" />}
                        <span className="hidden lg:inline">{t("pipe.retry")}</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, bar, barTone = "bg-primary", tone = "" }) {
  return (
    <Card className="p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-extrabold ${tone}`}>{value}</p>
      {typeof bar === "number" && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${barTone}`} style={{ width: `${bar}%` }} />
        </div>
      )}
    </Card>
  );
}
