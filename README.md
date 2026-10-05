# Zero Runtime · Evaluation prototype

Clickable prototype of the **Evaluation** and **Simulation** areas of the Zero Runtime dashboard. Evaluation is built from [UX.md](UX.md).
Simulation is its own area: simulated conversations never appear in production Sessions or evaluation runs. Datasets are out of scope.

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

### Simulation

One **Simulation** page with three tabs. Simulated sessions never mix with production Sessions or evaluation runs.

| Capability | Where |
| --- | --- |
| Past simulated sessions, with a banner for any simulation still running | Simulation → Run tab |
| Scenarios with success / failure criteria, added manually or generated from a system prompt | Simulation → Scenarios tab |
| 4 default personas (calm, angry, impatient, confused) plus custom ones described in plain words | Simulation → Personas tab |
| New simulation: agent + scenarios → personas → mode → review with cost estimate | "New simulation" button |
| Modes: Text only (cheapest), Audio, Telephony (dials the agent's phone number) | Mode step of the flow |
| Environments for Audio and Telephony: quiet room, noisy street, office, poor connection | Mode step of the flow |
| Results: pass rate, scenario × persona matrix, by environment, cost per conversation | Simulation link on any session |
| Session detail: why it failed, relevant turns, setup, cost breakdown | Click any simulated session |

## Mock data

Everything is generated deterministically in `src/data/`:

- `templates.js`: conversation templates for a banking support agent, plus how each evaluation judges them (reason + relevant turns)
- `agents.js`: 3 agents (banking, clinic, retail) with version history
- `sessions.js`: 3,400 production sessions across the agents (Aug 1 to Sep 30, 2026) with transcripts and latencies
- `engine.js`: verdicts, skip rules, run summaries. Newer agent versions fail less often, so the trend improves.
- `runs.js`: manual runs per agent, plus automations and the nightly runs they produced
- `simulation.js`: scenarios, personas, environments, pricing, the scenario generator and the simulated-conversation builder. Persona and environment change the transcript (an angry caller asks for a human, a poor line cuts out), and failures point at the turn where it went wrong. A custom persona's temperament is read from its description. Also seeds 5 past simulations, one of them over Telephony.

State lives in memory (`src/store.jsx`). A reload resets it.
