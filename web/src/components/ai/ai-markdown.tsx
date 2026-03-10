"use client";

import { cn } from "@/lib/utils";

type Props = {
  content: string;
  className?: string;
  dir?: "ltr" | "rtl" | "auto";
};

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export function AiMarkdown({ content, className, dir }: Props) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let ulBuffer: string[] = [];
  let olBuffer: Array<{ num: string; text: string }> = [];

  function flushUl() {
    if (ulBuffer.length === 0) return;
    nodes.push(
      <ul key={`ul-${i}`} className="my-2 space-y-1 ps-4">
        {ulBuffer.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>,
    );
    ulBuffer = [];
  }

  function flushOl() {
    if (olBuffer.length === 0) return;
    nodes.push(
      <ol key={`ol-${i}`} className="my-2 space-y-1.5 ps-4">
        {olBuffer.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <span className="shrink-0 font-semibold text-primary min-w-[1.2rem]">{item.num}.</span>
            <span>{renderInline(item.text)}</span>
          </li>
        ))}
      </ol>,
    );
    olBuffer = [];
  }

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.match(/^---+$/)) {
      flushUl(); flushOl();
      nodes.push(<hr key={`hr-${i}`} className="my-3 border-border" />);
      i++; continue;
    }

    if (line.startsWith("### ")) {
      flushUl(); flushOl();
      nodes.push(
        <h3 key={`h3-${i}`} className="mt-4 mb-1.5 text-sm font-bold text-foreground tracking-wide">
          {renderInline(line.slice(4))}
        </h3>,
      );
      i++; continue;
    }

    if (line.startsWith("## ")) {
      flushUl(); flushOl();
      nodes.push(
        <h2 key={`h2-${i}`} className="mt-4 mb-1.5 text-base font-bold text-foreground">
          {renderInline(line.slice(3))}
        </h2>,
      );
      i++; continue;
    }

    if (line.startsWith("# ")) {
      flushUl(); flushOl();
      nodes.push(
        <h1 key={`h1-${i}`} className="mt-3 mb-1.5 text-lg font-extrabold text-foreground">
          {renderInline(line.slice(2))}
        </h1>,
      );
      i++; continue;
    }

    const ulMatch = line.match(/^[-*] (.+)/);
    if (ulMatch) {
      flushOl();
      ulBuffer.push(ulMatch[1]!);
      i++; continue;
    }

    const olMatch = line.match(/^(\d+)\. (.+)/);
    if (olMatch) {
      flushUl();
      olBuffer.push({ num: olMatch[1]!, text: olMatch[2]! });
      i++; continue;
    }

    flushUl(); flushOl();

    if (line.trim() === "") {
      nodes.push(<div key={`sp-${i}`} className="h-2" />);
      i++; continue;
    }

    nodes.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  flushUl();
  flushOl();

  return (
    <div className={cn("prose-sm max-w-none", className)} dir={dir}>
      {nodes}
    </div>
  );
}
