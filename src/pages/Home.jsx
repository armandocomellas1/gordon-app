import { Link } from "react-router-dom";
import { Gem, Languages, ShieldCheck, RefreshCw, ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n";
import { useMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ShareButtons from "@/components/ShareButtons";

export default function Home() {
  const { t, isRTL } = useI18n();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  useMeta({ title: t("home.hero.title"), description: t("home.hero.body") });

  const features = [
    { icon: Languages, title: t("home.features.bilingual.title"), body: t("home.features.bilingual.body") },
    { icon: ShieldCheck, title: t("home.features.secure.title"), body: t("home.features.secure.body") },
    { icon: RefreshCw, title: t("home.features.updates.title"), body: t("home.features.updates.body") },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Gem className="h-4 w-4" />
              {t("home.hero.kicker")}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              {t("home.hero.title")}
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
              {t("home.hero.body")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/lectures">
                  {t("home.cta.browse")}
                  <Arrow className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/lectures">{t("home.cta.preview")}</Link>
              </Button>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="card-soft overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-purple-300 via-purple-200 to-amber-100">
                <div className="grid h-full place-items-center">
                  <Gem className="h-24 w-24 text-primary/60" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 start-6 rounded-xl bg-card p-3 shadow-lg">
              <p className="text-xs font-semibold text-muted-foreground">GIA · PhD</p>
              <p className="text-sm font-bold">Gemology &amp; Human Behaviour</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container grid gap-4 py-6 md:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="p-6">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-primary">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-bold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </Card>
        ))}
      </section>

      {/* About */}
      <section className="container py-12">
        <Card className="p-8 md:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold md:text-3xl">{t("home.about.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("home.about.body")}</p>
            <Button asChild className="mt-6">
              <Link to="/lectures">
                {t("home.cta.browse")}
                <Arrow className="h-4 w-4" />
              </Link>
            </Button>
            <div className="mt-8 flex justify-center">
              <ShareButtons title={t("home.hero.title")} />
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
