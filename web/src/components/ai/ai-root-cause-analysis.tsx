"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";
import { AiMarkdown } from "./ai-markdown";

type Props = {
  entityId: string;
  entityTitle: string;
  entityTitleAr?: string | null;
  achievement: number;
  ragStatus: "RED" | "AMBER";
  unit?: string;
};

export function AiRootCauseAnalysis({
  entityId,
  entityTitle,
  entityTitleAr,
  achievement,
  ragStatus,
  unit = "",
}: Props) {
  const { tr, isArabic } = useLocale();
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    setAnalysis(null);
    setError(false);

    try {
      const res = await fetch("/api/ai/root-cause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId, locale: isArabic ? "ar" : "en" }),
      });

      if (!res.ok) throw new Error("ai_error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      setAnalysis("");
      setLoading(false);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setAnalysis((prev) => (prev ?? "") + decoder.decode(value));
        }
      }
    } catch {
      setLoading(false);
      setError(true);
    }
  }

  function handleOpen(val: boolean) {
    setOpen(val);
    if (val && !analysis && !loading) {
      void handleAnalyze();
    }
    if (!val) {
      setAnalysis(null);
      setError(false);
    }
  }

  const statusColor = ragStatus === "RED"
    ? "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400"
    : "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400";

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 border",
            ragStatus === "RED"
              ? "border-red-500/40 text-red-600 hover:bg-red-500/5 dark:text-red-400"
              : "border-amber-500/40 text-amber-600 hover:bg-amber-500/5 dark:text-amber-400",
          )}
        >
          <Icon name="tabler:sparkles" className="h-3.5 w-3.5" />
          {tr("Why?", "لماذا؟")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="tabler:sparkles" className="h-5 w-5 text-primary" />
            {tr("Root Cause Analysis", "تحليل السبب الجذري")}
          </DialogTitle>
          <DialogDescription>
            <span className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", statusColor)}>
                {ragStatus === "RED" ? "🔴" : "🟡"} {isArabic ? entityTitleAr ?? entityTitle : entityTitle}
              </span>
              <span className="text-muted-foreground text-xs">
                {tr("Achievement:", "الإنجاز:")} {achievement}%{unit ? ` ${unit}` : ""}
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="tabler:loader-2" className="h-4 w-4 animate-spin text-primary" />
                {tr("Analyzing performance data, risks, and projects…", "جارٍ تحليل بيانات الأداء والمخاطر والمشاريع…")}
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn("h-4 rounded bg-muted/50 animate-pulse", i === 1 ? "w-3/4" : i === 2 ? "w-full" : "w-2/3")} />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 space-y-3">
              <p className="text-sm text-destructive">
                {tr("Analysis failed. Please try again.", "فشل التحليل. يرجى المحاولة مرة أخرى.")}
              </p>
              <Button size="sm" variant="outline" onClick={() => void handleAnalyze()}>
                <Icon name="tabler:refresh" className="me-2 h-4 w-4" />
                {tr("Retry", "إعادة المحاولة")}
              </Button>
            </div>
          )}

          {analysis !== null && (
            <div className="space-y-3">
              <div
                className={cn(
                  "rounded-xl border border-border bg-muted/20 px-4 py-4",
                  isArabic && "text-right",
                )}
                dir={isArabic ? "rtl" : "ltr"}
              >
                {analysis ? (
                  <AiMarkdown content={analysis} dir={isArabic ? "rtl" : "ltr"} />
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>

              {analysis && (
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Icon name="tabler:info-circle" className="h-3 w-3" />
                    {tr("AI-generated — verify with source data", "مُولَّد بالذكاء الاصطناعي — تحقق من البيانات المصدر")}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => { setAnalysis(null); void handleAnalyze(); }}
                  >
                    <Icon name="tabler:refresh" className="h-3 w-3" />
                    {tr("Reanalyze", "إعادة التحليل")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
