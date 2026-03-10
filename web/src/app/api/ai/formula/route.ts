import { NextRequest, NextResponse } from "next/server";

type Variable = { code: string; displayName: string };

type FormulaResult = { formula: string; explanation: string; example?: string };

function buildMockFormula(description: string, variables?: Variable[]): FormulaResult {
  const lower = description.toLowerCase();
  const firstVar = variables?.[0]?.code;
  const secondVar = variables?.[1]?.code;
  const v1 = firstVar ? `vars.${firstVar}` : "vars.ACTUAL";
  const v2 = secondVar ? `vars.${secondVar}` : "vars.TARGET";

  if (lower.includes("percent") || lower.includes("%") || lower.includes("rate") || lower.includes("ratio")) {
    return {
      formula: `(${v1} / ${v2}) * 100`,
      explanation: `Divides the actual value by the target and multiplies by 100 to express the result as a percentage.`,
      example: `(85 / 100) * 100 = 85%`,
    };
  }
  if (lower.includes("growth") || lower.includes("change") || lower.includes("increase") || lower.includes("variance")) {
    return {
      formula: `((${v1} - ${v2}) / ${v2}) * 100`,
      explanation: `Calculates the percentage change between the current value and the previous value.`,
      example: `((110 - 100) / 100) * 100 = 10%`,
    };
  }
  if (lower.includes("average") || lower.includes("mean")) {
    const vars = variables && variables.length >= 2
      ? variables.map((v) => `vars.${v.code}`).join(" + ")
      : `${v1} + ${v2}`;
    const count = variables?.length ?? 2;
    return {
      formula: `(${vars}) / ${count}`,
      explanation: `Calculates the simple average of ${count} values.`,
      example: `(80 + 90) / 2 = 85`,
    };
  }
  if (lower.includes("sum") || lower.includes("total") || lower.includes("add")) {
    const vars = variables && variables.length >= 2
      ? variables.map((v) => `vars.${v.code}`).join(" + ")
      : `${v1} + ${v2}`;
    return {
      formula: vars,
      explanation: `Sums all the provided values together.`,
      example: `50 + 30 + 20 = 100`,
    };
  }
  if (lower.includes("divide") || lower.includes("per")) {
    return {
      formula: `${v1} / ${v2}`,
      explanation: `Divides the first value by the second value.`,
      example: `200 / 4 = 50`,
    };
  }
  if (lower.includes("difference") || lower.includes("gap") || lower.includes("minus") || lower.includes("subtract")) {
    return {
      formula: `${v1} - ${v2}`,
      explanation: `Subtracts the second value from the first value to calculate the gap.`,
      example: `100 - 75 = 25`,
    };
  }
  if (lower.includes("multiply") || lower.includes("product")) {
    return {
      formula: `${v1} * ${v2}`,
      explanation: `Multiplies the two values together.`,
      example: `10 * 5 = 50`,
    };
  }
  return {
    formula: `(${v1} / ${v2}) * 100`,
    explanation: `Expresses the first value as a percentage of the second value (achievement rate).`,
    example: `(75 / 100) * 100 = 75%`,
  };
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AI_ENABLED !== "true") {
    return NextResponse.json({ error: "AI features are disabled." }, { status: 403 });
  }

  const { description, variables } = (await req.json()) as {
    description: string;
    variables?: Variable[];
  };

  if (!description?.trim()) {
    return NextResponse.json({ error: "Description is required." }, { status: 400 });
  }

  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL ?? "https://api.openai.com/v1/chat/completions";
  const model = process.env.AI_MODEL ?? "gpt-4o";

  if (!apiKey) {
    return NextResponse.json(buildMockFormula(description, variables));
  }

  const variablesContext =
    variables && variables.length > 0
      ? `Available variables (access as vars.CODE):\n${variables.map((v) => `- vars.${v.code} (${v.displayName})`).join("\n")}`
      : "No variables defined yet.";

  const systemPrompt = `You are a KPI formula assistant. The user will describe a calculation in plain language.
Generate a JavaScript formula expression that can be evaluated safely.
Use only: arithmetic operators (+, -, *, /), Math functions, and variables from the provided list (accessed as vars.CODE).
Return a JSON object with exactly these fields:
- formula: the JavaScript expression string (single line, no function declaration)
- explanation: plain language explanation of what the formula does (1-2 sentences)
- example: optional example calculation showing sample values and result

${variablesContext}

IMPORTANT: Return ONLY valid JSON, no markdown, no code fences.`;

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
          { role: "user", content: description },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: await res.text() }, { status: res.status });
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { formula?: string; explanation?: string; example?: string };

    return NextResponse.json({
      formula: parsed.formula ?? "",
      explanation: parsed.explanation ?? "",
      example: parsed.example,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
