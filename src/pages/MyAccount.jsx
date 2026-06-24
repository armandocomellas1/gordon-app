import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2, XCircle, CalendarClock, GraduationCap, PlayCircle, FileText, Package,
  CalendarDays, Award, Lock,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Lecture, Progress } from "@/api/entities";
import { courseCompletion } from "@/lib/course";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CourseMaterials from "@/components/CourseMaterials";
import KitSection from "@/components/KitSection";
import MeetingsSection from "@/components/MeetingsSection";

export default function MyAccount() {
  const { t, lang } = useI18n();
  const { user, accessState } = useAuth();
  const [lectures, setLectures] = useState([]);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [lec, prog] = await Promise.all([
        Lecture.filter({ is_published: true }),
        Progress.filter({ user_email: user.email }),
      ]);
      if (!alive) return;
      setLectures(lec);
      setProgress(prog);
    })();
    return () => {
      alive = false;
    };
  }, [user.email]);

  const active = accessState.hasFullAccess;
  const completion = courseCompletion(progress, lectures);

  const deliverables = [
    { icon: PlayCircle, label: t("course.lectures"), done: active },
    { icon: FileText, label: t("course.materials"), done: active },
    { icon: Package, label: t("course.kit"), done: active },
    { icon: CalendarDays, label: t("course.meetings"), done: active },
    { icon: Award, label: t("course.certificate"), done: completion.complete },
  ];

  return (
    <div className="container-page max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold">{t("account.title")}</h1>
        <p className="mt-1 text-muted-foreground">{user.full_name || user.email}</p>
      </header>

      {/* Deliverables overview */}
      <Card className="mb-5 p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {t("course.deliverables")}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {deliverables.map((d) => (
            <div key={d.label} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={`grid h-11 w-11 place-items-center rounded-xl ${
                  d.done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {d.done ? <d.icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
              </span>
              <span className="text-[11px] font-medium leading-tight">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Access */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{t("account.status")}</h2>
            {active ? (
              <Badge tone="success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("account.active")}
              </Badge>
            ) : (
              <Badge tone="locked">
                <XCircle className="h-3.5 w-3.5" />
                {t("account.none")}
              </Badge>
            )}
          </div>
          {active ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("account.plan")}</dt>
                <dd className="font-semibold">
                  {accessState.isAdmin ? "Admin" : accessState.activeEnrollment?.plan || "full_course"}
                </dd>
              </div>
              {accessState.expiresAt && (
                <div className="flex justify-between">
                  <dt className="inline-flex items-center gap-1 text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                    {t("account.expires")}
                  </dt>
                  <dd className="font-semibold">{formatDate(accessState.expiresAt, lang)}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{t("account.noAccessBody")}</p>
          )}
        </Card>

        {/* Progress + certificate */}
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-bold">
            <GraduationCap className="h-5 w-5 text-primary" />
            {t("account.progress")}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("account.watched", { n: completion.completed, total: completion.total })}
          </p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion.pct}%` }} />
          </div>

          <div className="mt-4 rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center gap-2">
              <Award className={`h-5 w-5 ${completion.complete ? "text-amber-500" : "text-muted-foreground"}`} />
              <p className="text-sm font-semibold">{t("cert.title")}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {completion.complete ? t("cert.unlocked") : t("cert.locked")}
            </p>
            <Button asChild size="sm" variant={completion.complete ? "accent" : "outline"} className="mt-3">
              <Link to="/certificate">{t("cert.view")}</Link>
            </Button>
          </div>

          <Button asChild className="mt-4 w-full" variant="outline">
            <Link to="/lectures">{t("home.cta.browse")}</Link>
          </Button>
        </Card>
      </div>

      {/* Course deliverables */}
      <div className="mt-5 grid gap-5">
        <CourseMaterials hasAccess={active} />
        <div className="grid gap-5 md:grid-cols-2">
          <KitSection user={user} hasAccess={active} />
          <MeetingsSection user={user} hasAccess={active} />
        </div>
      </div>
    </div>
  );
}
