# Visual Identity Audit — Reskin to match doctorgavrielov.co.il

**Goal:** keep the modern React/Vite/Base44/ServerAvatar architecture underneath, but
make the **public UI** read as a *respectful migration* of
[doctorgavrielov.co.il](https://www.doctorgavrielov.co.il/) — the site the client
holds emotionally sacred — **not** a generic modern purple SaaS course platform.

> The client's objection was never technical. It was that the app looked like a new,
> generic, purple product instead of *her site*. This audit fixes the visual identity,
> wording, and emotional tone to honor the original.

The `.co.il` palette/wording below was verified directly from the live site's
`heb.css` and toolbar configuration (not guessed).

---

## Reference identity — doctorgavrielov.co.il (the source of truth)

| Aspect | Value (verified) |
| --- | --- |
| Canvas | White `#ffffff` |
| Body text | Gray `#575757`; dark UI text `#3c3c3c` |
| **Navigation bar** | Charcoal **`#3c3c3c`**, white links, gold hover |
| **Accent (GOLD)** | **`#d9b91a`** (canonical), darker/active `#cca300` |
| Typography | Sans-serif (Arial/Helvetica), **Hebrew-first, RTL**, bold weight for emphasis — **no serif**, no airy geometric webfont |
| Logo treatment | The practitioner's **name** is the brand: `ד״ר גבריאלוב` + credential `לגמולוגיה ולמדעי ההתנהגות` ("Ph.D. in Gemology & Behavioral Sciences"). **No abstract logomark / no diamond.** |
| Buttons | Rectangular (not pill), charcoal or gold fill, white/charcoal text, gold hover/active |
| Mood | Charcoal + white + gold. Spiritual-meets-clinical, traditional, Jewish-heritage, prestigious — **never playful, pastel, or purple** |
| Cards | Simple rectangular tiles on white with gold/gray separators; no heavy shadows or rounded "SaaS" cards |

---

## 1. What currently did **not** match `.co.il`

| # | Problem (before) | Where |
| --- | --- | --- |
| 1 | **Wrong hero title.** Read *"The bridge between Scripture, gemology and stone healing"* — wrong capitalization **and** "stone healing" instead of the approved **"Crystal Healing"**. | `src/i18n/strings.js` |
| 2 | **Purple/amethyst everywhere.** Primary brand color was purple (`hsl(266 …)`); page background a purple-tinted lavender; body had purple radial "glow" gradients — pure generic SaaS. | `src/index.css`, `tailwind.config.js` |
| 3 | **Generic diamond/gem as the brand identity.** A purple-gradient `Gem` icon chip was the logo (header), the certificate seal, and the instructor avatar; a giant `Gem` filled the hero. Client explicitly: *no generic diamond icons as the main identity.* | `Layout`, `Home`, `Certificate`, `InstructorCard` |
| 4 | **Purple gradients on media placeholders.** `from-purple-300 … to-amber-100`, `from-purple-200 to-amber-100`, `from-purple-950` lock overlay. | `Home`, `LectureCard`, `Stones`, `LockOverlay` |
| 5 | **No dark charcoal navigation.** Header was a translucent light bar — the original's signature dark `#3c3c3c` + gold nav was missing. | `Layout` |
| 6 | **Too "pill"/SaaS.** Large border-radius (0.9rem) and rounded-full chips read as a modern startup, not a traditional practice. | `tailwind.config.js` |
| 7 | **Purple favicon.** A purple-gradient diamond. | `public/favicon.svg` |
| 8 | **Hebrew-first feeling absent** from the public chrome despite Hebrew being the original site's primary language and emotional core. | `Layout`, `Home` |

---

## 2. What colors / styles changed

- **Palette retuned to charcoal / white / gold** via the CSS variables in
  `src/index.css` (light + dark):
  - Background → near-white (`#ffffff`-class) instead of lavender.
  - `--primary` → brand gold **`#d9b91a`**; `--accent` → active gold **`#cca300`**.
  - New chrome tokens: `--ink` (charcoal `#3c3c3c`, identical in both themes),
    `--on-ink` (white nav text), `--gold` (legible gold on charcoal).
  - Body "glow" gradients → a barely-there warm paper wash (no purple).
- **Header & footer are now the dark `#3c3c3c` + gold bar** of the original site
  (`.site-chrome`), with white nav links that turn gold on hover/active and a thin
  gold rule (echoing the site's decorative dividers). They are scoped `dark` so the
  embedded controls stay legible on charcoal.
- **Typography:** dropped the (incorrect) serif experiment; kept a clean Hebrew-first
  **sans** (Heebo, Arial fallback) matching the reference. Emphasis = **bold weight +
  gold**, not a typeface.
- **Radius reduced** (`lg 0.9→0.5rem`, etc.) and pill chips squared off for the more
  classic, less-SaaS feel of the original.
- **Brand mark = a gold-on-charcoal monogram `ג`** (initial of גבריאלוב) — the name is
  the brand. No diamond. Used in the header logo, instructor avatar, certificate seal.
- **Favicon** redrawn: charcoal tile, thin gold frame, gold `ג`.
- **Buttons:** primary = gold fill / dark text; secondary (outline) gains a **gold
  hover border + gold text**, matching the site's gold hover state.

## 3. Wording corrections

| Key | Before | After |
| --- | --- | --- |
| `home.hero.title` (EN) | "The bridge between Scripture, gemology and stone healing" | **"The Bridge Between Scripture, Gemology and Crystal Healing"** (exact capitalization, approved phrase) |
| `home.hero.title` (FR) | "…guérison par les pierres" | "…la Guérison par les **Cristaux**" (consistent with the FR subtitle & certificate) |
| `home.hero.title` (RU) | "…исцелением камнями" | "…**кристаллотерапией**" |
| `home.hero.title` (HE) | "…והריפוי באבנים" | "…והריפוי **באבני חן**" (matches the site's wording) |

"stone healing" no longer appears anywhere. `app.subtitle` and `certpage.course`
already used "Crystal Healing" and were left intact.

## 4. Components updated (in order)

1. `src/index.css` — palette, chrome tokens, `.site-chrome` / `.nav-link` /
   `.brand-mark` / `.gold-rule`, glow.
2. `tailwind.config.js` — gold/ink color aliases, radius, font stack.
3. `index.html` — font link (Heebo only).
4. `src/i18n/strings.js` — hero title wording (all 4 languages).
5. `src/components/Layout.jsx` — dark charcoal header/footer, text-monogram logo,
   gold nav.
6. `src/pages/Home.jsx` — hero nameplate (gold-on-charcoal Hebrew name + credential),
   removed purple gradient + giant diamond, gold rules.
7. `LectureCard`, `InstructorCard`, `Stones`, `Certificate`, `LockOverlay` — de-purpled
   gradients/icons → charcoal/gold.
8. `public/favicon.svg` — charcoal + gold monogram.

---

## Post-review legibility pass

An adversarial review caught a real regression: bright brand gold `#d9b91a` is correct
as a **fill** (gold buttons), but unreadable as **text/icons on white** (~1.9:1) in the
light theme. Fixed systemically:

- Added a `--gold-ink` token — a deep "antique" gold on light surfaces, bright gold on
  dark — and routed all gold **text/icons** (`text-goldink`) through it, while gold
  **fills** keep the bright `#d9b91a`. Legible in both themes, brand stays gold.
- The certificate (always a white sheet) now forces light-theme ink + deep gold so it's
  readable on screen and in print in either theme.
- Squared the `accent` badge tone and pinned the lecture play/lock icons to charcoal so
  they read on their white disc in dark mode too.
- Retuned `--accent` to a truer `#cca300`.

## Round 2 — aligning to english.doctorgavrielov.co.il (from client screenshots)

The client supplied screenshots of the live **English** site. They revealed the real
look is **gray/charcoal, not white**, with a gold serif name banner + the doctor's
photo. Changes:

- **Palette pivoted to gray.** The default theme is now the live site's gray/charcoal
  canvas + gold + white text (kept a light theme as an alternative; default switched to
  the gray theme in `useTheme`).
- **Banner** added: the doctor's **photo** (self-hosted at `public/dr-gavrielov.jpg`)
  beside the signature **gold, outlined serif** title "Welcome to the site of /
  Dr. G. Gavrielov" (serif used *only* here, matching the original).
- **Navigation rebuilt to mirror the .co.il menu** (translatable, 4 languages):
  Dr Gavrielov – Crystal Healing → Home · About → new page · Store → inert · Crystal
  Secrets → Stone library · Courses & Workshops → Lectures · Stone Apothecary → inert ·
  Clinic → inert · Contact → new page · Company Policy → new page.
- **New pages** (full content, all 4 languages): **About** (her bio), **Contact**
  (form + clinic phone/fax/email/address), **Company Policy** (full Terms & Conditions).
- All new copy flows through i18n (`src/i18n/pages.js`) in **FR/EN/RU/HE** and switches
  with the language toggle. HE/RU/FR are machine-translated — recommend a human review
  before production, especially the legal Company Policy text.
- We deliberately **keep our clean React layout/components/buttons** rather than copying
  the original's broken table/sidebar HTML structure.

## Notes & boundaries

- **Navigation inventory** still follows the app's real routes (Home, Lectures, Stone
  Library, My Area, Admin) — these are the functioning pages of *this* product
  (`.com`/Base44). The navigation *style* (dark charcoal bar, white→gold links) now
  follows `.co.il`. The richer `.co.il` menu (Shop, Crystal Secrets, Stone Pharmacy,
  Diet & Stones, Clinic, Contact …) is documented here for the future store/diagnosis/
  clinic phases of the migration.
- **Dark mode** is retained as a true dark theme; in it the charcoal + gold identity
  reads as the "black/gold" look the client described.
- The build regenerates the committed `dist/` that ServerAvatar serves, so these
  changes reach the live static site.
