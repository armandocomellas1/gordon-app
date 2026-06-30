// ─────────────────────────────────────────────────────────────────────────
// Seed data for DEMO MODE.
//
// Dr. Gila Gavrielov — "Diagnosis & Healing with Crystals" course.
// Part 1 holds 12 recorded Hebrew lectures streamed from YouTube. English (and
// other) translations are pending: video_en_source is empty and
// translation_status is "pending" until a track is published in the Admin.
//
// Bump SEED_VERSION in mockBackend.js whenever this data changes so returning
// demo visitors get a fresh re-seed instead of a stale localStorage copy.
// ─────────────────────────────────────────────────────────────────────────

import { chunksForDuration } from "@/lib/translationPipeline";

// Kept for buildSeedTranslationJobs' (currently dormant) "done"/"ready" demo
// branches — a public sample so a published English track could play.
const EN_SAMPLE =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";

/** @typedef {"pending"|"in_progress"|"done"} TStatus */

// "Diagnosis & Healing with Crystals" — recorded Hebrew lectures streamed from
// YouTube; the cover image is the video's own thumbnail. Durations are taken
// from the source Wix course steps. Part 1 = 12 lessons, Part 2 = 11 lessons.
const PART1_TITLE_HE = "חלק א׳ — אבחון וריפוי באמצעות גבישים";
const PART1_TITLE_EN = "Part 1 — Diagnosis & Healing with Crystals";
const PART2_TITLE_HE = "חלק ב׳ — אבחון וריפוי באמצעות גבישים";
const PART2_TITLE_EN = "Part 2 — Diagnosis & Healing with Crystals";

// [order, youtubeId, duration_seconds]
const PART1 = [
  [1, "GLIANXTOQJs", 8590], // 02:23:10
  [2, "2fSfppn-_HY", 9375], // 02:36:15
  [3, "fssFqlJy-mw", 9284], // 02:34:44
  [4, "t3wfG97hgzc", 8657], // 02:24:17
  [5, "s9QPO0qKzN0", 8528], // 02:22:08
  [6, "2W9Q-gcdsCY", 9476], // 02:37:56
  [7, "fk8fWbDIawY", 8760], // 02:26:00
  [8, "YOiKa1PUe0A", 9364], // 02:36:04
  [9, "6_UDFKMy0oc", 8913], // 02:28:33
  [10, "SjB1WpXC-_E", 9368], // 02:36:08
  [11, "6BBHclPfyWw", 8805], // 02:26:45
  [12, "kcmCulUj_b4", 9086], // 02:31:26
];

// Part 2 — lessons 13–23.
const PART2 = [
  [13, "slBNmIBQE-c", 9289], // 02:34:49
  [14, "kpaSKTYFczA", 9089], // 02:31:29
  [15, "00YsrFfwS98", 9042], // 02:30:42
  [16, "gquprqyTVHc", 10450], // 02:54:10
  [17, "3z-eErHwjyY", 9776], // 02:42:56
  [18, "xiKgmMsakeM", 9356], // 02:35:56
  [19, "nFcxjHSKIiU", 9794], // 02:43:14
  [20, "QvsB38sAACw", 8053], // 02:14:13
  [21, "jJf-I1whddU", 8315], // 02:18:35
  [22, "pHhyVVnGm1o", 8335], // 02:18:55
  [23, "EzTBrcKJSYg", 8371], // 02:19:31
];

function lecturesForPart(part, titleHe, titleEn, rows) {
  return rows.map(([order, youtubeId, dur]) => ({
    order,
    code: `P${part}L${String(order).padStart(2, "0")}`,
    part,
    part_title_he: titleHe,
    part_title_en: titleEn,
    title_he: `ד״ר גילה גבריאלוב — שיעור ${order}`,
    title_en: `Dr. Gila Gavrielov — Lesson ${order}`,
    description_he: `שיעור ${order} מתוך ${titleHe}.`,
    description_en: `Lesson ${order} of ${titleEn}.`,
    thumbnail_url: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    duration_seconds: dur,
    video_provider: "youtube",
    video_he_source: youtubeId,
    video_en_source: "",
    translation_status: "pending",
    free_preview: order === 1,
    is_published: true,
  }));
}

export function buildSeedLectures() {
  return [
    ...lecturesForPart(1, PART1_TITLE_HE, PART1_TITLE_EN, PART1),
    ...lecturesForPart(2, PART2_TITLE_HE, PART2_TITLE_EN, PART2),
  ];
}

// Where each "in_progress" lecture sits in the pipeline — chosen to show a
// lively spread on the Foreman Dashboard: an active render, a failure to retry,
// an early stage, and one finished-but-not-yet-published (Publish button).
const INPROGRESS_STAGE = { 9: "processing", 10: "error", 11: "chunking", 12: "ready" };

const COST_PER_CHUNK = 0.8;
const CREDITS_PER_CHUNK = 50;

/**
 * Build TranslationJob rows from already-persisted lectures (need their ids).
 * Mirrors each lecture's translation_status onto a realistic pipeline state.
 */
export function buildSeedTranslationJobs(lectures) {
  const now = Date.now();
  return lectures.map((l) => {
    const total = chunksForDuration(l.duration_seconds);
    const worker_id = `worker-${(l.order % 2) + 1}`;
    const base = {
      lecture_id: l.id,
      lecture_code: l.code,
      lecture_order: l.order,
      source_file: `Lecture_${String(l.order).padStart(2, "0")}.mp4`,
      source_size_gb: 0.5,
      worker_id,
      chunks_total: total,
      chunks_done: 0,
      heygen_credits_used: 0,
      heygen_cost_usd: 0,
      retries: 0,
      last_error: "",
      output_url: "",
      throughput: "",
      eta: null,
      started_at: null,
      completed_at: null,
    };

    if (l.translation_status === "done") {
      return {
        ...base,
        status: "published",
        chunks_done: total,
        heygen_cost_usd: round2(total * COST_PER_CHUNK),
        heygen_credits_used: total * CREDITS_PER_CHUNK,
        throughput: "2.4x realtime",
        output_url: EN_SAMPLE,
        youtube_url: `https://youtu.be/demo${l.order}`,
        started_at: new Date(now - 86400000 * (22 - l.order)).toISOString(),
        completed_at: new Date(now - 86400000 * (21 - l.order)).toISOString(),
      };
    }

    if (l.translation_status === "in_progress") {
      const stage = INPROGRESS_STAGE[l.order] || "processing";
      const partial = Math.max(1, Math.floor(total / 2));
      const common = {
        ...base,
        status: stage,
        started_at: new Date(now - 3600000 * 2).toISOString(),
        throughput: "2.0x realtime",
        eta: new Date(now + 3600000 * 2).toISOString(),
      };
      if (stage === "processing")
        return { ...common, chunks_done: partial, heygen_cost_usd: round2(partial * COST_PER_CHUNK), heygen_credits_used: partial * CREDITS_PER_CHUNK };
      if (stage === "error")
        return { ...common, status: "error", chunks_done: partial, retries: 1, last_error: "HeyGen render timeout on chunk " + (partial + 1), heygen_cost_usd: round2(partial * COST_PER_CHUNK), heygen_credits_used: partial * CREDITS_PER_CHUNK, eta: null };
      if (stage === "ready")
        return { ...common, status: "ready", chunks_done: total, heygen_cost_usd: round2(total * COST_PER_CHUNK), heygen_credits_used: total * CREDITS_PER_CHUNK, output_url: EN_SAMPLE, eta: null };
      // chunking / uploading
      return common;
    }

    // pending → queued in staging
    return { ...base, status: "queued" };
  });
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ───────────────────────── Certificate Course extras ─────────────────────────

const DEMO_STUDENT_EMAIL = "student@example.com";
// Long-standing public sample PDF — placeholder for the real 300-page handbook.
const SAMPLE_PDF = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

/** The 300-page written companion (and any handouts) included with the course. */
export function buildSeedCourseResources() {
  return [
    {
      title_he: "חומר עיוני נלווה — 300 עמודים",
      title_en: "Written companion — 300 pages",
      description_he: "החומר הכתוב המלא הנלווה לקורס התעודה, להורדה לתלמידים רשומים.",
      description_en: "The full written extracurricular material for the Certificate Course, for enrolled students.",
      kind: "pdf",
      url: SAMPLE_PDF,
      size_mb: 12,
      pages: 300,
      enrolled_only: true,
      order: 1,
    },
    {
      title_he: "דף עזר — אבני החושן",
      title_en: "Quick sheet — breastplate stones",
      description_he: "טבלת התאמה: אבן · שבט · סגולה.",
      description_en: "Reference table: stone · tribe · property.",
      kind: "pdf",
      url: SAMPLE_PDF,
      size_mb: 1,
      pages: 4,
      enrolled_only: true,
      order: 2,
    },
  ];
}

// [number, name_he, name_en, family, color, hardness, props_he, props_en, scripture, tribe]
const RAW_STONES = [
  [1, "אודם", "Carnelian (Odem)", "Chalcedony", "אדום / Red", "7", "חיוניות, אומץ ויסוד.", "Vitality, courage and grounding.", "Exodus 28:17", "Reuben"],
  [2, "פטדה", "Topaz (Pitdah)", "Topaz", "צהוב / Yellow", "8", "בהירות מחשבה ושמחה.", "Mental clarity and joy.", "Exodus 28:17", "Simeon"],
  [3, "ברקת", "Emerald (Bareketh)", "Beryl", "ירוק / Green", "7.5", "ריפוי הלב ואיזון.", "Heart healing and balance.", "Exodus 28:17", "Levi"],
  [4, "נופך", "Turquoise (Nophekh)", "Phosphate", "תכלת / Teal", "5", "הגנה ותקשורת.", "Protection and communication.", "Exodus 28:18", "Judah"],
  [5, "ספיר", "Lapis Lazuli (Sappir)", "Lazurite", "כחול / Blue", "5.5", "חוכמה וראייה פנימית.", "Wisdom and inner vision.", "Exodus 28:18", "Issachar"],
  [6, "יהלום", "Quartz/Diamond (Yahalom)", "Quartz", "צלול / Clear", "7", "הגברה וצלילות.", "Amplification and clarity.", "Exodus 28:18", "Zebulun"],
  [7, "לשם", "Amber/Jacinth (Leshem)", "Resin", "כתום / Amber", "2.5", "ניקוי וריפוי עדין.", "Cleansing and gentle healing.", "Exodus 28:19", "Dan"],
  [8, "שבו", "Agate (Shevo)", "Chalcedony", "מעורב / Banded", "7", "יציבות והארקה.", "Stability and grounding.", "Exodus 28:19", "Naphtali"],
  [9, "אחלמה", "Amethyst (Achlamah)", "Quartz", "סגול / Purple", "7", "צלילות, איזון והרגעה.", "Sobriety, balance and calm.", "Exodus 28:19", "Gad"],
  [10, "תרשיש", "Beryl/Chrysolite (Tarshish)", "Beryl", "ירקרק / Sea-green", "7.5", "שגשוג וזרימה.", "Prosperity and flow.", "Exodus 28:20", "Asher"],
  [11, "שוהם", "Onyx (Shoham)", "Chalcedony", "שחור / Black", "7", "מיקוד והגנה.", "Focus and protection.", "Exodus 28:20", "Joseph"],
  [12, "ישפה", "Jasper (Yashpheh)", "Chalcedony", "מעורב / Mixed", "7", "חוסן ויציבות.", "Resilience and steadiness.", "Exodus 28:20", "Benjamin"],
  [28, "ישפה תמונתי", "Picture Jasper", "Jasper", "חום / Brown", "7", "הארקה וחיבור לאדמה.", "Grounding and earth connection.", "", ""],
  [30, "ישפה צהוב", "Yellow Jasper", "Jasper", "צהוב / Yellow", "7", "מרץ ובטחון.", "Energy and confidence.", "", ""],
  [33, "קוורץ צלול", "Clear Quartz", "Quartz", "צלול / Clear", "7", "אבן מאסטר — הגברה וכוונה.", "Master stone — amplifies intent.", "", ""],
  [34, "אגת טחב", "Moss Agate", "Chalcedony", "ירוק / Green", "7", "צמיחה, שפע וריפוי.", "Growth, abundance and healing.", "", ""],
  [35, "האולייט", "Howlite", "Borate", "לבן / White", "3.5", "הרגעה והפחתת מתח.", "Calm and stress relief.", "", ""],
  [36, "אובסידיאן שחור", "Black Obsidian", "Volcanic glass", "שחור / Black", "5.5", "הגנה ושחרור.", "Protection and release.", "", ""],
];

export function buildSeedStones() {
  return RAW_STONES.map(([number, name_he, name_en, family, color, hardness, props_he, props_en, scripture, tribe]) => ({
    number,
    name_he,
    name_en,
    family,
    color,
    hardness,
    properties_he: props_he,
    properties_en: props_en,
    scripture_ref: scripture,
    tribe,
    image_url: `https://picsum.photos/seed/stone-${number}/480/480`,
    is_published: true,
  }));
}

/** Demo shipment + meeting so both the student hub and the Admin ops views are populated. */
export function buildSeedKitShipments() {
  return [
    {
      user_email: DEMO_STUDENT_EMAIL,
      status: "requested",
      recipient_name: "תלמידה לדוגמה / Demo Student",
      phone: "+972-50-0000000",
      address1: "רחוב הרצל 1",
      city: "Bnei Brak",
      region: "",
      postal_code: "51000",
      country: "Israel",
      requested_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];
}

export function buildSeedMeetings() {
  return [
    {
      user_email: DEMO_STUDENT_EMAIL,
      meeting_no: 1,
      status: "requested",
      requested_datetime: new Date(Date.now() + 86400000 * 5).toISOString(),
      topic: "פתיחת הקורס ובחירת ערכת אבנים / Course kickoff & kit selection",
    },
  ];
}
