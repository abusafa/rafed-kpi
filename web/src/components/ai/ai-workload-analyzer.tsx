"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";

type WorkloadUser = {
  name: string;
  role: string;
  kpiCount: number;
  overdueCount: number;
  ragStatus: "overloaded" | "balanced" | "underloaded";
};

type WorkloadAnalysis = {
  summary: string;
  overloaded: WorkloadUser[];
  unassignedCount: number;
  recommendations: string[];
};

type Props = {
  className?: string;
};

const RAG_STYLES: Record<WorkloadUser["ragStatus"], { badge: string; label: { en: string; ar: string } }> = {
  overloaded: {
    badge: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400",
    label: { en: "Overloaded", ar: "محمَّل زيادة" },
  },
  balanced: {
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
    label: { en: "Balanced", ar: "متوازن" },
  },
  underloaded: {
    badge: "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400",
    label: { en: "Underloaded", ar: "متاح" },
  },
};

export function AiWorkloadAnalyzer({ className }: Props) {
  const { tr, isArabic } = useLocale();
  const [analysis, setAnalysis] = useState<WorkloadAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  async function handleAnalyze() {
    setLoading(true);
    setAnalysis(null);
    setError(false);

    try {
      const res = await fetch("/api/ai/workload-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: isArabic ? "ar" : "en" }),
      });

      if (!res.ok) throw new Error("ai_error");
      const data = (await res.json()) as WorkloadAnalysis;
      setAnalysis(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-muted/20 p-4 space-y-4",
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
              {tr("AI Workload Analysis", "تحليل عبء العمل بالذكاء الاصطناعي")}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr(
                "Detect overloaded users, unassigned KPIs, and imbalances",
                "رصد المستخدمين المحمَّلين زيادة والمؤشرات غير المعيَّنة",
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {analysis && (
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

      {!analysis && !loading && !error && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => void handleAnalyze()}
        >
          <Icon name="tabler:sparkles" className="h-3.5 w-3.5 text-primary" />
          {tr("Analyze Workload", "تحليل عبء العمل")}
        </Button>
      )}

      {loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="tabler:loader-2" className="h-4 w-4 animate-spin text-primary" />
            {tr("Analyzing assignments and workload…", "جارٍ تحليل التعيينات وعبء العمل…")}
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={cn("h-10 rounded-xl bg-muted/50 animate-pulse")} />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-destructive flex-1">
            {tr("Workload analysis failed.", "فشل تحليل عبء العمل.")}
          </p>
          <Button type="button" size="sm" variant="ghost" onClick={() => void handleAnalyze()}>
            {tr("Retry", "إعادة المحاولة")}
          </Button>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <p
            className={cn("text-sm text-foreground leading-relaxed", isArabic && "text-right")}
            dir={isArabic ? "rtl" : "ltr"}
          >
            {analysis.summary}
          </p>

          {analysis.unassignedCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
              <Icon name="tabler:user-question" className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {analysis.unassignedCount} {tr("KPIs have no assigned owner", "مؤشرات بدون مالك معيَّن")}
              </p>
            </div>
          )}

          {analysis.overloaded.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tr("Users requiring attention", "مستخدمون يحتاجون انتباهاً")}
              </p>
              <div className="divide-y divide-border rounded-xl border border-border bg-background/60 overflow-hidden">
                {analysis.overloaded.map((user, idx) => {
                  const style = RAG_STYLES[user.ragStatus];
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2.5",
                        isArabic && "flex-row-reverse",
                      )}
                    >
                      <div className={cn("min-w-0", isArabic && "text-right")}>
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {user.kpiCount} {tr("KPIs", "مؤشرات")}
                          {user.overdueCount > 0 && (
                            <span className="ms-1 text-red-500">
                              · {user.overdueCount} {tr("overdue", "متأخر")}
                            </span>
                          )}
                        </span>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5", style.badge)}>
                          {isArabic ? style.label.ar : style.label.en}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {analysis.recommendations.length > 0 && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-3 space-y-2">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Icon name="tabler:bulb" className="h-3.5 w-3.5" />
                {tr("Recommendations", "التوصيات")}
              </p>
              <ol className={cn("space-y-1", isArabic && "text-right")} dir={isArabic ? "rtl" : "ltr"}>
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <span className="shrink-0 font-bold text-blue-500 mt-0.5">{i + 1}.</span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Icon name="tabler:info-circle" className="h-3 w-3" />
            {tr("AI-generated — verify before redistributing assignments", "مُولَّد بالذكاء الاصطناعي — تحقق قبل إعادة التوزيع")}
          </p>
        </div>
      )}
    </div>
  );
}
