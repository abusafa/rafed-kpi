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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";
import { AiMarkdown } from "./ai-markdown";

type ReportSummary = {
  entityTypeName?: string;
  period?: string;
  totalKpis: number;
  green: number;
  amber: number;
  red: number;
  noData: number;
};

type Props = {
  summary: ReportSummary;
};

export function AiReportNarrator({ summary }: Props) {
  const { tr } = useLocale();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [narrative, setNarrative] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setNarrative(null);
    setError(false);

    try {
      const res = await fetch("/api/ai/report-narrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, lang }),
      });

      if (!res.ok) throw new Error("ai_error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      setNarrative("");
      setGenerating(false);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setNarrative((prev) => (prev ?? "") + decoder.decode(value));
        }
      }
    } catch {
      setGenerating(false);
      setError(true);
    }
  }

  async function handleCopy() {
    if (!narrative) return;
    try {
      await navigator.clipboard.writeText(narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setNarrative(null);
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
          {tr("AI Narrative", "سرد ذكي")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="tabler:sparkles" className="h-5 w-5 text-primary" />
            {tr("AI Report Narrative", "السرد الذكي للتقرير")}
          </DialogTitle>
          <DialogDescription>
            {tr(
              "Generate a plain-language narrative from the current report data",
              "توليد سرد نصي من بيانات التقرير الحالية",
            )}
          </DialogDescription>
        </DialogHeader>

        {!narrative ? (
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: tr("Total", "الإجمالي"), value: summary.totalKpis, color: "text-foreground" },
                { label: tr("Green", "أخضر"), value: summary.green, color: "text-emerald-600 dark:text-emerald-400" },
                { label: tr("Amber", "أصفر"), value: summary.amber, color: "text-amber-600 dark:text-amber-400" },
                { label: tr("Red", "أحمر"), value: summary.red, color: "text-red-600 dark:text-red-400" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 space-y-0.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>{tr("Narrative language", "لغة السرد")}</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as "en" | "ar")}>
                <SelectTrigger className="bg-card w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-destructive">
                {tr("Failed to generate narrative. Please try again.", "فشل توليد السرد. يرجى المحاولة مرة أخرى.")}
              </p>
            )}

            <Button
              className="w-full"
              onClick={() => void handleGenerate()}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Icon name="tabler:loader-2" className="me-2 h-4 w-4 animate-spin" />
                  {tr("Generating…", "جارٍ التوليد…")}
                </>
              ) : (
                <>
                  <Icon name="tabler:sparkles" className="me-2 h-4 w-4" />
                  {tr("Generate Narrative", "توليد السرد")}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div
              className={cn(
                "max-h-[360px] overflow-y-auto rounded-xl border border-border bg-muted/20 p-4",
                lang === "ar" ? "text-right" : "text-left",
              )}
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              <AiMarkdown content={narrative} dir={lang === "ar" ? "rtl" : "ltr"} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Icon name="tabler:info-circle" className="h-3.5 w-3.5 shrink-0" />
                {tr("AI-generated — verify before sharing", "مُولَّد بالذكاء الاصطناعي")}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNarrative(null)}
                >
                  <Icon name="tabler:refresh" className="me-2 h-4 w-4" />
                  {tr("Regenerate", "إعادة التوليد")}
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
