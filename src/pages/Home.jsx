import { Link } from "react-router-dom";
import { Languages, ShieldCheck, RefreshCw, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
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
            <span className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-sm font-semibold text-goldink">
              <Sparkles className="h-4 w-4" />
              {t("home.hero.kicker")}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              {t("home.hero.title")}
            </h1>
            <div className="gold-rule mt-5 w-24" />
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
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

          {/* Nameplate — honours the original site's identity: the doctor's name
              in a clean Hebrew sans, gold on charcoal, with a traditional
              double-rule frame. No generic diamond. */}
          <div className="relative animate-fade-in">
            <div className="card-soft overflow-hidden">
              <div className="relative grid aspect-video place-items-center bg-ink">
                <div
                  className="pointer-events-none absolute inset-3 rounded-md"
                  style={{ boxShadow: "inset 0 0 0 1px hsl(var(--gold) / 0.5)" }}
                />
                <div
                  className="pointer-events-none absolute inset-[1.1rem] rounded-md"
                  style={{ boxShadow: "inset 0 0 0 1px hsl(var(--gold) / 0.22)" }}
                />
                <div className="px-6 text-center">
                  <p className="text-3xl font-extrabold md:text-4xl" style={{ color: "hsl(var(--gold))" }}>
                    ד״ר גבריאלוב
                  </p>
                  <div className="gold-rule mx-auto my-3 w-28" />
                  <p className="text-xs tracking-[0.14em]" style={{ color: "hsl(var(--on-ink) / 0.78)" }}>
                    לגמולוגיה ולמדעי ההתנהגות
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 start-6 rounded-md border-t-2 border-primary bg-card p-3 shadow-lg">
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
            <span className="grid h-11 w-11 place-items-center rounded-md bg-secondary text-goldink">
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
            <div className="gold-rule mx-auto mt-4 w-24" />
            <p className="mt-5 text-muted-foreground">{t("home.about.body")}</p>
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
