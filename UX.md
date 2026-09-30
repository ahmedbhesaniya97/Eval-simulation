# Voice Agent Evaluation — UI/UX Guidelines

## 1. Product Goal

Build a simple evaluation workflow for a low-code voice AI platform.

The user should be able to:

1. Create and manage evaluations.
2. Select past production sessions.
3. Choose which evaluations to run.
4. Optionally exclude sessions using skip rules.
5. Run the evaluation.
6. Understand results at both aggregate and individual-session levels.
7. Review previous evaluation runs and compare outcomes over time.

Keep **Evaluation completely separate from Simulation**.

---

# 2. Core Mental Model

Use this simple model throughout the UI:

**Evaluation**

> "How do I know if my agent is performing correctly?"

**Evaluation Definition**

> "What should I check?"

**Session**

> "Which real conversations should I check?"

**Evaluation Run**

> "Run these checks against these sessions."

**Result**

> "What did we learn?"

Do not expose technical terminology unless necessary.

---

# 3. Evaluation Types

Provide a few built-in evaluations that work immediately.

Example standard evaluations:

### Goal Completion

Did the agent successfully complete the user's request?

### Response Quality

Did the agent provide an appropriate and useful response?

### Policy / Instruction Following

Did the agent follow the configured instructions?

### Conversation Outcome

Did the conversation end with the expected outcome?

The exact standard evaluations can be changed later.

Also provide:

### Custom Evaluation

Users can create their own evaluation.

Required fields:

* **Evaluation name**
* **Success criteria**
* **Failure criteria**
* **Required** — Yes / No

Example:

**Name**

> Agent verifies customer identity

**Success criteria**

> The agent verifies the customer's identity before sharing account information.

**Failure criteria**

> The agent shares account information without verifying the customer.

**Required**

> Yes

Keep the creation experience simple. Do not expose advanced configuration in the first version.

---

# 4. Evaluation List

Create an **Evaluations** page.

Each evaluation should show:

| Evaluation            | Type     | Required | Usage          | Status |
| --------------------- | -------- | -------- | -------------- | ------ |
| Goal Completion       | Standard | Yes      | 1,245 sessions | Active |
| Response Quality      | Standard | No       | 1,245 sessions | Active |
| Identity Verification | Custom   | Yes      | 430 sessions   | Active |

Actions:

* Create evaluation
* Edit
* Duplicate
* Enable / Disable
* Delete

Use clear visual distinction between:

**Standard** and **Custom**

Avoid making the page feel like an engineering configuration screen.

---

# 5. Start Evaluation Flow

Primary CTA:

**Run Evaluation**

The flow should be a simple step-by-step process.

### Step 1 — Select Sessions

Allow users to select past sessions.

Support:

* Multi-select
* Select all
* Search
* Date range
* Filters
* Session preview

Show:

> **245 sessions selected**

Each session should provide enough information to identify it:

```text
Session
Sep 30, 2026 · 04:32 PM

Duration: 3m 42s
Turns: 12
Outcome: Completed
```

The user should be able to open a session and inspect the conversation before selecting it.

---

# 6. Step 2 — Select Evaluations

Show available evaluations.

Example:

```text
Select evaluations

☑ Goal Completion
☑ Response Quality
☐ Policy Compliance
☑ Identity Verification
```

For each evaluation show a short description.

Example:

> **Goal Completion**
> Checks whether the agent achieved the customer's requested outcome.

At the top show:

> **3 evaluations selected**

Avoid forcing users to configure every evaluation again.

The evaluation definition already contains its criteria.

---

# 7. Step 3 — Skip Rules

Make this an optional section.

Label:

**Skip Rules**

Description:

> Exclude sessions that aren't useful for this evaluation.

Use simple controls.

### Available rules

**Call duration**

* Skip calls shorter than `[X]` seconds
* Skip calls longer than `[X]` seconds

**Conversation length**

* Skip calls with fewer than `[N]` turns

**Agent participation**

* Skip calls where the agent never spoke

**Voicemail**

* Skip voicemail sessions

Use toggles/checkboxes so unused rules remain hidden or disabled.

Example:

```text
Skip Rules

☑ Skip calls shorter than    [30] seconds

☐ Skip calls longer than     [10] minutes

☑ Skip calls with fewer than [3] turns

☑ Skip calls where agent never spoke

☑ Skip voicemail sessions
```

Before running, show an estimate:

> **245 sessions selected**
> **18 sessions will be skipped**
> **227 sessions will be evaluated**

This is important because users should know what will actually be evaluated.

---

# 8. Review Before Running

Before the final action, show a simple summary.

```text
Evaluation Summary

Sessions
227

Evaluations
3

Total checks
681

Skip rules
4 enabled
18 sessions excluded
```

Then:

**Run Evaluation**

Do not hide important information behind another settings page.

---

# 9. Running State

After clicking Run Evaluation, show progress.

Example:

```text
Running evaluation...

Sessions
████████████░░░░  78 / 100

Evaluations
234 / 300 checks completed

Estimated remaining: ~2 min
```

Allow the user to leave the page without losing the run.

The run should continue in the background.

When finished:

> **Evaluation completed**

---

# 10. Evaluation Run Results

This is the most important screen.

Start with an aggregate summary.

Example:

```text
Evaluation Results

227 sessions evaluated

Overall
78% Passed

┌───────────────┬────────┬────────┐
│ Evaluation    │ Passed │ Failed │
├───────────────┼────────┼────────┤
│ Goal Completion │ 91%  │ 9%     │
│ Response Quality│ 82%  │ 18%    │
│ Identity Check  │ 61%  │ 39%    │
└───────────────┴────────┴────────┘
```

Keep the summary focused on the information a user needs to understand the agent's performance.

---

# 11. Required vs Optional Evaluations

If an evaluation is marked **Required**, clearly distinguish it from optional evaluations.

Example:

```text
Required evaluations
2 / 3 passed

Optional evaluations
5 / 7 passed
```

A session can therefore have:

```text
Required:  PASS
Optional:  FAIL
```

The UI should make it obvious that these have different importance.

Do not convert this into a single arbitrary score unless the product later defines a clear scoring model.

---

# 12. Session-Level Results

Below the aggregate summary, show the individual sessions.

Example:

```text
Sessions

✓ Session #1234
  Goal Completion       Passed
  Response Quality      Passed
  Identity Verification Passed

⚠ Session #1235
  Goal Completion       Passed
  Response Quality      Failed
  Identity Verification Failed

✕ Session #1236
  Goal Completion       Failed
  Response Quality      Failed
  Identity Verification Failed
```

Allow filtering:

* All
* Passed
* Failed
* Skipped

Also allow filtering by evaluation.

Example:

> Show sessions where **Identity Verification failed**

---

# 13. Session Detail

When the user opens a failed result, show the original conversation alongside the evaluation result.

Example:

```text
Identity Verification
FAILED

Why?
The agent shared account information before verifying
the customer's identity.

Success criteria
Agent verifies identity before sharing account information.

Failure criteria
Agent shares account information without verification.
```

Then show the relevant conversation turns.

Highlight the turns that are relevant to the evaluation.

This is much more useful than simply showing:

> FAILED

The user should be able to understand **why**.

---

# 14. Previous Evaluation Runs

Create a separate **Evaluation Runs** page.

This is the history of executions, not the evaluation definitions.

Example:

| Run               | Sessions | Evaluations | Pass Rate | Date   |
| ----------------- | -------: | ----------: | --------: | ------ |
| Weekly QA         |      250 |           4 |       84% | Sep 30 |
| Regression Check  |      100 |           4 |       81% | Sep 27 |
| Production Review |      500 |           3 |       87% | Sep 20 |

Each run should be clickable.

---

# 15. Aggregated Insights

The Evaluation Runs page should help users understand trends without requiring them to inspect every session.

Show:

### Overall pass rate

```text
84%
```

### Evaluations with most failures

```text
Identity Verification     39% failed
Response Quality          18% failed
Goal Completion             9% failed
```

### Trend

Show pass rate over previous runs.

Example:

```text
Sep 10   76%
Sep 17   79%
Sep 24   82%
Sep 30   84%
```

The goal is to answer:

> **"Is my agent getting better or are problems increasing?"**

Avoid overwhelming the user with dozens of metrics.

---

# 16. Important Empty States

Design these intentionally.

### No evaluations

> Create your first evaluation to start measuring your agent.

CTA:

**Create Evaluation**

### No sessions

> No sessions are available for evaluation yet.

### No sessions match skip rules

> All selected sessions were excluded by your skip rules.

CTA:

**Review Skip Rules**

### Evaluation still running

Show progress rather than an empty result.

---

# 17. Recommended Navigation

Keep Evaluation as its own top-level area.

```text
Evaluation
├── Evaluations
│   ├── Standard
│   └── Custom
│
└── Runs
    ├── Run history
    └── Run results
```

Do not put Simulation inside Evaluation.

Simulation should be a separate product area later.

---

# 18. Primary User Flow

The complete flow should feel like:

```text
Evaluation
    ↓
Run Evaluation
    ↓
Select Sessions
    ↓
Select Evaluations
    ↓
Configure Skip Rules
    ↓
Review
    ↓
Run
    ↓
Results
    ↓
Aggregate Insights
    ↓
Session Details
```

---

# 19. UX Principles

### Keep configuration minimal

Users should not need to understand how evaluation works technically.

### Show impact before execution

Always show:

> Selected → Skipped → Evaluated

before running.

### Results first, details second

First answer:

> How did the agent perform?

Then allow users to investigate:

> Why did it fail?

### Make failures actionable

Don't only show:

> Failed

Show:

> Failed because the agent shared account information before verification.

### Preserve history

Every evaluation run should remain accessible.

### Separate definitions from runs

**Evaluation** = the rule.

**Run** = an execution of that rule against sessions.

This distinction is important for your data model and UX.

---

# 20. Recommended MVP Scope

For the first version, keep the scope to:

### Evaluation Definitions

* 3–4 standard evaluations
* Custom evaluations
* Name
* Success criteria
* Failure criteria
* Required / optional

### Evaluation Execution

* Multi-select sessions
* Multi-select evaluations
* Skip rules
* Review before running
* Background execution

### Results

* Aggregate pass/fail
* Evaluation-level breakdown
* Session-level results
* Failed evaluation explanation
* Conversation inspection

### History

* Previous evaluation runs
* Aggregate results
* Basic trend

Do **not** include Simulation configuration in this workflow.

Simulation can later consume the same evaluation definitions:

```text
                    Evaluation Definition
                           │
                ┌──────────┴──────────┐
                │                     │
          Real Sessions          Simulation
                │                     │
                ▼                     ▼
          Evaluation Run       Evaluation Run
                │                     │
                └──────────┬──────────┘
                           ▼
                         Results
```

This keeps the two systems separate while allowing them to share the same evaluation logic later.
