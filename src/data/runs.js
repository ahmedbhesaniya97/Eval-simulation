// Past evaluation runs — the history users see on the Runs page.
import { SESSIONS } from './sessions.js'
import { INITIAL_EVALUATIONS } from './evaluations.js'
import { computeRun, DEFAULT_SKIP_RULES } from './engine.js'
import { chance } from './random.js'

const SEED = [
  { id: 'run_8k2m1q', name: 'Production Review', at: '2026-08-12T10:14:00', version: 9, days: 11, sample: 1, evals: ['ev_goal', 'ev_quality', 'ev_identity'], by: 'Priya Shah' },
  { id: 'run_3n7c4x', name: 'Weekly QA', at: '2026-08-19T09:02:00', version: 10, days: 7, sample: 1, evals: ['ev_goal', 'ev_quality', 'ev_policy', 'ev_identity'], by: 'Ahmed Bhesaniya' },
  { id: 'run_9d1f6h', name: 'Weekly QA', at: '2026-08-26T09:05:00', version: 11, days: 7, sample: 1, evals: ['ev_goal', 'ev_quality', 'ev_policy', 'ev_identity'], by: 'Ahmed Bhesaniya' },
  { id: 'run_5t8w2z', name: 'Regression Check · v12 prompt', at: '2026-09-03T14:40:00', version: 12, days: 14, sample: 0.55, evals: ['ev_goal', 'ev_quality', 'ev_policy', 'ev_outcome', 'ev_identity'], by: 'Priya Shah' },
  { id: 'run_2h6y9p', name: 'Weekly QA', at: '2026-09-10T09:01:00', version: 12, days: 7, sample: 1, evals: ['ev_goal', 'ev_quality', 'ev_policy', 'ev_identity'], by: 'Ahmed Bhesaniya' },
  { id: 'run_7b4r3k', name: 'Weekly QA', at: '2026-09-17T09:03:00', version: 13, days: 7, sample: 1, evals: ['ev_goal', 'ev_quality', 'ev_policy', 'ev_identity'], by: 'Ahmed Bhesaniya' },
  { id: 'run_4q9e5v', name: 'Dispute flow review', at: '2026-09-24T16:20:00', version: 13, days: 14, sample: 0.6, evals: ['ev_goal', 'ev_quality', 'ev_outcome', 'ev_identity'], by: 'Marco Diaz' },
  { id: 'run_1x5s8j', name: 'Weekly QA', at: '2026-09-30T09:00:00', version: 14, days: 7, sample: 1, evals: ['ev_goal', 'ev_quality', 'ev_policy', 'ev_identity'], by: 'Ahmed Bhesaniya' },
]

const defsById = Object.fromEntries(INITIAL_EVALUATIONS.map((e) => [e.id, e]))

export function buildSeedRuns() {
  return SEED.map((r) => {
    const end = new Date(r.at).getTime()
    const start = end - r.days * 86400000
    const sessionIds = SESSIONS.filter((s) => {
      const t = new Date(s.startedAt).getTime()
      return t >= start && t < end && (r.sample >= 1 || chance(s.id + r.id) < r.sample)
    }).map((s) => s.id)
    const evaluations = r.evals.map((id) => ({ ...defsById[id] }))
    const skipRules = structuredClone(DEFAULT_SKIP_RULES)
    const computed = computeRun({ sessionIds, evaluations, skipRules, version: r.version })
    const totalChecks = computed.evaluated.length * evaluations.length
    return {
      id: r.id,
      name: r.name,
      createdAt: r.at,
      createdBy: r.by,
      agentVersion: r.version,
      sessionIds,
      evaluations,
      skipRules,
      ...computed,
      status: 'completed',
      totalChecks,
      doneChecks: totalChecks,
      durationSec: Math.round(40 + totalChecks * 0.35),
    }
  }).reverse()
}
