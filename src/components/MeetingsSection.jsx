import { useEffect, useState } from "react";
import { CalendarDays, Video, Lock, Clock } from "lucide-react";
import { useI18n } from "@/i18n";
import { Meeting } from "@/api/entities";
import { meetingSlots } from "@/lib/course";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/misc";

const STATUS_TONE = {
  available: "muted",
  requested: "warning",
  confirmed: "success",
  completed: "primary",
  cancelled: "muted",
};

export default function MeetingsSection({ user, hasAccess }) {
  const { t, lang } = useI18n();
  const [meetings, setMeetings] = useState(null);
  const [booking, setBooking] = useState(null); // meeting_no being booked

  async function load() {
    setMeetings(await Meeting.filter({ user_email: user.email }));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);

  if (!hasAccess) {
    return (
      <Card className="p-6">
        <h2 className="flex items-center gap-2 font-bold">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t("meetings.title")}
        </h2>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          {t("materials.locked")}
        </p>
      </Card>
    );
  }

  const slots = meetings ? meetingSlots(meetings) : [];
  const used = meetings ? meetings.filter((m) => m.status !== "cancelled").length : 0;

  async function cancel(m) {
    await Meeting.update(m.id, { status: "cancelled" });
    load();
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t("meetings.title")}
        </h2>
        <span className="text-xs text-muted-foreground">{t("meetings.included", { n: used })}</span>
      </div>

      {meetings === null ? (
        <div className="grid place-items-center py-6">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {slots.map((m) => (
            <div key={m.meeting_no} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  {t("meetings.slot")} {m.meeting_no}
                </p>
                <Badge tone={STATUS_TONE[m.status]}>{t(`meetings.status.${m.status}`)}</Badge>
              </div>

              {m.status === "available" && (
                <Button className="mt-3" size="sm" onClick={() => setBooking(m.meeting_no)}>
                  <CalendarDays className="h-4 w-4" />
                  {t("meetings.book")}
                </Button>
              )}

              {(m.status === "requested" || m.status === "confirmed") && (
                <div className="mt-2 space-y-1 text-sm">
                  {m.topic && (
                    <p>
                      <span className="text-muted-foreground">{t("meetings.topic")}: </span>
                      {m.topic}
                    </p>
                  )}
                  <p className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(m.confirmed_datetime || m.requested_datetime, lang)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {m.status === "confirmed" && m.meeting_link && (
                      <Button asChild size="sm">
                        <a href={m.meeting_link} target="_blank" rel="noreferrer">
                          <Video className="h-4 w-4" />
                          {t("meetings.join")}
                        </a>
                      </Button>
                    )}
                    {m.status === "requested" && (
                      <Button size="sm" variant="outline" onClick={() => cancel(m)}>
                        {t("meetings.cancel")}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <BookForm
        open={booking != null}
        onClose={() => setBooking(null)}
        onSave={async ({ requested_datetime, topic }) => {
          await Meeting.create({
            user_email: user.email,
            meeting_no: booking,
            status: "requested",
            requested_datetime,
            topic,
          });
          setBooking(null);
          load();
        }}
      />
    </Card>
  );
}

function BookForm({ open, onClose, onSave }) {
  const { t } = useI18n();
  const [dt, setDt] = useState("");
  const [topic, setTopic] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDt("");
      setTopic("");
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-bold">{t("meetings.book")}</h3>
        <div className="mt-4 space-y-3">
          <div>
            <Label className="mb-1 block">{t("meetings.datetime")}</Label>
            <Input type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">{t("meetings.topic")}</Label>
            <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t("admin.cancel")}
          </Button>
          <Button
            disabled={!dt || saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave({ requested_datetime: new Date(dt).toISOString(), topic });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? <Spinner className="text-white" /> : null}
            {t("meetings.request")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
