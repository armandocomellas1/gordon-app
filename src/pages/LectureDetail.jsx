import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Clock, Languages, PlayCircle, CheckCircle2, Lock, ListVideo,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { useMeta } from "@/lib/seo";
import { useAuth } from "@/hooks/useAuth";
import { Lecture, Progress } from "@/api/entities";
import { availableTracks } from "@/lib/videoProviders";
import { canWatch } from "@/lib/access";
import { formatDuration, cn } from "@/lib/utils";
import VideoPlayer from "@/components/VideoPlayer";
import ShareButtons from "@/components/ShareButtons";
import InstructorCard from "@/components/InstructorCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";

export default function LectureDetail() {
  const { id } = useParams();
  const { t, lang, isRTL, pick } = useI18n();
  const { user, accessState } = useAuth();

  const [lecture, setLecture] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [track, setTrack] = useState(null);
  const [resumeAt, setResumeAt] = useState(0);
  const progressId = useRef(null);

  // Load the lecture + ordered playlist + the user's progress (all lectures).
  useEffect(() => {
    let alive = true;
    setLecture(null);
    setTrack(null);
    progressId.current = null;
    (async () => {
      const [one, all] = await Promise.all([
        Lecture.get(id),
        Lecture.filter({ is_published: true }, "order"),
      ]);
      if (!alive) return;
      setLecture(one);
      setSiblings(all);

      const tracks = availableTracks(one);
      setTrack(tracks.includes(lang) ? lang : tracks[0] || "he");

      if (user) {
        try {
          const rows = await Progress.filter({ user_email: user.email });
          if (!alive) return;
          const map = {};
          for (const p of rows) map[p.lecture_id] = p;
          setProgressMap(map);
          const cur = rows.find((p) => p.lecture_id === id);
          if (cur) {
            progressId.current = cur.id;
            setResumeAt(cur.completed ? 0 : cur.position_seconds || 0);
          }
        } catch {
          /* ignore */
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.email]);

  const tracks = useMemo(() => (lecture ? availableTracks(lecture) : []), [lecture]);

  const { idx, prev, next } = useMemo(() => {
    if (!lecture || !siblings.length) return { idx: -1 };
    const i = siblings.findIndex((s) => s.id === lecture.id);
    return { idx: i, prev: siblings[i - 1], next: siblings[i + 1] };
  }, [lecture, siblings]);

  async function persist(patch) {
    if (!user || !lecture) return;
    try {
      if (progressId.current) {
        await Progress.update(progressId.current, { ...patch, last_watched: new Date().toISOString() });
      } else {
        const created = await Progress.create({
          user_email: user.email,
          lecture_id: lecture.id,
          lang: track,
          last_watched: new Date().toISOString(),
          ...patch,
        });
        progressId.current = created.id;
      }
      if (patch.completed) {
        setProgressMap((m) => ({ ...m, [lecture.id]: { ...(m[lecture.id] || {}), completed: true } }));
      }
    } catch {
      /* progress is best-effort */
    }
  }

  // Hook must run unconditionally (before the early return below).
  useMeta(
    lecture
      ? {
          title: pick(lecture, "title"),
          description: pick(lecture, "description"),
          image: lecture.thumbnail_url,
          type: "video.other",
        }
      : {}
  );

  if (!lecture) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const Back = isRTL ? ArrowRight : ArrowLeft;
  const Fwd = isRTL ? ArrowLeft : ArrowRight;
  const title = pick(lecture, "title");
  const description = pick(lecture, "description");
  const total = siblings.length;

  return (
    <div className="container-page max-w-6xl">
      <Link
        to="/lectures"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <Back className="h-4 w-4" />
        {t("player.back")}
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="lg:col-span-2">
          <VideoPlayer
            lecture={lecture}
            lang={track || "he"}
            user={user}
            accessState={accessState}
            startAt={resumeAt}
            onProgress={(s) => persist({ position_seconds: s, lang: track })}
            onEnded={() => persist({ completed: true })}
          />

          {/* Title + meta */}
          <div className="mt-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-goldink">
              {t("player.lessonOf", { n: idx >= 0 ? idx + 1 : lecture.order, total })}
            </span>
            <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(lecture.duration_seconds, t("common.minutes"))}
              </span>
              {lecture.free_preview && <Badge tone="success">{t("lectures.preview")}</Badge>}
              {progressMap[lecture.id]?.completed && (
                <Badge tone="primary">
                  <CheckCircle2 className="h-3 w-3" />
                  {t("lectures.completed")}
                </Badge>
              )}
            </div>
          </div>

          {/* Language track toggle */}
          <div className="mt-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Languages className="h-3.5 w-3.5" />
              {t("player.langTrack")}
            </p>
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              {[
                { code: "he", label: t("player.he") },
                { code: "en", label: t("player.en") },
              ].map((o) => {
                const available = tracks.includes(o.code);
                const active = track === o.code;
                return (
                  <button
                    key={o.code}
                    disabled={!available}
                    onClick={() => setTrack(o.code)}
                    className={cn(
                      "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
                      active ? "bg-primary text-primary-foreground" : "text-foreground/70",
                      !available && "cursor-not-allowed opacity-40"
                    )}
                    title={!available ? t("player.notAvailable") : undefined}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instructor */}
          <div className="mt-5">
            <InstructorCard compact />
          </div>

          {/* About */}
          {description && (
            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {t("player.about")}
              </h2>
              <p className="mt-2 leading-relaxed text-foreground/90">{description}</p>
            </div>
          )}

          {/* Share */}
          <div className="mt-6">
            <ShareButtons title={`${t("lectures.lecture")} ${lecture.order} · ${title}`} image={lecture.thumbnail_url} />
          </div>

          {/* Prev / next */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
            {prev ? (
              <Button asChild variant="outline">
                <Link to={`/lectures/${prev.id}`}>
                  <Back className="h-4 w-4" />
                  <span className="line-clamp-1 max-w-[40vw]">{pick(prev, "title")}</span>
                </Link>
              </Button>
            ) : (
              <span />
            )}
            {next ? (
              <Button asChild>
                <Link to={`/lectures/${next.id}`}>
                  <span className="line-clamp-1 max-w-[40vw]">{pick(next, "title")}</span>
                  <Fwd className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <span />
            )}
          </div>
        </div>

        {/* ── Playlist sidebar ── */}
        <aside className="lg:col-span-1">
          <div className="card-soft overflow-hidden lg:sticky lg:top-20">
            <div className="flex items-center gap-2 border-b border-border p-4">
              <ListVideo className="h-4 w-4 text-goldink" />
              <div>
                <p className="text-sm font-bold leading-tight">{t("player.playlist")}</p>
                <p className="text-[11px] text-muted-foreground">{t("lectures.subtitle")}</p>
              </div>
            </div>
            <ol className="max-h-[28rem] overflow-y-auto lg:max-h-[70vh]">
              {siblings.map((s) => {
                const isCurrent = s.id === lecture.id;
                const done = progressMap[s.id]?.completed;
                const locked = !canWatch(s, accessState);
                return (
                  <li key={s.id}>
                    <Link
                      to={`/lectures/${s.id}`}
                      className={cn(
                        "flex items-center gap-3 border-b border-border/60 px-3 py-2.5 text-sm transition-colors",
                        isCurrent ? "bg-secondary" : "hover:bg-secondary/60"
                      )}
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center">
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : isCurrent ? (
                          <PlayCircle className="h-5 w-5 text-goldink" />
                        ) : locked ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">{s.order}</span>
                        )}
                      </span>
                      <span className={cn("min-w-0 flex-1", isCurrent && "font-semibold")}>
                        <span className="line-clamp-2 leading-snug">{pick(s, "title")}</span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {formatDuration(s.duration_seconds, t("common.minutes"))}
                          {s.free_preview ? ` · ${t("lectures.preview")}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
