# AI Frontend Implementation Plan
## Rafed KPI — From Thin Proxy to Production-Ready AI

---

## Executive Summary

The AI frontend already has **7 UI components**, **5 API routes**, and **70+ i18n keys**
in place. However, the current implementation is a thin proxy layer — components call
API routes that forward requests to an OpenAI-compatible endpoint with minimal context.

This plan upgrades the AI layer into a **production-ready system** with:
- Real org data injected into every AI prompt
- RBAC-scoped context (users only see their own data)
- Audit logging for compliance and cost tracking
- Post-generation guardrails (hallucination checks, formula safety)
- Vercel AI SDK for structured streaming and tool support
- New AI features (KPI Wizard, Rejection Comments, Period Reports)

---

## What Already Exists

### UI Components (`web/src/components/ai/`)

| Component | File | Status | Integration |
|-----------|------|--------|-------------|
| Chat Panel | `ai-chat-panel.tsx` | ✅ Built | App shell (every page) |
| Summary Modal | `ai-generate-summary-modal.tsx` | ✅ Built | Overview + Dashboards pages |
| Formula Builder | `ai-formula-builder.tsx` | ✅ Built | Entity create/edit pages |
| Translate Button | `ai-translate-button.tsx` | ✅ Built | Entity create/edit pages |
| Review Context Card | `ai-review-context-card.tsx` | ✅ Built | Approvals page |
| Value Entry Assist | `ai-value-entry-assist.tsx` | ✅ Built | Needs wiring to real data |
| Suggest Note Button | `ai-suggest-note-button.tsx` | ✅ Built | Needs wiring to value entry flow |

### API Routes (`web/src/app/api/ai/`)

| Route | Streaming | Auth | Org Context |
|-------|-----------|------|-------------|
| `chat/route.ts` | ✅ | ❌ | ❌ Generic prompt |
| `summary/route.ts` | ✅ | ✅ | ✅ Real KPI data (partial) |
| `formula/route.ts` | ❌ JSON | ❌ | Partial (client-sent vars) |
| `translate/route.ts` | ❌ JSON | ❌ | ❌ |
| `suggest-note/route.ts` | ❌ JSON | ❌ | Partial (client-sent values) |

### Infrastructure

| Item | Status |
|------|--------|
| Feature gate (`NEXT_PUBLIC_AI_ENABLED`) | ✅ Working |
| i18n keys (EN + AR) | ✅ 70+ keys |
| Env vars (`AI_API_KEY`, `AI_API_URL`, `AI_MODEL`) | ✅ Working |
| Vercel AI SDK | ❌ Not installed |
| `lib/ai/` service layer | ❌ Not created |
| `AiInteraction` Prisma model | ❌ Not created |
| Guardrails module | ❌ Not created |

---

## Implementation Phases

```
Phase A — Server-Side AI Foundation       (Steps 1–5)    ~1 week
Phase B — Upgrade Existing Features       (Steps 6–10)   ~1 week
Phase C — New AI Features                 (Steps 11–15)  ~1-2 weeks
Phase D — Production Hardening            (Steps 16–20)  ~1 week
```

---

## Phase A — Server-Side AI Foundation

### Step 1: Install Vercel AI SDK

**Why:** Replace raw `fetch()` calls with the official SDK. Gives us structured streaming,
provider abstraction, tool calling, and TypeScript-first API.

**Files to create/modify:**
- `web/package.json` — add `ai`, `@ai-sdk/openai` dependencies

**Commands:**
```bash
cd web && pnpm add ai @ai-sdk/openai
```

**Acceptance:**
- Packages installed, `pnpm build` passes

---

### Step 2: Create AI Service Layer (`web/src/lib/ai/`)

**Why:** Centralize all AI logic — client factory, prompts, context builder, guardrails.
Currently, prompts are hardcoded inline strings in each API route.

**Files to create:**

#### `web/src/lib/ai/client.ts`
LLM client factory using Vercel AI SDK:
```ts
import { createOpenAI } from "@ai-sdk/openai";

export function getAIModel() {
  const apiKey = process.env.AI_API_KEY;
  const baseURL = process.env.AI_API_URL
    ? new URL(process.env.AI_API_URL).origin + "/v1"
    : undefined;
  const modelId = process.env.AI_MODEL ?? "gpt-4o";

  const provider = createOpenAI({ apiKey, baseURL });
  return provider(modelId);
}
```

#### `web/src/lib/ai/context.ts`
Org context builder — fetches scoped data from Prisma:
```ts
export interface OrgAIContext {
  org: { name: string; nameAr: string | null; vision: string | null; mission: string | null };
  entityTypes: Array<{ code: string; name: string }>;
  kpiSummary: { total: number; green: number; amber: number; red: number; noData: number; overallHealth: number };
  recentValues: Array<{ entityTitle: string; value: number; achievement: number | null; status: string; daysAgo: number }>;
  staleKpis: Array<{ title: string; daysSinceUpdate: number | null }>;
  pendingApprovals: number;
}

export async function buildOrgAIContext(orgId: string, userId: string, role: string): Promise<OrgAIContext> {
  // 1. Fetch org details
  // 2. Fetch entity types for this org
  // 3. Fetch KPI summary (green/amber/red counts) — reuse getOverviewInsights()
  // 4. Fetch recent approved values (last 6 periods, scoped by role)
  // 5. Fetch stale KPIs (no value in 30+ days)
  // 6. Count pending approvals
  // RBAC: if role === "MANAGER", only include assigned entities
}

export function contextToPromptText(ctx: OrgAIContext): string {
  // Compress context into a token-efficient text block
}
```

#### `web/src/lib/ai/prompts.ts`
All prompt templates as versioned TypeScript functions:
```ts
export const PROMPTS = {
  chatAssistant: { version: "1.0", build: (ctx, locale) => `...` },
  execSummary:   { version: "1.0", build: (ctx, reportType, locale) => `...` },
  formulaBuilder:{ version: "1.0", build: (description, variables) => `...` },
  autoTranslate: { version: "1.0", build: (fields, direction) => `...` },
  suggestNote:   { version: "1.0", build: (entityTitle, value, avg, unit, locale) => `...` },
};
```

#### `web/src/lib/ai/guardrails.ts`
Post-generation validation:
```ts
export function validateGrounding(response: string, allowedNumbers: number[]): { valid: boolean; suspicious: string[] }
export function isSafeFormula(formula: string): boolean
export const DANGEROUS_PATTERNS: RegExp[]
```

#### `web/src/lib/ai/logger.ts`
Audit logging helper:
```ts
export async function logAiInteraction(params: {
  orgId: string; userId: string; feature: string;
  prompt: string; response: string; model: string;
  tokensIn?: number; tokensOut?: number; latencyMs?: number;
}): Promise<void>
```

**Acceptance:**
- All files compile with `pnpm build`
- `buildOrgAIContext()` returns correct data for a test org
- `contextToPromptText()` produces readable output under 2000 tokens

---

### Step 3: Add `AiInteraction` Prisma Model

**Why:** Every AI call must be logged for governance, cost tracking, and debugging.

**File to modify:** `prisma/schema.prisma`

```prisma
model AiInteraction {
  id        String   @id @default(uuid())
  orgId     String   @map("org_id")
  userId    String   @map("user_id")
  feature   String   // "chat" | "summary" | "formula" | "translate" | "suggest_note"
  prompt    String   // User input (not the full system prompt)
  response  String   // AI output (or first 2000 chars for long responses)
  model     String   // e.g., "gpt-4o"
  tokensIn  Int?     @map("tokens_in")
  tokensOut Int?     @map("tokens_out")
  latencyMs Int?     @map("latency_ms")
  feedback  String?  // "positive" | "negative" | null
  createdAt DateTime @default(now()) @map("created_at")

  org  Organization @relation(fields: [orgId], references: [id])
  user User         @relation(fields: [userId], references: [id])

  @@index([orgId, userId])
  @@index([feature])
  @@index([createdAt])
  @@map("ai_interactions")
}
```

**Commands:**
```bash
cd web && npx prisma migrate dev --name add-ai-interactions
```

**Acceptance:**
- Migration runs cleanly
- `prisma.aiInteraction.create()` works in a test script
- No effect on existing tables

---

### Step 4: Create `buildOrgAIContext()` Implementation

**Why:** This is the most critical function — it assembles the data the AI sees.

**Depends on:** Step 2 (file structure), Step 3 (Prisma model available)

**Implementation details:**

```ts
// web/src/lib/ai/context.ts

import { prisma } from "@/lib/prisma";
import { getUserReadableEntityIds } from "@/actions/entities";

export async function buildOrgAIContext(
  orgId: string,
  userId: string,
  role: string,
): Promise<OrgAIContext> {

  // 1. Org metadata
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { name: true, nameAr: true, vision: true, mission: true },
  });

  // 2. Entity types
  const entityTypes = await prisma.orgEntityType.findMany({
    where: { orgId },
    select: { code: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  // 3. KPI entities (role-scoped)
  let entityFilter: { orgId: string; id?: { in: string[] } } = { orgId };
  if (role === "MANAGER") {
    const ids = await getUserReadableEntityIds(userId, orgId);
    entityFilter = { ...entityFilter, id: { in: ids } };
  }

  const entities = await prisma.entity.findMany({
    where: entityFilter,
    include: {
      values: {
        where: { status: { in: ["APPROVED", "LOCKED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // 4. Compute KPI summary
  let green = 0, amber = 0, red = 0, noData = 0;
  const recentValues = [];
  const staleKpis = [];
  const now = new Date();

  for (const entity of entities) {
    const latestValue = entity.values[0];
    if (!latestValue) { noData++; continue; }

    const achievement = latestValue.achievementValue ?? null;
    const daysAgo = Math.floor((now.getTime() - latestValue.createdAt.getTime()) / 86400000);

    if (achievement != null) {
      if (achievement >= 80) green++;
      else if (achievement >= 60) amber++;
      else red++;
    } else {
      noData++;
    }

    recentValues.push({
      entityTitle: entity.title,
      value: latestValue.finalValue ?? 0,
      achievement,
      status: achievement != null ? (achievement >= 80 ? "GREEN" : achievement >= 60 ? "AMBER" : "RED") : "NO_DATA",
      daysAgo,
    });

    if (daysAgo > 30) {
      staleKpis.push({ title: entity.title, daysSinceUpdate: daysAgo });
    }
  }

  const total = entities.length;
  const overallHealth = total > 0
    ? Math.round(recentValues.reduce((sum, v) => sum + (v.achievement ?? 0), 0) / Math.max(total - noData, 1))
    : 0;

  // 5. Pending approvals count
  const pendingApprovals = await prisma.entityValue.count({
    where: { entity: { orgId }, status: "SUBMITTED" },
  });

  return {
    org,
    entityTypes,
    kpiSummary: { total, green, amber, red, noData, overallHealth },
    recentValues: recentValues.slice(0, 20), // cap for token budget
    staleKpis,
    pendingApprovals,
  };
}
```

**Acceptance:**
- Returns correct counts for a test org
- Manager role only sees assigned entities
- Admin/Executive sees all org entities
- Output stays under ~2000 tokens when serialized

---

### Step 5: Write Prompt Templates

**Why:** Move all inline prompt strings to `lib/ai/prompts.ts`.

**File:** `web/src/lib/ai/prompts.ts`

Implement all 5 prompt builders using patterns from `docs/ai-enablement/08-prompt-engineering-guide.md`:

| Prompt | Key Parameters |
|--------|---------------|
| `chatAssistant` | `OrgAIContext`, `locale` |
| `execSummary` | `OrgAIContext`, `reportType`, `periodLabel`, `locale` |
| `formulaBuilder` | `description`, `variables[]` |
| `autoTranslate` | `fields`, `direction` |
| `suggestNote` | `entityTitle`, `enteredValue`, `historicalAvg`, `unit`, `locale` |

Each prompt must include:
- Grounding instruction ("only cite provided data")
- Language instruction (MSA for Arabic)
- Output format specification
- Scope boundary ("read-only, cannot modify data")

**Acceptance:**
- All prompts compile
- Each prompt produces output under 1000 tokens (system prompt portion)
- Arabic prompts reviewed for terminology consistency

---

## Phase B — Upgrade Existing Features

### Step 6: Upgrade Chat Route to Use AI Service Layer

**Why:** The chat route currently has no org context — the most impactful upgrade.

**File to modify:** `web/src/app/api/ai/chat/route.ts`

**Changes:**
1. Add `requireOrgMember()` auth check
2. Call `buildOrgAIContext()` with session user's orgId, userId, role
3. Use `PROMPTS.chatAssistant.build(ctx, locale)` for system prompt
4. Replace raw `fetch` with Vercel AI SDK `streamText()`
5. Log interaction via `logAiInteraction()`
6. Run `validateGrounding()` on the final response (log suspicious, don't block)

**Before:**
```ts
const systemPrompt = "You are an AI assistant specialized in strategic KPI performance...";
const upstream = await fetch(apiUrl, { ... });
```

**After:**
```ts
const session = await requireOrgMember();
const ctx = await buildOrgAIContext(session.user.orgId, session.user.id, session.user.role);
const system = PROMPTS.chatAssistant.build(ctx, locale);
const result = streamText({ model: getAIModel(), system, prompt: message });
return result.toDataStreamResponse();
```

**Acceptance:**
- Chat responds with org-specific data ("Your overall health is 72%")
- Manager only gets data about their assigned KPIs
- Interaction logged to `ai_interactions` table
- No regression in streaming behavior

---

### Step 7: Upgrade Summary Route

**Why:** Already has partial context — upgrade to full `OrgAIContext` and Vercel AI SDK.

**File to modify:** `web/src/app/api/ai/summary/route.ts`

**Changes:**
1. Replace `getKpiContextForAiReport()` with `buildOrgAIContext()`
2. Use `PROMPTS.execSummary.build()` for prompt
3. Replace raw `fetch` with `streamText()`
4. Log interaction
5. Add response caching (hash context → cache for 60min)

**Acceptance:**
- Summary includes richer org context (vision, mission, stale KPIs)
- Arabic summaries use correct terminology
- Cached responses served when underlying data hasn't changed

---

### Step 8: Upgrade Formula Route

**Why:** Add auth, guardrails, and centralized prompt.

**File to modify:** `web/src/app/api/ai/formula/route.ts`

**Changes:**
1. Add `requireOrgMember()` auth
2. Use `PROMPTS.formulaBuilder.build()` for prompt
3. Add `isSafeFormula()` validation on AI output before returning
4. Log interaction
5. Replace raw `fetch` with Vercel AI SDK `generateObject()` for typed output

**Acceptance:**
- Dangerous formulas blocked by `isSafeFormula()`
- Interaction logged
- Auth enforced

---

### Step 9: Upgrade Translate & Suggest-Note Routes

**File to modify:** `web/src/app/api/ai/translate/route.ts`, `web/src/app/api/ai/suggest-note/route.ts`

**Changes for both:**
1. Add `requireOrgMember()` auth
2. Use centralized prompts from `prompts.ts`
3. Replace raw `fetch` with Vercel AI SDK `generateObject()` / `generateText()`
4. Log interactions
5. Add KPI domain terminology glossary to translate prompt

**Acceptance:**
- Auth enforced on both routes
- Translation uses consistent KPI terminology
- Interactions logged

---

### Step 10: Update Chat Panel Component for Vercel AI SDK Streaming

**Why:** Vercel AI SDK uses a specific streaming protocol. The frontend needs to
consume it correctly.

**File to modify:** `web/src/components/ai/ai-chat-panel.tsx`

**Changes:**
1. If using `useChat()` hook from `ai/react` — simplifies streaming, history, and error handling
2. Alternatively, update the manual `ReadableStream` reader to handle the AI SDK data stream format
3. Add message feedback (thumbs up/down) buttons to each assistant message
4. Add "Clear conversation" button

**Option A — useChat hook (recommended):**
```tsx
import { useChat } from "ai/react";

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: "/api/ai/chat",
  body: { locale },
});
```

**Option B — keep manual streaming:**
Update the stream reader to parse the AI SDK data stream format instead of raw text.

**Acceptance:**
- Streaming still works with the upgraded route
- Feedback buttons appear on assistant messages
- Clear conversation works

---

## Phase C — New AI Features

### Step 11: KPI Definition Wizard (Feature B1)

**New files:**
- `web/src/app/api/ai/kpi-wizard/route.ts` — API route
- `web/src/components/ai/ai-kpi-wizard.tsx` — UI component

**API route:**
- Auth: `requireOrgMember()` (ADMIN only)
- Input: `{ objective: string, sector?: string, locale: string }`
- Prompt: `PROMPTS.kpiWizard.build(objective, sector, locale)`
- Output: JSON array of suggested KPIs with all fields

**UI component:**
- Trigger: "Suggest KPIs" button on entity type page or entity list page
- Modal with:
  - Textarea to describe strategic objective
  - Optional sector selector (if org has sector field)
  - Language toggle
- Output: Card list of suggested KPIs, each with Accept / Edit / Reject buttons
- Accept: pre-fills entity create form and navigates to `/entities/{type}/new`

**Integration:**
- Add to entity type list page header actions

**Acceptance:**
- 5 KPIs suggested with title, titleAr, unit, direction, period, target, formula
- Accept populates create form
- Arabic output uses correct KPI terminology

---

### Step 12: Rejection Comment Generator (Feature B4)

**New files:**
- `web/src/app/api/ai/rejection-comment/route.ts` — API route
- `web/src/components/ai/ai-rejection-comment.tsx` — UI component

**API route:**
- Auth: `requireOrgMember()` (ADMIN or EXECUTIVE)
- Input: `{ entityTitle, submittedValue, historicalValues[], managerNote?, locale }`
- Output: `{ comment: string, commentAr: string }`

**UI component:**
- Trigger: "Suggest comment" button in the rejection dialog on approvals page
- Shows AI-suggested rejection comment
- User can edit before submitting
- Bilingual: generates EN + AR versions

**Integration:**
- Add to the rejection flow on `approvals/page.tsx`

**Acceptance:**
- Comment references the specific anomaly
- Both EN and AR versions generated
- User can edit before confirming

---

### Step 13: Wire AiValueEntryAssist to Real Data

**Why:** Component exists but gets empty/mock props. Needs real historical data.

**Changes needed:**

1. **Server action or data fetch:** Create a function that returns historical context
   for a given entity:
   ```ts
   // web/src/actions/ai-context.ts
   export async function getEntityHistoricalContext(entityId: string): Promise<{
     lastValue: number | null;
     avgValue: number | null;
     expectedMin: number | null;
     expectedMax: number | null;
     trend: "improving" | "declining" | "stable";
   }>
   ```

2. **Wire into value entry flow:** Pass real data to `AiValueEntryAssist` component
   wherever values are entered.

3. **Wire `AiSuggestNoteButton`:** Connect to the note textarea in the value entry form
   with actual entity title and historical data.

**Acceptance:**
- Value entry shows real last value, avg, range
- Anomaly warning triggers on genuinely unusual values
- Suggest note button populates the note field

---

### Step 14: AI Feedback Mechanism

**New file:**
- `web/src/app/api/ai/feedback/route.ts` — POST route to save feedback

**Changes:**
- Add thumbs up/down to `AiChatPanel` messages
- Add thumbs up/down to `AiGenerateSummaryModal` output
- Store in `AiInteraction.feedback` column
- Optional: free-text "What was wrong?" on negative feedback

**Acceptance:**
- Clicking thumbs up/down updates the `AiInteraction` record
- Feedback persists across page refreshes

---

### Step 15: AI Usage Dashboard (Admin)

**New files:**
- `web/src/app/[locale]/admin/ai-usage/page.tsx` — Admin page
- `web/src/actions/ai-usage.ts` — Server actions for usage data

**Dashboard shows:**
- Total AI calls this month (by feature)
- Estimated token cost (tokensIn + tokensOut × model rate)
- Average response latency by feature
- Feedback summary (% positive / negative)
- Top users by AI usage
- Usage trend chart (daily calls over last 30 days)

**Acceptance:**
- Page accessible to ADMIN and SUPER_ADMIN only
- Data sourced from `ai_interactions` table
- Cost estimates based on known model pricing

---

## Phase D — Production Hardening

### Step 16: Rate Limiting

**Implementation:**
- Add `aiDailyTokenLimit` and `aiMonthlyTokenLimit` fields to `Organization` model
- Before each AI call, check current usage from `ai_interactions` aggregate
- Return 429 with a friendly message if limit exceeded
- Show usage indicator in the chat panel ("42% of monthly AI budget used")

**Acceptance:**
- Org exceeding daily limit gets 429 on all AI routes
- Usage indicator visible in chat panel
- SUPER_ADMIN can adjust limits per org

---

### Step 17: Response Caching

**Implementation:**
- Hash the context + prompt for summary and translate features
- Store cached responses with TTL (60 min for summaries, 24 hours for translations)
- Use in-memory Map or a simple `ai_cache` Prisma table
- "Refresh" button bypasses cache

**Acceptance:**
- Repeated identical summary requests return cached response instantly
- Cache invalidates when underlying KPI data changes
- Cache hit rate tracked in usage dashboard

---

### Step 18: Error Handling & Resilience

**Implementation:**
- Add timeout (30s) on all LLM API calls
- Add retry with exponential backoff (max 2 retries)
- Surface user-friendly error messages in all components (not raw error strings)
- Add health check endpoint: `GET /api/ai/health` — verifies API key is valid
- Log all errors to `ai_interactions` with `response = "ERROR: {message}"`

**Acceptance:**
- LLM API timeout shows "AI is taking longer than expected" message
- Network errors show "AI service temporarily unavailable" with retry button
- Health check returns `{ status: "ok" | "error", model: "gpt-4o" }`

---

### Step 19: Guardrails Enforcement

**Implementation:**
- Run `validateGrounding()` on chat and summary responses
- If suspicious numbers found, append a warning to the response:
  `"⚠️ Some values in this response could not be verified against your data."`
- Run `isSafeFormula()` on all formula builder output; block unsafe formulas
- Add prompt injection detection for chat input (basic pattern matching)

**Acceptance:**
- Chat response with invented numbers gets a warning appended
- Formula with `eval()` or `fetch()` is blocked
- Prompt injection attempts ("ignore all instructions") handled gracefully

---

### Step 20: End-to-End Testing & Documentation

**Testing:**
- Run all smoke tests from `docs/ai-enablement/09-testing-and-evaluation.md`
- Generate 10 English + 10 Arabic chat responses → score quality
- Test RBAC: Manager chat scoped correctly
- Test formula injection: 5 dangerous prompts blocked
- Test feature gate: all AI UI hidden when disabled
- Performance: all features within target latency

**Documentation updates:**
- Update `docs/ai-enablement/07-current-implementation.md` with final state
- Update `docs/ai-enablement/README.md` status table
- Update `web/ai-env-example.txt` with any new env vars
- Write brief user-facing help text for each AI feature

**Acceptance:**
- All tests pass
- Docs reflect reality
- Ready for production deployment

---

## File Creation Summary

### New files to create:

```
web/src/lib/ai/
├── client.ts           ← LLM client factory (Vercel AI SDK)
├── context.ts          ← buildOrgAIContext() + contextToPromptText()
├── prompts.ts          ← All prompt templates (versioned)
├── guardrails.ts       ← validateGrounding(), isSafeFormula()
└── logger.ts           ← logAiInteraction() helper

web/src/actions/
└── ai-context.ts       ← getEntityHistoricalContext() for value entry

web/src/app/api/ai/
├── kpi-wizard/route.ts        ← KPI definition wizard
├── rejection-comment/route.ts ← Rejection comment generator
├── feedback/route.ts          ← Save user feedback
└── health/route.ts            ← Health check endpoint

web/src/components/ai/
├── ai-kpi-wizard.tsx          ← KPI wizard modal
└── ai-rejection-comment.tsx   ← Rejection comment suggestion

web/src/app/[locale]/admin/
└── ai-usage/page.tsx          ← AI usage dashboard
```

### Existing files to modify:

```
prisma/schema.prisma                         ← Add AiInteraction model
web/src/app/api/ai/chat/route.ts             ← Full upgrade (auth, context, SDK, logging)
web/src/app/api/ai/summary/route.ts          ← Upgrade (full context, SDK, caching)
web/src/app/api/ai/formula/route.ts          ← Upgrade (auth, guardrails, SDK)
web/src/app/api/ai/translate/route.ts        ← Upgrade (auth, prompts, SDK)
web/src/app/api/ai/suggest-note/route.ts     ← Upgrade (auth, prompts, SDK)
web/src/components/ai/ai-chat-panel.tsx       ← Vercel AI SDK streaming + feedback
web/src/components/ai/index.ts               ← Add new component exports
```

---

## Dependency Summary

```
Step 1  ─────────────────────────────► (no dependency)
Step 2  ─────────────────────────────► depends on Step 1
Step 3  ─────────────────────────────► (no dependency, can parallel with 1-2)
Step 4  ─────────────────────────────► depends on Steps 2, 3
Step 5  ─────────────────────────────► depends on Step 2
Step 6  ─────────────────────────────► depends on Steps 4, 5
Step 7  ─────────────────────────────► depends on Steps 4, 5
Step 8  ─────────────────────────────► depends on Steps 2, 5
Step 9  ─────────────────────────────► depends on Steps 2, 5
Step 10 ─────────────────────────────► depends on Step 6
Steps 11-15 ─────────────────────────► depend on Phase B completion
Steps 16-20 ─────────────────────────► depend on Phase C completion
```

**Critical path:** Step 1 → Step 2 → Step 4 → Step 6 (chat with real data)

---

## Effort Estimates

| Phase | Steps | Estimated Effort | Developer |
|-------|-------|-----------------|-----------|
| **A** | 1–5 | 3–5 days | 1 full-stack dev |
| **B** | 6–10 | 3–5 days | 1 full-stack dev |
| **C** | 11–15 | 5–8 days | 1 full-stack dev |
| **D** | 16–20 | 3–5 days | 1 full-stack dev |
| **Total** | 20 steps | **~3–4 weeks** | 1 developer |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| LLM API cost overrun | Rate limiting (Step 16) + model tiering (GPT-4o-mini for translate/formula) |
| Hallucinated numbers in reports | Grounding prompts + `validateGrounding()` (Step 19) |
| RBAC bypass via chat | Context builder scopes data by role (Step 4) |
| Formula injection | `isSafeFormula()` blocklist (Step 8) |
| Arabic output quality | KPI terminology glossary in prompts + native speaker review |
| API key exposure | Server-side only env vars, never in client bundle |
| Feature breaks existing app | Feature gate `NEXT_PUBLIC_AI_ENABLED` — all AI off by default |

---

## Definition of Done

The AI frontend is production-ready when:

- [ ] All 5 existing API routes upgraded with auth, context, prompts, logging
- [ ] Chat returns org-specific answers grounded in real KPI data
- [ ] Manager chat is scoped to their assigned entities only
- [ ] All AI interactions logged to `ai_interactions` table
- [ ] KPI Wizard suggests relevant KPIs from natural language
- [ ] Formula guardrails block unsafe code
- [ ] Rate limiting prevents cost overrun
- [ ] 10 English + 10 Arabic chat samples score ≥ 3.5 quality
- [ ] Feature gate OFF hides all AI UI and returns 403 on routes
- [ ] Documentation reflects final implementation state
