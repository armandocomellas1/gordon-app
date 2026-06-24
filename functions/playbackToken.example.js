// ─────────────────────────────────────────────────────────────────────────
// Base44 backend function — secure playback token (Appendix B, EXAMPLE).
//
// Mints a SHORT-LIVED, SIGNED playback URL for a paid lecture, AFTER re-checking
// the viewer's access on the server. This is what makes the paywall link-proof:
// the client only sends { lecture_id, lang }; the server decides whether the
// viewer is allowed and derives the real source itself, so a tampered client
// cannot escalate access or obtain a permanent shareable URL.
//
// Frontend → set VITE_PLAYBACK_TOKEN_ENDPOINT to this function's URL.
//   POST https://<your-app>.base44.app/functions/playbackToken   (Base44 session cookie sent)
//   body: { "lecture_id": "...", "lang": "he" | "en" }
//   200:  { "url": "https://stream.mux.com/<id>.m3u8?token=<jwt>", "expiresAt": "..." }
//
// Server env (Mux → Settings → Signing Keys):
//   MUX_SIGNING_KEY_ID            e.g. "abcd1234..."
//   MUX_SIGNING_PRIVATE_KEY       base64-encoded RSA private key (PEM) from Mux
//   PLAYBACK_TTL_SECONDS          optional, default 120
// ─────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from "npm:@base44/sdk";
import { create as createJWT } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const MUX_SIGNING_KEY_ID = Deno.env.get("MUX_SIGNING_KEY_ID");
const MUX_SIGNING_PRIVATE_KEY = Deno.env.get("MUX_SIGNING_PRIVATE_KEY"); // base64 PEM
const TTL = Number(Deno.env.get("PLAYBACK_TTL_SECONDS")) || 120;

export default async function handler(req) {
  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  // User-scoped client: identifies the logged-in viewer from their session.
  const base44 = createClientFromRequest(req);
  let user;
  try {
    user = await base44.auth.me();
  } catch {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { lecture_id, lang } = await req.json();
  if (!lecture_id) return Response.json({ error: "lecture_id_required" }, { status: 400 });

  const lecture = await base44.entities.Lecture.get(lecture_id).catch(() => null);
  if (!lecture) return Response.json({ error: "not_found" }, { status: 404 });

  // ── Authoritative access check (never trust the client) ──────────────────
  const allowed =
    lecture.free_preview === true ||
    user.role === "admin" ||
    (await hasActiveEnrollment(base44, user.email));
  if (!allowed) return Response.json({ error: "forbidden" }, { status: 403 });

  // Server derives the real source for the requested language.
  const source = lang === "en" ? lecture.video_en_source : lecture.video_he_source;
  if (!source) return Response.json({ error: "no_source" }, { status: 404 });

  const expiresAt = new Date(Date.now() + TTL * 1000).toISOString();

  if (lecture.video_provider === "mux") {
    const token = await signMuxToken(source);
    return Response.json({ url: `https://stream.mux.com/${source}.m3u8?token=${token}`, expiresAt });
  }

  // "direct": for true protection, store files behind a signed CDN (CloudFront /
  // GCS signed URLs / Cloudflare). Sign here with that provider's SDK and return
  // the short-lived URL. Placeholder below appends an expiry the CDN enforces.
  const sep = source.includes("?") ? "&" : "?";
  return Response.json({ url: `${source}${sep}exp=${Math.floor(Date.now() / 1000) + TTL}`, expiresAt });
}

/** Active, unexpired enrollment for this email? */
async function hasActiveEnrollment(base44, email) {
  const rows = await base44.entities.Enrollment.filter({ user_email: email, status: "active" });
  const now = Date.now();
  return rows.some((e) => !e.expires_date || new Date(e.expires_date).getTime() > now);
}

/** RS256-sign a Mux playback JWT: header{kid}, payload{ sub, aud:"v", exp }. */
async function signMuxToken(playbackId) {
  const key = await importRsaPrivateKey(MUX_SIGNING_PRIVATE_KEY);
  const exp = Math.floor(Date.now() / 1000) + TTL;
  return createJWT(
    { alg: "RS256", typ: "JWT", kid: MUX_SIGNING_KEY_ID },
    { sub: playbackId, aud: "v", exp },
    key
  );
}

/** Import Mux's base64-encoded PEM private key as a WebCrypto signing key. */
async function importRsaPrivateKey(base64Pem) {
  const pem = atob(base64Pem);
  const body = pem
    .replace(/-----BEGIN [A-Z ]+-----/, "")
    .replace(/-----END [A-Z ]+-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}
