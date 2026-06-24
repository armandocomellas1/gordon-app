// ─────────────────────────────────────────────────────────────────────────
// Seed data for DEMO MODE.
//
// 20-lecture course bridging gemology, Jewish lore, and crystal healing.
// Demo video tracks use Blender Foundation open movies (CC-BY) purely as
// placeholders so reviewers can actually press play — replace video_*_source
// with real YouTube ids / Mux playback ids / Vimeo ids / URLs in the Admin.
//
// translation_status is deliberately mixed so the Admin "ongoing translated
// content updates" workflow (pending → in_progress → done) is visible.
// ─────────────────────────────────────────────────────────────────────────

import { chunksForDuration } from "@/lib/translationPipeline";

const HE_SAMPLE =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const EN_SAMPLE =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";

const thumb = (n) => `https://picsum.photos/seed/gavrielov-${n}/640/360`;

/** @typedef {"pending"|"in_progress"|"done"} TStatus */

const RAW = [
  ["L01", "מבוא: אבנים במקרא ובמדע", "Introduction: Stones in Scripture and Science",
    "שיעור פתיחה — הגשר בין הגמולוגיה המודרנית לבין אבני החן בכתבי הקודש.",
    "Opening lecture — the bridge between modern gemology and the gemstones of Scripture.",
    1580, "done", true],
  ["L02", "חושן המשפט: שתים-עשרה האבנים", "The Breastplate (Hoshen): The Twelve Stones",
    "מבנה החושן, סדר האבנים והקשר לשבטי ישראל.",
    "Structure of the breastplate, the order of the stones, and the tribes of Israel.",
    1720, "done", true],
  ["L03", "זיהוי אבני החן במקרא", "Identifying Biblical Gemstones",
    "כיצד מתאימים שם עברי עתיק לאבן גמולוגית מוכרת.",
    "How an ancient Hebrew name is matched to a known gemological mineral.",
    1990, "done", false],
  ["L04", "יסודות הגמולוגיה: מבנה הגביש", "Gemology Fundamentals: Crystal Structure",
    "מערכות גבישיות, שבירה ואור — היסודות המדעיים.",
    "Crystal systems, refraction and light — the scientific foundations.",
    2110, "done", false],
  ["L05", "צבע, אור ואנרגיה באבנים", "Color, Light and Energy in Stones",
    "כיצד צבע נוצר באבן ומה משמעותו במסורת הריפוי.",
    "How color arises in a stone and its meaning in the healing tradition.",
    1875, "done", false],
  ["L06", "שנים-עשר השבטים ואבניהם", "The Twelve Tribes and Their Stones",
    "התאמת כל שבט לאבנו, מקורות ומשמעות.",
    "Matching each tribe to its stone — sources and meaning.",
    1660, "done", false],
  ["L07", "אחלמה (אמטיסט): צלילות ואיזון", "Amethyst: Clarity and Sobriety",
    "האבן השביעית בחושן — היסטוריה, סגולות ושימוש.",
    "The seventh stone of the breastplate — history, properties and use.",
    1540, "done", false],
  ["L08", "אבן הספיר וכיסא הכבוד", "Lapis Lazuli and the Sapphire of the Throne",
    "ספיר במקרא, לאפיס לזולי, והחזון של כיסא הכבוד.",
    "Sapphire in Scripture, lapis lazuli, and the vision of the Throne.",
    2030, "done", false],
  ["L09", "טיהור והטענת אבנים", "Cleansing and Charging Stones",
    "שיטות מעשיות לטיהור אבנים והכנתן לשימוש.",
    "Practical methods for cleansing stones and preparing them for use.",
    1450, "in_progress", false],
  ["L10", "תמציות ריפוי: הכנה ושימוש", "Healing Essences: Preparation and Use",
    "הכנת תמציות אבן, מינונים והוראות שימוש.",
    "Preparing stone essences, dosing, and usage instructions.",
    1780, "in_progress", false],
  ["L11", "אבנים לאיזון רגשי", "Stones for Emotional Balance",
    "אבנים נגד מתח, חרדה ודכדוך — מסורת ומדע ההתנהגות.",
    "Stones for tension, anxiety and low mood — tradition and behavioural science.",
    1690, "in_progress", false],
  ["L12", "אבנים לחיוניות גופנית", "Stones for Physical Vitality",
    "אבנים לאנרגיה, חוסן וזרימת דם.",
    "Stones for energy, resilience and circulation.",
    1610, "in_progress", false],
  ["L13", "אבני מגן במסורת", "Protective Stones in Tradition",
    "אבני שמירה ומגן במקורות ובמנהג.",
    "Guardian and protective stones in sources and custom.",
    1500, "pending", false],
  ["L14", "אבני גן עדן (יחזקאל כ״ח)", "The Garden of Eden Stones (Ezekiel 28)",
    "תשע האבנים של גן עדן בנבואת יחזקאל.",
    "The nine stones of Eden in the prophecy of Ezekiel.",
    1920, "pending", false],
  ["L15", "בניית ערכת אבנים אישית", "Building a Personal Stone Kit",
    "כיצד מרכיבים ערכת אבנים מותאמת אישית.",
    "How to assemble a personalised stone kit.",
    1350, "pending", false],
  ["L16", "צמידים ואבנים לנשיאה", "Bracelets and Wearable Stones",
    "בחירת אבנים לצמידים ולנשיאה יומיומית.",
    "Choosing stones for bracelets and daily wear.",
    1280, "pending", false],
  ["L17", "שיטת אבחון באבנים", "The Stone Diagnosis Method",
    "מבוא לשיטת האבחון של ד״ר גבריאלוב.",
    "Introduction to Dr. Gavrielov's diagnosis method.",
    2240, "pending", false],
  ["L18", "גבישים והתנהגות אנושית", "Crystals and Human Behaviour",
    "הקשר בין גבישים, התנהגות ומחקר אקדמי.",
    "The link between crystals, behaviour and academic research.",
    2050, "pending", false],
  ["L19", "אתיקה, בטיחות וגבולות התרגול", "Ethics, Safety and Boundaries of Practice",
    "גבולות אחריות, בטיחות והפניה לרפואה קונבנציונלית.",
    "Boundaries of responsibility, safety, and referral to conventional medicine.",
    1430, "pending", false],
  ["L20", "אינטגרציה: מן הכתוב אל המעשה", "Integration: From Scripture to Practice",
    "סיכום הקורס — חיבור התיאוריה לתרגול היומיומי.",
    "Course summary — connecting theory to daily practice.",
    1990, "pending", false],
];

export function buildSeedLectures() {
  return RAW.map(([code, title_he, title_en, desc_he, desc_en, dur, status, free], i) => {
    const order = i + 1;
    const done = status === "done";
    return {
      order,
      code,
      title_he,
      title_en,
      description_he: desc_he,
      description_en: desc_en,
      thumbnail_url: thumb(order),
      duration_seconds: dur,
      video_provider: "direct",
      video_he_source: HE_SAMPLE,
      video_en_source: done ? EN_SAMPLE : "",
      translation_status: status,
      free_preview: !!free,
      is_published: true,
    };
  });
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
