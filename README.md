# Zero Runtime · Evaluation prototype

Clickable prototype of the **Evaluation** area of the Zero Runtime dashboard, built from [UX.md](UX.md).
Simulation and datasets are intentionally out of scope for this iteration.

```bash
npm install
npm run dev
```

## What's in it

| Spec section | Where |
| --- | --- |
| Evaluation list, Standard vs Custom, create / edit / duplicate / enable / delete | Evaluation → Evaluations |
| Run Evaluation flow: sessions → evaluations → skip rules → review | "Run Evaluation" button |
| Running state, continues in the background, toast when done | Opens after "Run Evaluation" |
| Run results: aggregate, required vs optional, per-evaluation, session list + filters | Click any run |
| Session detail: why it failed, criteria, highlighted turns | Click any session in a run |
| Run history, most failures, pass-rate trend, per agent | Evaluation → Runs (agent picker + Manual / Automated filter) |
| Daily automated evaluation of each day's sessions | Evaluation → Automations, or "Automated, every day" in the run flow |

## Mock data

Everything is generated deterministically in `src/data/`:

- `templates.js`: conversation templates for a banking support agent, plus how each evaluation judges them (reason + relevant turns)
- `agents.js`: 3 agents (banking, clinic, retail) with version history
- `sessions.js`: 3,400 production sessions across the agents (Aug 1 to Sep 30, 2026) with transcripts and latencies
- `engine.js`: verdicts, skip rules, run summaries. Newer agent versions fail less often, so the trend improves.
- `runs.js`: manual runs per agent, plus automations and the nightly runs they produced

State lives in memory (`src/store.jsx`). A reload resets it.
