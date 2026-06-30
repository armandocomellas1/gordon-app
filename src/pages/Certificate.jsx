import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Printer, Award } from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Lecture, Progress } from "@/api/entities";
import { courseCompletion } from "@/lib/course";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";

export default function Certificate() {
  const { t, lang, isRTL } = useI18n();
  const { user } = useAuth();
  const [completion, setCompletion] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [lec, prog] = await Promise.all([
        Lecture.filter({ is_published: true }),
        Progress.filter({ user_email: user.email }),
      ]);
      if (alive) setCompletion(courseCompletion(prog, lec));
    })();
    return () => {
      alive = false;
    };
  }, [user.email]);

  if (!completion) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const Back = isRTL ? ArrowRight : ArrowLeft;
  const today = formatDate(new Date().toISOString(), lang);

  return (
    <div className="container-page max-w-3xl">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link to="/account" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Back className="h-4 w-4" />
          {t("certpage.back")}
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          {t("certpage.print")}
        </Button>
      </div>

      {!completion.complete && (
        <div className="no-print mb-4 rounded-lg bg-amber-100 px-4 py-3 text-sm font-medium text-amber-800">
          {t("certpage.previewNote")} ({completion.completed}/{completion.total})
        </div>
      )}

      {/* The printable sheet */}
      <div className="cert-sheet card-soft mx-auto bg-white p-10 text-center md:p-14">
        <div className="brand-mark mx-auto mb-6 h-16 w-16 rounded-full text-3xl" aria-hidden>
          ג
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          {t("app.title")}
        </p>
        <h1 className="mt-3 flex items-center justify-center gap-2 text-2xl font-extrabold md:text-3xl">
          <Award className="h-7 w-7 text-amber-500" />
          {t("cert.title")}
        </h1>

        <p className="mt-8 text-sm text-muted-foreground">{t("certpage.awarded")}</p>
        <p className="mt-1 text-3xl font-extrabold">{user.full_name || user.email}</p>

        <p className="mt-6 text-sm text-muted-foreground">{t("certpage.completed")}</p>
        <p className="mt-1 text-lg font-bold">{t("certpage.course")}</p>

        <div className="mt-12 flex items-end justify-between">
          <div className="text-start">
            <p className="text-xs text-muted-foreground">{t("certpage.date")}</p>
            <p className="font-semibold">{today}</p>
          </div>
          <div className="text-end">
            <p className="border-t border-foreground/40 pt-1 font-[cursive] text-lg">
              {t("certpage.signature")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
