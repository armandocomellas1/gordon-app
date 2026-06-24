import { useEffect } from "react";

// Update <title> and Open-Graph / Twitter-Card meta tags per page so shared
// links render rich previews (title, description, image).
//
// SPA caveat: scrapers that don't run JS (some Facebook/Pinterest crawlers) only
// see the STATIC tags in index.html. For per-lecture rich cards in production,
// prerender these routes (Base44 SSR / a prerender service). These dynamic tags
// cover JS-capable consumers and keep the in-app title/sharing correct.

function setMeta(attr, key, content) {
  if (content == null || content === "") return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useMeta({ title, description, image, url, type = "website" }) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ד״ר גבריאלוב` : null;
    if (fullTitle) document.title = fullTitle;
    const href = url || (typeof window !== "undefined" ? window.location.href : "");

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", image);
    setMeta("property", "og:url", href);
    setMeta("property", "og:type", type);
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
  }, [title, description, image, url, type]);
}
