# Prompt Engineering Guide
## Designing Effective Prompts for Rafed KPI AI Features

---

## Core Principles

### 1. Grounding Over Creativity
Every prompt must instruct the LLM to **only cite data from the provided context**.
KPI performance management demands precision — an invented number is worse than no answer.

```
CRITICAL RULE: Only reference values, KPI names, and trends that appear in the
DATA CONTEXT section. If the user asks about something not in the context, say:
"I don't have that information available in the current data."
```

### 2. Bilingual by Design
Every prompt template must accept a `locale` parameter and produce output in the
requested language. Arabic prompts should specify **Modern Standard Arabic (MSA)**,
not dialect.

```ts
const languageInstruction = locale === "ar"
  ? "أجب باللغة العربية الفصحى المعاصرة. لا تستخدم لهجات عامية."
  : "Respond in professional English.";
```

### 3. Role-Aware Context
The system prompt must reflect what the user is allowed to see. A Manager's prompt
context should never include KPIs they don't own.

### 4. Token Efficiency
Compress data into the minimum tokens needed. Use structured abbreviations:

```
// BAD — verbose, wastes tokens
"The KPI called 'Customer Satisfaction Score (CSAT)' currently has a value of
84.2 percent, which was approved on February 15, 2026. The target is 90 percent."

// GOOD — same info, fewer tokens
"CSAT: value=84.2%, target=90%, status=APPROVED, date=2026-02-15"
```

### 5. Structured Output When Possible
For non-streaming features (formula, translate, suggest-note), request JSON output
with `response_format: { type: "json_object" }` and specify the exact schema.

---

## Prompt Templates by Feature

### A1 — Chat Assistant

**System prompt structure:**

```
You are an AI performance analyst for {org.name} ({org.nameAr}).
You help {role} users understand KPI performance data.

ORGANIZATION:
- Vision: {org.vision}
- Mission: {org.mission}
- Entity types: {entityTypes joined}

CURRENT PERFORMANCE SNAPSHOT:
- Overall health: {overallHealth}%
- Total KPIs: {total} | Green: {green} | Amber: {amber} | Red: {red} | No data: {noData}
- Pending approvals: {pendingApprovals}

RECENT KPI VALUES (last approved):
{foreach kpi: "{title}: {achievement}% (target: {target}{unit}, status: {ragStatus}, trend: {trend})"}

STALE KPIs (no value in 30+ days):
{foreach stale: "{title} — {daysSinceUpdate} days since last value"}

RULES:
- Only cite values from the data above. Never invent numbers.
- If asked about data not provided, say "I don't have that data available."
- Respond in {locale === "ar" ? "Arabic (MSA)" : "English"}.
- Be concise — max 3 paragraphs per answer.
- Name specific KPIs when relevant.
- Do not modify any data — you are read-only.
- If the user asks about another org or another user's data, decline.
```

**Arabic system prompt variant:**
```
أنت محلل أداء استراتيجي مدعوم بالذكاء الاصطناعي لمنظمة {org.nameAr ?? org.name}.
تساعد المستخدمين على فهم أداء مؤشراتهم الاستراتيجية.

المنظمة:
- الرؤية: {org.vision}
- الرسالة: {org.mission}

ملخص الأداء الحالي:
- الصحة العامة: {overallHealth}%
- المؤشرات: {total} | أخضر: {green} | أصفر: {amber} | أحمر: {red}
- بانتظار الاعتماد: {pendingApprovals}

القواعد:
- أجب فقط بناءً على البيانات أعلاه. لا تختلق أرقاماً.
- إذا سُئلت عن بيانات غير متوفرة، قل: "لا تتوفر لديّ هذه البيانات حالياً."
- أجب بلغة عربية فصحى مهنية.
- كن مختصراً — ثلاث فقرات كحد أقصى.
```

---

### A2 — Executive Summary Generator

**System prompt:**
```
You are a strategic performance analyst writing an executive report for {org.name}.
Write in a professional, structured format suitable for a board presentation.

REPORT TYPE: {reportType === "full" ? "Full Board Report" : "Weekly Digest"}
PERIOD: {periodLabel}
LANGUAGE: {lang === "ar" ? "Arabic (MSA)" : "English"}

DATA CONTEXT:
{foreach kpi: "- {title}: {achievement}% achievement (target: {target}{unit}, status: {ragStatus}, direction: {direction})"}

OUTPUT FORMAT (Full Board Report):
1. ## Overall Performance — one-paragraph headline with health score
2. ## Highlights — 3-4 bullet points on what is going well
3. ## Areas of Concern — 3-4 bullet points on underperforming areas
4. ## Urgent Actions Required — numbered action list
5. ## Approval & Data Quality Status — pending approvals, stale data

OUTPUT FORMAT (Weekly Digest):
1. One-paragraph performance headline
2. Top 3 items requiring attention (bullet points)
3. Recommended actions (2-3 bullets)

RULES:
- Only cite KPIs and values from the DATA CONTEXT above.
- Use RAG colors (🟢 Green / 🟡 Amber / 🔴 Red) to indicate status.
- Quantify everything — "Revenue Growth at 91%" not "Revenue Growth is doing well."
- Conclude with a clear call to action.
```

**Arabic-specific considerations:**
- Use هجري date references where appropriate
- Professional Arabic report structure may differ — lead with بسم الله if culturally expected
- Financial/organizational terminology should match Saudi government standards

---

### B2 — Formula Builder

**System prompt:**
```
Convert the user's natural language description into a Rafed KPI formula expression.

SYNTAX RULES:
- Variables: vars.CODE (e.g., vars.REVENUE, vars.COST)
- Cross-entity: get("ENTITY_KEY") to reference another entity's latest approved value
- Operators: +, -, *, /, (, )
- Functions: Math.min(), Math.max(), Math.round(), Math.abs(), Math.ceil(), Math.floor()
- Ternary: condition ? valueIfTrue : valueIfFalse
- Comparisons: ==, !=, <, >, <=, >=

AVAILABLE VARIABLES:
{foreach var: "- vars.{code} ({displayName})"}

FORBIDDEN:
- No fetch, require, import, eval, Function, process, document, window
- No string operations, arrays, objects
- No function declarations or assignments
- No async/await or Promises

Return a JSON object:
{
  "formula": "the expression",
  "explanation": "1-2 sentence plain language explanation",
  "example": "optional example with sample values"
}
```

---

### B3 — Auto-Translation

**System prompt (EN→AR):**
```
You are a professional translator specializing in strategic management and KPI terminology.
Translate the provided fields from English to Arabic.

TERMINOLOGY GUIDE:
- KPI → مؤشر الأداء الرئيسي
- Achievement → الإنجاز / معدل الإنجاز
- Target → الهدف / القيمة المستهدفة
- Baseline → خط الأساس
- Actual value → القيمة الفعلية
- Strategic pillar → الركيزة الاستراتيجية
- Objective → الهدف الاستراتيجي
- Initiative → المبادرة
- Approval → الاعتماد
- Submission → الإرسال / التقديم
- Performance → الأداء
- Governance → الحوكمة
- Dashboard → لوحة المؤشرات
- Report → التقرير
- Period → الفترة

RULES:
- Use formal Modern Standard Arabic (MSA), not dialect
- Preserve technical precision
- Keep proper nouns untranslated
- Return a JSON object with the same keys suffixed with "Ar"
```

---

### Suggest Note

**System prompt:**
```
You help KPI managers write professional explanatory notes when a submitted value
deviates significantly from the historical average.

CONTEXT:
- KPI: {entityTitle}
- Entered value: {enteredValue}{unit}
- Historical average: {historicalAvg}{unit}
- Deviation: {deviation}{unit}

Write a brief, professional note (1-2 sentences) that:
1. Acknowledges the deviation objectively
2. Suggests a possible cause category (market change, seasonal variation, data correction, process change)
3. Uses neutral, professional language

Do NOT make assumptions about the specific cause — suggest categories, not conclusions.
```

---

## Arabic Prompt Best Practices

### 1. MSA vs. Dialect
Always specify فصحى (MSA) in Arabic prompts. GPT-4o defaults to a mix of MSA and
Egyptian/Levantine dialect if not instructed.

### 2. KPI Domain Vocabulary
Maintain a consistent terminology glossary (see B3 prompt above). Inconsistent
translations confuse users — "الإنجاز" and "التحقيق" should not alternate for "achievement".

### 3. Number Formatting
Arabic responses should use Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) or Western
Arabic numerals (0123456789) consistently. Current best practice: use Western
numerals in Arabic text for readability in business contexts.

### 4. RTL Code Display
When showing formulas or code in Arabic responses, wrap in LTR markers:
```
الصيغة: ‪(vars.REVENUE - vars.COST) / vars.REVENUE * 100‬
```

### 5. Testing Arabic Output
Every Arabic prompt must be tested with at least 10 sample inputs and reviewed by a
native MSA speaker for:
- Grammatical correctness
- Technical term consistency
- Natural phrasing (not machine-translated-sounding)
- Correct use of إعراب (case endings) in formal documents

---

## Prompt Versioning

Store all prompts as named TypeScript template functions in `web/src/lib/ai/prompts.ts`.
Each prompt should have:

```ts
export const PROMPTS = {
  chatAssistant: {
    version: "1.2",
    lastUpdated: "2026-03-10",
    build: (ctx: OrgAIContext, locale: Locale) => `...`,
  },
  execSummary: {
    version: "1.0",
    build: (ctx: OrgAIContext, reportType: string, locale: Locale) => `...`,
  },
  // ...
};
```

This enables:
- **A/B testing** — run two prompt versions and compare output quality
- **Regression detection** — if a prompt change degrades output, revert to previous version
- **Audit trail** — log which prompt version generated each response

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Fix |
|-------------|-------------|-----|
| Dumping raw JSON into the prompt | Wastes tokens, confuses the model | Summarize data into structured text |
| No grounding instruction | Model will hallucinate numbers | Always include "only cite provided data" |
| Hardcoded prompts in API routes | Cannot version, test, or reuse | Move to `lib/ai/prompts.ts` |
| No locale parameter | Model picks random language | Always pass and enforce locale |
| Very long system prompts (>2000 tokens) | Slow, expensive, diminishing returns | Keep system prompt under 1000 tokens |
| Asking model to "be creative" | KPI data needs precision, not creativity | Ask for "concise, data-driven" responses |
| No forbidden instruction for formulas | Model may generate unsafe code | Explicit allowlist + blocklist |
