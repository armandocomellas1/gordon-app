// Social Media Promotion config + share-URL builders.
//
// Profile links come from env so they're set once per deployment. Defaults point
// at each network's home page until the real handles are provided.

const env = (typeof import.meta !== "undefined" && import.meta.env) || {};

const INSTAGRAM_GRADIENT =
  "linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)";

/** Follow links shown in the footer / share rows. */
export const SOCIAL = [
  { key: "pinterest", label: "Pinterest", color: "#E60023", url: env.VITE_SOCIAL_PINTEREST || "https://www.pinterest.com" },
  { key: "instagram", label: "Instagram", color: "#E4405F", bg: INSTAGRAM_GRADIENT, url: env.VITE_SOCIAL_INSTAGRAM || "https://www.instagram.com" },
  { key: "facebook", label: "Facebook", color: "#1877F2", url: env.VITE_SOCIAL_FACEBOOK || "https://www.facebook.com" },
  { key: "x", label: "X", color: "#000000", url: env.VITE_SOCIAL_X || "https://x.com" },
].filter((s) => s.url);

/**
 * Web share intents for a given page. Instagram has no web-share URL, so it's a
 * follow-only network (omitted here). Pinterest needs an image to pin.
 */
export function shareTargets({ url, title, image }) {
  const u = encodeURIComponent(url || "");
  const t = encodeURIComponent(title || "");
  const img = encodeURIComponent(image || "");
  return [
    { key: "facebook", label: "Facebook", color: "#1877F2", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: "x", label: "X", color: "#000000", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { key: "pinterest", label: "Pinterest", color: "#E60023", href: `https://www.pinterest.com/pin/create/button/?url=${u}&media=${img}&description=${t}` },
    { key: "whatsapp", label: "WhatsApp", color: "#25D366", href: `https://wa.me/?text=${t}%20${u}` },
  ];
}
