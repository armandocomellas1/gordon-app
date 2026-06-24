// ─────────────────────────────────────────────────────────────────────────
// The single place that decides between the real Base44 backend and the
// demo (localStorage) backend.
//
//   • VITE_BASE44_APP_ID set   → live @base44/sdk client
//   • VITE_BASE44_APP_ID blank → demo mock client (same interface)
//
// Every page/component imports from ./entities and ./integrations only, so
// nothing else in the app ever needs to know which backend is active.
// ─────────────────────────────────────────────────────────────────────────

import { createClient } from "@base44/sdk";
import { createMockClient } from "./mockBackend";

const appId = import.meta.env.VITE_BASE44_APP_ID?.trim();
const requiresAuth = String(import.meta.env.VITE_BASE44_REQUIRES_AUTH) === "true";

/** True when running against the localStorage demo backend. */
export const IS_DEMO = !appId;

export const base44 = IS_DEMO
  ? createMockClient()
  : createClient({ appId, requiresAuth });

if (IS_DEMO && typeof window !== "undefined") {
  // Make demo state resettable from the console / Login screen.
  window.__GAVRIELOV_DEMO__ = base44;
}
