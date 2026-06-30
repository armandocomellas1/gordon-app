import { useEffect, useState } from "react";
import { FileText, Download, Lock } from "lucide-react";
import { useI18n } from "@/i18n";
import { CourseResource } from "@/api/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";

export default function CourseMaterials({ hasAccess }) {
  const { t, pick } = useI18n();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let alive = true;
    CourseResource.list("order").then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 font-bold">
        <FileText className="h-5 w-5 text-goldink" />
        {t("materials.title")}
      </h2>

      {rows === null ? (
        <div className="grid place-items-center py-6">
          <Spinner className="h-6 w-6" />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("materials.none")}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {rows.map((r) => {
            const locked = r.enrolled_only && !hasAccess;
            return (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-goldink">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{pick(r, "title")}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.kind?.toUpperCase()}
                    {r.pages ? ` · ${t("materials.pages", { n: r.pages })}` : ""}
                    {r.size_mb ? ` · ${r.size_mb}MB` : ""}
                  </p>
                </div>
                {locked ? (
                  <Button size="sm" variant="outline" disabled title={t("materials.locked")}>
                    <Lock className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button asChild size="sm">
                    <a href={r.url} target="_blank" rel="noreferrer" download>
                      <Download className="h-4 w-4" />
                      {t("materials.download")}
                    </a>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!hasAccess && <p className="mt-3 text-xs text-muted-foreground">{t("materials.locked")}</p>}
    </Card>
  );
}
