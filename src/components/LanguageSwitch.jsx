import { useI18n } from "@/i18n";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LanguageSwitch({ className }) {
  const { lang, setLang } = useI18n();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card p-0.5 text-sm",
        className
      )}
      role="group"
      aria-label="Language"
    >
      <Languages className="mx-1.5 h-4 w-4 text-muted-foreground" aria-hidden />
      {[
        { code: "fr", label: "FR" },
        { code: "en", label: "EN" },
      ].map((o) => (
        <button
          key={o.code}
          onClick={() => setLang(o.code)}
          className={cn(
            "rounded-full px-3 py-1 font-semibold transition-colors",
            lang === o.code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={lang === o.code}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
