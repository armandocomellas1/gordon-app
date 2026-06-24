import { cn } from "@/lib/utils";

const tones = {
  default: "bg-secondary text-secondary-foreground",
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/15 text-amber-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  muted: "bg-muted text-muted-foreground",
  locked: "bg-foreground/5 text-foreground/70",
};

export function Badge({ className, tone = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
