"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";

type Suggestion = {
  description: string;
  descriptionAr?: string;
};

type Props = {
  title: string;
  onAccept: (description: string, descriptionAr?: string) => void;
  className?: string;
};

export function AiAutoDescription({ title, onAccept, className }: Props) {
  const { tr, isArabic } = useLocale();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [lastTitle, setLastTitle] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!title?.trim() || title.trim().length < 4) {
      setSuggestion(null);
      setDismissed(false);
      return;
    }

    if (title === lastTitle) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      void fetchSuggestion(title.trim());
    }, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  async function fetchSuggestion(t: string) {
    setLoading(true);
    setSuggestion(null);
    setDismissed(false);
    setLastTitle(t);

    try {
      const res = await fetch("/api/ai/auto-describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });

      if (!res.ok) return;
      const data = (await res.json()) as Suggestion;
      setSuggestion(data);
    } catch {
      // silently fail — auto-description is optional
    } finally {
      setLoading(false);
    }
  }

  if (dismissed || (!loading && !suggestion)) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 space-y-2",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        {loading ? (
          <Icon name="tabler:loader-2" className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
        ) : (
          <Icon name="tabler:sparkles" className="h-3.5 w-3.5 text-primary shrink-0" />
        )}
        <p className="text-xs font-medium text-primary">
          {loading
            ? tr("AI is suggesting a description…", "يقترح الذكاء الاصطناعي وصفاً…")
            : tr("AI suggested description", "وصف مقترح بالذكاء الاصطناعي")}
        </p>
      </div>

      {suggestion && (
        <>
          <p
            className={cn("text-xs text-muted-foreground leading-relaxed", isArabic && "text-right")}
            dir="ltr"
          >
            {suggestion.description}
          </p>

          {suggestion.descriptionAr && (
            <p className="text-xs text-muted-foreground leading-relaxed text-right" dir="rtl">
              {suggestion.descriptionAr}
            </p>
          )}

          <div className="flex items-center gap-2 pt-0.5">
            <Button
              type="button"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => {
                onAccept(suggestion.description, suggestion.descriptionAr);
                setDismissed(true);
              }}
            >
              <Icon name="tabler:check" className="me-1.5 h-3 w-3" />
              {tr("Use suggestion", "استخدام الاقتراح")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setDismissed(true)}
            >
              {tr("Dismiss", "تجاهل")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
