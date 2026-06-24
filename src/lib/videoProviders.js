// ─────────────────────────────────────────────────────────────────────────
// Provider-agnostic video resolution.
//
// Each Lecture carries `video_provider` (youtube | mux | vimeo | direct) and a
// per-language source (an id or a URL). The UI never hard-codes a provider —
// it asks resolvePlayback() for a descriptor and renders accordingly. Upgrading
// a single lecture from a gated YouTube embed to a Mux signed URL is just a
// field change in the Admin; no code changes.
//
// SECURITY (Appendix B): for a locked lecture, resolvePlayback() returns
// { locked: true } and never exposes the source. For "protectable" providers
// (mux, direct) it requests a short-lived SIGNED url from the backend token
// endpoint so the resulting link can't be reshared. youtube/vimeo are
// embed-only and therefore "gate-only" (login gate, not link-proof).
// ─────────────────────────────────────────────────────────────────────────

import { canWatch } from "./access";

const TOKEN_ENDPOINT = import.meta.env.VITE_PLAYBACK_TOKEN_ENDPOINT?.trim();

export const PROVIDERS = ["youtube", "mux", "vimeo", "direct"];

/** Providers whose URL can be cryptographically signed/expired server-side. */
export const PROTECTABLE = new Set(["mux", "direct"]);

export function sourceForLang(lecture, lang) {
  return lang === "en" ? lecture?.video_en_source : lecture?.video_he_source;
}

export function hasTrack(lecture, lang) {
  return !!sourceForLang(lecture, lang);
}

/** Languages that actually have a configured source for this lecture. */
export function availableTracks(lecture) {
  const out = [];
  if (hasTrack(lecture, "he")) out.push("he");
  if (hasTrack(lecture, "en")) out.push("en");
  return out;
}

function youtubeEmbed(id) {
  // Privacy-enhanced domain, minimal chrome.
  const vid = extractYouTubeId(id);
  return `https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1&playsinline=1`;
}

function vimeoEmbed(id) {
  const vid = String(id).replace(/[^0-9]/g, "") || id;
  return `https://player.vimeo.com/video/${vid}?dnt=1`;
}

export function extractYouTubeId(input) {
  if (!input) return "";
  // Accept a bare id or any youtube/youtu.be URL.
  const m = String(input).match(
    /(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/
  );
  return m ? m[1] : String(input).trim();
}

/**
 * Ask the backend to mint a short-lived signed URL for a protectable source.
 * Returns { url, expiresAt } or null. In demo (no endpoint) we synthesize a
 * fake expiring token so the flow is observable end-to-end.
 *
 * SECURITY: the live request sends only { lecture_id, lang } — the server
 * (functions/playbackToken.example.js) re-checks the viewer's enrollment and
 * derives the real source itself. The client never tells the server which URL
 * to sign, so a tampered client can't escalate access.
 */
async function mintSignedUrl({ lectureId, provider, source, lang }) {
  if (TOKEN_ENDPOINT) {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lecture_id: lectureId, lang }),
      credentials: "include", // send the Base44 session so the server knows the viewer
    });
    if (!res.ok) throw new Error(`playback token endpoint ${res.status}`);
    return res.json(); // { url, expiresAt }
  }

  // Demo fallback: append an expiring pseudo-token. Real protection requires
  // the server-side endpoint above (e.g. a Base44 function returning a Mux JWT).
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const token = btoa(`${lectureId || "demo"}:${expiresAt}`).replace(/=+$/, "");
  if (provider === "mux") {
    const playbackId = String(source).trim();
    return { url: `https://stream.mux.com/${playbackId}.m3u8?token=${token}`, expiresAt, demo: true };
  }
  const sep = source.includes("?") ? "&" : "?";
  return { url: `${source}${sep}sig=${token}`, expiresAt, demo: true };
}

/**
 * Resolve how to play `lecture` in `lang` for this viewer.
 * @returns {Promise<object>} one of:
 *   { locked: true, reason }                       — not authorized
 *   { unavailable: true }                          — no source for this lang
 *   { kind: 'embed', provider, embedUrl }          — iframe (youtube/vimeo)
 *   { kind: 'file', provider, url, signed, expiresAt } — <video> (direct/mux)
 */
export async function resolvePlayback(lecture, lang, { user, accessState }) {
  if (!canWatch(lecture, accessState)) {
    return { locked: true, reason: user ? "enroll" : "login" };
  }

  const source = sourceForLang(lecture, lang);
  if (!source) return { unavailable: true };

  const provider = lecture.video_provider || "youtube";

  if (provider === "youtube") {
    return { kind: "embed", provider, embedUrl: youtubeEmbed(source), signed: false };
  }
  if (provider === "vimeo") {
    return { kind: "embed", provider, embedUrl: vimeoEmbed(source), signed: false };
  }

  // mux / direct → protectable: hand back a signed, expiring URL.
  if (PROTECTABLE.has(provider)) {
    try {
      const { url, expiresAt, demo } = await mintSignedUrl({ lectureId: lecture.id, provider, source, lang });
      return { kind: "file", provider, url, signed: !demo, demoSigned: !!demo, expiresAt };
    } catch (e) {
      // Fall back to the raw source so demo still plays, but flag it.
      return { kind: "file", provider, url: source, signed: false, error: String(e?.message || e) };
    }
  }

  return { kind: "file", provider, url: source, signed: false };
}
