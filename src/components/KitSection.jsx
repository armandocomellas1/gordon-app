import { useEffect, useState } from "react";
import { Package, Truck, Lock, Pencil } from "lucide-react";
import { useI18n } from "@/i18n";
import { KitShipment } from "@/api/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/misc";

const STATUS_TONE = {
  requested: "warning",
  preparing: "primary",
  shipped: "primary",
  delivered: "success",
  cancelled: "muted",
};

const EMPTY = {
  recipient_name: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  region: "",
  postal_code: "",
  country: "",
};

export default function KitSection({ user, hasAccess }) {
  const { t } = useI18n();
  const [shipment, setShipment] = useState(undefined); // undefined=loading, null=none
  const [editing, setEditing] = useState(false);

  async function load() {
    const rows = await KitShipment.filter({ user_email: user.email });
    setShipment(rows[0] || null);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  if (!hasAccess) {
    return (
      <Card className="p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <Package className="h-5 w-5 text-primary" />
          {t("kit.title")}
        </h2>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          {t("materials.locked")}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <Package className="h-5 w-5 text-primary" />
          {t("kit.title")}
        </h2>
        {shipment && <Badge tone={STATUS_TONE[shipment.status]}>{t(`kit.status.${shipment.status}`)}</Badge>}
      </div>

      {shipment === undefined ? (
        <div className="grid place-items-center py-6">
          <Spinner className="h-6 w-6" />
        </div>
      ) : shipment === null ? (
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">{t("kit.intro")}</p>
          <Button className="mt-4" onClick={() => setEditing(true)}>
            <Package className="h-4 w-4" />
            {t("kit.request")}
          </Button>
        </div>
      ) : (
        <div className="mt-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("kit.shippingTo")}</p>
          <p className="mt-1 font-medium">{shipment.recipient_name}</p>
          <p className="text-muted-foreground">
            {[shipment.address1, shipment.address2, shipment.city, shipment.region, shipment.postal_code, shipment.country]
              .filter(Boolean)
              .join(", ")}
          </p>
          {shipment.tracking && (
            <p className="mt-2 inline-flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary" />
              {t("kit.tracking")}: <span className="font-semibold">{shipment.tracking}</span>
              {shipment.carrier ? ` (${shipment.carrier})` : ""}
            </p>
          )}
          {["requested", "preparing"].includes(shipment.status) && (
            <Button className="mt-4" variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              {t("kit.edit")}
            </Button>
          )}
        </div>
      )}

      <KitForm
        open={editing}
        initial={shipment || EMPTY}
        onClose={() => setEditing(false)}
        onSave={async (data) => {
          if (shipment) {
            await KitShipment.update(shipment.id, data);
          } else {
            await KitShipment.create({
              user_email: user.email,
              status: "requested",
              requested_date: new Date().toISOString(),
              ...data,
            });
          }
          setEditing(false);
          load();
        }}
      />
    </Card>
  );
}

function KitForm({ open, initial, onClose, onSave }) {
  const { t } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  // Reset form whenever the dialog opens.
  useEffect(() => {
    if (open) setForm({ ...EMPTY, ...initial });
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.recipient_name && form.address1 && form.city && form.country;

  const fields = [
    ["recipient_name", "kit.form.recipient"],
    ["phone", "kit.form.phone"],
    ["address1", "kit.form.address1"],
    ["address2", "kit.form.address2"],
    ["city", "kit.form.city"],
    ["region", "kit.form.region"],
    ["postal_code", "kit.form.postal"],
    ["country", "kit.form.country"],
  ];

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-bold">{t("kit.request")}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {fields.map(([key, label]) => (
            <div key={key} className={key.startsWith("address") ? "sm:col-span-2" : ""}>
              <Label className="mb-1 block">{t(label)}</Label>
              <Input value={form[key] || ""} onChange={set(key)} />
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t("admin.cancel")}
          </Button>
          <Button
            disabled={!valid || saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(form);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? <Spinner className="text-white" /> : null}
            {t("kit.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
