"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";
import { AiMarkdown } from "./ai-markdown";

type Props = {
  dashboardType: string;
  context: Record<string, unknown>;
  className?: string;
};

export function AiDashboardInsightCard({ dashboardType, context, className }: Props) {
  const { tr, isArabic } = useLocale();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  async function handleGenerate() {
    setLoading(true);
    setInsight(null);
    setError(false);

    try {
      const res = await fetch("/api/ai/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardType, context }),
      });

      if (!res.ok) throw new Error("ai_error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      setInsight("");
      setLoading(false);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setInsight((prev) => (prev ?? "") + decoder.decode(value));
        }
      }
    } catch {
      setLoading(false);
      setError(true);
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Icon name="tabler:sparkles" className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {tr("AI Insight", "تحليل ذكي")}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tr("AI-generated — verify before sharing", "مُولَّد بالذكاء الاصطناعي")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {insight && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground"
              title={tr("Regenerate", "إعادة التوليد")}
              onClick={() => { setInsight(null); setError(false); }}
            >
              <Icon name="tabler:refresh" className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setDismissed(true)}
            aria-label={tr("Dismiss", "إغلاق")}
          >
            <Icon name="tabler:x" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!insight && !loading && !error && (
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => void handleGenerate()}
        >
          <Icon name="tabler:sparkles" className="h-3.5 w-3.5 text-primary" />
          {tr("Generate Insight", "توليد تحليل")}
        </Button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </span>
          {tr("Generating insight…", "جارٍ توليد التحليل…")}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-destructive flex-1">
            {tr("Failed to generate insight.", "تعذّر توليد التحليل.")}
          </p>
          <Button size="sm" variant="ghost" onClick={() => void handleGenerate()}>
            {tr("Retry", "إعادة المحاولة")}
          </Button>
        </div>
      )}

      {insight && (
        <AiMarkdown
          content={insight}
          dir={isArabic ? "rtl" : "ltr"}
          className={cn(isArabic && "text-right")}
        />
      )}
    </div>
  );
}
