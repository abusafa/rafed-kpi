import { NextResponse } from "next/server";

export function createMockStream(text: string, delayMs = 22): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const tokens = text.split(/(\s+)/);

  return new ReadableStream({
    async start(controller) {
      for (const token of tokens) {
        controller.enqueue(encoder.encode(token));
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
      controller.close();
    },
  });
}

export function streamResponse(text: string): Response {
  return new Response(createMockStream(text), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}

export function aiDisabledResponse(): NextResponse {
  return NextResponse.json({ error: "AI features are disabled." }, { status: 403 });
}

export function isAiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_ENABLED === "true";
}
