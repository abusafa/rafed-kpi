"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";

type SuggestedKpi = {
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  unit: string;
  unitAr?: string;
  direction: "increase" | "decrease" | "maintain";
  period: string;
  targetSuggestion: string;
  rationale?: string;
};

type Props = {
  entityTypeCode?: string;
  onAccept: (kpis: SuggestedKpi[]) => void;
};

const DIRECTION_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  increase: { en: "Higher is better", ar: "الأعلى أفضل", color: "text-emerald-600 dark:text-emerald-400" },
  decrease: { en: "Lower is better", ar: "الأقل أفضل", color: "text-blue-600 dark:text-blue-400" },
  maintain: { en: "Stay on target", ar: "الحفاظ على المستهدف", color: "text-amber-600 dark:text-amber-400" },
};

export function AiKpiWizard({ entityTypeCode, onAccept }: Props) {
  const { t, tr, isArabic } = useLocale();
  const [open, setOpen] = useState(false);
  const [objective, setObjective] = useState("");
  const [sector, setSector] = useState<string>("general");
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedKpi[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState(false);
  const [expandedRationale, setExpandedRationale] = useState<number | null>(null);

  async function handleGenerate() {
    if (!objective.trim()) return;
    setGenerating(true);
    setSuggestions(null);
    setSelected(new Set());
    setError(false);

    try {
      const res = await fetch("/api/ai/kpi-wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: objective.trim(), sector, entityTypeCode }),
      });

      if (!res.ok) throw new Error("ai_error");
      const data = (await res.json()) as { kpis: SuggestedKpi[] };
      setSuggestions(data.kpis);
      setSelected(new Set(data.kpis.map((_, i) => i)));
    } catch {
      setError(true);
    } finally {
      setGenerating(false);
    }
  }

  function handleAccept() {
    if (!suggestions) return;
    const accepted = suggestions.filter((_, i) => selected.has(i));
    onAccept(accepted);
    setOpen(false);
    handleReset();
  }

  function handleReset() {
    setObjective("");
    setSuggestions(null);
    setSelected(new Set());
    setError(false);
    setExpandedRationale(null);
  }

  function toggleSelect(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) handleReset(); }}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Icon name="tabler:sparkles" className="h-4 w-4 text-primary" />
          {t("aiUseWizard")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="tabler:sparkles" className="h-5 w-5 text-primary" />
            {t("aiKpiWizard")}
          </DialogTitle>
          <DialogDescription>{t("aiKpiWizardSubtitle")}</DialogDescription>
        </DialogHeader>

        {!suggestions ? (
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label>{tr("Strategic objective or goal", "الهدف الاستراتيجي")}</Label>
              <Textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder={t("aiKpiWizardPlaceholder")}
                rows={3}
                dir={isArabic ? "rtl" : "ltr"}
                className="bg-card resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>{tr("Sector / Industry", "القطاع / الصناعة")}</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{tr("General", "عام")}</SelectItem>
                  <SelectItem value="government">{tr("Government / Public Sector", "الحكومة / القطاع العام")}</SelectItem>
                  <SelectItem value="healthcare">{tr("Healthcare", "الرعاية الصحية")}</SelectItem>
                  <SelectItem value="education">{tr("Education", "التعليم")}</SelectItem>
                  <SelectItem value="finance">{tr("Financial Services", "الخدمات المالية")}</SelectItem>
                  <SelectItem value="realestate">{tr("Real Estate", "العقارات")}</SelectItem>
                  <SelectItem value="retail">{tr("Retail / FMCG", "التجزئة / السلع الاستهلاكية")}</SelectItem>
                  <SelectItem value="technology">{tr("Technology", "التكنولوجيا")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {tr("Failed to generate suggestions. Please try again.", "فشل توليد الاقتراحات. يرجى المحاولة مرة أخرى.")}
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => void handleGenerate()}
              disabled={!objective.trim() || generating}
            >
              {generating ? (
                <>
                  <Icon name="tabler:loader-2" className="me-2 h-4 w-4 animate-spin" />
                  {t("aiKpiWizardGenerating")}
                </>
              ) : (
                <>
                  <Icon name="tabler:sparkles" className="me-2 h-4 w-4" />
                  {t("aiKpiWizardGenerate")}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tr(
                  `${suggestions.length} KPIs suggested — select which to create`,
                  `تم اقتراح ${suggestions.length} مؤشرات — اختر ما تريد إنشاءه`,
                )}
              </p>
              <Badge variant="outline" className="text-primary border-primary/30">
                {selected.size} {tr("selected", "محدد")}
              </Badge>
            </div>

            <div className="space-y-3">
              {suggestions.map((kpi, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-xl border p-4 space-y-3 transition-colors cursor-pointer",
                    selected.has(idx)
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-muted/20 opacity-60",
                  )}
                  onClick={() => toggleSelect(idx)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.has(idx)}
                      onCheckedChange={() => toggleSelect(idx)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{kpi.title}</p>
                        {kpi.titleAr && (
                          <p className="text-sm text-muted-foreground" dir="rtl">{kpi.titleAr}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                          {kpi.unit}
                        </span>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                          {kpi.period}
                        </span>
                        <span className={cn("font-medium", DIRECTION_LABELS[kpi.direction]?.color)}>
                          {isArabic
                            ? DIRECTION_LABELS[kpi.direction]?.ar
                            : DIRECTION_LABELS[kpi.direction]?.en}
                        </span>
                        {kpi.targetSuggestion && (
                          <span className="text-muted-foreground">
                            {tr("Target:", "المستهدف:")} {kpi.targetSuggestion}
                          </span>
                        )}
                      </div>

                      {kpi.rationale && (
                        <div className="pt-1">
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRationale(expandedRationale === idx ? null : idx);
                            }}
                          >
                            <Icon name="tabler:info-circle" className="h-3 w-3" />
                            {t("aiKpiWizardWhyThis")}
                          </button>
                          {expandedRationale === idx && (
                            <p
                              className={cn(
                                "mt-1.5 text-xs text-muted-foreground leading-relaxed",
                                isArabic && "text-right",
                              )}
                              dir={isArabic ? "rtl" : "ltr"}
                            >
                              {kpi.rationale}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                <Icon name="tabler:refresh" className="me-2 h-4 w-4" />
                {t("aiKpiWizardStartOver")}
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={selected.size === 0}
                onClick={handleAccept}
              >
                <Icon name="tabler:check" className="me-2 h-4 w-4" />
                {selected.size === suggestions.length
                  ? t("aiKpiWizardAccept")
                  : `${t("aiKpiWizardAcceptSelected")} (${selected.size})`}
              </Button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground">
              {tr("AI-generated — review all fields before creating KPIs", "مُولَّد بالذكاء الاصطناعي — راجع جميع الحقول قبل الإنشاء")}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
