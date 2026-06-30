import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { useI18n } from "@/i18n";
import { useMeta } from "@/lib/seo";
import { useAuth } from "@/hooks/useAuth";
import { Lecture, Progress } from "@/api/entities";
import { canWatch } from "@/lib/access";
import LectureCard from "@/components/LectureCard";
import InstructorCard from "@/components/InstructorCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";

export default function Lectures() {
  const { t, pick } = useI18n();
  useMeta({ title: t("lectures.title"), description: t("lectures.intro") });
  const { user, accessState } = useAuth();
  const [lectures, setLectures] = useState(null);
  const [progressMap, setProgressMap] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await Lecture.filter({ is_published: true }, "order");
      if (!alive) return;
      setLectures(rows);

      if (user) {
        try {
          const prog = await Progress.filter({ user_email: user.email });
          if (!alive) return;
          const map = {};
          for (const p of prog) map[p.lecture_id] = p;
          setProgressMap(map);
        } catch {
          /* ignore */
        }
      } else {
        setProgressMap({});
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.email]);

  const firstPreview = lectures?.find((l) => l.free_preview) || lectures?.[0];

  // Group lectures by course part/section (Part 1, Part 2, …) for headed rows.
  const groups = useMemo(() => {
    if (!lectures) return null;
    const byPart = new Map();
    for (const l of lectures) {
      const key = l.part ?? 1;
      if (!byPart.has(key)) byPart.set(key, []);
      byPart.get(key).push(l);
    }
    return [...byPart.entries()].sort((a, b) => a[0] - b[0]);
  }, [lectures]);

  return (
    <div className="container-page">
      {/* Welcoming course intro */}
      <header className="mb-8 grid gap-5 md:grid-cols-3 md:items-stretch">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-extrabold">{t("lectures.title")}</h1>
          <p className="mt-1 text-sm font-semibold text-primary">{t("lectures.subtitle")}</p>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{t("lectures.intro")}</p>
          {firstPreview && (
            <Button asChild className="mt-4">
              <Link to={`/lectures/${firstPreview.id}`}>
                <PlayCircle className="h-4 w-4" />
                {t("lectures.startHere")}
              </Link>
            </Button>
          )}
        </div>
        <InstructorCard className="md:col-span-1" />
      </header>

      {lectures === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-soft overflow-hidden">
              <Skeleton className="aspect-video rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : lectures.length === 0 ? (
        <p className="text-muted-foreground">{t("lectures.empty")}</p>
      ) : (
        <div className="space-y-10">
          {groups.map(([part, items]) => (
            <section key={part}>
              <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-2">
                <h2 className="text-lg font-extrabold">{pick(items[0], "part_title")}</h2>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {items.length} {t("nav.lectures")}
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((l) => (
                  <LectureCard
                    key={l.id}
                    lecture={l}
                    locked={!canWatch(l, accessState)}
                    progress={progressMap[l.id]}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
