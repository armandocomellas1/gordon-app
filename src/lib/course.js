// Certificate-Course business rules: what's included and when a certificate is earned.

/** Personal meetings with Dr. Gavrielov included in the course. */
export const MEETINGS_INCLUDED = 2;

/** Compute lecture-completion stats from a user's Progress rows + published lectures. */
export function courseCompletion(progressRows = [], lectures = []) {
  const total = lectures.length;
  const completedIds = new Set(progressRows.filter((p) => p.completed).map((p) => p.lecture_id));
  const completed = lectures.filter((l) => completedIds.has(l.id)).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return { completed, total, pct, complete: total > 0 && completed >= total };
}

/** Build the (up to 2) meeting slots view, filling gaps with empty placeholders. */
export function meetingSlots(meetings = []) {
  const slots = [];
  for (let n = 1; n <= MEETINGS_INCLUDED; n++) {
    slots.push(meetings.find((m) => m.meeting_no === n) || { meeting_no: n, status: "available" });
  }
  return slots;
}

export const SHIPMENT_FLOW = ["requested", "preparing", "shipped", "delivered"];
