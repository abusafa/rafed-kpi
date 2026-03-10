"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type Period = "ytd" | "q1" | "q2" | "q3" | "q4" | "m1" | "m2" | "m3" | "m4" | "m5" | "m6" | "m7" | "m8" | "m9" | "m10" | "m11" | "m12";

const PERIOD_LABELS: Record<Period, { en: string; ar: string }> = {
  ytd: { en: "Current YTD", ar: "من بداية العام" },
  q1: { en: "Q1", ar: "الربع الأول" },
  q2: { en: "Q2", ar: "الربع الثاني" },
  q3: { en: "Q3", ar: "الربع الثالث" },
  q4: { en: "Q4", ar: "الربع الرابع" },
  m1: { en: "January", ar: "يناير" },
  m2: { en: "February", ar: "فبراير" },
  m3: { en: "March", ar: "مارس" },
  m4: { en: "April", ar: "أبريل" },
  m5: { en: "May", ar: "مايو" },
  m6: { en: "June", ar: "يونيو" },
  m7: { en: "July", ar: "يوليو" },
  m8: { en: "August", ar: "أغسطس" },
  m9: { en: "September", ar: "سبتمبر" },
  m10: { en: "October", ar: "أكتوبر" },
  m11: { en: "November", ar: "نوفمبر" },
  m12: { en: "December", ar: "ديسمبر" },
};

type Props = {
  defaultPeriodA?: Period;
  defaultPeriodB?: Period;
};

export function AiPeriodComparison({ defaultPeriodA = "q1", defaultPeriodB = "q2" }: Props) {
  const { tr, isArabic } = useLocale();
  const [open, setOpen] = useState(false);
  const [periodA, setPeriodA] = useState<Period>(defaultPeriodA);
  const [periodB, setPeriodB] = useState<Period>(defaultPeriodB);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [comparison, setComparison] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const periodLabel = (p: Period) =>
    isArabic ? PERIOD_LABELS[p]?.ar ?? p : PERIOD_LABELS[p]?.en ?? p;

  async function handleGenerate() {
    setGenerating(true);
    setComparison(null);
    setError(false);

    try {
      const res = await fetch("/api/ai/period-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodA, periodB, lang }),
      });

      if (!res.ok) throw new Error("ai_error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      setComparison("");
      setGenerating(false);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setComparison((prev) => (prev ?? "") + decoder.decode(value));
        }
      }
    } catch {
      setGenerating(false);
      setError(true);
    }
  }

  async function handleCopy() {
    if (!comparison) return;
    try {
      await navigator.clipboard.writeText(comparison);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setComparison(null);
      setGenerating(false);
      setError(false);
      setCopied(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Icon name="tabler:sparkles" className="h-4 w-4 text-primary" />
          {tr("Compare Periods", "مقارنة الفترات")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="tabler:sparkles" className="h-5 w-5 text-primary" />
            {tr("AI Period Comparison", "مقارنة الفترات بالذكاء الاصطناعي")}
          </DialogTitle>
          <DialogDescription>
            {tr(
              "Compare KPI performance across two periods with AI-generated insights",
              "قارن أداء المؤشرات عبر فترتين باستخدام تحليلات الذكاء الاصطناعي",
            )}
          </DialogDescription>
        </DialogHeader>

        {!comparison ? (
          <div className="space-y-5 pt-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{tr("Period A (baseline)", "الفترة أ (الأساس)")}</Label>
                <Select value={periodA} onValueChange={(v) => setPeriodA(v as Period)}>
                  <SelectTrigger className="bg-card">
                    <SelectValue>{periodLabel(periodA)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(["ytd", "q1", "q2", "q3", "q4"] as Period[]).map((p) => (
                      <SelectItem key={p} value={p}>{periodLabel(p)}</SelectItem>
                    ))}
                    {(["m1","m2","m3","m4","m5","m6","m7","m8","m9","m10","m11","m12"] as Period[]).map((p) => (
                      <SelectItem key={p} value={p}>{periodLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{tr("Period B (compare)", "الفترة ب (المقارنة)")}</Label>
                <Select value={periodB} onValueChange={(v) => setPeriodB(v as Period)}>
                  <SelectTrigger className="bg-card">
                    <SelectValue>{periodLabel(periodB)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(["ytd", "q1", "q2", "q3", "q4"] as Period[]).map((p) => (
                      <SelectItem key={p} value={p}>{periodLabel(p)}</SelectItem>
                    ))}
                    {(["m1","m2","m3","m4","m5","m6","m7","m8","m9","m10","m11","m12"] as Period[]).map((p) => (
                      <SelectItem key={p} value={p}>{periodLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{tr("Output language", "لغة المخرجات")}</Label>
                <Select value={lang} onValueChange={(v) => setLang(v as "en" | "ar")}>
                  <SelectTrigger className="bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">
                {tr("Failed to generate comparison. Please try again.", "فشل توليد المقارنة. يرجى المحاولة مرة أخرى.")}
              </p>
            )}

            <Button
              className="w-full"
              onClick={() => void handleGenerate()}
              disabled={generating || periodA === periodB}
            >
              {generating ? (
                <>
                  <Icon name="tabler:loader-2" className="me-2 h-4 w-4 animate-spin" />
                  {tr("Comparing…", "جارٍ المقارنة…")}
                </>
              ) : (
                <>
                  <Icon name="tabler:sparkles" className="me-2 h-4 w-4" />
                  {tr("Compare", "مقارنة")}
                </>
              )}
            </Button>

            {periodA === periodB && (
              <p className="text-center text-xs text-muted-foreground">
                {tr("Select two different periods to compare.", "اختر فترتين مختلفتين للمقارنة.")}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 font-medium text-foreground">
                {periodLabel(periodA)}
              </span>
              <Icon name="tabler:arrow-narrow-right" className="h-4 w-4" />
              <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 font-medium text-foreground">
                {periodLabel(periodB)}
              </span>
            </div>

            <div
              className={cn(
                "max-h-[380px] overflow-y-auto rounded-xl border border-border bg-muted/20 p-4",
                lang === "ar" ? "text-right" : "text-left",
              )}
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              <AiMarkdown content={comparison} dir={lang === "ar" ? "rtl" : "ltr"} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Icon name="tabler:info-circle" className="h-3.5 w-3.5 shrink-0" />
                {tr("AI-generated — verify before sharing", "مُولَّد بالذكاء الاصطناعي")}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setComparison(null)}>
                  <Icon name="tabler:refresh" className="me-2 h-4 w-4" />
                  {tr("Redo", "إعادة")}
                </Button>
                <Button size="sm" onClick={() => void handleCopy()}>
                  <Icon name={copied ? "tabler:check" : "tabler:copy"} className="me-2 h-4 w-4" />
                  {copied ? tr("Copied!", "تم النسخ!") : tr("Copy", "نسخ")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
