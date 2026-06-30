import { useI18n } from "@/i18n";
import { useMeta } from "@/lib/seo";
import InstructorCard from "@/components/InstructorCard";
import ShareButtons from "@/components/ShareButtons";

export default function About() {
  const { t } = useI18n();
  const body = t("about.body");
  useMeta({ title: t("about.title"), description: body.slice(0, 160) });
  const paras = body.split("\n\n");

  return (
    <div className="container-page max-w-3xl">
      <h1 className="text-3xl font-extrabold text-goldink md:text-4xl">{t("about.title")}</h1>
      <div className="gold-rule mt-3 w-24" />

      <div className="mt-6">
        <InstructorCard />
      </div>

      <div className="mt-6 space-y-4 text-[15px] leading-relaxed">
        {paras.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="mt-8">
        <ShareButtons title={t("about.title")} />
      </div>
    </div>
  );
}
