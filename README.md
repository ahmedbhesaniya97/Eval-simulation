# Voice Agent — Test & Monitor (UX prototype)

A clickable UI/UX prototype for evaluation and simulation of AI voice agents, aimed at low-code users. It follows [UX.md](UX.md) and is styled to match the existing agent builder ([low-code-agent.png](low-code-agent.png)). All data is mocked in `src/data.js`.

```bash
npm install
npm run dev   # http://localhost:5173
```

## Where things live

| Area | What it answers | Files |
| --- | --- | --- |
| **Agent** tab (existing) | Build, plus a "fixing this issue" banner when you come from an issue | `src/components/AgentTab.jsx` |
| **Test → Evaluations** | "Is my agent ready to go live?" Named test suites, pass/fail, compared with earlier runs; the suite marked *Required before deploy* gates the Deploy button | `EvaluationsHome.jsx`, `SuiteDetail.jsx`, `RunResults.jsx` |
| **Test → Simulations** | "What happens when different customers call?" Exploration that never blocks deploy; anything found can be added to a suite | `src/test/Simulations.jsx` |
| **Test → Scenarios / Customer behaviors** | Shared library used by both | `Scenarios.jsx`, `Personas.jsx` |
| **Monitor → Evaluations** | Production evaluation: "How is it doing with real customers?" | `src/monitor/MonitorTab.jsx` |
| Evaluation drawer | What happened, why, and a playable conversation | `src/components/EvaluationDrawer.jsx` |
| Deploy button | Readiness check before going live | `src/components/DeployModal.jsx` |

## Demo path (the core loop)

1. **Test → Evaluations**: the required suite *Core booking flows* is 18/20, and 2 scenarios need attention.
2. Click *Customer verification was skipped* and listen to the call.
3. **Update agent** → *Add to system prompt* → **Run evaluation again**.
4. The result is **19 / 20 · 1 fixed · No new issues** → **Deploy** (the modal names the required suite).
5. **Test → Simulations** → open *Booking with different customers*. Talkative callers cause problems → **Add to evaluation suite**.
6. **Monitor → Issues** → *Update agent* or *Add to evaluation suite* for issues found in production.

## Test & Evaluate tab (merged flow)

A newer, merged take that sits next to the existing Test and Monitor tabs. It follows the `eval.png` sketch. Code lives in `src/evaluate/`.

- **Eval list:** each eval is one check, shown with its name, whether it's *Required*, and its *Success rate*. The list mixes built-in evals (generated from the agent) with custom ones. An eval passes when at least 90% of the calls it applies to meet it.
- **Add custom eval:** name, task, success criteria, failure criteria, and a Required checkbox.
- **Run evaluation:** choose **Production calls** (tick sessions from the last 7 days) or **Simulated calls** (scenarios × customer behaviors × environment), then choose which evals to run.
- **Results:** view **By eval** (expand to see the failing calls and why) or **By call**. Each call opens with its eval results next to the conversation and player. **Update agent** starts the fix loop, and the Agent tab's *Run evaluation again* returns here.
