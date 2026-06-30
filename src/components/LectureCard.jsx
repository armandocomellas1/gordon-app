import { Link } from "react-router-dom";
import { Play, Lock, Check, Languages, Clock, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n";
import { formatDuration } from "@/lib/utils";
import { hasTrack } from "@/lib/videoProviders";
import { Badge } from "./ui/badge";

export default function LectureCard({ lecture, locked, progress }) {
  const { t, lang, pick } = useI18n();
  const title = pick(lecture, "title");
  const pct = progress?.completed
    ? 100
    : progress && lecture.duration_seconds
    ? Math.min(100, Math.round((progress.position_seconds / lecture.duration_seconds) * 100))
    : 0;

  const enInProgress = lecture.translation_status === "in_progress";
  const hasEn = hasTrack(lecture, "en");

  return (
    <Link
      to={`/lectures/${lecture.id}`}
      className="group card-soft block overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-200 to-amber-100">
        {lecture.thumbnail_url && (
          <img
            src={lecture.thumbnail_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
        <span className="absolute start-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-xs font-bold text-white">
          {t("lectures.lecture")} {lecture.order}
        </span>
        <div className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/25">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 opacity-0 shadow transition-opacity group-hover:opacity-100">
            {locked ? <Lock className="h-5 w-5 text-foreground" /> : <Play className="h-5 w-5 text-primary" />}
          </span>
        </div>
        {pct > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
            <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] font-bold leading-snug">{title}</h3>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {lecture.free_preview && <Badge tone="success">{t("lectures.preview")}</Badge>}
          {locked && <Badge tone="locked"><Lock className="h-3 w-3" />{t("lectures.locked")}</Badge>}
          {progress?.completed && <Badge tone="primary"><Check className="h-3 w-3" />{t("lectures.completed")}</Badge>}
          {!hasEn && enInProgress ? (
            <Badge tone="warning"><Loader2 className="h-3 w-3" />{t("lectures.translating")}</Badge>
          ) : !hasEn ? (
            <Badge tone="muted"><Languages className="h-3 w-3" />{t("lectures.he_only")}</Badge>
          ) : null}
          <span className="ms-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(lecture.duration_seconds, t("common.minutes"))}
          </span>
        </div>
      </div>
    </Link>
  );
}
