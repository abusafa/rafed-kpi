# AI Enablement — Rafed KPI

This folder contains the complete documentation for transforming Rafed KPI from a
governed data-entry and reporting platform into an **AI-powered strategy execution
intelligence system** using Large Language Models (LLMs) and supporting AI techniques.

---

## Current Implementation Status

> **Last updated:** March 2026

| Layer | Status | Details |
|-------|--------|---------|
| **Feature gate** | ✅ Done | `NEXT_PUBLIC_AI_ENABLED=true` env var via `web/src/lib/ai-features.ts` |
| **API routes** | ✅ Done (5/5 Phase 1) | `chat`, `summary`, `formula`, `translate`, `suggest-note` |
| **UI components** | ✅ Done (7 components) | Chat panel, summary modal, formula builder, translate button, review card, value entry assist, suggest note |
| **Page integrations** | ✅ Done | App shell, overview, dashboards, entity edit/new, approvals |
| **i18n keys** | ✅ Done | 70+ keys in both `en.json` and `ar.json` |
| **Server-side AI lib** | ⬜ Not started | `web/src/lib/ai/` — context builder, prompt templates, guardrails |
| **Vercel AI SDK** | ⬜ Not started | Currently using raw `fetch` to OpenAI-compatible APIs |
| **Prisma AiInteraction** | ⬜ Not started | Audit log model not yet in schema |
| **pgvector / RAG** | ⬜ Not started | Phase 2+ |

### What Works Today
The current frontend is a **thin proxy layer**: components call Next.js API routes that
forward requests to any OpenAI-compatible endpoint (configured via `AI_API_KEY`,
`AI_API_URL`, `AI_MODEL` env vars). There is no org-context injection, no RBAC-scoped
prompts, and no audit logging yet. These are the next priorities.

---

## Why AI for a KPI Platform?

Rafed KPI already collects structured, governed, bilingual performance data across
organizations. This is exactly the kind of high-quality, domain-specific data that
makes LLM integration powerful and immediately valuable — the AI has real, trusted
context to reason over rather than generic internet knowledge.

The goal is not to replace human judgment, but to:
- Surface insights faster than any human can read through a dashboard
- Generate the first draft of analyses and reports that leaders currently spend hours writing
- Alert decision-makers to risks before they appear in red on a chart
- Help non-technical users interact with their own data naturally, in Arabic or English

---

## Document Index

| # | Document | What It Covers |
|---|----------|---------------|
| [01](./01-vision-and-use-cases.md) | Vision & AI Use Cases | The "why" — what problems AI solves, user stories by role |
| [02](./02-feature-catalogue.md) | AI Feature Catalogue | Full list of proposed features with priority and complexity |
| [03](./03-architecture-and-integration.md) | Architecture & Integration | How AI connects to the existing Next.js / Prisma stack |
| [04](./04-data-readiness.md) | Data Readiness | What data we have, what needs enriching, prompt context design |
| [05](./05-implementation-roadmap.md) | Implementation Roadmap | Phased plan — from first prototype to full AI platform |
| [06](./06-risks-and-guardrails.md) | Risks & Guardrails | Hallucination, privacy, bias, governance, and mitigations |
| [07](./07-current-implementation.md) | Current Implementation | Inventory of what is already built — components, routes, integrations |
| [08](./08-prompt-engineering-guide.md) | Prompt Engineering Guide | Detailed prompt design patterns for each feature, Arabic considerations |
| [09](./09-testing-and-evaluation.md) | Testing & Evaluation | How to test AI features, quality metrics, evaluation framework |
| [10](./10-new-feature-proposals.md) | New Feature Proposals | 19 additional AI features — root cause analysis, risk intelligence, project narration, dashboard insights |
| — | [User Stories](./user-stories/) | Detailed user stories by role (Executive, Manager, Admin, Approver, Super Admin) |

---

## Quick Summary: AI Feature Tiers

### Tier 1 — Conversational Intelligence & Quick Wins (Months 1–3)
> Chat with your KPI data in plain Arabic or English

- **AI Strategy Analyst** — natural language Q&A over org performance data ✅ *UI built*
- **Auto-generated Executive Summary** — one-click narrative report from dashboard data ✅ *UI built*
- **Smart Anomaly Alerts** — proactive "something unusual happened" notifications ✅ *UI built (value entry assist, review context)*
- **Formula Builder Assistant** — describe the metric in words, AI writes the formula ✅ *UI built*
- **Arabic/English Auto-translation** — AI fills `titleAr`/`descriptionAr` fields ✅ *UI built*
- **AI-Suggested Submission Note** — AI suggests a note when value is anomalous ✅ *UI built*

### Tier 2 — Generative Assistance (Months 3–6)
> AI helps users do their jobs faster

- **KPI Definition Wizard** — AI suggests KPIs based on strategic pillars
- **Rejection Comment Generator** — structured feedback when approver rejects a value
- **Automated Period Report Writer** — AI generates end-of-period reports
- **Smart Value Entry Assist** — expected range, anomaly warning, deadline reminder *(partial — UI built, needs server-side context)*
- **Governance Health Advisor** — weekly AI governance report for Admins

### Tier 3 — Predictive Intelligence (Months 6–12)
> AI predicts what will happen before it does

- **KPI Trend Forecasting** — predict next quarter's value from historical trend
- **At-Risk Early Warning** — flag KPIs likely to go RED before the period closes
- **Strategy Alignment Scoring** — detect KPIs that are not contributing to any pillar

### Tier 4 — Autonomous Agents (Future)
> AI takes actions on behalf of users

- **Automated Period Reports** — send stakeholder briefings with no human authoring
- **Correction Suggestions** — AI recommends target adjustments based on benchmarks
- **Cross-org Benchmarking** — compare performance against anonymized peer orgs

### Tier 5 — New Proposals (March 2026)
> Cross-cutting AI features unlocked by platform maturity — risks, projects, dashboards

- **AI Root Cause Analysis** — "why did this KPI drop?" with cross-entity investigation (E1) `P1`
- **AI Dashboard Insight Cards** — one AI sentence per dashboard highlighting key takeaway (I2) `P1`
- **Smart Notifications Digest** — AI-prioritized daily summary replacing notification noise (I1) `P1`
- **Project Health Narrator** — plain-language project health from milestones + risks + KPIs (F1) `P1`
- **Risk Assessment Generator** — severity, likelihood, mitigation, KPI impact from description (G1) `P1`
- **Auto-Description from Title** — zero-click AI description + Arabic description on KPI create (J2) `P1`
- **Report Narrator** — narrative layer on the Reports page for filtered data (H1) `P1`
- **Change Request Impact Analysis** — downstream effect preview before CR approval (J4) `P2`
- **Comparative Period Analysis** — Q-over-Q structured comparison (H3) `P2`
- **What-If Scenario Modeler** — "what if this KPI drops to X?" cascading impact (E3) `P2`

See [10-new-feature-proposals.md](./10-new-feature-proposals.md) for full details on all 19 new features.

---

## Recommended LLM Stack

| Component | Recommended Option | Alternative |
|-----------|-------------------|-------------|
| Primary LLM | OpenAI GPT-4o | Anthropic Claude 3.5 Sonnet |
| Arabic-first LLM | Jais (MBZUAI) | Allam (SDAIA / Saudi) |
| Embeddings | OpenAI `text-embedding-3-small` | Cohere Embed v3 |
| Vector DB | Postgres + `pgvector` (already in stack) | Pinecone |
| Orchestration | Vercel AI SDK (fits Next.js) | LangChain.js |
| Self-hosted option | Ollama + Llama 3.1 | vLLM |

---

## Environment Variables

The current implementation uses three server-side env vars (provider-agnostic):

```env
NEXT_PUBLIC_AI_ENABLED=true   # Feature gate — must be "true" to enable AI UI
AI_API_KEY=sk-...             # API key for any OpenAI-compatible provider
AI_API_URL=https://api.openai.com/v1/chat/completions  # Override for alt providers
AI_MODEL=gpt-4o              # Model to use
```

See `web/ai-env-example.txt` for a complete example.
