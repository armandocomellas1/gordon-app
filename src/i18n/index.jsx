import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { LANGS, strings } from "./strings";

const I18nContext = createContext(null);
const STORAGE_KEY = "gavrielov.lang";

// Order the language toggle cycles through.
const LANG_ORDER = ["fr", "en", "ru", "he"];

function initialLang() {
  if (typeof window === "undefined") return "fr";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && LANGS[saved]) return saved;
  const nav = (navigator.language || "fr").toLowerCase();
  if (nav.startsWith("he")) return "he";
  if (nav.startsWith("ru")) return "ru";
  if (nav.startsWith("en")) return "en";
  return "fr";
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(initialLang);

  useEffect(() => {
    const meta = LANGS[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const t = useCallback(
    (key, vars) => {
      let s = strings[lang]?.[key] ?? strings.he[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return s;
    },
    [lang]
  );

  const toggle = useCallback(() => setLang((l) => {
    const i = LANG_ORDER.indexOf(l);
    return LANG_ORDER[(i + 1) % LANG_ORDER.length];
  }), []);

  /** Pick the right field of a bilingual record, with graceful fallback. */
  const pick = useCallback(
    (record, base) => {
      if (!record) return "";
      // fr/ru/he → use _he content (original); en → use _en content
      const key = lang === "en" ? "en" : "he";
      const primary = record[`${base}_${key}`];
      if (primary) return primary;
      return record[`${base}_en`] || "";
    },
    [lang]
  );

  const value = {
    lang,
    dir: LANGS[lang].dir,
    isRTL: LANGS[lang].dir === "rtl",
    setLang,
    toggle,
    t,
    pick,
    meta: LANGS[lang],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}
