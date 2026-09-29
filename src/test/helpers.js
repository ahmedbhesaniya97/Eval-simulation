import { buildEvaluation, ISSUE_BECAUSE, joinPhrases, SCENARIOS, PERSONAS, CUSTOM_SCENARIOS, CUSTOM_PERSONAS } from '../data'

export const evalFromResult = (r) =>
  buildEvaluation({ id: r.id, scenarioId: r.scenarioId, personaId: r.personaId, envId: r.envId, status: r.status, issue: r.issue, kind: r.kind || 'evaluation' })

export function issueCounts(results) {
  const m = new Map()
  results.forEach((r) => r.issue && m.set(r.issue, (m.get(r.issue) || 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

export function becauseSentence(results) {
  const keys = issueCounts(results).map(([k]) => ISSUE_BECAUSE[k])
  return keys.length ? `because ${joinPhrases(keys)}` : ''
}

export const passed = (run) => run.results.filter((r) => r.status === 'success').length

export const worst = (rs) => (rs.some((r) => r.status === 'failed') ? 'failed' : rs.some((r) => r.status === 'attention') ? 'attention' : 'success')

export const findScenario = (id) => SCENARIOS.find((x) => x.id === id) || CUSTOM_SCENARIOS[id]
export const findPersona = (id) => PERSONAS.find((x) => x.id === id) || CUSTOM_PERSONAS[id]

// Evaluation runs of one suite, newest first.
export const suiteRuns = (runs, suiteId) => runs.filter((r) => r.suiteId === suiteId)
export const requiredSuite = (suites) => suites.find((s) => s.requiredForDeploy) || suites[0]
