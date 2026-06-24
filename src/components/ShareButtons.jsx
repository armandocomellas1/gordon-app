import { useState } from "react";
import { Share2, Link2, Check } from "lucide-react";
import { useI18n } from "@/i18n";
import { shareTargets } from "@/lib/social";
import { BrandIcon } from "./BrandIcons";
import { cn } from "@/lib/utils";

/**
 * Per-page share row. `url` defaults to the current page. On devices with the
 * Web Share API the copy button opens the native share sheet; otherwise it
 * copies the link to the clipboard.
 */
export default function ShareButtons({ url, title, image, label = true, className }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const targets = shareTargets({ url: shareUrl, title, image });

  async function copyOrShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {label && (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Share2 className="h-4 w-4" />
          {t("share.title")}
        </span>
      )}
      {targets.map((s) => (
        <a
          key={s.key}
          href={s.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${t("share.title")} · ${s.label}`}
          title={s.label}
          style={{ backgroundColor: s.color }}
          className="grid h-9 w-9 place-items-center rounded-full text-white shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <BrandIcon name={s.key} className="h-4 w-4" />
        </a>
      ))}
      <button
        onClick={copyOrShare}
        aria-label={copied ? t("share.copied") : t("share.copy")}
        title={copied ? t("share.copied") : t("share.copy")}
        className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
