"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

type BriefType = "board" | "department" | "project" | "manager-1on1";

type Props = {
  defaultBriefType?: BriefType;
};

const BRIEF_TYPES: Record<BriefType, { en: string; ar: string; icon: string; desc: { en: string; ar: string } }> = {
  board: {
    en: "Board Meeting",
    ar: "اجتماع مجلس الإدارة",
    icon: "tabler:building-community",
    desc: { en: "Full org — strategic KPI overview", ar: "الجهة بأكملها — مؤشرات استراتيجية" },
  },
  department: {
    en: "Department Review",
    ar: "مراجعة الإدارة",
    icon: "tabler:building",
    desc: { en: "One department's KPIs and performance", ar: "مؤشرات إدارة واحدة وأدائها" },
  },
  project: {
    en: "Project Review",
    ar: "مراجعة المشروع",
    icon: "tabler:timeline",
    desc: { en: "Project milestones, risks, and linked KPIs", ar: "معالم المشروع والمخاطر والمؤشرات" },
  },
  "manager-1on1": {
    en: "Manager 1:1",
    ar: "اجتماع فردي مع مدير",
    icon: "tabler:user",
    desc: { en: "One manager's assigned KPIs and submissions", ar: "مؤشرات مدير واحد وتقديماته" },
  },
};

export function AiMeetingBrief({ defaultBriefType = "board" }: Props) {
  const { tr, isArabic } = useLocale();
  const [open, setOpen] = useState(false);
  const [briefType, setBriefType] = useState<BriefType>(defaultBriefType);
  const [contextInput, setContextInput] = useState("");
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [brief, setBrief] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setBrief(null);
    setError(false);

    try {
      const res = await fetch("/api/ai/meeting-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefType, contextInput: contextInput.trim() || undefined, lang }),
      });

      if (!res.ok) throw new Error("ai_error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      setBrief("");
      setGenerating(false);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setBrief((prev) => (prev ?? "") + decoder.decode(value));
        }
      }
    } catch {
      setGenerating(false);
      setError(true);
    }
  }

  async function handleCopy() {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setBrief(null);
      setGenerating(false);
      setError(false);
      setCopied(false);
    }
  }

  const currentType = BRIEF_TYPES[briefType];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Icon name="tabler:sparkles" className="h-4 w-4 text-primary" />
          {tr("Meeting Brief", "ملخص الاجتماع")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="tabler:sparkles" className="h-5 w-5 text-primary" />
            {tr("AI Meeting Preparation Brief", "ملخص تحضير الاجتماع بالذكاء الاصطناعي")}
          </DialogTitle>
          <DialogDescription>
            {tr(
              "Generate a 2-minute pre-meeting KPI brief with talking points and key questions",
              "توليد ملخص موجز للمؤشرات قبل الاجتماع مع نقاط النقاش والأسئلة الرئيسية",
            )}
          </DialogDescription>
        </DialogHeader>

        {!brief ? (
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label>{tr("Meeting type", "نوع الاجتماع")}</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.entries(BRIEF_TYPES) as [BriefType, typeof BRIEF_TYPES[BriefType]][]).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBriefType(key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
                      briefType === key
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    <Icon name={val.icon} className="h-5 w-5" />
                    <span className="text-[10px] font-medium leading-tight">
                      {isArabic ? val.ar : val.en}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? currentType.desc.ar : currentType.desc.en}
              </p>
            </div>

            {(briefType === "department" || briefType === "project" || briefType === "manager-1on1") && (
              <div className="space-y-2">
                <Label>
                  {briefType === "department" && tr("Department name (optional)", "اسم الإدارة (اختياري)")}
                  {briefType === "project" && tr("Project name (optional)", "اسم المشروع (اختياري)")}
                  {briefType === "manager-1on1" && tr("Manager name (optional)", "اسم المدير (اختياري)")}
                </Label>
                <Input
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                  placeholder={tr("Leave blank to use all available data", "اتركه فارغاً لاستخدام جميع البيانات المتاحة")}
                  className="bg-card"
                  dir={isArabic ? "rtl" : "ltr"}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{tr("Brief language", "لغة الملخص")}</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as "en" | "ar")}>
                <SelectTrigger className="bg-card w-36">
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
                {tr("Failed to generate brief. Please try again.", "فشل توليد الملخص. يرجى المحاولة مرة أخرى.")}
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
                  {tr("Preparing brief…", "جارٍ تحضير الملخص…")}
                </>
              ) : (
                <>
                  <Icon name="tabler:sparkles" className="me-2 h-4 w-4" />
                  {tr("Prepare Brief", "تحضير الملخص")}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name={currentType.icon} className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-foreground">
                {isArabic ? currentType.ar : currentType.en}
              </span>
              {contextInput && (
                <>
                  <span>·</span>
                  <span>{contextInput}</span>
                </>
              )}
            </div>

            <div
              className={cn(
                "max-h-[380px] overflow-y-auto rounded-xl border border-border bg-muted/20 p-4",
                lang === "ar" ? "text-right" : "text-left",
              )}
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              <AiMarkdown content={brief} dir={lang === "ar" ? "rtl" : "ltr"} />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Icon name="tabler:info-circle" className="h-3.5 w-3.5 shrink-0" />
                {tr("AI-generated — verify figures before the meeting", "مُولَّد بالذكاء الاصطناعي — تحقق من الأرقام قبل الاجتماع")}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setBrief(null)}>
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
