"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";

type RiskAssessment = {
  suggestedSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  likelihood: "LOW" | "MEDIUM" | "HIGH";
  mitigations: string[];
  kpiImpacts: Array<{ title: string; impact: string }>;
  reasoning: string;
};

type Props = {
  description: string;
  onApply?: (assessment: RiskAssessment) => void;
};

const SEVERITY_STYLES: Record<string, { badge: string; label: { en: string; ar: string } }> = {
  LOW: { badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400", label: { en: "Low", ar: "منخفضة" } },
  MEDIUM: { badge: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400", label: { en: "Medium", ar: "متوسطة" } },
  HIGH: { badge: "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400", label: { en: "High", ar: "عالية" } },
  CRITICAL: { badge: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400", label: { en: "Critical", ar: "حرجة" } },
};

const LIKELIHOOD_STYLES: Record<string, { en: string; ar: string }> = {
  LOW: { en: "Unlikely", ar: "غير محتمل" },
  MEDIUM: { en: "Possible", ar: "محتمل" },
  HIGH: { en: "Likely", ar: "مرجح" },
};

export function AiRiskAssessment({ description, onApply }: Props) {
  const { tr, isArabic } = useLocale();
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleAssess() {
    if (!description.trim()) return;
    setLoading(true);
    setAssessment(null);
    setError(false);
    setExpanded(true);

    try {
      const res = await fetch("/api/ai/risk-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), locale: isArabic ? "ar" : "en" }),
      });

      if (!res.ok) throw new Error("ai_error");
      const data = (await res.json()) as RiskAssessment;
      setAssessment(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const severityStyle = assessment ? SEVERITY_STYLES[assessment.suggestedSeverity] : null;

  return (
    <div className="space-y-2">
      {!expanded && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!description.trim() || loading}
          onClick={() => void handleAssess()}
        >
          <Icon name="tabler:sparkles" className="h-3.5 w-3.5 text-primary" />
          {tr("AI Assess Risk", "تقييم المخاطرة بالذكاء الاصطناعي")}
        </Button>
      )}

      {expanded && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15">
                <Icon name="tabler:sparkles" className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {tr("AI Risk Assessment", "تقييم المخاطرة بالذكاء الاصطناعي")}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setExpanded(false)}
            >
              <Icon name="tabler:x" className="h-3.5 w-3.5" />
            </Button>
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="tabler:loader-2" className="h-4 w-4 animate-spin text-primary" />
                {tr("Assessing risk…", "جارٍ تقييم المخاطرة…")}
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn("h-3 rounded bg-muted/60 animate-pulse", i === 1 ? "w-2/3" : i === 2 ? "w-full" : "w-1/2")} />
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-destructive flex-1">
                {tr("Assessment failed.", "فشل التقييم.")}
              </p>
              <Button type="button" size="sm" variant="ghost" onClick={() => void handleAssess()}>
                {tr("Retry", "إعادة المحاولة")}
              </Button>
            </div>
          )}

          {assessment && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-background/60 px-3 py-2.5 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {tr("Severity", "الخطورة")}
                  </p>
                  <Badge variant="outline" className={cn("text-xs font-semibold", severityStyle?.badge)}>
                    {isArabic
                      ? SEVERITY_STYLES[assessment.suggestedSeverity]?.label.ar
                      : SEVERITY_STYLES[assessment.suggestedSeverity]?.label.en}
                  </Badge>
                </div>

                <div className="rounded-xl border border-border bg-background/60 px-3 py-2.5 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {tr("Likelihood", "الاحتمالية")}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {isArabic
                      ? LIKELIHOOD_STYLES[assessment.likelihood]?.ar
                      : LIKELIHOOD_STYLES[assessment.likelihood]?.en}
                  </p>
                </div>

                <div className="col-span-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {tr("Assessment", "التقييم")}
                  </p>
                  <p
                    className={cn("text-xs text-foreground leading-relaxed", isArabic && "text-right")}
                    dir={isArabic ? "rtl" : "ltr"}
                  >
                    {assessment.reasoning}
                  </p>
                </div>
              </div>

              {assessment.mitigations.length > 0 && (
                <div className="rounded-xl border border-border bg-background/40 px-3 py-2.5 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {tr("Recommended Mitigations", "إجراءات التخفيف الموصى بها")}
                  </p>
                  <ol className={cn("space-y-1 text-xs text-foreground", isArabic && "text-right")} dir={isArabic ? "rtl" : "ltr"}>
                    {assessment.mitigations.map((m, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 font-semibold text-primary mt-0.5">{i + 1}.</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {assessment.kpiImpacts.length > 0 && (
                <div className="rounded-xl border border-border bg-background/40 px-3 py-2.5 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {tr("Potential KPI Impact", "التأثير المحتمل على المؤشرات")}
                  </p>
                  <div className="space-y-1">
                    {assessment.kpiImpacts.map((ki, i) => (
                      <div key={i} className={cn("flex items-start gap-2 text-xs", isArabic && "flex-row-reverse text-right")}>
                        <Icon name="tabler:arrow-narrow-right" className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <span>
                          <strong className="text-foreground">{ki.title}</strong>
                          <span className="text-muted-foreground"> — {ki.impact}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {onApply && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-[10px] text-muted-foreground">
                    {tr("AI-generated — verify before saving", "مُولَّد بالذكاء الاصطناعي — تحقق قبل الحفظ")}
                  </p>
                  <Button type="button" size="sm" onClick={() => onApply(assessment)}>
                    <Icon name="tabler:check" className="me-2 h-3.5 w-3.5" />
                    {tr("Apply Severity", "تطبيق الخطورة")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
