// Past evaluation runs and automations: the history users see on the Runs
// and Automations pages.
import { SESSIONS, sessionsOnDay } from './sessions.js'
import { INITIAL_EVALUATIONS } from './evaluations.js'
import { computeRun, DEFAULT_SKIP_RULES } from './engine.js'
import { versionAt } from './agents.js'
import { chance } from './random.js'

const NW = 'agt_7f3k2m'
const CL = 'agt_2p9x4d'
const AC = 'agt_5h1q8w'
const STD4 = ['ev_goal', 'ev_quality', 'ev_policy', 'ev_identity']

const MANUAL = [
  { id: 'run_8k2m1q', agent: NW, name: 'Production Review', at: '2026-08-12T10:14:00', days: 11, sample: 1, evals: ['ev_goal', 'ev_quality', 'ev_identity'], by: 'Priya Shah' },
  { id: 'run_3n7c4x', agent: NW, name: 'Weekly QA', at: '2026-08-19T09:02:00', days: 7, sample: 1, evals: STD4, by: 'Ahmed Bhesaniya' },
  { id: 'run_9d1f6h', agent: NW, name: 'Weekly QA', at: '2026-08-26T09:05:00', days: 7, sample: 1, evals: STD4, by: 'Ahmed Bhesaniya' },
  { id: 'run_5t8w2z', agent: NW, name: 'Regression Check · v12 prompt', at: '2026-09-03T14:40:00', days: 14, sample: 0.55, evals: ['ev_goal', 'ev_quality', 'ev_policy', 'ev_outcome', 'ev_identity'], by: 'Priya Shah' },
  { id: 'run_2h6y9p', agent: NW, name: 'Weekly QA', at: '2026-09-10T09:01:00', days: 7, sample: 1, evals: STD4, by: 'Ahmed Bhesaniya' },
  { id: 'run_7b4r3k', agent: NW, name: 'Weekly QA', at: '2026-09-17T09:03:00', days: 7, sample: 1, evals: STD4, by: 'Ahmed Bhesaniya' },
  { id: 'run_4q9e5v', agent: NW, name: 'Dispute flow review', at: '2026-09-24T16:20:00', days: 14, sample: 0.6, evals: ['ev_goal', 'ev_quality', 'ev_outcome', 'ev_identity'], by: 'Marco Diaz' },
  { id: 'run_1x5s8j', agent: NW, name: 'Weekly QA', at: '2026-09-30T09:00:00', days: 7, sample: 1, evals: STD4, by: 'Ahmed Bhesaniya' },

  { id: 'run_6c2p7n', agent: CL, name: 'Launch review', at: '2026-08-20T11:30:00', days: 19, sample: 1, evals: ['ev_goal', 'ev_quality', 'ev_identity'], by: 'Dana Whitaker' },
  { id: 'run_0m4k9t', agent: CL, name: 'Weekly QA', at: '2026-09-08T10:00:00', days: 7, sample: 1, evals: STD4, by: 'Dana Whitaker' },
  { id: 'run_8f3z1r', agent: CL, name: 'Refill policy check', at: '2026-09-18T15:10:00', days: 10, sample: 0.7, evals: ['ev_goal', 'ev_policy', 'ev_identity'], by: 'Dana Whitaker' },
  { id: 'run_2w7b5s', agent: CL, name: 'Weekly QA', at: '2026-09-22T10:05:00', days: 7, sample: 1, evals: STD4, by: 'Dana Whitaker' },

  { id: 'run_5r1j8e', agent: AC, name: 'Pilot review', at: '2026-08-25T13:00:00', days: 24, sample: 1, evals: ['ev_goal', 'ev_quality', 'ev_identity'], by: 'Marco Diaz' },
  { id: 'run_9k6u3g', agent: AC, name: 'Returns flow review', at: '2026-09-12T16:45:00', days: 12, sample: 1, evals: STD4, by: 'Marco Diaz' },
  { id: 'run_3v8m2d', agent: AC, name: 'Post-v3 check', at: '2026-09-26T11:20:00', days: 10, sample: 1, evals: ['ev_goal', 'ev_quality', 'ev_policy', 'ev_outcome', 'ev_identity'], by: 'Marco Diaz' },
]

// Automations: evaluate every session an agent handled that day, on a daily schedule.
export const INITIAL_AUTOMATIONS = [
  { id: 'aut_n7x2', name: 'Nightly production check', agentId: NW, evalIds: STD4, time: '23:30', enabled: true, createdAt: '2026-09-19T11:02:00', createdBy: 'Ahmed Bhesaniya' },
  { id: 'aut_c4m9', name: 'Nightly clinic check', agentId: CL, evalIds: ['ev_goal', 'ev_policy', 'ev_outcome', 'ev_identity'], time: '22:00', enabled: true, createdAt: '2026-09-24T09:40:00', createdBy: 'Dana Whitaker' },
  { id: 'aut_a1q5', name: 'Daily returns check', agentId: AC, evalIds: STD4, time: '23:00', enabled: false, createdAt: '2026-09-08T14:15:00', createdBy: 'Marco Diaz', pausedAt: '2026-09-16T10:00:00' },
].map((a) => ({ ...a, skipRules: structuredClone(DEFAULT_SKIP_RULES) }))

const defsById = Object.fromEntries(INITIAL_EVALUATIONS.map((e) => [e.id, e]))

export function buildRun({ id, name, agentId, at, sessionIds, evalIds, skipRules, trigger, by }) {
  const evaluations = evalIds.map((eid) => ({ ...defsById[eid] }))
  const version = versionAt(agentId, at)
  const computed = computeRun({ sessionIds, evaluations, skipRules, version })
  const totalChecks = computed.evaluated.length * evaluations.length
  return {
    id, name, agentId, trigger,
    createdAt: at,
    createdBy: by,
    agentVersion: version,
    sessionIds,
    evaluations,
    skipRules,
    ...computed,
    status: 'completed',
    totalChecks,
    doneChecks: totalChecks,
  }
}

const addDays = (day, n) => new Date(new Date(`${day}T12:00:00`).getTime() + n * 86400000).toISOString().slice(0, 10)

export function buildSeedRuns() {
  const manual = MANUAL.map((r) => {
    const end = new Date(r.at).getTime()
    const start = end - r.days * 86400000
    const sessionIds = SESSIONS.filter((s) => {
      const t = new Date(s.startedAt).getTime()
      return s.agentId === r.agent && t >= start && t < end && (r.sample >= 1 || chance(s.id + r.id) < r.sample)
    }).map((s) => s.id)
    return buildRun({ id: r.id, name: r.name, agentId: r.agent, at: r.at, sessionIds, evalIds: r.evals, skipRules: structuredClone(DEFAULT_SKIP_RULES), trigger: { type: 'manual' }, by: r.by })
  })

  const automated = INITIAL_AUTOMATIONS.flatMap((a) => {
    const runs = []
    const last = (a.pausedAt ?? '2026-09-30T00:00:00').slice(0, 10)
    for (let day = a.createdAt.slice(0, 10); day < last; day = addDays(day, 1)) {
      const sessionIds = sessionsOnDay(a.agentId, day).map((s) => s.id)
      runs.push(buildRun({
        id: `run_${a.id.slice(4)}${day.slice(5).replace('-', '')}`,
        name: a.name,
        agentId: a.agentId,
        at: `${day}T${a.time}:00`,
        sessionIds,
        evalIds: a.evalIds,
        skipRules: structuredClone(a.skipRules),
        trigger: { type: 'automation', automationId: a.id, day },
        by: 'Automation',
      }))
    }
    return runs
  })

  return [...manual, ...automated].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
