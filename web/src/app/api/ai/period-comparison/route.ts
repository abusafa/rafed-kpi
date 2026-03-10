import { NextRequest } from "next/server";
import { aiDisabledResponse, isAiEnabled, streamResponse } from "../_mock-stream";

const PERIOD_LABELS: Record<string, { en: string; ar: string }> = {
  ytd: { en: "Year-to-Date", ar: "من بداية العام" },
  q1: { en: "Q1", ar: "الربع الأول" },
  q2: { en: "Q2", ar: "الربع الثاني" },
  q3: { en: "Q3", ar: "الربع الثالث" },
  q4: { en: "Q4", ar: "الربع الرابع" },
  m1: { en: "January", ar: "يناير" }, m2: { en: "February", ar: "فبراير" },
  m3: { en: "March", ar: "مارس" }, m4: { en: "April", ar: "أبريل" },
  m5: { en: "May", ar: "مايو" }, m6: { en: "June", ar: "يونيو" },
  m7: { en: "July", ar: "يوليو" }, m8: { en: "August", ar: "أغسطس" },
  m9: { en: "September", ar: "سبتمبر" }, m10: { en: "October", ar: "أكتوبر" },
  m11: { en: "November", ar: "نوفمبر" }, m12: { en: "December", ar: "ديسمبر" },
};

function buildComparison(pA: string, pB: string, lang: "en" | "ar"): string {
  const labelA = (PERIOD_LABELS[pA] ?? { en: pA, ar: pA })[lang];
  const labelB = (PERIOD_LABELS[pB] ?? { en: pB, ar: pB })[lang];

  if (lang === "ar") {
    return `## مقارنة الأداء: ${labelA} مقابل ${labelB}

### الصحة الإجمالية
ارتفع مؤشر الصحة الإجمالية من **64%** في ${labelA} إلى **72%** في ${labelB} — تحسن بمقدار +8 نقاط مئوية.

### المؤشرات التي تحسّنت (12 مؤشراً) ✅
- **نمو الإيرادات:** من 67% إلى 91% (+24 نقطة) — أبرز تحسّن
- **كسب العملاء:** من 38% إلى 55% (+17 نقطة)
- **معدل الإنجاز الرقمي:** من 72% إلى 83% (+11 نقطة)
- **التزام التقارير:** من 81% إلى 89% (+8 نقاط)
- **كفاءة العمليات:** من 74% إلى 80% (+6 نقاط)

### المؤشرات التي تراجعت (5 مؤشرات) 🔴
- **معدل الاحتفاظ بالموظفين:** من 52% إلى 41% (-11 نقطة) — الأكثر إثارة للقلق
- **كفاءة التكلفة:** من 82% إلى 78% (-4 نقاط)
- **معدل إكمال التدريب:** من 68% إلى 65% (-3 نقاط)

### المؤشرات الثابتة (3 مؤشرات) ➡️
- **معدل الامتثال:** ثابت عند 94%
- **نسبة حل الشكاوى:** ثابتة عند 87%

### الاستنتاج الرئيسي
تحسّنت مؤشرات النمو المالي والرقمي بشكل ملحوظ، في حين تراجعت مؤشرات الأفراد والثقافة. يشير هذا إلى وجود مفاضلات في تخصيص الموارد — يبدو أن التركيز على النمو جاء على حساب برامج الاحتفاظ بالموظفين. ينبغي معالجة هذا الخلل قبل نهاية الربع القادم.`;
  }

  return `## Performance Comparison: ${labelA} → ${labelB}

### Overall Health
Overall health score improved from **64%** in ${labelA} to **72%** in ${labelB} — a +8pp improvement.

### Improved KPIs (12 KPIs) ✅
- **Revenue Growth:** 67% → 91% (+24pp) — strongest improvement
- **Customer Acquisition:** 38% → 55% (+17pp)
- **Digital Completion Rate:** 72% → 83% (+11pp)
- **Reporting Compliance:** 81% → 89% (+8pp)
- **Operational Efficiency:** 74% → 80% (+6pp)

### Declined KPIs (5 KPIs) 🔴
- **Employee Retention Rate:** 52% → 41% (-11pp) — most concerning
- **Cost Efficiency:** 82% → 78% (-4pp)
- **Training Completion Rate:** 68% → 65% (-3pp)

### Unchanged KPIs (3 KPIs) ➡️
- **Compliance Rate:** stable at 94%
- **Complaint Resolution Rate:** stable at 87%

### Key Insight
Growth-oriented and digital KPIs improved significantly while People & Culture KPIs declined. This pattern suggests resource allocation trade-offs — the push for growth may be consuming capacity at the expense of retention programs. This imbalance should be addressed before the next period close to prevent further HR attrition.`;
}

export async function POST(req: NextRequest) {
  if (!isAiEnabled()) return aiDisabledResponse();

  const { periodA = "q1", periodB = "q2", lang = "en" } =
    (await req.json()) as { periodA?: string; periodB?: string; lang?: "en" | "ar" };

  const text = buildComparison(periodA, periodB, lang);
  return streamResponse(text);
}
