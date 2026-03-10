"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";

type Result = {
  comment: string;
  commentAr?: string;
};

type Props = {
  entityTitle: string;
  submittedValue: number;
  historicalAvg: number;
  unit?: string;
  managerNote?: string | null;
  onAccept: (comment: string) => void;
};

export function AiRejectionComment({
  entityTitle,
  submittedValue,
  historicalAvg,
  unit = "",
  managerNote,
  onAccept,
}: Props) {
  const { tr, isArabic, formatNumber } = useLocale();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedComment, setEditedComment] = useState("");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  async function handleGenerate() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/rejection-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityTitle,
          submittedValue,
          historicalAvg,
          unit,
          managerNote,
          locale: isArabic ? "ar" : "en",
        }),
      });

      if (!res.ok) throw new Error("ai_error");
      const data = (await res.json()) as Result;
      setResult(data);
      setEditedComment(isArabic && data.commentAr ? data.commentAr : data.comment);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    onAccept(editing ? editedComment : (isArabic && result?.commentAr ? result.commentAr : (result?.comment ?? "")));
    setDismissed(true);
  }

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon name="tabler:sparkles" className="h-3.5 w-3.5 text-primary shrink-0" />
        <p className="text-xs font-medium text-foreground">
          {tr("AI-Suggested Rejection Comment", "تعليق رفض مقترح بالذكاء الاصطناعي")}
        </p>
      </div>

      <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground flex flex-wrap gap-3">
        <span>
          {tr("Submitted:", "المُرسَل:")} <strong className="text-foreground">{formatNumber(submittedValue)}{unit}</strong>
        </span>
        <span>
          {tr("Historical avg:", "المتوسط التاريخي:")} <strong className="text-foreground">{formatNumber(historicalAvg)}{unit}</strong>
        </span>
      </div>

      {!result && !loading && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs"
          onClick={() => void handleGenerate()}
        >
          <Icon name="tabler:sparkles" className="h-3 w-3 text-primary" />
          {tr("Suggest comment", "اقتراح تعليق")}
        </Button>
      )}

      {loading && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="tabler:loader-2" className="h-3.5 w-3.5 animate-spin" />
          {tr("Generating comment…", "جارٍ توليد التعليق…")}
        </div>
      )}

      {result && !editing && (
        <div className="space-y-2">
          <p
            className={cn(
              "text-sm text-foreground leading-relaxed rounded-xl border border-border bg-background/60 px-3 py-2",
              isArabic && "text-right",
            )}
            dir={isArabic ? "rtl" : "ltr"}
          >
            {isArabic && result.commentAr ? result.commentAr : result.comment}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleAccept}
            >
              <Icon name="tabler:check" className="me-1.5 h-3 w-3" />
              {tr("Use this", "استخدام هذا")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs"
              onClick={() => {
                setEditing(true);
                setEditedComment(isArabic && result.commentAr ? result.commentAr : result.comment);
              }}
            >
              <Icon name="tabler:pencil" className="me-1.5 h-3 w-3" />
              {tr("Edit", "تعديل")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => { setResult(null); void handleGenerate(); }}
            >
              <Icon name="tabler:refresh" className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <div className="space-y-2">
          <Textarea
            value={editedComment}
            onChange={(e) => setEditedComment(e.target.value)}
            rows={3}
            dir={isArabic ? "rtl" : "ltr"}
            className="bg-card resize-none text-sm"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleAccept}
              disabled={!editedComment.trim()}
            >
              <Icon name="tabler:check" className="me-1.5 h-3 w-3" />
              {tr("Use edited", "استخدام المُعدَّل")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => setEditing(false)}
            >
              {tr("Cancel", "إلغاء")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
