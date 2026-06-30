import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useI18n } from "@/i18n";
import { Button } from "./ui/button";

export default function LockOverlay({ reason }) {
  const { t } = useI18n();
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-gradient-to-b from-black/80 to-black/95 text-center text-white">
      <div className="max-w-sm px-6">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-white/10">
          <Lock className="h-7 w-7" />
        </div>
        <h3 className="text-xl font-bold">{t("lock.title")}</h3>
        <p className="mt-2 text-sm text-white/80">{t("lock.body")}</p>
        <div className="mt-5 flex justify-center gap-2">
          {reason === "login" ? (
            <Button asChild variant="accent">
              <Link to="/login">{t("lock.cta")}</Link>
            </Button>
          ) : (
            <Button asChild variant="accent">
              <Link to="/account">{t("lock.enrollCta")}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
