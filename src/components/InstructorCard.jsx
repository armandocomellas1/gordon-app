import { GraduationCap, Gem } from "lucide-react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/** Warm "meet your lecturer" card — reassures users who Dr. Gavrielov is. */
export default function InstructorCard({ compact = false, className }) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "card-soft flex items-center gap-4 p-4",
        compact ? "" : "md:p-5",
        className
      )}
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-purple-700 text-white">
        <Gem className="h-7 w-7" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("instructor.label")}
        </p>
        <p className="truncate text-base font-bold">{t("instructor.name")}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{t("instructor.title")}</span>
        </p>
        {!compact && <p className="mt-2 text-sm text-muted-foreground">{t("instructor.blurb")}</p>}
      </div>
    </div>
  );
}
