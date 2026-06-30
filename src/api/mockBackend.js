// ─────────────────────────────────────────────────────────────────────────
// DEMO-MODE backend.
//
// Implements the exact surface of @base44/sdk that this app uses
// (base44.entities.<Name>.{list,filter,get,create,update,delete,bulkCreate}
//  and base44.auth.{me,login,logout,updateMyUserData}) on top of localStorage.
//
// This lets the whole platform run with ZERO external services. Swapping to a
// real Base44 backend is a one-line change in base44Client.js — no UI/page code
// touches the mock directly; everything goes through src/api/entities.js.
// ─────────────────────────────────────────────────────────────────────────

import {
  buildSeedLectures,
  buildSeedTranslationJobs,
  buildSeedCourseResources,
  buildSeedStones,
  buildSeedKitShipments,
  buildSeedMeetings,
} from "./seed";

const NS = "gavrielov.demo.";
const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "id_" + Math.abs(Math.floor((performance.now() + Object.keys(localStorage).length) * 1000)).toString(36));

const nowIso = () => new Date().toISOString();

function read(key) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function write(key, rows) {
  localStorage.setItem(NS + key, JSON.stringify(rows));
}

/** Add the standard system fields Base44 stamps on every record. */
function stampRows(rows) {
  return rows.map((r) => ({
    id: uid(),
    created_date: nowIso(),
    updated_date: nowIso(),
    created_by: "seed",
    ...r,
  }));
}

// Tiny delay so loading states are exercised, just like a network round-trip.
const tick = (v) => new Promise((res) => setTimeout(() => res(v), 90));

function applySort(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av > bv ? 1 : -1;
    return desc ? -cmp : cmp;
  });
}

function matches(row, query) {
  return Object.entries(query).every(([k, v]) => row[k] === v);
}

function makeEntity(name, currentUserRef) {
  const store = () => read(name);
  const persist = (rows) => write(name, rows);

  const stamp = (data) => ({
    ...data,
    updated_date: nowIso(),
  });

  return {
    async list(sort, limit) {
      let rows = applySort(store(), sort);
      if (limit) rows = rows.slice(0, limit);
      return tick(rows);
    },
    async filter(query = {}, sort, limit) {
      let rows = applySort(store().filter((r) => matches(r, query)), sort);
      if (limit) rows = rows.slice(0, limit);
      return tick(rows);
    },
    async get(id) {
      const row = store().find((r) => r.id === id);
      if (!row) throw new Error(`${name} ${id} not found`);
      return tick(row);
    },
    async create(data) {
      const rows = store();
      const row = {
        id: uid(),
        created_date: nowIso(),
        updated_date: nowIso(),
        created_by: currentUserRef.user?.email || "anonymous",
        ...data,
      };
      rows.push(row);
      persist(rows);
      return tick(row);
    },
    async bulkCreate(items = []) {
      const rows = store();
      const created = items.map((data) => ({
        id: uid(),
        created_date: nowIso(),
        updated_date: nowIso(),
        created_by: currentUserRef.user?.email || "anonymous",
        ...data,
      }));
      persist([...rows, ...created]);
      return tick(created);
    },
    async update(id, data) {
      const rows = store();
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error(`${name} ${id} not found`);
      rows[idx] = { ...rows[idx], ...stamp(data) };
      persist(rows);
      return tick(rows[idx]);
    },
    async delete(id) {
      persist(store().filter((r) => r.id !== id));
      return tick({ id });
    },
  };
}

// Demo identities — stand in for Base44's Google login. The chooser is in Login.jsx.
export const DEMO_USERS = {
  guest: null,
  student: {
    id: "demo-student",
    email: "student@example.com",
    full_name: "תלמידה לדוגמה / Demo Student",
    role: "user",
  },
  admin: {
    id: "demo-admin",
    email: "admin@doctorgavrielov.co.il",
    full_name: "ד״ר גבריאלוב (Admin)",
    role: "admin",
  },
};

function makeAuth(currentUserRef) {
  const persistUser = () => {
    if (currentUserRef.user) localStorage.setItem(NS + "__user", JSON.stringify(currentUserRef.user));
    else localStorage.removeItem(NS + "__user");
  };

  return {
    async me() {
      if (!currentUserRef.user) {
        const err = new Error("Not authenticated");
        err.status = 401;
        throw err;
      }
      return tick(currentUserRef.user);
    },
    async updateMyUserData(data) {
      if (!currentUserRef.user) throw new Error("Not authenticated");
      currentUserRef.user = { ...currentUserRef.user, ...data };
      persistUser();
      return tick(currentUserRef.user);
    },
    // In real Base44 this redirects to Google. In demo we pick an identity.
    async login(roleKey = "student") {
      currentUserRef.user = DEMO_USERS[roleKey] ? { ...DEMO_USERS[roleKey] } : null;
      persistUser();
      return tick(currentUserRef.user);
    },
    async logout() {
      currentUserRef.user = null;
      persistUser();
      return tick(true);
    },
    isDemo: true,
  };
}

let singleton = null;

export function createMockClient() {
  if (singleton) return singleton;

  const currentUserRef = { user: null };
  try {
    const saved = localStorage.getItem(NS + "__user");
    if (saved) currentUserRef.user = JSON.parse(saved);
  } catch {
    /* ignore */
  }

  // Content seed version. BUMP THIS whenever buildSeedLectures() changes so
  // returning demo visitors (whose localStorage holds an older course) get the
  // new lectures instead of a stale copy. Only the seed-derived content
  // collections are rebuilt; user data (Enrollment/Progress) is left intact.
  const SEED_VERSION = "2026-06-crystals-part1";
  if (localStorage.getItem(NS + "__seed_version") !== SEED_VERSION) {
    write("Lecture", stampRows(buildSeedLectures()));
    write("TranslationJob", stampRows(buildSeedTranslationJobs(read("Lecture"))));
    localStorage.setItem(NS + "__seed_version", SEED_VERSION);
  }

  // Seed each collection INDEPENDENTLY (not gated on Lecture being empty), so
  // entities added in a later version backfill for users whose localStorage was
  // seeded by an earlier version — no full reset required.
  if (read("Lecture").length === 0) write("Lecture", stampRows(buildSeedLectures()));
  // TranslationJob is derived from the persisted lectures (needs their ids).
  if (read("TranslationJob").length === 0) {
    write("TranslationJob", stampRows(buildSeedTranslationJobs(read("Lecture"))));
  }
  if (read("CourseResource").length === 0) write("CourseResource", stampRows(buildSeedCourseResources()));
  if (read("Stone").length === 0) write("Stone", stampRows(buildSeedStones()));
  if (read("KitShipment").length === 0) write("KitShipment", stampRows(buildSeedKitShipments()));
  if (read("Meeting").length === 0) write("Meeting", stampRows(buildSeedMeetings()));

  singleton = {
    isDemo: true,
    entities: {
      Lecture: makeEntity("Lecture", currentUserRef),
      Enrollment: makeEntity("Enrollment", currentUserRef),
      Progress: makeEntity("Progress", currentUserRef),
      TranslationJob: makeEntity("TranslationJob", currentUserRef),
      CourseResource: makeEntity("CourseResource", currentUserRef),
      KitShipment: makeEntity("KitShipment", currentUserRef),
      Meeting: makeEntity("Meeting", currentUserRef),
      Stone: makeEntity("Stone", currentUserRef),
    },
    auth: makeAuth(currentUserRef),
    integrations: {
      Core: {
        // No-op stubs so integration calls don't crash in demo mode.
        async InvokeLLM() {
          return { ok: true, demo: true };
        },
        async SendEmail() {
          return { ok: true, demo: true };
        },
        async UploadFile({ file }) {
          return { file_url: URL.createObjectURL(file) };
        },
      },
    },
    // Helper used only by the demo login screen.
    _resetDemoData() {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(NS))
        .forEach((k) => localStorage.removeItem(k));
      singleton = null;
    },
    // Re-derive the translation jobs from the current lectures so the demo
    // simulation can be replayed after a full run (without wiping everything).
    _reseedPipeline() {
      write("TranslationJob", stampRows(buildSeedTranslationJobs(read("Lecture"))));
    },
  };

  return singleton;
}
