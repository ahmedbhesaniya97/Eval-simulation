# AI Voice Agent Evaluation & Simulation — UX Design Prompt

## Objective

Design a simple, modern, low-code UX for evaluating and testing AI voice agents.

The primary users are **partially non-technical users** who build voice agents without needing to understand evaluation frameworks, LLM judges, simulation engines, or complex observability concepts.

The product should help users answer three simple questions:

1. **Before production:** Is my agent ready to go live?
2. **During/after production:** Is my agent actually performing well in real conversations?
3. **During development:** What happens when different types of customers interact with my agent?

The experience should be **minimalistic, outcome-focused, and easy to understand**.

Do not expose unnecessary technical complexity in the primary UX.

---

# 1. Core Product Model

The UX should be organized around three connected capabilities:

```text
                 AI Agent
                    │
          ┌─────────┼─────────┐
          ↓         ↓         ↓
      Simulation  Evaluation  Production
          │         │           │
          ↓         ↓           ↓
      Test calls   Validate    Monitor
      scenarios    readiness   real calls
                    │
                    ↓
                Insights
```

### Simulation

Simulate realistic customers interacting with the agent.

### Pre-Production Evaluation

Run controlled tests against the agent before deployment.

### Post-Production Evaluation

Evaluate real conversations and identify issues, trends, and regressions.

These should feel like **one unified system**, not three unrelated features.

---

# 2. Primary UX Principle

The product should NOT primarily communicate:

> "Your agent scored 87/100."

Instead communicate:

> "Your agent successfully completed 18 of 20 test scenarios."

And explain:

> "2 scenarios need attention because the agent failed to verify the customer before completing the action."

Every evaluation result should answer:

* What happened?
* Was it successful?
* Why?
* What should I investigate?

---

# 3. Main Navigation

Keep navigation simple.

Suggested structure:

```text
Agent

Build
Test
  ├── Simulations
  └── Evaluations

Production
  └── Evaluations

Analytics
```

If the existing application already has navigation, integrate into the current structure rather than creating unnecessary top-level navigation.

A possible simpler structure:

```text
Agent
├── Build
├── Test
└── Monitor
```

Where:

```text
Test
├── Simulation
└── Evaluation

Monitor
└── Production Evaluation
```

Prefer the smallest navigation structure that works with the existing application.

---

# 4. Evaluation Dashboard

Create a central evaluation overview.

Example:

```text
Evaluation

Your agent has been evaluated across 42 conversations.

┌──────────────────────────────────────────────┐
│  38 Successful       4 Need Attention        │
└──────────────────────────────────────────────┘

Goal Achievement       ✓ 91%
Instruction Following  ✓ 96%
Action Completion      ✓ 94%
Conversation Quality   ⚠ 82%

Recent Issues

⚠ Customer verification was skipped
⚠ Agent repeated a question
⚠ Transfer was not completed

[ View Evaluations ]
```

Do not overwhelm the user with dozens of metrics.

Show the **few signals that matter most**.

---

# 5. Evaluation Categories

Use human-readable evaluation categories.

Recommended categories:

### Goal Achievement

Did the agent accomplish what the customer wanted?

Example:

> Customer successfully booked an appointment.

### Instruction Following

Did the agent follow the configured instructions?

Example:

> Agent verified the customer before accessing account information.

### Action Completion

Did the agent correctly perform required actions?

Example:

> Appointment was successfully created.

### Accuracy

Did the agent provide correct information?

Example:

> Agent provided the correct cancellation policy.

### Conversation Quality

Was the conversation clear and efficient?

Example:

> Agent repeated the same question twice.

### Safety / Guardrails

Did the agent stay within configured boundaries?

Example:

> Agent did not disclose restricted customer information.

Not every agent needs every category.

Only display categories that are relevant to the agent's configured behavior.

---

# 6. Evaluation Results

Avoid making the primary result a numerical score.

Prefer statuses:

```text
✓ Successful
⚠ Needs Attention
✕ Failed
```

For example:

```text
Evaluation Result

✓ Goal achieved

The customer successfully completed the appointment booking.

✓ Instructions followed

The agent verified the customer's information before booking.

⚠ Conversation quality

The agent asked for the customer's phone number twice.

✓ Action completed

Appointment was successfully created.
```

If numerical data is useful, show it as supporting information rather than the primary UX.

---

# 7. Evaluation Detail Page

Every evaluation should have a detailed view.

Suggested layout:

```text
Evaluation #1842

Status
✓ Successful

Scenario
Customer wants to book an appointment

Customer Persona
Impatient + Fast Speaker

Environment
Moderate background noise

────────────────────────────

Outcome

Appointment successfully booked.

────────────────────────────

Evaluation

✓ Goal Achievement
✓ Instruction Following
✓ Action Completion
⚠ Conversation Quality

────────────────────────────

Issues

⚠ Repeated Question

The agent asked for the customer's phone number
after it had already been provided.

────────────────────────────

Conversation

Agent
...

Customer
...

Agent
...

[ Play Conversation ]
```

The conversation should be easily playable alongside the evaluation.

---

# 8. Pre-Production Evaluation

The pre-production experience should answer:

> "Is my agent ready to deploy?"

Users should be able to create a test suite.

Example:

```text
Pre-Production Evaluation

Test Suite
Customer Support — Release 12

Scenarios
✓ Cancel order
✓ Modify order
✓ Invalid order number
✓ Customer refuses verification
✓ Escalation request

Personas
✓ Calm
✓ Impatient
✓ Confused
✓ Fast Speaker

[ Run Evaluation ]
```

After execution:

```text
Evaluation Complete

18 / 20 scenarios passed

2 scenarios need attention

Issues found:

⚠ Verification skipped
⚠ Agent failed to handle customer interruption

[ Review Issues ]
```

The UX should make it easy to compare the current agent version against previous test runs.

---

# 9. Simulation

Simulation is the mechanism used to generate realistic conversations.

The user should NOT have to manually write every conversation.

The system should derive scenarios from:

* Agent system instructions
* Tools
* Functions
* Knowledge/context
* Configured goals
* User-defined test objectives

Example:

```text
Generate Test Scenarios

Based on your agent configuration, we found:

8 possible customer scenarios

✓ Book appointment
✓ Cancel appointment
✓ Reschedule appointment
✓ Ask about pricing
✓ Provide invalid information
✓ Refuse verification
✓ Ask unrelated question
✓ Request human support

[ Review Scenarios ]
```

Allow users to edit or add scenarios manually.

---

# 10. Scenario Structure

Each scenario should have:

```text
Scenario

Goal
Customer wants to cancel an order.

Expected Behavior
Agent must verify the customer's order
before cancellation.

Required Actions
1. Ask for order ID
2. Verify order
3. Cancel order

Failure Conditions
- Cancellation before verification
- Incorrect information
- Failure to complete cancellation
```

Do not expose the underlying evaluation prompt or evaluator implementation.

The user should think in terms of **expected behavior**, not LLM evaluation logic.

---

# 11. Human Personas

Personas control **how the simulated customer behaves**.

Scenario controls:

> What does the customer want?

Persona controls:

> How does the customer behave?

This distinction is critical.

Example:

```text
Scenario:
Customer wants to cancel an order.

Persona:
Impatient Customer
```

The same scenario can then be tested with multiple personas.

---

# 12. Persona Configuration

Provide simple presets.

Recommended presets:

```text
Calm Customer
Fast Speaker
Slow Speaker
Confused Customer
Impatient Customer
Talkative Customer
Distracted Customer
Difficult Customer
```

Each persona can control:

### Communication

* Speaking speed
* Response length
* Pause frequency
* Interruptions
* Filler words
* Self-corrections

### Behavior

* Changes mind
* Gives incomplete information
* Goes off-topic
* Repeats questions
* Refuses to answer
* Becomes impatient
* Challenges the agent

### Audio Environment

* Background noise
* Echo
* Poor microphone quality
* Low volume
* Intermittent audio

Keep these controls hidden behind:

```text
Advanced settings
```

The default experience should use presets.

---

# 13. Persona UX

Example:

```text
Customer Persona

Choose how the simulated customer behaves.

○ Calm
○ Impatient
● Fast Speaker
○ Confused
○ Talkative

Advanced
────────────────────

Speaking Speed
[──────●────]

Interruptions
[────●──────]

Response Length
[──────●────]

Background Noise
[───●────────]

[ Save Persona ]
```

Do not expose technical values such as:

```text
interrupt_probability = 0.37
noise_db = -18
pause_distribution = ...
```

Translate these into human-readable controls.

---

# 14. Scenario × Persona

Make it easy to combine them.

Example:

```text
Scenario
Cancel Order

Personas

✓ Calm Customer
✓ Impatient Customer
✓ Fast Speaker
✓ Confused Customer

Environment

✓ Background Noise

Total simulations:
4
```

Explain:

> This will run the same scenario with 4 different customer behaviors.

This creates useful coverage without requiring the user to manually create four scenarios.

---

# 15. Simulation Execution

During simulation, show lightweight progress.

Example:

```text
Running Simulation

Scenario 4 of 10

Customer:
Impatient + Fast Speaker

Environment:
Background Noise

● Connecting
● Conversation
● Evaluating

Please wait...
```

Do not expose internal model chains, evaluator prompts, or infrastructure details.

---

# 16. Simulation Results

After simulation:

```text
Simulation Results

10 simulations completed

✓ 8 Successful
⚠ 2 Need Attention

Common Issues

2 × Agent repeated questions
1 × Verification was skipped
1 × Agent struggled with interruptions

Persona Performance

Calm Customer       ✓
Fast Speaker        ✓
Impatient Customer  ⚠
Confused Customer   ⚠

[ Review Results ]
```

This allows users to discover patterns.

---

# 17. Post-Production Evaluation

Production evaluation should work on real conversations.

The user should see:

```text
Production Evaluation

Last 7 days

124 conversations evaluated

✓ 103 Successful
⚠ 17 Need Attention
✕ 4 Failed

Common Issues

23% — Repeated questions
11% — Failed transfers
7%  — Incorrect information
```

Focus on **patterns and actionable issues**, not raw telemetry.

---

# 18. Production Conversation View

For each real conversation:

```text
Conversation

Status
⚠ Needs Attention

Outcome
Customer's request was not completed.

Reason

The agent transferred the call but the
transfer failed.

Conversation

[ Audio Player ]

Customer:
"I need to speak with billing."

Agent:
"Sure, I'll transfer you."

...

Evaluation Findings

✕ Action Completion
Transfer was not successfully completed.

✓ Instruction Following
Agent correctly attempted the transfer.

[ View Full Conversation ]
```

---

# 19. Issues / Insights

Create an aggregated issue view.

Example:

```text
Issues

Most common issues this week

1. Repeated questions
   18 conversations

2. Failed transfers
   11 conversations

3. Customer verification skipped
   6 conversations

4. Off-topic handling
   4 conversations
```

Clicking an issue should show the affected conversations.

This turns individual evaluations into product insights.

---

# 20. Feedback Loop

The system should help users improve the agent.

Example:

```text
Issue

Agent repeatedly asks for phone number.

Found in:
12 conversations

Possible cause:
The agent does not appear to retain the
phone number after collecting it.

[ View Conversations ]

[ Update Agent ]
```

Do NOT automatically change the agent's configuration.

Instead provide a clear path:

```text
Issue
   ↓
Understand
   ↓
Review Conversation
   ↓
Modify Agent
   ↓
Run Simulation Again
   ↓
Evaluate
```

This creates a continuous development loop.

---

# 21. Recommended Overall Flow

The complete experience should feel like:

```text
BUILD AGENT
     │
     ↓
GENERATE SCENARIOS
     │
     ↓
CHOOSE PERSONAS
     │
     ↓
RUN SIMULATION
     │
     ↓
EVALUATE
     │
     ↓
FIND ISSUES
     │
     ↓
IMPROVE AGENT
     │
     ↓
RUN AGAIN
     │
     ↓
DEPLOY
     │
     ↓
EVALUATE REAL CONVERSATIONS
     │
     ↓
FIND PRODUCTION ISSUES
     │
     ↓
IMPROVE AGENT
```

This loop should be the foundation of the UX.

---

# 22. Important UX Rules

### Keep it outcome-oriented

Prefer:

> "Customer verification was skipped."

Instead of:

> "Evaluator score: 0.71"

---

### Use progressive disclosure

Primary UI:

```text
✓ Successful
⚠ Needs Attention
✕ Failed
```

Then allow:

```text
View details →
```

for deeper information.

---

### Avoid technical terminology

Prefer:

| Technical             | User-facing          |
| --------------------- | -------------------- |
| Evaluator             | Evaluation           |
| Simulation Agent      | Simulated Customer   |
| Evaluation Criteria   | Expected Behavior    |
| Test Case             | Scenario             |
| Persona Configuration | Customer Behavior    |
| Latency               | Response Time        |
| ASR Error             | Speech Understanding |
| Tool Call             | Action               |
| Evaluation Score      | Result               |
| Regression            | New Issue            |

---

### Don't overload the user with metrics

The first screen should answer:

1. Did it work?
2. What went wrong?
3. How often does it happen?
4. What should I look at?

Everything else can be secondary.

---

# 23. Design Language

Use a clean, modern SaaS interface.

Prioritize:

* Clear hierarchy
* Minimal cards
* Strong whitespace
* Short explanations
* Status indicators
* Simple charts only where useful
* Conversation/audio playback
* Side panels or detail drawers where appropriate
* Progressive disclosure
* Consistent terminology

Avoid:

* Dashboard overload
* Large walls of metrics
* Excessive graphs
* Technical jargon
* Complex configuration forms
* Score-heavy UX
* Showing evaluator internals

The product should feel closer to:

> **"Test my AI employee"**

than:

> **"Configure an LLM evaluation framework."**

---

# 24. Most Important User Journey

Optimize the entire experience around this journey:

```text
I built my agent.
        ↓
What could go wrong?
        ↓
Generate scenarios.
        ↓
Test different types of customers.
        ↓
Show me where the agent failed.
        ↓
Let me hear/read the conversation.
        ↓
Help me understand the problem.
        ↓
I update my agent.
        ↓
I run the tests again.
        ↓
I deploy.
        ↓
Show me what is happening with real customers.
        ↓
Detect new issues.
        ↓
Improve the agent again.
```

The user should never need to understand how the simulator or evaluator works internally.

The UX should make the **simulation → evaluation → improvement → production → evaluation** loop feel natural and continuous.
