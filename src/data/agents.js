// Agents in the workspace. `releases` drives which agent version handled a
// session on a given date, and `factors` how often each version fails checks.

export const AGENTS = [
  {
    id: 'agt_7f3k2m',
    name: 'Northwind Support',
    org: 'Northwind Bank',
    persona: 'Ava',
    sessions: 1500,
    releases: [[9, '2026-08-01'], [10, '2026-08-15'], [11, '2026-08-22'], [12, '2026-08-30'], [13, '2026-09-14'], [14, '2026-09-24']],
    factors: { 9: 2.3, 10: 2.0, 11: 1.75, 12: 1.5, 13: 1.25, 14: 1.0 },
  },
  {
    id: 'agt_2p9x4d',
    name: 'Riverside Clinic Scheduler',
    org: 'Riverside Health Clinic',
    persona: 'Maya',
    sessions: 1100,
    releases: [[4, '2026-08-01'], [5, '2026-09-05'], [6, '2026-09-21']],
    factors: { 4: 1.7, 5: 1.35, 6: 1.0 },
  },
  {
    id: 'agt_5h1q8w',
    name: 'Acme Returns Assistant',
    org: 'Acme Outfitters',
    persona: 'Leo',
    sessions: 800,
    releases: [[2, '2026-08-01'], [3, '2026-09-15']],
    factors: { 2: 1.6, 3: 1.0 },
  },
]

export const AGENT_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a]))
export const agentLabel = (id) => `${AGENT_BY_ID[id].name} (${id})`

export function versionAt(agentId, iso) {
  const { releases } = AGENT_BY_ID[agentId]
  const day = iso.slice(0, 10)
  let v = releases[0][0]
  for (const [ver, from] of releases) if (day >= from) v = ver
  return v
}

export const currentVersion = (agentId) => AGENT_BY_ID[agentId].releases.at(-1)[0]
export const factorFor = (agentId, version) => AGENT_BY_ID[agentId].factors[version] ?? 1
