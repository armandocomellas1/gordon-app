import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { LANGS, strings } from "./strings";

const I18nContext = createContext(null);
const STORAGE_KEY = "gavrielov.lang";

function initialLang() {
  if (typeof window === "undefined") return "fr";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && LANGS[saved]) return saved;
  const nav = (navigator.language || "fr").toLowerCase();
  return nav.startsWith("fr") ? "fr" : nav.startsWith("en") ? "en" : "fr";
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

  const toggle = useCallback(() => setLang((l) => (l === "fr" ? "en" : "fr")), []);

  /** Pick the right field of a bilingual record, with graceful fallback. */
  const pick = useCallback(
    (record, base) => {
      if (!record) return "";
      // fr maps to _he content (original language); fall back to _en
      const key = lang === "fr" ? "he" : lang;
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
