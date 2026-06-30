import { useI18n } from "@/i18n";
import { useMeta } from "@/lib/seo";

export default function CompanyPolicy() {
  const { t } = useI18n();
  useMeta({ title: t("policy.title"), description: t("policy.heading") });

  return (
    <div className="container-page max-w-3xl">
      <h1 className="text-3xl font-extrabold text-goldink md:text-4xl">{t("policy.title")}</h1>
      <div className="gold-rule mt-3 w-24" />
      <h2 className="mt-6 text-xl font-bold text-goldink">{t("policy.heading")}</h2>
      <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed">
        {t("policy.body")}
      </div>
    </div>
  );
}
