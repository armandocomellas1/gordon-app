# Dr. Gavrielov — Bilingual Streaming Lecture Platform

A bilingual (Hebrew ⇄ English) streaming platform for Dr. Gavrielov's
20-lecture course bridging **gemology, Jewish lore, and crystal healing**.
Hebrew lectures are the source; English tracks are AI‑translated and published
as they are completed.

Built on the **Base44 stack** (React + Vite + Tailwind + shadcn‑style UI +
`@base44/sdk`, entities-as-JSON-schema, built‑in auth) so it drops straight into
a Base44 app — but it also runs **fully offline in demo mode** with zero backend.

> Scope of this round (per the spec): **Lectures only (Hebrew + English)**.
> The store, courses-with-certificates, diagnosis, etc. are out of scope for now
> and are noted in the roadmap.

---

## What's implemented

| Requirement (JD / spec) | Where |
| --- | --- |
| Streaming of 20 lectures | `src/pages/Lectures.jsx`, `LectureDetail.jsx`, `components/VideoPlayer.jsx` |
| Hebrew **and** English, smooth language access | `src/i18n/*` (RTL/LTR auto-switch, persisted), per-lecture HE/EN tracks |
| Ongoing translated-content updates | Admin → **Translation** tab (Foreman Dashboard) + `TranslationJob` entity + ingestion webhook — see [Translation pipeline integration](#translation-pipeline-integration-spec-p5--the-foremanworkerheygen-flow) |
| **Appendix B — secure paywall / content protection** | `src/lib/access.js`, `src/lib/videoProviders.js` (signed/expiring URLs, locked sources) |
| Login gate + 1‑year enrollment | `src/lib/access.js`, `src/hooks/useAuth.jsx`, Admin → Enrollments |
| Provider-agnostic video (YouTube now, Mux/Vimeo later) | `src/lib/videoProviders.js` (`youtube | mux | vimeo | direct`) |
| Resume / progress / completed | `Progress` entity + `LectureDetail.jsx` |
| **Certificate Course** — 300-page PDF, stone kit, 2 meetings, certificate | `MyAccount.jsx` hub + `CourseMaterials`/`KitSection`/`MeetingsSection`/`Certificate.jsx`; Admin → Course |
| **Stone Reference Library** (gemology ⇄ Scripture ⇄ healing) | `src/pages/Stones.jsx` + `Stone` entity; Admin → Stones |
| **Social Media Promotion** (Pinterest/Instagram/Facebook/X) | `SocialLinks` (footer follow) + `ShareButtons` (share) + `lib/seo.js` OG/Twitter tags — see [Social Media Promotion](#social-media-promotion) |

---

## Large lecture files (the 20 raw ~½–1 GB uploads)

The client ships 20 large HD files. **Do not serve them as raw MP4s** from app
storage — there's no adaptive bitrate and range support is unreliable at that size.
Run each through a streaming host, then store only its **id** on the lecture:

- **Mux (recommended):** upload → it transcodes to adaptive HLS → store the
  **playback id** with `video_provider = mux` (signed, per Appendix B).
- **YouTube (unlisted):** upload → store the **video id** with `video_provider = youtube`.

The player is large-file-ready regardless: for `direct`/file sources it uses
`preload="metadata"` (pulls only the header, not the whole gigabyte), streams via
HTTP range requests, and shows a buffering spinner. The `direct` provider is best
kept for short clips/previews, not the full HD lectures.

## Modern lecture experience & theming

- **Course-player layout** — [LectureDetail.jsx](./src/pages/LectureDetail.jsx) has a
  sticky **playlist sidebar** (all 20 with completed ✓ / now-playing / locked state),
  a "lecture N of 20" indicator, the language-track toggle, an **instructor card**
  ([InstructorCard.jsx](./src/components/InstructorCard.jsx)), description, share, and
  prev/next. The catalog opens with a warm course intro + "start with the free
  introduction" CTA.
- **Dark / light mode** — a sun/moon toggle in the header
  ([ThemeToggle.jsx](./src/components/ThemeToggle.jsx) + [useTheme.jsx](./src/hooks/useTheme.jsx)),
  persisted and defaulting to the OS preference. Colors are CSS variables
  (`:root` / `.dark` in [index.css](./src/index.css)) so every semantic surface
  adapts automatically.

## Certificate Course & Stone Library

**Certificate Course** — the WiX course is *"1-year streaming lectures + 300-page PDF
+ stone kit + 2 meetings."* All four deliverables live in the student's **My Area**
([MyAccount.jsx](./src/pages/MyAccount.jsx)):
- **Lectures** — 1-year enrollment + progress (as before)
- **Materials** — gated download of the 300-page companion PDF (`CourseResource`)
- **Stone kit** — student submits a shipping address (`KitShipment`); admin advances
  `requested → preparing → shipped (+tracking) → delivered`
- **Meetings** — student books up to **2** sessions (`Meeting`); admin confirms a time
  and adds the video link
- **Certificate** — when all lectures are completed, a printable
  [Certificate.jsx](./src/pages/Certificate.jsx) (Print / Save-as-PDF) is unlocked

Admin runs the operational side from **Admin → Course** (materials, shipments, meetings).

## Social Media Promotion

The spec's social grid (Pinterest · Instagram · Facebook · X) is implemented three ways:

- **Follow links** — brand-coloured profile buttons in the footer
  ([SocialLinks.jsx](./src/components/SocialLinks.jsx)). Set the real handles via
  `VITE_SOCIAL_PINTEREST` / `_INSTAGRAM` / `_FACEBOOK` / `_X` (blank → network home).
- **Share buttons** — per-page sharing on Home, every lecture, and each stone
  ([ShareButtons.jsx](./src/components/ShareButtons.jsx)): Facebook, X, Pinterest
  (pins the image), WhatsApp, plus a copy-link/native-share button. Instagram has no
  web-share intent, so it's follow-only.
- **Rich link previews** — Open Graph + Twitter-Card tags: static defaults in
  [index.html](./index.html) and per-page values set at runtime by
  [lib/seo.js](./src/lib/seo.js) `useMeta` (title, description, image).

Brand glyphs are inline SVG ([BrandIcons.jsx](./src/components/BrandIcons.jsx)) because
lucide-react dropped social icons and never shipped Pinterest/X.

> **SPA caveat:** crawlers that don't run JS (some Facebook/Pinterest scrapers) only
> read the *static* tags in `index.html`. For per-lecture rich cards, prerender those
> routes in production (Base44 SSR / a prerender service). The dynamic `useMeta` tags
> cover JS-capable consumers and keep in-app titles/shares correct.

**Stone Reference Library** ([Stones.jsx](./src/pages/Stones.jsx), public) — a searchable
catalog bridging gemology, the Hebrew Scriptures (breastplate stones + tribes) and
crystal-healing properties, seeded with the breastplate twelve plus common stones.
The numbered tumbled-stone photos (the 28-36 grid) map onto `Stone.image_url`; the demo
uses placeholders with a clearly-labelled slot for the real images. Editable in
**Admin → Stones**.

---

## Appendix B — content-protection model (the feature you were worried about)

The worry in **Appendix A** is real: *"unlisted YouTube videos can still be
shared via link."* Here is how this build addresses it, and where the honest
limits are.

**Authorization (who may watch):** `src/lib/access.js`
- `free_preview` lectures → anyone.
- Everything else → logged-in user **with an active, unexpired `Enrollment`**
  (admins always pass). Enrollment defaults to **1 year** (`oneYearFrom`).

**Enforcement (so a link can't be reshared):** `src/lib/videoProviders.js`
- `resolvePlayback()` returns `{ locked: true }` for an unauthorized viewer and
  **never resolves the real source**.
- For **protectable providers (`mux`, `direct`)** it requests a **short‑lived,
  signed, expiring URL** from a backend token endpoint
  (`VITE_PLAYBACK_TOKEN_ENDPOINT`) — e.g. a Base44 function returning a **Mux
  signed JWT**. The player shows a 🛡 "Signed URL" badge. A copied link dies in
  minutes.
- `youtube`/`vimeo` are **embed-only / "gate-only"**: protected by the login
  gate but not link-proof (exactly Appendix A's caveat). Use them for free
  previews / low-risk content; use **Mux signed URLs for paid lectures**.

**Production hardening — provided as a ready-to-deploy example:**
1. Host paid lectures on **Mux** with *signed playback policy*; set the
   lecture's `video_provider = mux` (the source field then holds the Mux
   playback id).
2. Deploy **[functions/playbackToken.example.js](./functions/playbackToken.example.js)**
   as a Base44 backend function and set `VITE_PLAYBACK_TOKEN_ENDPOINT` to its URL.
   It (a) identifies the viewer from their Base44 session, (b) **re-checks
   enrollment server-side**, (c) derives the source itself, and (d) returns a
   short-lived **Mux signed JWT** URL. The client only sends `{ lecture_id, lang }`
   — it never tells the server which URL to sign, so it can't escalate access.
   Server env: `MUX_SIGNING_KEY_ID`, `MUX_SIGNING_PRIVATE_KEY`, `PLAYBACK_TTL_SECONDS`.
3. Set Row-Level Security on the `Lecture` entity so a locked lecture's
   `video_*_source` is **never sent to unauthorized clients** (the
   `entities/Lecture.json` schema already includes an `rls` block to start from).

> In **demo mode** the data lives in `localStorage`, so a determined user could
> read a source from devtools — that's expected. The code path is already shaped
> for real protection; only the server-side token endpoint + Mux are missing,
> and both are config, not rewrites.

---

## Tech stack

- **React 18 + Vite** (JSX, the Base44 default — not TS)
- **React Router v6**
- **Tailwind CSS** + hand-rolled **shadcn-style** primitives (`src/components/ui`)
- **lucide-react** icons
- **`@base44/sdk`** for entities / auth / integrations
- Entities defined as **JSON schema** in [`/entities`](./entities) (Base44's native format)

---

## Run it

### Prerequisites
**Node.js 18+ is required and is *not currently installed on this machine*.**
Install it first:

- Windows: download the LTS installer from <https://nodejs.org> (or `winget install OpenJS.NodeJS.LTS`)
- Verify in a new terminal: `node -v` and `npm -v`

### Demo mode (no backend, recommended first run)
```bash
npm install
cp .env.example .env     # or: copy .env.example .env   (PowerShell)
npm run dev              # http://localhost:5173
```
Leave `VITE_BASE44_APP_ID` blank → the app uses the **localStorage mock backend**,
seeded with all 20 lectures.

On the **Login** screen pick an identity:
- **Guest** — previews only, paid lectures locked.
- **Enrolled student** — full access (a 1‑year enrollment is auto-created).
- **Admin (Dr. Gavrielov)** — full access **+ the `/admin` content panel**.

"Reset demo data" on the login screen wipes local state back to the seed.

### Live Base44 mode (zero code changes)
1. Create the entities in your Base44 app by importing the schemas in
   [`/entities`](./entities) (`Lecture`, `Enrollment`, `Progress`, `TranslationJob`,
   `CourseResource`, `KitShipment`, `Meeting`, `Stone`).
2. Set env:
   ```
   VITE_BASE44_APP_ID=your-base44-app-id
   VITE_BASE44_REQUIRES_AUTH=true
   VITE_PLAYBACK_TOKEN_ENDPOINT=https://<your-app>/functions/playbackToken   # for Mux signing
   ```
3. `npm run dev` (or `npm run build`). Login now uses Base44's real Google auth;
   every page talks to the live backend. Nothing else changes — all data access
   goes through `src/api/entities.js`.

---

## Translation pipeline integration (spec p.5 — the foreman/worker/HeyGen flow)

The actual translation runs **off-platform on your LAN** and is unchanged:

```
HD staging ─> Codex FOREMAN ─> Codex WORKER ─> HeyGen ─> stitch ─┐
(Lecture_NN.mp4)  orchestrates   per-lecture    translate         │
                                 1 cut chunks                      │ worker POSTs status
                                 2 upload                          ▼
                                 3 poll completion        platform ingestion endpoint
                                 4 poll budget            (Base44 backend function)
                                 5 download & stitch              │
                                                                   ▼
                                              TranslationJob updated ─> Admin "Translation" tab
                                                                   │  (Foreman Dashboard)
                                                          on done ─┘─> Lecture.video_en_source set + published
```

The platform implements the **right-hand half**: a status sink, a Foreman-style
dashboard, and the publish step.

### What was built for it
- **`TranslationJob` entity** ([entities/TranslationJob.json](./entities/TranslationJob.json)) —
  one record per lecture tracking stage, chunks done/total, HeyGen credits & USD
  cost, retries, last error, throughput, ETA, worker id, source file/size.
- **Foreman Dashboard** — Admin → **Translation** tab
  ([src/components/TranslationDashboard.jsx](./src/components/TranslationDashboard.jsx)):
  the same rollups the spec's dashboard lists — *lectures 1‑20 progress, worker
  status, HeyGen usage/budget, errors/retries, throughput/ETA* — plus per‑lecture
  rows with a live progress bar, **Publish** (finished → attach EN track) and
  **Retry** (failed render) actions.
- **Pipeline logic** ([src/lib/translationPipeline.js](./src/lib/translationPipeline.js)) —
  stage model mapped to the worker's 5 steps, progress/budget/ETA math, the
  ingestion **contract** (`applyWorkerPayload`), and a **demo simulator** that
  emulates the foreman/worker so the dashboard is live without the LAN.
- **Live ingestion endpoint** ([functions/translationWebhook.example.js](./functions/translationWebhook.example.js)) —
  a Base44 backend function that receives the worker POST and upserts the job.
- **Two-way sync with the Lectures tab** — publishing a job attaches the EN track
  to its Lecture; editing a lecture's translation status reconciles its job
  (`reconcileJobForLecture`), so the two Admin tabs never drift apart.

### Stage ↔ spec mapping

| Worker step (spec) | `TranslationJob.status` | Dashboard shows |
| --- | --- | --- |
| (in staging) | `queued` | waiting |
| 1 · cut into chunks | `chunking` | chunks_total |
| 2 · upload to HeyGen | `uploading` | — |
| 3 · poll completion (+ 4 · poll budget) | `processing` | chunks_done/total, $cost, credits, ETA |
| 5 · download | `downloading` | — |
| 5 · stitch | `stitching` | — |
| stitched, awaiting publish | `ready` | **Publish** button |
| published / on YouTube | `published` | EN track attached, lecture live |
| any failure | `error` | last_error + **Retry** |

### The contract (what the worker POSTs)

```jsonc
POST /functions/translationWebhook        // Authorization: Bearer <PIPELINE_SHARED_SECRET>
{
  "lecture_code": "L09", "worker_id": "worker-1",
  "status": "processing",                 // a TranslationJob.status, or "error"
  "chunks_total": 6, "chunks_done": 3,
  "heygen_cost_usd": 8.4, "heygen_credits_used": 420,
  "throughput": "2.1x realtime", "eta": "2026-06-19T14:00:00Z",
  "retries": 0, "error": null,
  "output_url": null                      // the stitched EN file URL when status=ready/published
}
```

The frontend `applyWorkerPayload()` and the backend function map this identical
payload onto the entity, so **demo mode and production exercise the same path**.

### Try it (demo)
Login as **Admin** → **Translation** tab → **Run simulation**. Queued lectures
flow `chunking → uploading → processing → … → ready`; HeyGen cost and the budget
bar climb; one job throws an error so you can **Retry**; finished jobs wait at
**ready** for you to **Publish** (which attaches the English track to the lecture
and makes it selectable in the player). The seed starts with L1‑8 published,
L9‑12 mid‑pipeline (incl. one error + one ready), L13‑20 queued.

### Go live
1. Deploy [functions/translationWebhook.example.js](./functions/translationWebhook.example.js)
   as a Base44 backend function; set `PIPELINE_SHARED_SECRET`.
2. Point your foreman/worker at `POST /functions/translationWebhook` with that
   bearer token, emitting the payload above at each stage.
3. Done — the dashboard reflects live status and auto-publishes the English
   track when a lecture reports `published`. (Optional: tune
   `VITE_HEYGEN_BUDGET_USD` for the budget gauge.)

---

## Project structure

```
entities/                 Base44 entity JSON schemas (import into your app)
  Lecture.json  Enrollment.json  Progress.json  TranslationJob.json
  CourseResource.json  KitShipment.json  Meeting.json  Stone.json
functions/
  translationWebhook.example.js   Base44 backend function: pipeline ingestion endpoint
  playbackToken.example.js        Base44 backend function: Mux signed playback URL (Appendix B)
src/
  api/
    base44Client.js        real Base44 vs demo mock switch (the only place that decides)
    entities.js            Lecture / Enrollment / Progress / TranslationJob / User handles
    integrations.js        Core integrations passthrough
    mockBackend.js         localStorage backend implementing the SDK interface
    seed.js                20-lecture demo seed + translation jobs
  i18n/                    bilingual strings + RTL/LTR provider
  lib/
    access.js              authorization: enrollment + 1-year + free-preview
    videoProviders.js      provider resolver + signed-URL playback (Appendix B)
    translationPipeline.js stages, budget/ETA math, ingestion contract, demo simulator
    course.js              certificate eligibility + meeting/shipment rules
    social.js              follow links + share-URL builders
    seo.js                 useMeta() — Open Graph / Twitter-Card tags
    utils.js               cn(), duration/date formatting
  hooks/useAuth.jsx        auth + enrollments + computed access state
  components/              Layout, VideoPlayer, LectureCard, LockOverlay, TranslationDashboard,
                           CourseMaterials, KitSection, MeetingsSection, CourseOpsAdmin, StonesAdmin,
                           SocialLinks, ShareButtons, BrandIcons, ui/*
  pages/                   Home, Lectures, LectureDetail, Stones, Login, MyAccount,
                           Certificate, Admin, NotFound
  App.jsx  main.jsx        router + entry
```

---

## Roadmap (beyond this round)

Done since the first round: ✅ Certificate Course (PDF + kit + 2 meetings + certificate),
✅ Stone Reference Library, ✅ translation-pipeline dashboard + ingestion webhook,
✅ Mux signed-token function, ✅ Social Media Promotion (follow links + share + OG tags).

Still open:
- Store (essences / oils / stone kits / bracelets) + checkout & VAT
- Online stone **diagnosis** intake & 1‑on‑1 confidential patient care booking
- Real numbered-stone photos (28–36 …) into `Stone.image_url`
- Real social handles into `VITE_SOCIAL_*`; prerender routes for crawler-visible OG cards
- Payments/enrollment self-serve (turn the admin-grant into checkout)

---

## Notes / honesty

- This scaffold was authored without a local Node runtime available, so the dev
  server was **not run here**. The code is internally consistent and import-clean;
  please run `npm install && npm run dev` to verify in your environment and report
  anything that needs adjusting.
- Demo videos are Blender open movies (CC‑BY) used purely as placeholders.
  Replace `video_he_source` / `video_en_source` with real sources in Admin.
