import { useEffect, useState } from "react";
import {
  Pencil, Save, X, Check, CircleDot, Circle, Eye, EyeOff, Star, ShieldCheck, Trash2, Plus,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { Lecture, Enrollment, TranslationJob } from "@/api/entities";
import { PROVIDERS } from "@/lib/videoProviders";
import { oneYearFrom } from "@/lib/access";
import { reconcileJobForLecture, defaultJobForLecture } from "@/lib/translationPipeline";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Label, Select } from "@/components/ui/input";
import { Switch, Spinner } from "@/components/ui/misc";
import TranslationDashboard from "@/components/TranslationDashboard";
import CourseOpsAdmin from "@/components/CourseOpsAdmin";
import StonesAdmin from "@/components/StonesAdmin";

const STATUS_TONE = { pending: "muted", in_progress: "warning", done: "success" };

/**
 * Keep the lecture's matching TranslationJob consistent after a Lectures-tab edit,
 * so the Translation (Foreman) tab never drifts out of sync. Conservative: only
 * applies a patch when the job actually contradicts the lecture's status.
 */
async function syncTranslationJob(lecture) {
  if (!lecture?.id) return;
  try {
    const jobs = await TranslationJob.filter({ lecture_id: lecture.id });
    const job = jobs[0];
    const patch = reconcileJobForLecture(lecture, job);
    if (!patch) return;
    if (job) await TranslationJob.update(job.id, patch);
    else await TranslationJob.create({ ...defaultJobForLecture(lecture), ...patch });
  } catch {
    /* sync is best-effort; the dashboard can still be driven directly */
  }
}

export default function Admin() {
  const { t } = useI18n();
  const [tab, setTab] = useState("lectures");

  return (
    <div className="container-page max-w-5xl">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">{t("admin.title")}</h1>
      </header>

      <div className="mb-6 inline-flex flex-wrap rounded-lg border border-border bg-card p-1">
        {[
          { k: "lectures", label: t("admin.tab.lectures") },
          { k: "translation", label: t("admin.tab.translation") },
          { k: "course", label: t("admin.tab.course") },
          { k: "stones", label: t("admin.tab.stones") },
          { k: "enrollments", label: t("admin.tab.enrollments") },
        ].map((o) => (
          <button
            key={o.k}
            onClick={() => setTab(o.k)}
            className={[
              "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
              tab === o.k ? "bg-primary text-primary-foreground" : "text-foreground/70",
            ].join(" ")}
          >
            {o.label}
          </button>
        ))}
      </div>

      {tab === "lectures" && <LecturesAdmin />}
      {tab === "translation" && <TranslationDashboard />}
      {tab === "course" && <CourseOpsAdmin />}
      {tab === "stones" && <StonesAdmin />}
      {tab === "enrollments" && <EnrollmentsAdmin />}
    </div>
  );
}

/* ───────────────────────────── Lectures ───────────────────────────── */

function LecturesAdmin() {
  const { t, pick } = useI18n();
  const [rows, setRows] = useState(null);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    setRows(await Lecture.filter({}, "order"));
  }
  useEffect(() => {
    load();
  }, []);

  async function quickMarkDone(l) {
    const updated = await Lecture.update(l.id, { translation_status: "done" });
    await syncTranslationJob(updated || { ...l, translation_status: "done" });
    load();
  }

  if (rows === null) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <Card className="p-5 md:p-6">
      <div className="mb-4">
        <h2 className="font-bold">{t("admin.lectures.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("admin.lectures.subtitle")}</p>
      </div>

      <div className="divide-y divide-border">
        {rows.map((l) =>
          editingId === l.id ? (
            <LectureEditor
              key={l.id}
              lecture={l}
              onCancel={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null);
                load();
              }}
            />
          ) : (
            <div key={l.id} className="flex items-center gap-3 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary text-sm font-bold">
                {l.order}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{pick(l, "title")}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge tone={STATUS_TONE[l.translation_status]}>
                    {t("admin.field.translation")}: {l.translation_status}
                  </Badge>
                  {l.is_published ? (
                    <Badge tone="primary"><Eye className="h-3 w-3" />{t("admin.field.published")}</Badge>
                  ) : (
                    <Badge tone="locked"><EyeOff className="h-3 w-3" />draft</Badge>
                  )}
                  {l.free_preview && <Badge tone="success"><Star className="h-3 w-3" />{t("admin.field.preview")}</Badge>}
                  <Badge tone="muted">{l.video_provider}</Badge>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {l.translation_status !== "done" && (
                  <Button size="sm" variant="ghost" onClick={() => quickMarkDone(l)} title={t("admin.markDone")}>
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("admin.markDone")}</span>
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setEditingId(l.id)}>
                  <Pencil className="h-4 w-4" />
                  {t("admin.edit")}
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </Card>
  );
}

function LectureEditor({ lecture, onCancel, onSaved }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState({ ...lecture });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => {
    const v = e?.target?.type === "checkbox" ? e.target.checked : e?.target?.value ?? e;
    setDraft((d) => ({ ...d, [k]: v }));
  };

  async function save() {
    setSaving(true);
    try {
      const updated = await Lecture.update(lecture.id, {
        order: Number(draft.order),
        title_he: draft.title_he,
        title_en: draft.title_en,
        description_he: draft.description_he,
        description_en: draft.description_en,
        thumbnail_url: draft.thumbnail_url,
        duration_seconds: Number(draft.duration_seconds) || 0,
        video_provider: draft.video_provider,
        video_he_source: draft.video_he_source,
        video_en_source: draft.video_en_source,
        translation_status: draft.translation_status,
        free_preview: !!draft.free_preview,
        is_published: !!draft.is_published,
      });
      // Keep the Translation (Foreman) tab in sync with this edit.
      await syncTranslationJob(updated || { ...lecture, ...draft });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg bg-secondary/40 p-4 my-2">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={`${t("admin.field.order")}`}>
          <Input type="number" value={draft.order} onChange={set("order")} />
        </Field>
        <Field label={t("admin.field.duration")}>
          <Input type="number" value={draft.duration_seconds} onChange={set("duration_seconds")} />
        </Field>
        <Field label={t("admin.field.title_he")}>
          <Input dir="rtl" value={draft.title_he || ""} onChange={set("title_he")} />
        </Field>
        <Field label={t("admin.field.title_en")}>
          <Input dir="ltr" value={draft.title_en || ""} onChange={set("title_en")} />
        </Field>
        <Field label={t("admin.field.desc_he")}>
          <Textarea dir="rtl" value={draft.description_he || ""} onChange={set("description_he")} />
        </Field>
        <Field label={t("admin.field.desc_en")}>
          <Textarea dir="ltr" value={draft.description_en || ""} onChange={set("description_en")} />
        </Field>
        <Field label={t("admin.field.provider")}>
          <Select value={draft.video_provider} onChange={set("video_provider")}>
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("admin.field.translation")}>
          <Select value={draft.translation_status} onChange={set("translation_status")}>
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
          </Select>
        </Field>
        <Field label={t("admin.field.he_source")}>
          <Input dir="ltr" value={draft.video_he_source || ""} onChange={set("video_he_source")} placeholder="YouTube id / Mux id / URL" />
        </Field>
        <Field label={t("admin.field.en_source")}>
          <Input dir="ltr" value={draft.video_en_source || ""} onChange={set("video_en_source")} placeholder="empty until translated" />
        </Field>
        <Field label={t("admin.field.thumb")} className="md:col-span-2">
          <Input dir="ltr" value={draft.thumbnail_url || ""} onChange={set("thumbnail_url")} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Switch checked={!!draft.is_published} onChange={(v) => setDraft((d) => ({ ...d, is_published: v }))} />
          {t("admin.field.published")}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <Switch checked={!!draft.free_preview} onChange={(v) => setDraft((d) => ({ ...d, free_preview: v }))} />
          {t("admin.field.preview")}
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? <Spinner className="text-white" /> : <Save className="h-4 w-4" />}
          {t("admin.save")}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4" />
          {t("admin.cancel")}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, className }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

/* ──────────────────────────── Enrollments ──────────────────────────── */

function EnrollmentsAdmin() {
  const { t, lang } = useI18n();
  const [rows, setRows] = useState(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setRows(await Enrollment.list("-granted_date"));
  }
  useEffect(() => {
    load();
  }, []);

  async function grant() {
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setBusy(true);
    try {
      await Enrollment.create({
        user_email: clean,
        plan: "full_course",
        status: "active",
        granted_date: new Date().toISOString(),
        expires_date: oneYearFrom().toISOString(),
      });
      setEmail("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id) {
    await Enrollment.update(id, { status: "revoked" });
    load();
  }
  async function reactivate(id) {
    await Enrollment.update(id, {
      status: "active",
      granted_date: new Date().toISOString(),
      expires_date: oneYearFrom().toISOString(),
    });
    load();
  }
  async function remove(id) {
    await Enrollment.delete(id);
    load();
  }

  return (
    <Card className="p-5 md:p-6">
      <div className="mb-4">
        <h2 className="font-bold">{t("admin.enroll.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("admin.enroll.subtitle")}</p>
      </div>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          dir="ltr"
          placeholder={t("admin.enroll.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && grant()}
        />
        <Button onClick={grant} disabled={busy || !email.trim()}>
          {busy ? <Spinner className="text-white" /> : <Plus className="h-4 w-4" />}
          {t("admin.enroll.grant")}
        </Button>
      </div>

      {rows === null ? (
        <div className="grid place-items-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.enroll.none")}</p>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-3 py-3">
              <ShieldCheck className={e.status === "active" ? "h-5 w-5 text-emerald-600" : "h-5 w-5 text-muted-foreground"} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.user_email}</p>
                <p className="text-xs text-muted-foreground">
                  {t("admin.enroll.granted")}: {formatDate(e.granted_date, lang)} · {t("admin.enroll.expires")}:{" "}
                  {formatDate(e.expires_date, lang)}
                </p>
              </div>
              {e.status === "active" ? (
                <Badge tone="success">
                  <CircleDot className="h-3 w-3" />
                  {t("admin.enroll.active")}
                </Badge>
              ) : (
                <Badge tone="muted">
                  <Circle className="h-3 w-3" />
                  {t("admin.enroll.revoked")}
                </Badge>
              )}
              {e.status === "active" ? (
                <Button size="sm" variant="outline" onClick={() => revoke(e.id)}>
                  {t("admin.enroll.revoke")}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => reactivate(e.id)}>
                  {t("admin.enroll.grant")}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => remove(e.id)} title="delete">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
