import { cn } from "@/lib/utils";

export function Skeleton({ className }) {
  return <div className={cn("shimmer rounded-md", className)} />;
}

export function Spinner({ className }) {
  return (
    <svg
      className={cn("animate-spin h-5 w-5 text-goldink", className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
      />
    </svg>
  );
}

export function Switch({ checked, onChange, id }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          // ms-* is logical (RTL-safe).
          checked ? "ms-5" : "ms-0.5"
        )}
      />
    </button>
  );
}
