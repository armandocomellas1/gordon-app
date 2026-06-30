import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn-style className combiner. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Seconds → "h:mm" / "m:ss" friendly label. */
export function formatDuration(seconds, minutesLabel = "min") {
  if (!seconds || seconds < 0) return "—";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} ${minutesLabel}`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

export function formatDate(iso, lang = "he") {
  if (!iso) return "—";
  try {
    const locales = { he: "he-IL", fr: "fr-FR", ru: "ru-RU" };
    return new Date(iso).toLocaleDateString(locales[lang] || "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
