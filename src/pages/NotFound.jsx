import { Link } from "react-router-dom";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="container-page grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="text-6xl font-extrabold text-goldink/30">404</p>
        <h1 className="mt-2 text-2xl font-bold">{t("notfound.title")}</h1>
        <Button asChild className="mt-6">
          <Link to="/">{t("notfound.cta")}</Link>
        </Button>
      </div>
    </div>
  );
}
