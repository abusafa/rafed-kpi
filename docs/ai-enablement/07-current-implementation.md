# Current AI Implementation
## What Has Been Built — Components, Routes, and Integrations

---

## Overview

As of March 2026, the Rafed KPI AI frontend consists of a **thin proxy layer** that
connects React components to any OpenAI-compatible LLM API. The implementation provides
a working UI for 7 AI features with streaming support, bilingual i18n, and a global
feature gate.

**Architecture pattern:**
```
React Component → fetch() → Next.js API Route → fetch() → OpenAI-compatible API
```

This design is intentionally simple — it gets AI features in front of users quickly.
The next phase upgrades this to a proper server-side AI service layer with org-context
injection, RBAC-scoped prompts, and audit logging.

---

## Feature Gate

All AI features are gated by a single environment variable:

```ts
// web/src/lib/ai-features.ts
export function isAiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_ENABLED === "true";
}

// React hook — false on SSR, real value after hydration
export function useAiEnabled(): boolean { ... }
```

- **Client-side:** Components use `useAiEnabled()` to conditionally render
- **Server-side:** Every API route checks `NEXT_PUBLIC_AI_ENABLED` and returns `403` if disabled
- **Default:** AI is OFF unless explicitly enabled

---

## UI Components

All components live in `web/src/components/ai/` with a barrel export in `index.ts`.

### 1. AiChatPanel (`ai-chat-panel.tsx`)
**Type:** Floating chat interface
**Placement:** App shell — renders on every page when AI enabled + user logged in

| Aspect | Detail |
|--------|--------|
| **Trigger** | Floating button (bottom-end corner, `z-70`) |
| **Panel** | Slide-out side panel, 420px max width, 600px max height |
| **Streaming** | Yes — reads `ReadableStream` from `/api/ai/chat`, renders token-by-token |
| **RTL** | Chat bubbles respect `isArabic` locale for text direction |
| **History** | Session-scoped `useState` array — not persisted |
| **Welcome** | Auto-sends `aiWelcomeMessage` on first open |
| **Input** | Textarea with Enter-to-send (Shift+Enter for newline) |

**Current limitation:** No org data context in the prompt — the chat route sends a
generic system prompt. The chat does not know anything about the user's actual KPIs.

---

### 2. AiGenerateSummaryModal (`ai-generate-summary-modal.tsx`)
**Type:** Dialog modal with streaming output
**Placement:** Overview page + Dashboards page (in PageHeader actions)

| Aspect | Detail |
|--------|--------|
| **Trigger** | "Generate Report" button with sparkles icon |
| **Options** | Report type (Full / Digest), Language (EN / AR), Period (YTD / Q1-Q4) |
| **Streaming** | Yes — progressive text display |
| **Data context** | Fetches real KPI data via `getKpiContextForAiReport()` (up to 25 KPIs) |
| **Copy** | One-click copy to clipboard |
| **Regenerate** | Reset and regenerate with same or different options |

**Note:** This is the most production-ready route — it actually injects real KPI data
from the database into the prompt via `requireOrgMember()` + `getKpiContextForAiReport()`.

---

### 3. AiFormulaBuilder (`ai-formula-builder.tsx`)
**Type:** Dialog modal with JSON response
**Placement:** Entity create/edit pages, next to Formula label

| Aspect | Detail |
|--------|--------|
| **Trigger** | "Ask AI" button |
| **Input** | Textarea for natural language formula description |
| **Context** | Shows available `vars.CODE` variables as chips |
| **Output** | Formula expression + explanation + optional example |
| **Action** | "Insert into editor" button calls `onInsert(formula)` callback |
| **Safety** | Route requests `response_format: { type: "json_object" }` |

---

### 4. AiTranslateButton (`ai-translate-button.tsx`)
**Type:** Inline button with overwrite confirmation
**Placement:** Entity create/edit pages, next to Arabic name label

| Aspect | Detail |
|--------|--------|
| **Input** | Takes `fields: { title, description, unit }` from form state |
| **Direction** | Currently EN→AR only |
| **Overwrite guard** | If `hasExistingAr` is true, shows amber confirmation bar |
| **Output** | Calls `onTranslated({ titleAr, descriptionAr, unitAr })` to update form |
| **Fallback** | If no API key configured, returns `[ترجمة] {original}` prefix |

---

### 5. AiReviewContextCard (`ai-review-context-card.tsx`)
**Type:** Expandable inline card
**Placement:** Approvals page — "AI Review Context" badge on SUBMITTED rows

| Aspect | Detail |
|--------|--------|
| **Props** | `submittedValue`, `historicalAvg`, `unit`, `historicalValues[]`, `managerNote`, `anomalyType` |
| **Display** | Three metric cards (submitted / avg / deviation) + historical values + manager note + AI assessment |
| **Assessment** | Static text from i18n keys — not a live LLM call |
| **Dismissable** | Close button sets `dismissed` state |

**Note:** This component is purely presentational — it uses pre-computed data passed as
props, not a live AI call. The anomaly detection logic lives in the parent page.

---

### 6. AiValueEntryAssist (`ai-value-entry-assist.tsx`)
**Type:** Contextual panel
**Placement:** KPI value entry form (shown inline during data entry)

| Aspect | Detail |
|--------|--------|
| **Context** | Shows last value, 6-month avg, expected range, trend direction |
| **Anomaly detection** | Client-side: value outside ±35% of average or outside min/max range |
| **Warning** | Amber card with deviation details + "Confirm correct" / "Re-check" buttons |
| **No history** | Shows generic "no history" message if no previous values |

**Note:** Anomaly detection is a simple client-side threshold check. Not an AI call.
The server-side statistical anomaly detection (z-score) is not yet implemented.

---

### 7. AiSuggestNoteButton (`ai-suggest-note-button.tsx`)
**Type:** Inline ghost button
**Placement:** Value entry form, next to note textarea

| Aspect | Detail |
|--------|--------|
| **Trigger** | "Suggest note" button with sparkles icon |
| **Input** | Entity title, entered value, historical avg, unit, locale |
| **Output** | Calls `onSuggested(note)` to populate the note textarea |
| **Token limit** | API route sets `max_tokens: 150` for concise output |

---

## API Routes

All routes live in `web/src/app/api/ai/` and share this pattern:

```ts
// 1. Feature gate check
if (process.env.NEXT_PUBLIC_AI_ENABLED !== "true") return 403;

// 2. Parse request body
// 3. Read env vars: AI_API_KEY, AI_API_URL, AI_MODEL
// 4. Fallback if no API key
// 5. Build system + user prompts
// 6. Call upstream LLM API (streaming or JSON)
// 7. Return response
```

### Route Inventory

| Route | Method | Streaming | Auth | Data Context |
|-------|--------|-----------|------|-------------|
| `/api/ai/chat` | POST | ✅ Yes | ❌ None | ❌ None — generic system prompt |
| `/api/ai/summary` | POST | ✅ Yes | ✅ `requireOrgMember()` | ✅ `getKpiContextForAiReport()` |
| `/api/ai/formula` | POST | ❌ JSON | ❌ None | Partial — passes `variables[]` from client |
| `/api/ai/translate` | POST | ❌ JSON | ❌ None | ❌ None — translates provided fields |
| `/api/ai/suggest-note` | POST | ❌ JSON | ❌ None | Partial — client sends entity title + values |

### Key Observations

1. **Only `/api/ai/summary` has proper auth and data context** — the rest are thin proxies
2. **No audit logging** — no `AiInteraction` records are created
3. **No RBAC scoping** — chat route has no idea what the user can see
4. **No guardrails** — no post-generation validation on any route
5. **No rate limiting** — no per-org or per-user usage limits

---

## Page Integrations

| Page | Component(s) | How |
|------|-------------|-----|
| `app-shell.tsx` | `AiChatPanel` | Rendered at app level when `useAiEnabled() && user` |
| `overview/page.tsx` | `AiGenerateSummaryModal` | In PageHeader actions section |
| `dashboards/page.tsx` | `AiGenerateSummaryModal` | In PageHeader actions section |
| `entities/.../edit/page.tsx` | `AiTranslateButton`, `AiFormulaBuilder` | Next to Arabic name label; next to Formula label |
| `entities/.../new/page.tsx` | `AiTranslateButton`, `AiFormulaBuilder` | Same as edit page |
| `approvals/page.tsx` | `AiReviewContextCard` | "AI Review Context" badge on SUBMITTED rows; click expands card inline |

### Components Not Yet Integrated

| Component | Designed For | Status |
|-----------|-------------|--------|
| `AiValueEntryAssist` | Value entry modal/page | Component exists but needs wiring to real historical data |
| `AiSuggestNoteButton` | Value entry note field | Component exists but needs wiring to value entry flow |

---

## i18n Keys

70+ AI-specific translation keys added to both `messages/en.json` and `messages/ar.json`.

Key categories:
- **General:** `aiAssistant`, `aiPowered`, `aiReadOnly`, `aiUnavailable`, `aiThinking`
- **Chat:** `aiWelcomeMessage`, `aiAskPlaceholder`, `aiSend`, `aiDataAsOf`
- **Summary:** `aiGenerateReport`, `aiGenerateReportSubtitle`, `aiReportType*`, `aiReportLanguage`, `aiReportPeriod*`, `aiReportDisclaimer`, `aiCopyReport`, `aiReportCopied`
- **Formula:** `aiFormulaBuilder`, `aiFormulaBuilderSubtitle`, `aiDescribeFormula*`, `aiGeneratedFormula`, `aiFormulaExplanation`, `aiInsertFormula`, `aiGenerateFormula`, `aiAskAi`
- **Translate:** `aiTranslateToArabic`, `aiTranslating`, `aiTranslateConfirmOverwrite`
- **Review:** `aiReviewContext`, `aiAnomalyFlagged`, `aiSubmittedValue`, `aiHistoricalAvg`, `aiDeviation`, `aiLastValues`, `aiAssessmentLabel`, `aiAnomaly*`
- **Value entry:** `aiValueContext`, `aiLastPeriod`, `aiSixMonthAvg`, `aiExpectedRange`, `aiTrend*`, `aiUnusualValue*`, `aiConfirmCorrect`, `aiReCheck`
- **Note:** `aiSuggestNote`
- **Common:** `aiGenerate`, `aiGenerating`, `aiTryAgain`

---

## Environment Variables

```env
# Feature gate
NEXT_PUBLIC_AI_ENABLED=true

# LLM provider configuration (server-side only)
AI_API_KEY=sk-...
AI_API_URL=https://api.openai.com/v1/chat/completions   # Default: OpenAI
AI_MODEL=gpt-4o                                          # Default: gpt-4o
```

The provider-agnostic design means any OpenAI-compatible API works:
- **OpenAI:** Default URL + any `gpt-*` model
- **Azure OpenAI:** Set `AI_API_URL` to your Azure endpoint
- **Ollama:** `AI_API_URL=http://localhost:11434/v1/chat/completions`, `AI_MODEL=llama3.1`
- **Jais:** `AI_API_URL=https://api.ai71.ai/v1/chat/completions`, `AI_MODEL=jais-30b-chat`
- **Any OpenAI-compatible:** Just set URL + key + model

---

## What Is Missing — Gap Summary

| Gap | Impact | Priority |
|-----|--------|----------|
| No server-side AI service layer (`lib/ai/`) | Prompts are inline strings in each route, not reusable | High |
| No org context in chat | Chat cannot answer questions about actual KPI data | High |
| No RBAC in chat/formula/translate routes | No session check, no role-based data scoping | High |
| No `AiInteraction` audit log | No cost tracking, no compliance trail | High |
| No guardrails module | No post-generation validation, no hallucination check | Medium |
| No Vercel AI SDK | Using raw `fetch`; no tool calling, no structured output support | Medium |
| No response caching | Identical summary requests re-call LLM every time | Medium |
| No rate limiting | No per-org or per-user usage caps | Medium |
| No error analytics | API errors silently swallowed in most components | Low |
| No pgvector/RAG | Full-context approach only; no semantic search | Low (Phase 2) |
