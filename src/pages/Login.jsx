import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { LogIn, User2, GraduationCap, ShieldCheck, RotateCcw } from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { IS_DEMO, base44 } from "@/api/base44Client";
import { Enrollment } from "@/api/entities";
import { oneYearFrom } from "@/lib/access";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";

export default function Login() {
  const { t } = useI18n();
  const { user, login, refresh } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [busy, setBusy] = useState(null);

  const dest = loc.state?.from || "/lectures";
  if (user) return <Navigate to={dest} replace />;

  async function ensureDemoEnrollment(roleKey) {
    if (!IS_DEMO || roleKey !== "student") return;
    const email = "student@example.com";
    const existing = await Enrollment.filter({ user_email: email, status: "active" });
    if (!existing.length) {
      await Enrollment.create({
        user_email: email,
        plan: "full_course",
        status: "active",
        granted_date: new Date().toISOString(),
        expires_date: oneYearFrom().toISOString(),
        note: "demo seed",
      });
    }
  }

  async function handleDemo(roleKey) {
    setBusy(roleKey);
    try {
      await login(roleKey);
      await ensureDemoEnrollment(roleKey);
      await refresh();
      nav(dest, { replace: true });
    } finally {
      setBusy(null);
    }
  }

  async function handleGoogle() {
    setBusy("google");
    // Real Base44: redirects to Google and returns to the app authenticated.
    await login();
  }

  function resetDemo() {
    base44._resetDemoData?.();
    window.location.reload();
  }

  return (
    <div className="container-page grid min-h-[70vh] place-items-center">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-goldink">
            <LogIn className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold">{t("login.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("login.body")}</p>
        </div>

        {IS_DEMO ? (
          <div className="mt-7">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("login.demoTitle")}
            </p>
            <div className="space-y-2.5">
              <Button className="w-full justify-start" variant="outline" disabled={!!busy} onClick={() => handleDemo("guest")}>
                {busy === "guest" ? <Spinner /> : <User2 className="h-4 w-4" />}
                {t("login.demoGuest")}
              </Button>
              <Button className="w-full justify-start" disabled={!!busy} onClick={() => handleDemo("student")}>
                {busy === "student" ? <Spinner className="text-white" /> : <GraduationCap className="h-4 w-4" />}
                {t("login.demoStudent")}
              </Button>
              <Button className="w-full justify-start" variant="accent" disabled={!!busy} onClick={() => handleDemo("admin")}>
                {busy === "admin" ? <Spinner /> : <ShieldCheck className="h-4 w-4" />}
                {t("login.demoAdmin")}
              </Button>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">{t("login.demoNote")}</p>
            <button
              onClick={resetDemo}
              className="mx-auto mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("login.reset")}
            </button>
          </div>
        ) : (
          <div className="mt-7">
            <Button className="w-full" size="lg" disabled={!!busy} onClick={handleGoogle}>
              {busy === "google" ? <Spinner className="text-white" /> : <LogIn className="h-5 w-5" />}
              {t("login.google")}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
