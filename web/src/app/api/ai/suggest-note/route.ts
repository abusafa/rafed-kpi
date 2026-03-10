import { NextRequest, NextResponse } from "next/server";

function buildMockNote(params: {
  entityTitle?: string;
  enteredValue?: number;
  historicalAvg?: number;
  unit?: string;
  locale?: string;
}): string {
  const { entityTitle, enteredValue, historicalAvg, unit = "", locale } = params;
  const isAr = locale === "ar";
  const title = entityTitle ?? (isAr ? "المؤشر" : "this KPI");

  if (enteredValue == null || historicalAvg == null || historicalAvg === 0) {
    return isAr
      ? `تم إدخال القيمة بعد التحقق من مصادر البيانات المتاحة. يرجى مراجعة التقرير الداعم المرفق للتأكيد.`
      : `The value was entered after reviewing available data sources. Please refer to the attached supporting report for confirmation.`;
  }

  const pct = Math.round(Math.abs(((enteredValue - historicalAvg) / historicalAvg) * 100));
  const isLow = enteredValue < historicalAvg;

  if (pct <= 5) {
    return isAr
      ? `القيمة المُدخلة لـ"${title}" (${enteredValue}${unit}) متسقة مع الأداء التاريخي. الانحراف ضئيل (${pct}%) ويقع ضمن نطاق التوقعات.`
      : `The submitted value for "${title}" (${enteredValue}${unit}) is consistent with historical performance. The ${pct}% deviation is within the expected range.`;
  }

  if (isLow) {
    const reasons = isAr
      ? ["شهدت الفترة الحالية ظروفاً استثنائية أثّرت سلباً على الأداء.", "يُعزى الانخفاض إلى تغييرات تشغيلية مؤقتة جارٍ معالجتها.", "تأثّر المؤشر بعوامل خارجية خارجة عن نطاق السيطرة."]
      : ["The current period experienced exceptional circumstances that negatively impacted performance.", "The decline is attributed to temporary operational changes currently being addressed.", "External factors outside the team's control contributed to this result."];
    return isAr
      ? `القيمة المُدخلة لـ"${title}" (${enteredValue}${unit}) أقل بنسبة ${pct}% من المتوسط التاريخي (${historicalAvg}${unit}). ${reasons[pct % 3]}`
      : `The submitted value for "${title}" (${enteredValue}${unit}) is ${pct}% below the historical average of ${historicalAvg}${unit}. ${reasons[pct % 3]}`;
  }

  const reasons = isAr
    ? ["يعكس الارتفاع نتائج مبادرات التحسين المُنفَّذة خلال هذه الفترة.", "تحسّن المؤشر نتيجة تغييرات إيجابية في العملية تم تطبيقها مؤخراً.", "يعكس الأداء المرتفع جهوداً استثنائية من الفريق خلال هذه الفترة."]
    : ["The increase reflects outcomes from improvement initiatives implemented during this period.", "The KPI improved due to positive process changes recently applied.", "The higher-than-average performance reflects exceptional team effort during this period."];
  return isAr
    ? `القيمة المُدخلة لـ"${title}" (${enteredValue}${unit}) أعلى بنسبة ${pct}% من المتوسط التاريخي (${historicalAvg}${unit}). ${reasons[pct % 3]}`
    : `The submitted value for "${title}" (${enteredValue}${unit}) is ${pct}% above the historical average of ${historicalAvg}${unit}. ${reasons[pct % 3]}`;
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AI_ENABLED !== "true") {
    return NextResponse.json({ error: "AI features are disabled." }, { status: 403 });
  }

  const { entityTitle, enteredValue, historicalAvg, unit, locale } = (await req.json()) as {
    entityTitle?: string;
    enteredValue?: number;
    historicalAvg?: number;
    unit?: string;
    locale?: string;
  };

  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "gpt-4o";

  if (!apiKey) {
    return NextResponse.json({ note: buildMockNote({ entityTitle, enteredValue, historicalAvg, unit, locale }) });
  }

  const isArabic = locale === "ar";
  const systemPrompt = isArabic
    ? "أنت مساعد لكتابة ملاحظات تفسيرية لمؤشرات الأداء. اكتب ملاحظة قصيرة ومهنية (جملة أو جملتان) تشرح سبب الانحراف في القيمة المُدخلة عن المتوسط التاريخي. استخدم لغة موضوعية ومهنية."
    : "You are an assistant helping KPI managers write explanatory notes. Write a short professional note (1-2 sentences) explaining the deviation of the entered value from the historical average. Be objective and professional.";

  const deviation = enteredValue != null && historicalAvg != null
    ? Math.abs(enteredValue - historicalAvg)
    : null;

  const userPrompt = isArabic
    ? `المؤشر: ${entityTitle ?? "غير محدد"}\nالقيمة المُدخلة: ${enteredValue ?? "—"}${unit ?? ""}\nالمتوسط التاريخي: ${historicalAvg ?? "—"}${unit ?? ""}${deviation != null ? `\nالانحراف: ${deviation}${unit ?? ""}` : ""}\n\nاكتب ملاحظة تفسيرية موجزة.`
    : `KPI: ${entityTitle ?? "Unknown"}\nEntered value: ${enteredValue ?? "—"}${unit ?? ""}\nHistorical average: ${historicalAvg ?? "—"}${unit ?? ""}${deviation != null ? `\nDeviation: ${deviation}${unit ?? ""}` : ""}\n\nWrite a brief explanatory note.`;

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
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 150,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const note = data.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ note });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
