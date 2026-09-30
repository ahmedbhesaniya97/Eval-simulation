// Mock evaluation engine: turns (session × evaluation) into a verdict with an
// explanation and the turns that justify it. Deterministic per agent version,
// so newer agent versions fail less often and the trend improves over time.
import { chance } from './random.js'
import { SESSION_BY_ID, TEMPLATE_BY_KEY } from './sessions.js'
import { factorFor } from './agents.js'

export const DEFAULT_SKIP_RULES = {
  short: { on: true, value: 30 },
  long: { on: false, value: 10 },
  fewTurns: { on: true, value: 3 },
  silent: { on: true },
  voicemail: { on: true },
}

export function skipReason(session, rules) {
  if (rules.voicemail.on && session.voicemail) return 'Voicemail'
  if (rules.silent.on && !session.agentSpoke) return 'Agent never spoke'
  if (rules.short.on && session.duration < rules.short.value) return `Shorter than ${rules.short.value}s`
  if (rules.long.on && session.duration > rules.long.value * 60) return `Longer than ${rules.long.value} min`
  if (rules.fewTurns.on && session.turnCount < rules.fewTurns.value) return `Fewer than ${rules.fewTurns.value} turns`
  return null
}

const lastAgentTurn = (s) => [...s.turns].reverse().find((t) => t.role === 'agent')?.idx ?? 0

function fallbackVerdict(session, key) {
  // Voicemail / silent calls that were not excluded by skip rules.
  if (session.voicemail) {
    const map = {
      goal: ['failed', 'The call reached voicemail, so there was no caller request to complete.', [0]],
      quality: ['passed', 'The voicemail message was short and included a callback number.', [1]],
      policy: ['passed', 'The agent left the approved callback message.', [1]],
      outcome: ['failed', 'No conversation took place. The call went to voicemail.', [0, 1]],
      identity: ['passed', 'No account information was left in the voicemail.', [1]],
    }
    return map[key]
  }
  if (!session.agentSpoke) {
    const map = {
      goal: ['failed', "The agent never spoke, so the caller's request was never addressed.", [0]],
      quality: ['failed', 'The agent did not respond to the caller at all.', [0]],
      policy: ['failed', 'The agent did not deliver the required greeting.', [0]],
      outcome: ['failed', 'The caller hung up with no response from the agent.', [0]],
      identity: ['passed', 'No account information was shared.', [0]],
    }
    return map[key]
  }
  return null
}

export function judge(session, evaluation, version) {
  const factor = factorFor(session.agentId, version)
  const roll = chance(`${session.id}:${evaluation.id}:${version}`)
  const template = TEMPLATE_BY_KEY[session.template]

  const fb = fallbackVerdict(session, evaluation.key)
  if (fb) return { status: fb[0], reason: fb[1], turns: fb[2] }

  if (evaluation.key === 'closing') {
    const offered = session.turns.find((t) => t.role === 'agent' && /anything else/i.test(t.text))
    return offered
      ? { status: 'passed', reason: `The agent offered further help: “${offered.text}”`, turns: [offered.idx] }
      : { status: 'failed', reason: 'The call ended without the agent asking whether the caller needed anything else.', turns: [lastAgentTurn(session)] }
  }

  const hint = evaluation.key && template.verdicts[evaluation.key]
  if (hint) {
    const failed = hint.p > 0 && roll < Math.min(0.97, hint.p * 0.8 * factor)
    const [reason, turns] = failed ? hint.fail : hint.pass
    return { status: failed ? 'failed' : 'passed', reason, turns }
  }

  // User-created custom evaluation — judged against its own criteria.
  const failed = roll < 0.14 * factor
  const agentTurns = session.turns.filter((t) => t.role === 'agent')
  const turn = agentTurns[Math.floor(chance(session.id + evaluation.id) * agentTurns.length)]?.idx ?? 0
  return failed
    ? { status: 'failed', reason: `This conversation matches the failure criteria: “${evaluation.failure}”`, turns: [turn] }
    : { status: 'passed', reason: `This conversation meets the success criteria: “${evaluation.success}”`, turns: [turn] }
}

// Build the full result set for a run.
export function computeRun({ sessionIds, evaluations, skipRules, version }) {
  const skipped = {}
  const evaluated = []
  const results = {}
  for (const sid of sessionIds) {
    const s = SESSION_BY_ID[sid]
    const why = skipReason(s, skipRules)
    if (why) {
      skipped[sid] = why
      continue
    }
    evaluated.push(sid)
    results[sid] = Object.fromEntries(evaluations.map((e) => [e.id, judge(s, e, version)]))
  }
  return { skipped, evaluated, results }
}

// passed | review | failed — required failures dominate, optional failures only flag for review.
export function sessionStatus(sessionResults, evaluations) {
  let status = 'passed'
  for (const e of evaluations) {
    if (sessionResults[e.id]?.status !== 'failed') continue
    if (e.required) return 'failed'
    status = 'review'
  }
  return status
}

export function summarizeRun(run) {
  const { evaluations, evaluated, results, skipped } = run
  const perEval = evaluations.map((e) => {
    let passed = 0
    let failed = 0
    for (const sid of evaluated) (results[sid][e.id].status === 'passed' ? passed++ : failed++)
    const total = passed + failed
    return { ...e, passed, failed, total, passRate: total ? passed / total : 0 }
  })
  const counts = { passed: 0, review: 0, failed: 0, skipped: Object.keys(skipped).length }
  for (const sid of evaluated) counts[sessionStatus(results[sid], evaluations)]++

  const sum = (list, k) => list.reduce((a, e) => a + e[k], 0)
  const checks = sum(perEval, 'total')
  const checksPassed = sum(perEval, 'passed')
  const req = perEval.filter((e) => e.required)
  const opt = perEval.filter((e) => !e.required)
  return {
    perEval,
    counts,
    checks,
    checksPassed,
    passRate: checks ? checksPassed / checks : 0,
    required: { evals: req, checks: sum(req, 'total'), passed: sum(req, 'passed'), sessionsPassing: evaluated.length - counts.failed },
    optional: { evals: opt, checks: sum(opt, 'total'), passed: sum(opt, 'passed') },
  }
}
