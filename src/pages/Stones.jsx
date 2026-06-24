import { useEffect, useMemo, useState } from "react";
import { Gem, Search, BookOpen, ScrollText } from "lucide-react";
import { useI18n } from "@/i18n";
import { useMeta } from "@/lib/seo";
import { Stone } from "@/api/entities";
import ShareButtons from "@/components/ShareButtons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/misc";

export default function Stones() {
  const { t, lang } = useI18n();
  useMeta({ title: t("stones.title"), description: t("stones.subtitle") });
  const [stones, setStones] = useState(null);
  const [q, setQ] = useState("");
  const [family, setFamily] = useState("");
  const [active, setActive] = useState(null);

  useEffect(() => {
    let alive = true;
    Stone.filter({ is_published: true }, "number").then((rows) => alive && setStones(rows));
    return () => {
      alive = false;
    };
  }, []);

  const name = (s) => (lang === "he" ? s.name_he : s.name_en) || s.name_he || s.name_en;
  const props = (s) => (lang === "he" ? s.properties_he : s.properties_en) || s.properties_en || s.properties_he;

  const families = useMemo(() => {
    if (!stones) return [];
    return [...new Set(stones.map((s) => s.family).filter(Boolean))].sort();
  }, [stones]);

  const filtered = useMemo(() => {
    if (!stones) return [];
    const needle = q.trim().toLowerCase();
    return stones.filter((s) => {
      if (family && s.family !== family) return false;
      if (!needle) return true;
      return [s.name_he, s.name_en, s.family, s.tribe, s.scripture_ref]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(needle));
    });
  }, [stones, q, family]);

  return (
    <div className="container-page">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold">
          <Gem className="h-7 w-7 text-primary" />
          {t("stones.title")}
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">{t("stones.subtitle")}</p>
      </header>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("stones.search")} className="ps-9" />
        </div>
        <Select value={family} onChange={(e) => setFamily(e.target.value)} className="sm:w-56">
          <option value="">{t("stones.familyAll")}</option>
          {families.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </div>

      {stones === null ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">{t("stones.empty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className="card-soft group overflow-hidden text-start transition-transform hover:-translate-y-0.5"
            >
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-purple-200 to-amber-100">
                {s.image_url && (
                  <img
                    src={s.image_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
                {s.number != null && (
                  <span className="absolute start-2 top-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {s.number}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate font-bold leading-tight">{name(s)}</p>
                <p className="truncate text-xs text-muted-foreground">{s.family || "—"}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!active} onClose={() => setActive(null)}>
        {active && (
          <div>
            <div className="relative aspect-video overflow-hidden rounded-t-lg bg-gradient-to-br from-purple-200 to-amber-100">
              {active.image_url && (
                <img src={active.image_url} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2">
                {active.number != null && <Badge tone="primary">{t("stones.number")} {active.number}</Badge>}
                {active.tribe && <Badge tone="accent">{t("stones.tribe")}: {active.tribe}</Badge>}
              </div>
              <h2 className="mt-2 text-2xl font-extrabold">{name(active)}</h2>
              <p className="text-sm text-muted-foreground">
                {lang === "he" ? active.name_en : active.name_he}
              </p>

              {props(active) && (
                <div className="mt-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    {t("stones.properties")}
                  </p>
                  <p className="mt-1 leading-relaxed">{props(active)}</p>
                </div>
              )}

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Meta label={t("stones.family")} value={active.family} />
                <Meta label={t("stones.color")} value={active.color} />
                <Meta label={t("stones.hardness")} value={active.hardness} />
                <Meta label={t("stones.scripture")} value={active.scripture_ref} icon={ScrollText} />
              </dl>

              <div className="mt-5 border-t border-border pt-4">
                <ShareButtons title={`${name(active)} · ${t("stones.title")}`} image={active.image_url} />
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">{t("stones.imageNote")}</p>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Meta({ label, value, icon: Icon }) {
  if (!value) return null;
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
