"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";

type ImpactItem = {
  label: string;
  before: string;
  after: string;
  direction: "positive" | "negative" | "neutral";
};

type ChangeImpact = {
  summary: string;
  impacts: ImpactItem[];
  warnings: string[];
  recommendation?: string;
};

type Props = {
  entityTitle: string;
  changeType: "target" | "formula" | "structure" | "other";
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  autoLoad?: boolean;
  className?: string;
};

const CHANGE_TYPE_LABELS: Record<Props["changeType"], { en: string; ar: string; icon: string }> = {
  target: { en: "Target Change", ar: "تغيير المستهدف", icon: "tabler:target" },
  formula: { en: "Formula Change", ar: "تغيير المعادلة", icon: "tabler:math-function" },
  structure: { en: "Structure Change", ar: "تغيير هيكلي", icon: "tabler:sitemap" },
  other: { en: "Change Request", ar: "طلب تغيير", icon: "tabler:file-diff" },
};

const DIRECTION_ICONS: Record<ImpactItem["direction"], { icon: string; color: string }> = {
  positive: { icon: "tabler:trending-up", color: "text-emerald-600 dark:text-emerald-400" },
  negative: { icon: "tabler:trending-down", color: "text-red-600 dark:text-red-400" },
  neutral: { icon: "tabler:minus", color: "text-muted-foreground" },
};

export function AiChangeRequestImpact({
  entityTitle,
  changeType,
  before,
  after,
  autoLoad = true,
  className,
}: Props) {
  const { tr, isArabic } = useLocale();
  const [impact, setImpact] = useState<ChangeImpact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (autoLoad) void handleAnalyze();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dismissed) return null;

  async function handleAnalyze() {
    setLoading(true);
    setImpact(null);
    setError(false);

    try {
      const res = await fetch("/api/ai/change-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityTitle,
          changeType,
          before,
          after,
          locale: isArabic ? "ar" : "en",
        }),
      });

      if (!res.ok) throw new Error("ai_error");
      const data = (await res.json()) as ChangeImpact;
      setImpact(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const typeInfo = CHANGE_TYPE_LABELS[changeType];

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Icon name="tabler:sparkles" className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {tr("AI Impact Analysis", "تحليل الأثر بالذكاء الاصطناعي")}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Icon name={typeInfo.icon} className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {isArabic ? typeInfo.ar : typeInfo.en} — {entityTitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {impact && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => void handleAnalyze()}
              title={tr("Refresh", "تحديث")}
            >
              <Icon name="tabler:refresh" className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => setDismissed(true)}
          >
            <Icon name="tabler:x" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="tabler:loader-2" className="h-4 w-4 animate-spin text-primary" />
            {tr("Analyzing downstream impact…", "جارٍ تحليل الأثر المنعكس…")}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn("h-3 rounded bg-muted/50 animate-pulse", i === 1 ? "w-3/4" : i === 2 ? "w-full" : "w-1/2")} />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-destructive flex-1">
            {tr("Impact analysis failed.", "فشل تحليل الأثر.")}
          </p>
          <Button type="button" size="sm" variant="ghost" onClick={() => void handleAnalyze()}>
            {tr("Retry", "إعادة المحاولة")}
          </Button>
        </div>
      )}

      {impact && (
        <div className="space-y-3">
          <p
            className={cn("text-sm text-foreground leading-relaxed", isArabic && "text-right")}
            dir={isArabic ? "rtl" : "ltr"}
          >
            {impact.summary}
          </p>

          {impact.impacts.length > 0 && (
            <div className="rounded-xl border border-border bg-background/60 divide-y divide-border overflow-hidden">
              {impact.impacts.map((item, idx) => {
                const dir = DIRECTION_ICONS[item.direction];
                return (
                  <div
                    key={idx}
                    className={cn(
                      "grid grid-cols-3 items-center gap-2 px-3 py-2 text-xs",
                      isArabic && "direction-rtl",
                    )}
                  >
                    <span className="text-muted-foreground font-medium truncate">{item.label}</span>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-muted-foreground line-through">{item.before}</span>
                      <Icon name="tabler:arrow-narrow-right" className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className={cn("font-semibold", dir.color)}>{item.after}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Icon name={dir.icon} className={cn("h-4 w-4", dir.color)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {impact.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 space-y-1.5">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Icon name="tabler:alert-triangle" className="h-3.5 w-3.5" />
                {tr("Warnings", "تحذيرات")}
              </p>
              {impact.warnings.map((w, i) => (
                <p
                  key={i}
                  className={cn("text-xs text-amber-700 dark:text-amber-300 leading-relaxed", isArabic && "text-right")}
                  dir={isArabic ? "rtl" : "ltr"}
                >
                  {w}
                </p>
              ))}
            </div>
          )}

          {impact.recommendation && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 space-y-1">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Icon name="tabler:bulb" className="h-3.5 w-3.5" />
                {tr("Recommendation", "التوصية")}
              </p>
              <p
                className={cn("text-xs text-foreground leading-relaxed", isArabic && "text-right")}
                dir={isArabic ? "rtl" : "ltr"}
              >
                {impact.recommendation}
              </p>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Icon name="tabler:info-circle" className="h-3 w-3" />
            {tr("AI-generated — verify before approving", "مُولَّد بالذكاء الاصطناعي — تحقق قبل الموافقة")}
          </p>
        </div>
      )}

      {!impact && !loading && !error && !autoLoad && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => void handleAnalyze()}
        >
          <Icon name="tabler:sparkles" className="h-3.5 w-3.5 text-primary" />
          {tr("Analyze Impact", "تحليل الأثر")}
        </Button>
      )}
    </div>
  );
}
