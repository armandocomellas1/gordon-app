import { useEffect, useRef, useState } from "react";
import { ShieldCheck, AlertTriangle, VideoOff } from "lucide-react";
import { useI18n } from "@/i18n";
import { resolvePlayback } from "@/lib/videoProviders";
import { Spinner } from "./ui/misc";
import LockOverlay from "./LockOverlay";

/**
 * Provider-agnostic, access-aware player.
 *
 * Props:
 *   lecture, lang, user, accessState
 *   startAt        — seconds to resume from (file providers only)
 *   onProgress     — (seconds) => void, throttled ~5s
 *   onEnded        — () => void
 */
export default function VideoPlayer({
  lecture,
  lang,
  user,
  accessState,
  startAt = 0,
  onProgress,
  onEnded,
}) {
  const { t } = useI18n();
  const [state, setState] = useState({ status: "loading" });
  const [buffering, setBuffering] = useState(false);
  const videoRef = useRef(null);
  const lastReport = useRef(0);

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    resolvePlayback(lecture, lang, { user, accessState })
      .then((res) => alive && setState({ status: "ready", res }))
      .catch((e) => alive && setState({ status: "error", error: String(e?.message || e) }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecture?.id, lang, accessState?.hasFullAccess]);

  const res = state.res;

  return (
    <div className="aspect-video-frame card-soft">
      {state.status === "loading" && (
        <div className="absolute inset-0 grid place-items-center bg-black/95 text-white">
          <Spinner className="h-8 w-8 text-white" />
        </div>
      )}

      {state.status === "ready" && res?.locked && <LockOverlay reason={res.reason} />}

      {state.status === "ready" && res?.unavailable && (
        <Message icon={VideoOff} text={lang === "en" ? t("player.notAvailable") : t("player.notConfigured")} />
      )}

      {state.status === "ready" && res?.kind === "embed" && (
        <iframe
          title={lecture?.code || "lecture"}
          src={res.embedUrl}
          allow="accelerated-download; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      )}

      {state.status === "ready" && res?.kind === "file" && (
        <video
          ref={videoRef}
          src={res.url}
          poster={lecture?.thumbnail_url}
          controls
          playsInline
          // Stream large files: pull only metadata up front, not the whole ~1GB.
          preload="metadata"
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
          onLoadedMetadata={() => {
            if (startAt && videoRef.current) {
              try {
                videoRef.current.currentTime = startAt;
              } catch {
                /* ignore */
              }
            }
          }}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onCanPlay={() => setBuffering(false)}
          onTimeUpdate={(e) => {
            const s = Math.floor(e.currentTarget.currentTime);
            if (onProgress && s - lastReport.current >= 5) {
              lastReport.current = s;
              onProgress(s);
            }
          }}
          onEnded={() => onEnded?.()}
        />
      )}

      {/* Buffering overlay for large/slow video files. */}
      {state.status === "ready" && res?.kind === "file" && buffering && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/40">
          <div className="flex flex-col items-center gap-2 text-white">
            <Spinner className="h-7 w-7 text-white" />
            <span className="text-xs">{t("player.loadingVideo")}</span>
          </div>
        </div>
      )}

      {state.status === "error" && (
        <Message icon={AlertTriangle} text={state.error} />
      )}

      {/* Security indicator for protected/signed playback (Appendix B). */}
      {state.status === "ready" && res?.kind === "file" && (res.signed || res.demoSigned) && (
        <div className="pointer-events-none absolute end-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
          {res.demoSigned ? "Signed (demo)" : "Signed URL"}
        </div>
      )}
    </div>
  );
}

function Message({ icon: Icon, text }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-black/95 px-6 text-center text-white">
      <div>
        <Icon className="mx-auto mb-3 h-8 w-8 text-white/70" />
        <p className="text-sm text-white/80">{text}</p>
      </div>
    </div>
  );
}
