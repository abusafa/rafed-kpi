"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";
import { AiMarkdown } from "./ai-markdown";

type Props = {
  projectId: string;
  projectTitle: string;
  milestonesTotal?: number;
  milestonesComplete?: number;
  milestonesBlocked?: number;
  risksCount?: number;
  linkedKpisCount?: number;
  daysRemaining?: number | null;
  autoLoad?: boolean;
};

export function AiProjectHealthNarrator({
  projectId,
  projectTitle,
  milestonesTotal = 0,
  milestonesComplete = 0,
  milestonesBlocked = 0,
  risksCount = 0,
  linkedKpisCount = 0,
  daysRemaining,
  autoLoad = false,
}: Props) {
  const { tr, isArabic } = useLocale();
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (autoLoad) void handleGenerate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, projectId]);

  if (dismissed) return null;

  async function handleGenerate() {
    setLoading(true);
    setNarrative(null);
    setError(false);

    try {
      const res = await fetch("/api/ai/project-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          projectTitle,
          milestonesTotal,
          milestonesComplete,
          milestonesBlocked,
          risksCount,
          linkedKpisCount,
          daysRemaining,
          locale: isArabic ? "ar" : "en",
        }),
      });

      if (!res.ok) throw new Error("ai_error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      setNarrative("");
      setLoading(false);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setNarrative((prev) => (prev ?? "") + decoder.decode(value));
        }
      }
    } catch {
      setLoading(false);
      setError(true);
    }
  }

  const completionPct = milestonesTotal > 0
    ? Math.round((milestonesComplete / milestonesTotal) * 100)
    : null;

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Icon name="tabler:sparkles" className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {tr("AI Health Summary", "ملخص الصحة بالذكاء الاصطناعي")}
            </p>
            <p className="text-[10px] text-muted-foreground">{projectTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {narrative && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => { setNarrative(null); void handleGenerate(); }}
              title={tr("Regenerate", "إعادة التوليد")}
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

      <div className="flex flex-wrap gap-3 text-xs">
        {completionPct !== null && (
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background/60 px-2.5 py-1.5">
            <Icon name="tabler:circle-check" className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="text-muted-foreground">{tr("Milestones:", "المعالم:")}</span>
            <span className="font-semibold text-foreground">{milestonesComplete}/{milestonesTotal} ({completionPct}%)</span>
          </div>
        )}
        {milestonesBlocked > 0 && (
          <div className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5">
            <Icon name="tabler:lock" className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-semibold text-amber-600 dark:text-amber-400">{milestonesBlocked} {tr("blocked", "محجوب")}</span>
          </div>
        )}
        {risksCount > 0 && (
          <div className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1.5">
            <Icon name="tabler:shield-exclamation" className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span className="font-semibold text-red-600 dark:text-red-400">{risksCount} {tr("risks", "مخاطر")}</span>
          </div>
        )}
        {daysRemaining != null && (
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background/60 px-2.5 py-1.5">
            <Icon name="tabler:calendar-due" className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{daysRemaining} {tr("days left", "يوم متبقٍ")}</span>
          </div>
        )}
      </div>

      {!narrative && !loading && !error && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => void handleGenerate()}
        >
          <Icon name="tabler:sparkles" className="h-3.5 w-3.5 text-primary" />
          {tr("Generate Health Summary", "توليد ملخص الصحة")}
        </Button>
      )}

      {loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="tabler:loader-2" className="h-4 w-4 animate-spin text-primary" />
            {tr("Analyzing project health…", "جارٍ تحليل صحة المشروع…")}
          </div>
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn("h-3 rounded bg-muted/50 animate-pulse", i === 1 ? "w-full" : i === 2 ? "w-4/5" : "w-2/3")} />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-destructive flex-1">
            {tr("Failed to generate summary.", "فشل توليد الملخص.")}
          </p>
          <Button type="button" size="sm" variant="ghost" onClick={() => void handleGenerate()}>
            {tr("Retry", "إعادة المحاولة")}
          </Button>
        </div>
      )}

      {narrative !== null && (
        <div dir={isArabic ? "rtl" : "ltr"}>
          {narrative ? (
            <AiMarkdown content={narrative} dir={isArabic ? "rtl" : "ltr"} className={cn(isArabic && "text-right")} />
          ) : (
            <span className="inline-flex items-center gap-0.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
            </span>
          )}
        </div>
      )}

      {narrative && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Icon name="tabler:info-circle" className="h-3 w-3" />
          {tr("AI-generated — verify with project data", "مُولَّد بالذكاء الاصطناعي — تحقق من بيانات المشروع")}
        </p>
      )}
    </div>
  );
}
