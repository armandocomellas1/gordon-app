import { useEffect, useState } from "react";
import { Package, Truck, CalendarDays, Video, Check, FileText, Save } from "lucide-react";
import { useI18n } from "@/i18n";
import { KitShipment, Meeting, CourseResource } from "@/api/entities";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";

const SHIP_TONE = { requested: "warning", preparing: "primary", shipped: "primary", delivered: "success", cancelled: "muted" };
const MEET_TONE = { requested: "warning", confirmed: "success", completed: "primary", cancelled: "muted" };

export default function CourseOpsAdmin() {
  return (
    <div className="space-y-5">
      <MaterialsAdmin />
      <ShipmentsAdmin />
      <MeetingsAdmin />
    </div>
  );
}

/* ── Materials ─────────────────────────────────────────────────────────── */
function MaterialsAdmin() {
  const { t, pick } = useI18n();
  const [rows, setRows] = useState(null);
  const load = () => CourseResource.list("order").then(setRows);
  useEffect(() => {
    load();
  }, []);

  if (rows === null) return <Card className="grid place-items-center p-8"><Spinner /></Card>;

  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 font-bold">
        <FileText className="h-4 w-4 text-primary" />
        {t("admin.course.materials")}
      </h3>
      <div className="mt-3 divide-y divide-border">
        {rows.map((r) => (
          <MaterialRow key={r.id} resource={r} onSaved={load} title={pick(r, "title")} />
        ))}
      </div>
    </Card>
  );
}

function MaterialRow({ resource, onSaved, title }) {
  const { t } = useI18n();
  const [url, setUrl] = useState(resource.url || "");
  const [pages, setPages] = useState(resource.pages || "");
  const [saving, setSaving] = useState(false);
  const dirty = url !== (resource.url || "") || String(pages) !== String(resource.pages || "");

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          <Input dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} className="h-8 min-w-[16rem] flex-1" placeholder="file URL" />
          <Input dir="ltr" type="number" value={pages} onChange={(e) => setPages(e.target.value)} className="h-8 w-24" placeholder="pages" />
        </div>
      </div>
      <Button
        size="sm"
        disabled={!dirty || saving}
        onClick={async () => {
          setSaving(true);
          try {
            await CourseResource.update(resource.id, { url, pages: Number(pages) || 0 });
            onSaved();
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? <Spinner className="text-white" /> : <Save className="h-4 w-4" />}
        {t("admin.save")}
      </Button>
    </div>
  );
}

/* ── Shipments ─────────────────────────────────────────────────────────── */
function ShipmentsAdmin() {
  const { t, lang } = useI18n();
  const [rows, setRows] = useState(null);
  const load = () => KitShipment.list("-requested_date").then(setRows);
  useEffect(() => {
    load();
  }, []);

  if (rows === null) return <Card className="grid place-items-center p-8"><Spinner /></Card>;

  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 font-bold">
        <Package className="h-4 w-4 text-primary" />
        {t("admin.course.shipments")}
      </h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("admin.ship.none")}</p>
      ) : (
        <div className="mt-3 divide-y divide-border">
          {rows.map((s) => (
            <ShipmentRow key={s.id} shipment={s} onChanged={load} lang={lang} />
          ))}
        </div>
      )}
    </Card>
  );
}

function ShipmentRow({ shipment, onChanged, lang }) {
  const { t } = useI18n();
  const [carrier, setCarrier] = useState(shipment.carrier || "");
  const [tracking, setTracking] = useState(shipment.tracking || "");
  const [busy, setBusy] = useState(false);

  async function update(patch) {
    setBusy(true);
    try {
      await KitShipment.update(shipment.id, patch);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{shipment.recipient_name} · {shipment.user_email}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[shipment.address1, shipment.city, shipment.country].filter(Boolean).join(", ")} ·{" "}
            {formatDate(shipment.requested_date, lang)}
          </p>
        </div>
        <Badge tone={SHIP_TONE[shipment.status]}>{t(`kit.status.${shipment.status}`)}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {shipment.status === "requested" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => update({ status: "preparing" })}>
            {t("admin.ship.markPreparing")}
          </Button>
        )}
        {shipment.status === "preparing" && (
          <>
            <Input dir="ltr" value={carrier} onChange={(e) => setCarrier(e.target.value)} className="h-8 w-32" placeholder={t("admin.ship.carrier")} />
            <Input dir="ltr" value={tracking} onChange={(e) => setTracking(e.target.value)} className="h-8 w-40" placeholder={t("admin.ship.tracking")} />
            <Button size="sm" disabled={busy} onClick={() => update({ status: "shipped", carrier, tracking, shipped_date: new Date().toISOString() })}>
              <Truck className="h-4 w-4" />
              {t("admin.ship.markShipped")}
            </Button>
          </>
        )}
        {shipment.status === "shipped" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => update({ status: "delivered" })}>
            <Check className="h-4 w-4" />
            {t("admin.ship.markDelivered")}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Meetings ──────────────────────────────────────────────────────────── */
function MeetingsAdmin() {
  const { t, lang } = useI18n();
  const [rows, setRows] = useState(null);
  const load = () => Meeting.list("-requested_datetime").then(setRows);
  useEffect(() => {
    load();
  }, []);

  if (rows === null) return <Card className="grid place-items-center p-8"><Spinner /></Card>;

  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 font-bold">
        <CalendarDays className="h-4 w-4 text-primary" />
        {t("admin.course.meetings")}
      </h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("admin.meet.none")}</p>
      ) : (
        <div className="mt-3 divide-y divide-border">
          {rows.map((m) => (
            <MeetingRow key={m.id} meeting={m} onChanged={load} lang={lang} />
          ))}
        </div>
      )}
    </Card>
  );
}

function MeetingRow({ meeting, onChanged, lang }) {
  const { t } = useI18n();
  const [link, setLink] = useState(meeting.meeting_link || "");
  const [busy, setBusy] = useState(false);

  async function update(patch) {
    setBusy(true);
    try {
      await Meeting.update(meeting.id, patch);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {t("meetings.slot")} {meeting.meeting_no} · {meeting.user_email}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {meeting.topic ? `${meeting.topic} · ` : ""}
            {formatDate(meeting.confirmed_datetime || meeting.requested_datetime, lang)}
          </p>
        </div>
        <Badge tone={MEET_TONE[meeting.status]}>{t(`meetings.status.${meeting.status}`)}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {meeting.status === "requested" && (
          <>
            <Input dir="ltr" value={link} onChange={(e) => setLink(e.target.value)} className="h-8 w-56" placeholder={t("admin.meet.link")} />
            <Button
              size="sm"
              disabled={busy || !link}
              onClick={() => update({ status: "confirmed", meeting_link: link, confirmed_datetime: meeting.requested_datetime })}
            >
              <Video className="h-4 w-4" />
              {t("admin.meet.confirm")}
            </Button>
          </>
        )}
        {meeting.status === "confirmed" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => update({ status: "completed" })}>
            <Check className="h-4 w-4" />
            {t("admin.meet.complete")}
          </Button>
        )}
      </div>
    </div>
  );
}
