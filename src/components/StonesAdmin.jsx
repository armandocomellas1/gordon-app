import { useEffect, useState } from "react";
import { Gem, Pencil, Save, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { Stone } from "@/api/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Switch, Spinner } from "@/components/ui/misc";

export default function StonesAdmin() {
  const { t, pick } = useI18n();
  const [rows, setRows] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const load = () => Stone.list("number").then(setRows);
  useEffect(() => {
    load();
  }, []);

  if (rows === null) return <Card className="grid place-items-center p-10"><Spinner className="h-7 w-7" /></Card>;

  return (
    <Card className="p-5 md:p-6">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-bold">
          <Gem className="h-5 w-5 text-primary" />
          {t("admin.stones.title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("admin.stones.subtitle")}</p>
      </div>

      <div className="divide-y divide-border">
        {rows.map((s) =>
          editingId === s.id ? (
            <StoneEditor key={s.id} stone={s} onCancel={() => setEditingId(null)} onSaved={() => { setEditingId(null); load(); }} />
          ) : (
            <div key={s.id} className="flex items-center gap-3 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-secondary text-sm font-bold">
                {s.number ?? "–"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{pick(s, "name")}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[s.family, s.tribe && `${t("stones.tribe")}: ${s.tribe}`, s.scripture_ref].filter(Boolean).join(" · ")}
                </p>
              </div>
              {!s.is_published && <Badge tone="locked">draft</Badge>}
              <Button size="sm" variant="outline" onClick={() => setEditingId(s.id)}>
                <Pencil className="h-4 w-4" />
                {t("admin.edit")}
              </Button>
            </div>
          )
        )}
      </div>
    </Card>
  );
}

function StoneEditor({ stone, onCancel, onSaved }) {
  const { t } = useI18n();
  const [d, setD] = useState({ ...stone });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setD((p) => ({ ...p, [k]: e.target.value }));

  const fields = [
    ["number", t("stones.number"), "number", "ltr"],
    ["name_he", t("admin.field.title_he"), "text", "rtl"],
    ["name_en", t("admin.field.title_en"), "text", "ltr"],
    ["family", t("stones.family"), "text", "ltr"],
    ["color", t("stones.color"), "text", "ltr"],
    ["hardness", t("stones.hardness"), "text", "ltr"],
    ["scripture_ref", t("stones.scripture"), "text", "ltr"],
    ["tribe", t("stones.tribe"), "text", "ltr"],
    ["image_url", "Image URL", "text", "ltr"],
  ];

  return (
    <div className="space-y-4 rounded-lg bg-secondary/40 p-4 my-2">
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map(([k, label, type, dir]) => (
          <div key={k} className={k === "image_url" ? "md:col-span-2" : ""}>
            <Label className="mb-1 block">{label}</Label>
            <Input type={type} dir={dir} value={d[k] ?? ""} onChange={set(k)} />
          </div>
        ))}
        <div className="md:col-span-2">
          <Label className="mb-1 block">{t("stones.properties")} (he)</Label>
          <Textarea dir="rtl" value={d.properties_he || ""} onChange={set("properties_he")} />
        </div>
        <div className="md:col-span-2">
          <Label className="mb-1 block">{t("stones.properties")} (en)</Label>
          <Textarea dir="ltr" value={d.properties_en || ""} onChange={set("properties_en")} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <Switch checked={!!d.is_published} onChange={(v) => setD((p) => ({ ...p, is_published: v }))} />
        {t("admin.field.published")}
      </label>

      <div className="flex items-center gap-2">
        <Button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await Stone.update(stone.id, {
                number: d.number === "" ? null : Number(d.number),
                name_he: d.name_he,
                name_en: d.name_en,
                family: d.family,
                color: d.color,
                hardness: d.hardness,
                scripture_ref: d.scripture_ref,
                tribe: d.tribe,
                image_url: d.image_url,
                properties_he: d.properties_he,
                properties_en: d.properties_en,
                is_published: !!d.is_published,
              });
              onSaved();
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? <Spinner className="text-white" /> : <Save className="h-4 w-4" />}
          {t("admin.save")}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4" />
          {t("admin.cancel")}
        </Button>
      </div>
    </div>
  );
}
