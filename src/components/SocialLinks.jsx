import { useI18n } from "@/i18n";
import { SOCIAL } from "@/lib/social";
import { BrandIcon } from "./BrandIcons";
import { cn } from "@/lib/utils";

/** Footer / page "Follow us" row of brand-coloured profile links. */
export default function SocialLinks({ withLabel = false, size = "md", className }) {
  const { t } = useI18n();
  const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {withLabel && <span className="text-sm text-muted-foreground">{t("social.follow")}</span>}
      {SOCIAL.map((s) => (
        <a
          key={s.key}
          href={s.url}
          target="_blank"
          rel="noreferrer"
          aria-label={s.label}
          title={s.label}
          style={{ background: s.bg || s.color }}
          className={cn(
            "grid place-items-center rounded-full text-white shadow-sm transition-transform hover:-translate-y-0.5",
            dim
          )}
        >
          <BrandIcon name={s.key} className={icon} />
        </a>
      ))}
    </div>
  );
}
