// ─────────────────────────────────────────────────────────────────────────
// Access-control layer  ·  Appendix B: "secure paywall / content protection"
//
// Authorization rules (who is allowed to watch what):
//   • free_preview lectures  → anyone, no login.
//   • all other lectures     → logged-in user WITH an active, unexpired
//                              Enrollment ("login gate + 1-year enrollment").
//
// The *enforcement* of paid-content protection (so a link can't be reshared)
// lives in videoProviders.resolvePlayback(): a locked lecture's real source is
// never resolved for an unauthorized viewer, and protected providers (Mux,
// signed direct) hand back a short-lived signed URL minted server-side rather
// than a permanent, shareable one. See README → "Appendix B".
// ─────────────────────────────────────────────────────────────────────────

export const ENROLLMENT_YEARS = 1;

export function oneYearFrom(date = new Date()) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + ENROLLMENT_YEARS);
  return d;
}

function isEnrollmentActive(enr, at = new Date()) {
  if (!enr || enr.status !== "active") return false;
  if (!enr.expires_date) return true;
  return new Date(enr.expires_date) > at;
}

/**
 * Compute a viewer's overall access from their enrollments.
 * @returns {{ hasFullAccess: boolean, activeEnrollment: object|null,
 *             expiresAt: string|null, isAdmin: boolean }}
 */
export function getAccessState(user, enrollments = []) {
  const isAdmin = user?.role === "admin";
  const active = enrollments.find((e) => isEnrollmentActive(e));
  // Admins (Dr. Gavrielov / staff) always have full access.
  const hasFullAccess = isAdmin || !!active;
  return {
    hasFullAccess,
    activeEnrollment: active || null,
    expiresAt: active?.expires_date || null,
    isAdmin,
  };
}

/** Is THIS viewer allowed to watch THIS lecture? */
export function canWatch(lecture, accessState) {
  if (!lecture) return false;
  if (lecture.free_preview) return true;
  return !!accessState?.hasFullAccess;
}

/** Reason a lecture is locked (for messaging). */
export function lockReason(lecture, user, accessState) {
  if (canWatch(lecture, accessState)) return null;
  if (!user) return "login";
  return "enroll";
}
