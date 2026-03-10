# New AI Feature Proposals
## Beyond the Original Catalogue — Features Unlocked by Platform Maturity

> These features were not in the original AI Feature Catalogue (Doc 02). They are
> proposed based on the platform's current capabilities: risks, projects, departments,
> dashboards (executive, governance, risk-escalation, initiative-health, employee-contribution),
> reports, responsibilities, and the existing AI foundation (7 components, 5 API routes).

---

## Category E — Root Cause & Correlation Intelligence

### E1 — AI Root Cause Analysis
**Priority:** P1 | **Complexity:** M | **Phase:** 2

When a KPI turns RED or drops significantly, AI generates a structured root cause
analysis by cross-referencing related data across the system.

**How it works:**
1. User clicks "Why did this drop?" on any entity detail page showing a RED KPI
2. AI examines:
   - Historical values and trend pattern
   - Correlated KPIs (same pillar/objective) — did they also drop?
   - Risk register — are there escalated risks linked to this initiative?
   - Project milestones — are related projects delayed or blocked?
   - Seasonal patterns — did this happen last year at the same time?
   - Recent change requests — was the target or formula recently modified?
3. AI generates a structured analysis:

```
## Root Cause Analysis — Employee Retention Rate (41%)

### Pattern Detected: Sustained Decline
- Declined from 78% → 65% → 52% → 41% over 4 quarters
- This is NOT a one-time drop — it's a structural trend

### Contributing Factors Found:
1. 🔴 Risk "High turnover in engineering" (CRITICAL severity) — escalated 45 days ago, still open
2. 🟡 Related KPI "Employee Satisfaction Score" also declined (72% → 58%)
3. ⚠️ Project "HR Retention Program" — 2 of 3 milestones are BLOCKED

### Recommended Actions:
1. Prioritize unblocking the HR Retention Program milestones
2. Address the escalated turnover risk — assign an owner if not already assigned
3. Consider revising the retention target from 80% to 70% while remediation is in progress
```

**UI placement:** "Analyze" button on entity detail page (RED/AMBER KPIs only)

**Why this is high-value:** Today, users see a RED number and have to manually
investigate across dashboards, risk registers, and project pages. This AI feature
does that investigation in seconds.

---

### E2 — KPI Correlation Detector
**Priority:** P2 | **Complexity:** M | **Phase:** 3

AI identifies statistically significant correlations between KPIs that may indicate
causal relationships or hidden dependencies.

**Output example:**
> "Strong negative correlation detected between **Cost Per Hire** and **Employee
> Retention Rate** (r = -0.87 over 8 periods). When hiring costs increase, retention
> tends to drop. This may indicate that rushed hiring leads to poor cultural fit."

**Use cases:**
- Discover leading indicators (KPI X moves before KPI Y)
- Detect contradictory KPIs (optimizing X hurts Y)
- Validate that initiative KPIs actually drive pillar outcomes

**UI placement:** New "Correlations" tab on the KPI Performance Dashboard

---

### E3 — AI What-If Scenario Modeler
**Priority:** P2 | **Complexity:** L | **Phase:** 3

Executive asks: *"What happens to our overall health if Revenue Growth drops to 60%?"*

AI recalculates:
- The KPI's RAG status change
- The parent objective/pillar weighted health impact
- The overall org health score impact
- Which other KPIs would need to compensate

**UI:** Interactive slider on entity detail page or a dedicated "Scenario" modal.
User adjusts hypothetical values; AI shows cascading effects in real-time.

---

## Category F — Project & Initiative Intelligence

### F1 — AI Project Health Narrator
**Priority:** P1 | **Complexity:** S | **Phase:** 2

On each project detail page, AI generates a plain-language health summary based on:
- Milestone completion rate and overdue milestones
- Related KPI performance
- Associated risks (count, severity)
- Team assignment coverage
- Timeline (days remaining vs. % complete)

**Output example:**
> "**Project Health: 🟡 At Risk**
> 3 of 7 milestones are complete (43%), but the project is 65% through its timeline.
> 2 milestones are BLOCKED. The linked KPI 'Process Cycle Time' is trending downward.
> Risk: The critical-severity risk 'Vendor delivery delay' has been open for 30 days
> with no mitigation action recorded."

**UI placement:** "AI Summary" card on `projects/[projectId]/page.tsx`

---

### F2 — AI Initiative Impact Assessment
**Priority:** P2 | **Complexity:** M | **Phase:** 2

When an admin creates or modifies an initiative, AI assesses its potential impact on
the strategic pillar it belongs to.

**Input:** Initiative description, linked KPIs, assigned resources
**Output:**
- Coverage analysis: "This initiative addresses 3 of 5 KPIs under the Growth pillar"
- Gap identification: "KPIs 'Market Share' and 'Brand Awareness' are not covered by any initiative"
- Resource assessment: "2 of the 4 assigned team members also own 5+ other KPIs — workload risk"

**UI placement:** "AI Assessment" section on initiative create/edit page

---

### F3 — AI Milestone Predictor
**Priority:** P3 | **Complexity:** M | **Phase:** 3

Based on historical milestone completion patterns for this project and similar projects,
predict whether upcoming milestones will be completed on time.

**Output:**
> "Milestone 'Phase 2 Deployment' (due in 14 days) has a **35% probability** of
> on-time completion based on: current velocity (1.2 milestones/month vs. required 2),
> 2 blocking dependencies unresolved, and the team's historical pattern of 8-day delays
> on deployment milestones."

---

## Category G — Risk Intelligence

### G1 — AI Risk Assessment Generator
**Priority:** P1 | **Complexity:** S | **Phase:** 2

When a user creates a new risk entry, AI suggests:
- **Severity classification** based on the description
- **Likelihood score** based on similar risks in the org or sector
- **Mitigation strategies** — 3–5 actionable recommendations
- **KPI impact mapping** — which KPIs will be affected if this risk materializes

**Example:**
```
Risk: "Key supplier may not deliver components on time"

AI Assessment:
  Suggested Severity: HIGH
  Suggested Likelihood: MEDIUM (based on 3 similar vendor risks in your org history)

  Potential KPI Impact:
  - Production Output (direct) — could drop 15–25%
  - Cost Per Unit (indirect) — may increase due to expedited alternatives
  - Customer Delivery SLA (indirect) — at risk if production delays > 2 weeks

  Recommended Mitigations:
  1. Identify backup supplier and negotiate standby terms
  2. Increase safety stock by 2 weeks' buffer
  3. Establish weekly supplier status check-in
```

**UI placement:** "AI Assess" button on risk create form + risk detail page

---

### G2 — AI Risk Escalation Advisor
**Priority:** P2 | **Complexity:** S | **Phase:** 2

AI monitors the risk register and proactively recommends escalation when:
- A risk has been at HIGH/CRITICAL severity for > 14 days with no mitigation action
- Multiple related risks are emerging in the same initiative
- A risk's linked KPIs have started declining
- A risk owner is inactive or has too many assigned risks

**Alert format:**
> "🚨 **Escalation Recommended:** Risk 'Regulatory compliance gap' has been CRITICAL
> for 21 days. No mitigation actions recorded. The linked KPI 'Compliance Rate'
> dropped from 89% to 71% this month. Recommend escalating to the pillar owner."

**UI placement:** Alert banner on Risk Escalation Dashboard + notification

---

## Category H — Reports & Data Intelligence

### H1 — AI-Powered Report Narrator
**Priority:** P1 | **Complexity:** S | **Phase:** 2

On the Reports page (which currently shows a flat KPI data table), add an AI narrative
layer that converts the tabular data into a readable performance story.

**How it works:**
1. User applies filters (entity type, period, status)
2. Clicks "Generate Narrative"
3. AI reads the filtered report data and produces:
   - Executive summary paragraph
   - Top 3 performers with context
   - Bottom 3 performers with recommended actions
   - Data quality note (missing values, stale data)

**Difference from A2 (Executive Summary):** A2 works on the overview dashboard.
H1 works on the **Reports page** with user-selected filters, producing a filtered,
contextual narrative — not a whole-org summary.

**UI placement:** "AI Narrative" button in Reports page header

---

### H2 — AI Data Import Assistant
**Priority:** P2 | **Complexity:** M | **Phase:** 2

When an admin uploads a CSV or Excel file with historical KPI data, AI helps map
columns to the correct fields:

**Flow:**
1. Admin uploads a file
2. AI reads the column headers and sample values
3. Suggests mapping: `"الإيرادات" → title (AR), "Revenue" → title (EN), "%" → unit, "شهري" → MONTHLY`
4. Detects potential issues: "Column 'Q4 Target' has 3 empty values — fill or skip?"
5. Shows preview of imported entities with AI-suggested enrichment (descriptions, directions)

**Why this matters:** Onboarding new organizations is the most time-consuming admin task.
AI-assisted import can reduce it from hours to minutes.

---

### H3 — AI Comparative Period Analysis
**Priority:** P2 | **Complexity:** S | **Phase:** 2

User selects two periods (e.g., Q1 vs Q2) and AI generates a structured comparison:

```
## Q1 → Q2 Performance Comparison

### Improved (12 KPIs):
- Revenue Growth: 67% → 91% (+24pp) — strongest improvement
- Customer Acquisition: 38% → 55% (+17pp)

### Declined (5 KPIs):
- Employee Retention: 52% → 41% (-11pp) — most concerning
- Cost Efficiency: 82% → 78% (-4pp)

### Unchanged (3 KPIs):
- Compliance Rate: stable at 94%

### Key Insight:
Growth-oriented KPIs improved significantly while People-related KPIs declined.
This may indicate resource allocation trade-offs — growth is consuming attention
at the expense of retention programs.
```

**UI placement:** "Compare Periods" button on dashboards or reports page

---

## Category I — User Experience & Productivity

### I1 — AI Smart Notifications Digest
**Priority:** P1 | **Complexity:** S | **Phase:** 2

Instead of individual notification emails, AI generates a daily/weekly digest that
prioritizes and contextualizes all pending items:

**Daily Manager Digest:**
```
Good morning, Ahmed.

🔴 URGENT (2 items):
1. KPI "Cost Per Hire" is 5 days past its monthly deadline — enter your value now
2. You have 1 submitted value rejected — "Revenue Q1" needs resubmission with documentation

🟡 ATTENTION (3 items):
3. KPI "Training Hours" entered at 12 hours — this is 60% below your average (30 hrs). Confirm or correct.
4. 2 values you submitted are awaiting approval (avg wait: 3 days)
5. Project "Digital Transformation" has a milestone due in 5 days

✅ GOOD NEWS:
- 4 of your 7 KPIs are GREEN this month — strong performance on Customer Satisfaction (95%)
```

**Delivery:** In-app notification panel + optional email

---

### I2 — AI Dashboard Insight Cards
**Priority:** P1 | **Complexity:** S | **Phase:** 2

On each specialized dashboard (Executive, KPI Performance, Initiative Health,
Employee Contribution, Risk Escalation, Governance), add an AI insight card that
highlights the most important takeaway.

**Example — Executive Dashboard:**
> "📊 Your organization's health improved from 64% to 72% this quarter. The primary
> driver was Growth pillar KPIs (+15pp average). However, 3 KPIs in People & Culture
> are now RED — the worst cluster performance in 6 months. Focus area: Employee Retention."

**Example — Risk Escalation Dashboard:**
> "⚠️ You have 4 CRITICAL risks, up from 2 last month. 2 have been open > 30 days
> with no mitigation recorded. Risk 'Regulatory compliance gap' is linked to 3 KPIs
> that are all declining — this is your highest-priority risk."

**How it works:**
- Each dashboard already has an `insights` server action (e.g., `getExecutiveDashboardInsights()`)
- AI receives that data and generates a 2–3 sentence insight
- Cached for 1 hour, refreshed when data changes

**UI placement:** Collapsible "AI Insight" card at the top of each dashboard

---

### I3 — AI Responsibility Workload Analyzer
**Priority:** P2 | **Complexity:** S | **Phase:** 2

On the Responsibilities page, AI analyzes entity assignments and identifies:

- **Overloaded users** — users with too many KPIs relative to peers
- **Unassigned entities** — KPIs with no owner
- **Unbalanced distribution** — departments where one person owns 80% of KPIs
- **At-risk assignments** — users whose KPIs are mostly RED/AMBER

**Output:**
> "⚠️ **Workload Imbalance Detected:**
> - Ahmed owns 18 KPIs (org average: 6). 8 of his KPIs are overdue.
> - 4 KPIs in the Operations pillar have no assigned owner.
> - Recommendation: Redistribute 5–7 of Ahmed's KPIs to Sarah (currently owns 2)
>   or Khalid (currently owns 3)."

**UI placement:** "AI Analysis" card on Responsibilities page

---

### I4 — AI Meeting Preparation Brief
**Priority:** P2 | **Complexity:** S | **Phase:** 2

One-click generation of a pre-meeting KPI brief for a specific audience:

**Options:**
- Board meeting brief (full org, strategic focus)
- Department review (filtered to one department's KPIs)
- Project review (one project's KPIs, risks, milestones)
- Manager 1:1 (one user's assigned KPIs)

**Output format:** Structured talking points, not a full report. Designed to be
read in 2 minutes before a meeting.

```
## Pre-Meeting Brief: Operations Department Review
### Date: March 10, 2026

**3 Things Going Well:**
1. Process Cycle Time at 88% — best in 6 months
2. All 4 monthly KPIs submitted on time
3. Risk "Equipment failure" mitigated and closed

**3 Things to Discuss:**
1. Cost Efficiency dropped 4pp — is this a trend or one-time?
2. 2 KPIs have no baseline set — need historical data
3. Project "Automation Phase 2" milestone is 8 days overdue

**Key Question for the Team:**
"What specific actions will bring Cost Efficiency back above 80% by end of Q2?"
```

**UI placement:** "Prepare Brief" button accessible from overview or dashboard pages

---

## Category J — Advanced AI Capabilities

### J1 — Voice-to-Chat (Arabic & English)
**Priority:** P3 | **Complexity:** M | **Phase:** 3

Enable voice input in the AI Chat Panel — users speak their question in Arabic
or English, the browser's Speech Recognition API transcribes it, and the chat
processes it as text.

**Why:** Saudi executives in meetings may prefer speaking over typing. Arabic voice
input is increasingly well-supported by browser APIs and Whisper-based transcription.

**Implementation:** Use Web Speech API (browser-native) or Whisper API (server-side)
for transcription, then feed into the existing chat pipeline.

---

### J2 — AI-Generated KPI Descriptions from Title
**Priority:** P1 | **Complexity:** S | **Phase:** 1

When an admin types a KPI title (e.g., "Customer Satisfaction Score"), AI auto-suggests
a description and Arabic description without the user clicking anything.

**How:** Debounced API call after the user stops typing the title (500ms delay).
AI returns:
```json
{
  "description": "Measures overall customer satisfaction with products and services, typically collected via post-interaction surveys on a 1-5 or 1-10 scale.",
  "descriptionAr": "يقيس مدى رضا العملاء العام عن المنتجات والخدمات، ويُجمع عادةً عبر استبيانات ما بعد التفاعل على مقياس 1-5 أو 1-10."
}
```

**UI:** Subtle "AI suggested" ghost text that appears below the description field.
User can accept with one click or ignore.

**Why this is impactful:** Most KPIs in existing orgs have empty descriptions (Gap 1
in Data Readiness). This feature fills descriptions passively with zero effort.

---

### J3 — AI Email Report Delivery
**Priority:** P2 | **Complexity:** M | **Phase:** 3

Scheduled AI-generated performance reports sent via email to configured recipients.

**Configuration (Admin):**
- Frequency: daily / weekly / monthly / quarterly
- Recipients: selected users or email addresses
- Report type: executive summary / department digest / full board report
- Language: AR / EN / both

**How:** Cron job runs at configured frequency → calls `buildOrgAIContext()` → generates
report via LLM → formats as HTML email → sends via configured SMTP / SendGrid / SES.

---

### J4 — AI Change Request Impact Analysis
**Priority:** P2 | **Complexity:** S | **Phase:** 2

When someone submits a Change Request (target change, formula change, KPI restructure),
AI analyzes the downstream impact before the approver reviews it:

**Example — Target Change Request:**
> "Change Request: Reduce 'Revenue Growth' target from 90% to 75%.
>
> **AI Impact Analysis:**
> - Current achievement would change from 🔴 RED (67%) to 🟡 AMBER (80%)
> - The Growth pillar weighted health would improve from 61% to 69%
> - Overall org health would improve from 68% to 71%
> - ⚠️ Warning: 3 other orgs in this sector have targets ≥ 85% — reducing to 75%
>   would place this org below the peer benchmark."

**UI placement:** Inline card on Change Request approval page

---

## New Feature Summary

| ID | Feature | Category | Priority | Complexity | Phase |
|----|---------|----------|----------|------------|-------|
| E1 | Root Cause Analysis | Root Cause & Correlation | P1 | M | 2 |
| E2 | KPI Correlation Detector | Root Cause & Correlation | P2 | M | 3 |
| E3 | What-If Scenario Modeler | Root Cause & Correlation | P2 | L | 3 |
| F1 | Project Health Narrator | Project & Initiative | P1 | S | 2 |
| F2 | Initiative Impact Assessment | Project & Initiative | P2 | M | 2 |
| F3 | Milestone Predictor | Project & Initiative | P3 | M | 3 |
| G1 | Risk Assessment Generator | Risk Intelligence | P1 | S | 2 |
| G2 | Risk Escalation Advisor | Risk Intelligence | P2 | S | 2 |
| H1 | Report Narrator | Reports & Data | P1 | S | 2 |
| H2 | Data Import Assistant | Reports & Data | P2 | M | 2 |
| H3 | Comparative Period Analysis | Reports & Data | P2 | S | 2 |
| I1 | Smart Notifications Digest | UX & Productivity | P1 | S | 2 |
| I2 | Dashboard Insight Cards | UX & Productivity | P1 | S | 2 |
| I3 | Responsibility Workload Analyzer | UX & Productivity | P2 | S | 2 |
| I4 | Meeting Preparation Brief | UX & Productivity | P2 | S | 2 |
| J1 | Voice-to-Chat | Advanced | P3 | M | 3 |
| J2 | Auto-Description from Title | Advanced | P1 | S | 1 |
| J3 | Email Report Delivery | Advanced | P2 | M | 3 |
| J4 | Change Request Impact Analysis | Advanced | P2 | S | 2 |

---

## Updated Priority Matrix (Including New Features)

```
                    HIGH IMPACT
                         │
    J2 Auto-Description ─┤─── E1 Root Cause Analysis
    I2 Dashboard Insights┤─── I1 Smart Digest
    G1 Risk Assessment ──┤─── F1 Project Narrator
    H1 Report Narrator ──┤─── H3 Period Comparison
                         │
LOW COMPLEXITY ──────────┼────────────────── HIGH COMPLEXITY
                         │
    G2 Risk Escalation ──┤─── E2 Correlation Detector
    I3 Workload Analyzer ┤─── E3 What-If Modeler
    J4 CR Impact ────────┤─── H2 Data Import
    I4 Meeting Brief ────┤─── J3 Email Reports
                         │
                    LOW IMPACT
```

**Highest-impact, lowest-complexity new features (start here):**
- **J2** — Auto-Description from Title (passive, zero-click, fixes data quality)
- **I2** — Dashboard Insight Cards (one AI sentence per dashboard)
- **I1** — Smart Notifications Digest (daily AI-summarized priorities)
- **G1** — Risk Assessment Generator (structured risk analysis)
- **H1** — Report Narrator (narrative layer on existing reports page)
- **F1** — Project Health Narrator (AI summary on project detail)
