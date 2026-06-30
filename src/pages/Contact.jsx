import { useState } from "react";
import { Phone, Printer, Mail, MapPin } from "lucide-react";
import { useI18n } from "@/i18n";
import { useMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";

// Static contact details (verbatim from doctorgavrielov.co.il) — not translated.
const INFO = {
  usaPhone: "1-718-838-1530",
  tel: "972-3-5320259",
  telefax: "972-3-5320266",
  email: "info@doctorgavrielov.co.il",
  address: "24 Rabbi Nimrover St., Givat Shmuel 54019, Israel",
};

export default function Contact() {
  const { t } = useI18n();
  useMeta({ title: t("contact.title"), description: t("contact.intro") });
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Static hosting has no backend — compose an email to the clinic.
  const submit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Website contact — ${form.name}`);
    const body = encodeURIComponent(
      `${form.message}\n\n— ${form.name}\n${form.phone}\n${form.email}`
    );
    window.location.href = `mailto:${INFO.email}?subject=${subject}&body=${body}`;
  };

  const Row = ({ icon: Icon, label, children }) => (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-goldink">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  );

  return (
    <div className="container-page max-w-4xl">
      <h1 className="text-3xl font-extrabold text-goldink md:text-4xl">{t("contact.title")}</h1>
      <div className="gold-rule mt-3 w-24" />
      <p className="mt-4 max-w-2xl text-muted-foreground">{t("contact.intro")}</p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {/* Form */}
        <form onSubmit={submit} className="card-soft space-y-4 p-6">
          <div>
            <Label htmlFor="c-name">{t("contact.name")} *</Label>
            <Input id="c-name" required value={form.name} onChange={set("name")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="c-phone">{t("contact.phone")} *</Label>
            <Input id="c-phone" required value={form.phone} onChange={set("phone")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="c-email">{t("contact.email")} *</Label>
            <Input id="c-email" type="email" required value={form.email} onChange={set("email")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="c-msg">{t("contact.message")} *</Label>
            <Textarea id="c-msg" required rows={5} value={form.message} onChange={set("message")} className="mt-1" />
          </div>
          <p className="text-xs text-muted-foreground">{t("contact.requiredNote")}</p>
          <Button type="submit" className="w-full sm:w-auto">{t("contact.send")}</Button>
        </form>

        {/* Details */}
        <div className="card-soft space-y-5 p-6">
          <h2 className="text-lg font-bold text-goldink">{t("contact.infoTitle")}</h2>
          <Row icon={Phone} label={t("contact.usaPhone")}>
            <a href={`tel:${INFO.usaPhone}`} className="font-semibold hover:text-goldink">{INFO.usaPhone}</a>
          </Row>
          <Row icon={Phone} label={t("contact.tel")}>
            <a href={`tel:${INFO.tel}`} className="font-semibold hover:text-goldink">{INFO.tel}</a>
          </Row>
          <Row icon={Printer} label={t("contact.telefax")}>
            <span className="font-semibold">{INFO.telefax}</span>
          </Row>
          <Row icon={Mail} label={t("contact.emailLabel")}>
            <a href={`mailto:${INFO.email}`} className="font-semibold hover:text-goldink">{INFO.email}</a>
          </Row>
          <Row icon={MapPin} label={t("contact.addressLabel")}>
            <span className="font-semibold">{INFO.address}</span>
          </Row>
        </div>
      </div>
    </div>
  );
}
