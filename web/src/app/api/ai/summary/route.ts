import { NextRequest, NextResponse } from "next/server";
import { requireOrgMember } from "@/lib/server-action-auth";
import { getKpiContextForAiReport } from "@/actions/insights";
import { createMockStream } from "../_mock-stream";

const MOCK_FULL_EN = `## Q2 Performance Report — Rafed KPI Platform
### Reporting Period: Year-to-Date

**Overall Organizational Health: 72%** 🟢 (Improved from 64% in Q4)

---

### Executive Summary
The organization has delivered a strong recovery this quarter, with overall health improving 8 percentage points quarter-on-quarter. Financial and operational KPIs are performing well above target, while People & Culture metrics remain the primary concern requiring board-level attention.

### Performance by Pillar

**🟢 Growth Pillar — 88%** (Target: 80%)
Revenue Growth leads at 91%, driven by strong Q2 sales performance and new customer acquisition (83%). This pillar has exceeded its target for the second consecutive quarter.

**🟡 Operations Pillar — 74%** (Target: 80%)
Process Cycle Time improved significantly (88%), but Cost Efficiency has declined 4pp this quarter. Root cause investigation is underway.

**🔴 People & Culture Pillar — 48%** (Target: 75%)
Employee Retention is the critical concern at 41% — the lowest in 12 months. Training completion and engagement scores are also below target. Immediate HR intervention is required.

**🟢 Governance Pillar — 89%** (Target: 85%)
Compliance and reporting metrics are strong. Approval turnaround time has improved to an average of 3.2 days.

### Key Risks
- 4 CRITICAL risks open with no recorded mitigation actions
- 12 KPIs have no data submitted for the current period
- People & Culture decline may accelerate if Q3 retention programs are not activated

### Recommendations
1. **Immediate:** Activate HR retention program — allocate Q3 budget by end of next week
2. **This month:** Close or escalate all 4 CRITICAL risks pending action
3. **Ongoing:** Enforce data submission policy — 12 missing KPIs represent a governance risk

---
*AI-generated from approved KPI data — verify all figures before presenting to the board*`;

const MOCK_FULL_AR = `## تقرير الأداء للربع الثاني — منصة رافد للأداء
### فترة التقرير: من بداية العام

**الصحة الإجمالية للجهة: 72%** 🟢 (تحسّن من 64% في الربع الرابع)

---

### الملخص التنفيذي
حقق التنظيم تعافياً قوياً هذا الربع، مع تحسّن الصحة الإجمالية بمقدار 8 نقاط مئوية ربعاً بربع. تؤدي مؤشرات النمو المالي والتشغيلي أداءً جيداً فوق الهدف، في حين تبقى مؤشرات الأفراد والثقافة المخاوف الرئيسية التي تستدعي الاهتمام على مستوى الإدارة.

### الأداء حسب المحور

**🟢 محور النمو — 88%** (الهدف: 80%)
يتصدر مؤشر نمو الإيرادات بنسبة 91%، مدفوعاً بأداء مبيعات قوي في الربع الثاني وكسب عملاء جدد (83%).

**🟡 محور العمليات — 74%** (الهدف: 80%)
تحسّن وقت دورة العملية بشكل ملحوظ (88%)، لكن كفاءة التكلفة تراجعت 4 نقاط هذا الربع. جارٍ التحقيق في السبب الجذري.

**🔴 محور الأفراد والثقافة — 48%** (الهدف: 75%)
معدل الاحتفاظ بالموظفين هو المخاوف الحرجة عند 41% — الأدنى في 12 شهراً. تطوير المهارات ومؤشرات التفاعل دون الهدف أيضاً. يُلزم تدخل فوري من الموارد البشرية.

**🟢 محور الحوكمة — 89%** (الهدف: 85%)
مؤشرات الامتثال والإبلاغ قوية. تحسّن متوسط وقت الموافقة إلى 3.2 أيام.

### المخاطر الرئيسية
- 4 مخاطر حرجة مفتوحة دون إجراءات تخفيفية مسجَّلة
- 12 مؤشراً بلا بيانات مُقدَّمة للفترة الحالية
- قد يتسارع تراجع مؤشرات الأفراد إذا لم تُفعَّل برامج الاحتفاظ في الربع الثالث

### التوصيات
1. **فوري:** تفعيل برنامج الاحتفاظ بالموظفين — تخصيص ميزانية الربع الثالث بنهاية الأسبوع القادم
2. **هذا الشهر:** إغلاق أو تصعيد جميع المخاطر الحرجة الأربع المعلقة
3. **مستمر:** تطبيق سياسة إدخال البيانات — المؤشرات الـ 12 المفقودة تمثل مخاطرة حوكمية

---
*مُولَّد بالذكاء الاصطناعي من البيانات المعتمدة — تحقق من جميع الأرقام قبل عرضها على الإدارة*`;

const MOCK_DIGEST_EN = `## Weekly Performance Digest

🟢 **Health: 72%** (+8pp vs last quarter)

**Top 3 this week:**
- Revenue Growth: 91% ✅
- Governance Compliance: 98% ✅
- Project Completion Rate: 89% ✅

**Needs attention:**
- Employee Retention: 41% 🔴 — HR action required
- 12 KPIs missing data — chase owners
- 4 critical risks unaddressed

*AI-generated digest — verify before sharing*`;

const MOCK_DIGEST_AR = `## الملخص الأسبوعي للأداء

🟢 **الصحة: 72%** (+8 نقاط مقارنة بالربع الماضي)

**أبرز 3 مؤشرات هذا الأسبوع:**
- نمو الإيرادات: 91% ✅
- الامتثال الحوكمي: 98% ✅
- معدل إنجاز المشاريع: 89% ✅

**يحتاج اهتماماً:**
- معدل الاحتفاظ بالموظفين: 41% 🔴 — يُلزم تدخل الموارد البشرية
- 12 مؤشراً بلا بيانات — تواصل مع الأصحاب
- 4 مخاطر حرجة دون معالجة

*ملخص مُولَّد بالذكاء الاصطناعي — تحقق قبل المشاركة*`;

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AI_ENABLED !== "true") {
    return NextResponse.json({ error: "AI features are disabled." }, { status: 403 });
  }

  const { reportType, lang, period } = (await req.json()) as {
    reportType: "full" | "digest";
    lang: "en" | "ar";
    period?: string;
  };

  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "gpt-4o";

  if (!apiKey) {
    const isDigest = reportType === "digest";
    const text = lang === "ar"
      ? (isDigest ? MOCK_DIGEST_AR : MOCK_FULL_AR)
      : (isDigest ? MOCK_DIGEST_EN : MOCK_FULL_EN);
    return new Response(createMockStream(text), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Fetch real KPI context from the database
  let kpiContext = "";
  try {
    const session = await requireOrgMember();
    const kpis = await getKpiContextForAiReport(session.user.orgId, 25);
    if (kpis.length > 0) {
      const lines = kpis.map(
        (k) =>
          `- ${k.title}: ${k.achievement}% achievement (target: ${k.target ?? "N/A"}${k.unit ? ` ${k.unit}` : ""}, status: ${k.status}, direction: ${k.direction ?? "INCREASE_IS_GOOD"})`,
      );
      kpiContext =
        lang === "ar"
          ? `\n\nبيانات المؤشرات الحالية:\n${lines.join("\n")}`
          : `\n\nCurrent KPI data:\n${lines.join("\n")}`;
    }
  } catch {
    // continue without context if auth fails (e.g. called outside session)
  }

  const periodLabel =
    period === "q1" ? "Q1" : period === "q2" ? "Q2" : period === "q3" ? "Q3" : period === "q4" ? "Q4" : "Year-to-date";

  const systemPrompt =
    lang === "ar"
      ? "أنت محلل أداء استراتيجي. اكتب تقريراً احترافياً عن أداء مؤشرات الجهة بناءً على البيانات المعتمدة. أجب باللغة العربية."
      : "You are a strategic performance analyst. Write a professional performance narrative based on approved KPI data. Be structured, concise, and executive-ready.";

  const userPrompt =
    reportType === "full"
      ? lang === "ar"
        ? `اكتب تقرير مجلس إدارة كامل عن الفترة: ${periodLabel}. غطِّ الأداء العام، المؤشرات الرئيسية، التحديات، والتوصيات.${kpiContext}`
        : `Write a full board report for the period: ${periodLabel}. Cover overall performance, key KPIs, challenges, and recommendations.${kpiContext}`
      : lang === "ar"
        ? `اكتب ملخصاً مختصراً عن الفترة: ${periodLabel}. أبرز المؤشرات والإجراءات المطلوبة.${kpiContext}`
        : `Write a concise digest for the period: ${periodLabel}. Highlight key KPI performance and required actions.${kpiContext}`;

  try {
    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!upstream.ok) {
      return new Response(await upstream.text(), { status: upstream.status });
    }

    const reader = upstream.body!.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const raw = decoder.decode(value);
          for (const line of raw.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) controller.enqueue(new TextEncoder().encode(token));
            } catch {
              // skip malformed chunks
            }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
}
