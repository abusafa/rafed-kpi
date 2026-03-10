import { NextRequest, NextResponse } from "next/server";

const EN_TO_AR: Record<string, string> = {
  "customer satisfaction": "رضا العملاء",
  "employee retention": "الاحتفاظ بالموظفين",
  "revenue growth": "نمو الإيرادات",
  "cost efficiency": "كفاءة التكلفة",
  "project completion": "إنجاز المشروع",
  "compliance rate": "معدل الامتثال",
  "training hours": "ساعات التدريب",
  "market share": "الحصة السوقية",
  "quality rate": "معدل الجودة",
  "response time": "وقت الاستجابة",
  "on-time delivery": "التسليم في الموعد",
  "net promoter score": "مؤشر صافي المروجين",
  "%": "٪",
  "percentage": "نسبة مئوية",
  "score": "درجة",
  "days": "أيام",
  "hours": "ساعات",
  "ratio": "نسبة",
  "count": "عدد",
};

function mockTranslateToAr(fields: { title?: string; description?: string; unit?: string }) {
  function tr(text?: string): string | undefined {
    if (!text) return undefined;
    const lower = text.toLowerCase();
    for (const [en, ar] of Object.entries(EN_TO_AR)) {
      if (lower === en) return ar;
    }
    for (const [en, ar] of Object.entries(EN_TO_AR)) {
      if (lower.includes(en)) return text.replace(new RegExp(en, "gi"), ar);
    }
    return `ترجمة: ${text}`;
  }
  return {
    ...(fields.title != null && { titleAr: tr(fields.title) }),
    ...(fields.description != null && { descriptionAr: tr(fields.description) }),
    ...(fields.unit != null && { unitAr: tr(fields.unit) ?? fields.unit }),
  };
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AI_ENABLED !== "true") {
    return NextResponse.json({ error: "AI features are disabled." }, { status: 403 });
  }

  const { fields, direction } = (await req.json()) as {
    fields: { title?: string; description?: string; unit?: string };
    direction: "en_to_ar" | "ar_to_en";
  };

  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "gpt-4o";

  if (!apiKey) {
    if (direction === "en_to_ar") {
      return NextResponse.json(mockTranslateToAr(fields));
    }
    return NextResponse.json({
      ...(fields.title != null && { title: fields.title }),
      ...(fields.description != null && { description: fields.description }),
      ...(fields.unit != null && { unit: fields.unit }),
    });
  }

  const isToAr = direction === "en_to_ar";

  const systemPrompt = isToAr
    ? `You are a professional translator specializing in strategic management and KPI terminology.
Translate the provided fields from English to Arabic.
Return a JSON object with fields: titleAr, descriptionAr (optional), unitAr (optional).
Only include fields that were provided. Preserve technical terms appropriately.
IMPORTANT: Return ONLY valid JSON, no markdown.`
    : `You are a professional translator specializing in strategic management and KPI terminology.
Translate the provided fields from Arabic to English.
Return a JSON object with fields: title, description (optional), unit (optional).
Only include fields that were provided. Preserve technical terms appropriately.
IMPORTANT: Return ONLY valid JSON, no markdown.`;

  const userContent = JSON.stringify(fields);

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as Record<string, string>;

    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
