// Mock data for the "Test & Evaluate" section.
// Here an *eval* is a single check (name, task, success / failure criteria) that is run
// against a set of calls — either real production sessions or freshly simulated calls.

import { ISSUES, PROD_CONVERSATIONS, transcriptFor, simulateOutcome } from '../data'

// ---------------------------------------------------------------------------
// Evals: built-in (generated from the agent's configuration) + custom
// `scenarios` limits which calls an eval applies to ('all' = every call).
// ---------------------------------------------------------------------------
export const INITIAL_EVALS = [
  {
    id: 'e_goal', builtIn: true, required: true, scenarios: 'all',
    name: 'Completes what the caller asked for',
    task: 'Check that the caller’s request was fully handled by the end of the call.',
    success: 'The booking, change, question or transfer the caller asked for was completed.',
    failure: 'The call ended without the caller’s request being handled.',
  },
  {
    id: 'e_verify', builtIn: true, required: true, scenarios: ['s2', 's3', 's6'], issueKey: 'verification_skipped',
    name: 'Verifies the caller before changing an appointment',
    task: 'Before any cancel or reschedule, confirm who the caller is.',
    success: 'Agent gets the caller’s full name and date of birth before changing anything.',
    failure: 'Agent changes or cancels an appointment before the caller is verified.',
  },
  {
    id: 'e_transfer', builtIn: true, required: true, scenarios: ['s8', 's5'], issueKey: 'transfer_failed',
    name: 'Transfers to the front desk when asked',
    task: 'When the caller asks for billing or a person, transfer them.',
    success: 'The call is successfully transferred to the front desk.',
    failure: 'Transfer is not attempted, or it fails with no fallback.',
  },
  {
    id: 'e_accuracy', builtIn: true, required: true, scenarios: ['s4', 's2'], issueKey: 'incorrect_info',
    name: 'Gives correct prices and policies',
    task: 'Any price or policy the agent mentions must match the clinic’s real ones.',
    success: 'Prices and policies quoted match the agent’s knowledge.',
    failure: 'Agent states a wrong price or policy, or makes one up.',
  },
  {
    id: 'e_medical', builtIn: true, required: true, scenarios: ['s7'], issueKey: 'off_topic',
    name: 'Doesn’t give medical advice',
    task: 'The agent is a receptionist — it should offer an appointment instead of advice.',
    success: 'Agent declines to advise and offers an appointment.',
    failure: 'Agent recommends medication or treatment.',
  },
  {
    id: 'e_repeat', builtIn: true, required: false, scenarios: 'all', issueKey: 'repeated_question',
    name: 'Doesn’t ask for details already given',
    task: 'Keep track of what the caller has already said.',
    success: 'Every detail is asked for at most once.',
    failure: 'Agent asks for a detail the caller already gave.',
  },
  {
    id: 'e_interrupt', builtIn: true, required: false, scenarios: 'all', issueKey: 'interruption',
    name: 'Handles interruptions smoothly',
    task: 'When the caller cuts in, respond to what they said.',
    success: 'Agent stops, listens and responds to the interruption.',
    failure: 'Agent ignores the interruption or starts over.',
  },
  {
    id: 'e_confirm', builtIn: true, required: false, scenarios: ['s1', 's3'], issueKey: 'speech',
    name: 'Repeats dates and times back to confirm',
    task: 'Read back any date or time before booking it.',
    success: 'Agent confirms the date and time with the caller before booking.',
    failure: 'Agent books without confirming, or books the wrong date.',
  },
  {
    id: 'c_insurance', builtIn: false, required: true, scenarios: ['s4', 's1'],
    name: 'Asks about insurance before quoting or booking',
    task: 'When a caller asks about cost or books a visit, check whether they have dental insurance.',
    success: 'Agent asks whether the caller has dental insurance before giving a price or confirming a booking.',
    failure: 'Agent quotes a price or books without asking about insurance.',
  },
]

// ---------------------------------------------------------------------------
// Production sessions available to evaluate (Monitor's conversations + older ones)
// ---------------------------------------------------------------------------
const OLDER = [
  ['s1', null, 'Mon, 17:48', '+1 (415) ••• 6620'],
  ['s3', 'interruption', 'Mon, 16:12', '+1 (628) ••• 1943'],
  ['s2', null, 'Mon, 15:30', '+1 (510) ••• 7784'],
  ['s4', null, 'Mon, 14:02', '+1 (650) ••• 3051'],
  ['s8', 'transfer_failed', 'Mon, 11:25', '+1 (408) ••• 9912'],
  ['s6', null, 'Mon, 10:40', '+1 (925) ••• 4467'],
  ['s1', null, 'Sun, 12:15', '+1 (415) ••• 8203'],
  ['s5', null, 'Sun, 11:02', '+1 (707) ••• 5518'],
  ['s3', null, 'Sat, 16:44', '+1 (510) ••• 2290'],
  ['s1', 'speech', 'Sat, 10:05', '+1 (628) ••• 7406'],
]

export const SESSIONS = [
  ...PROD_CONVERSATIONS.map((c) => ({ id: c.id, source: 'production', scenarioId: c.scenarioId, issue: c.issue, status: c.status, when: c.when, caller: c.caller, duration: c.duration })),
  ...OLDER.map(([scenarioId, issue, when, caller], i) => {
    const t = transcriptFor(scenarioId, issue)
    return {
      id: `conv-${2126 - i}`, source: 'production', scenarioId, issue,
      status: issue ? ISSUES[issue].severity : 'success', when, caller, duration: t[t.length - 1].t + 4,
    }
  }),
]

// ---------------------------------------------------------------------------
// Checking one call against one eval (deterministic, so results are stable)
// ---------------------------------------------------------------------------
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 10007, 17)

export function checkCall(call, ev) {
  if (ev.scenarios !== 'all' && !ev.scenarios.includes(call.scenarioId)) return { status: 'na' }
  let fail = false
  let reason = null
  if (ev.issueKey) {
    fail = call.issue === ev.issueKey
    reason = fail ? ISSUES[ev.issueKey].explanation : null
  } else if (ev.id === 'e_goal') {
    fail = call.status === 'failed'
    reason = fail ? 'The caller’s request was not completed.' : null
  } else if (ev.id === 'c_insurance') {
    fail = hash(call.id + ev.id) % 100 < 14
    reason = fail ? (call.scenarioId === 's4' ? 'The agent gave a price before asking whether the caller has insurance.' : 'The agent confirmed the booking without asking about insurance.') : null
  } else {
    // A custom eval the user just wrote
    fail = hash(call.id + ev.id) % 100 < 12
    reason = fail ? `Matched the failure criteria: “${ev.failure || 'did not meet the success criteria'}”` : null
  }
  return fail ? { status: 'fail', reason } : { status: 'pass', reason: ev.success }
}

// One evaluation run: every selected call × every selected eval.
export function evaluateCalls({ id, source, label, when, calls, evals }) {
  const results = calls.map((call) => ({
    call,
    checks: Object.fromEntries(evals.map((ev) => [ev.id, checkCall(call, ev)])),
  }))
  return { id, source, label, when, evalIds: evals.map((e) => e.id), results }
}

// An eval passes when at least TARGET of the calls it applies to meet it.
// A required eval below FAIL_BELOW counts as failing (red), otherwise it needs attention.
export const TARGET = 0.9
const FAIL_BELOW = 0.8

// Per-eval summary for a run: { applicable, passed, rate, status }
export function evalStats(run, ev) {
  const checks = run.results.map((r) => r.checks[ev.id]).filter((c) => c && c.status !== 'na')
  const passed = checks.filter((c) => c.status === 'pass').length
  const rate = checks.length ? passed / checks.length : null
  let status = 'success'
  if (rate != null && rate < TARGET) status = ev.required && rate < FAIL_BELOW ? 'failed' : 'attention'
  return { applicable: checks.length, passed, rate, status }
}

export function simulatedCalls(runId, { scenarioIds, personaIds, envIds }, fixed) {
  const calls = []
  let n = 1
  scenarioIds.forEach((s) => personaIds.forEach((p) => envIds.forEach((e) => {
    const { status, issue } = simulateOutcome(s, p, e, fixed)
    const t = transcriptFor(s, issue)
    calls.push({ id: `${runId}-${n++}`, source: 'simulated', scenarioId: s, personaId: p, envId: e, status, issue, duration: t[t.length - 1].t + 4 })
  })))
  return calls
}

export const INITIAL_EVAL_RUNS = [
  evaluateCalls({
    id: 'er-1', source: 'production', label: '24 production calls · last 7 days', when: 'Today, 08:00',
    calls: SESSIONS, evals: INITIAL_EVALS,
  }),
]

export const pct = (r) => (r == null ? '—' : `${Math.round(r * 100)}%`)
