import { mulberry32, hash, pick, between, intBetween, weightedPick } from './random.js'
import { TEMPLATES, NAMES, DOBS } from './templates.js'
import { AGENTS } from './agents.js'

// "Today" for the prototype.
export const NOW = new Date('2026-09-30T16:45:00')

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'
function sessionId(rng) {
  const chunk = () => Array.from({ length: 4 }, () => LETTERS[Math.floor(rng() * 26)]).join('')
  return `${chunk()}-${chunk()}-${chunk()}`
}

function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

function buildTranscript(rng, template, vars) {
  let t = rng() * 1.5
  return template.turns.map(([role, raw], i) => {
    const text = fill(raw, vars)
    const words = text.split(/\s+/).length
    const turn = { idx: i, role, text, t: Math.round(t) }
    if (role === 'user') {
      turn.eou = intBetween(rng, 240, 620)
    } else {
      const llm = intBetween(rng, 420, 1700) + (rng() < 0.08 ? intBetween(rng, 600, 1400) : 0)
      const tts = intBetween(rng, 110, 290)
      turn.llm = llm
      turn.tts = tts
      turn.e2e = llm + tts + intBetween(rng, 300, 900)
    }
    t += words * 0.36 + between(rng, 0.8, 2.4)
    if (role === 'agent') t += (turn.e2e || 0) / 1000
    return turn
  })
}

function generateSessions(agent) {
  const rng = mulberry32(hash(agent.id))
  const templates = TEMPLATES.filter((t) => t.agent === agent.id || t.agent === '*')
  const start = new Date('2026-08-01T08:00:00').getTime()
  const span = NOW.getTime() - start
  const sessions = []
  for (let i = 0; i < agent.sessions; i++) {
    const template = weightedPick(rng, templates)
    const name = pick(rng, NAMES)
    const [first, last] = name.split(' ')
    const vars = {
      name,
      first,
      dob: pick(rng, DOBS),
      last4: String(intBetween(rng, 1000, 9999)),
      email: `${first.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}.${last[0].toLowerCase()}@gmail.com`,
      org: agent.org,
      persona: agent.persona,
    }
    const turns = buildTranscript(rng, template, vars)
    const lastTurn = turns[turns.length - 1]
    const duration = Math.max(4, Math.round(lastTurn.t + lastTurn.text.split(/\s+/).length * 0.36 + between(rng, 1, 4)))

    // Business-hours-ish timestamps
    const d = new Date(start + rng() * span)
    d.setHours(intBetween(rng, 8, 19), intBetween(rng, 0, 59), intBetween(rng, 0, 59))
    if (d > NOW) d.setTime(NOW.getTime() - intBetween(rng, 5, 600) * 60000)

    sessions.push({
      id: sessionId(rng),
      agentId: agent.id,
      startedAt: d.toISOString(),
      duration,
      turnCount: turns.length,
      outcome: template.outcome,
      topic: template.topic,
      template: template.key,
      voicemail: !!template.voicemail,
      agentSpoke: !template.agentSilent,
      caller: `+1 (${intBetween(rng, 201, 989)}) •••-••${intBetween(rng, 10, 99)}`,
      direction: template.voicemail ? 'Outbound' : 'Inbound',
      turns,
    })
  }
  return sessions
}

export const SESSIONS = AGENTS.flatMap(generateSessions).sort((a, b) => b.startedAt.localeCompare(a.startedAt))
export const SESSION_BY_ID = Object.fromEntries(SESSIONS.map((s) => [s.id, s]))
export const TEMPLATE_BY_KEY = Object.fromEntries(TEMPLATES.map((t) => [t.key, t]))
export const sessionsForAgent = (agentId) => SESSIONS.filter((s) => s.agentId === agentId)

// Sessions an agent handled on a calendar day (local time), optionally only up to `until`.
export function sessionsOnDay(agentId, day, until) {
  const start = new Date(`${day}T00:00:00`).getTime()
  const end = until ? new Date(until).getTime() : start + 86400000
  return SESSIONS.filter((s) => {
    if (s.agentId !== agentId) return false
    const t = new Date(s.startedAt).getTime()
    return t >= start && t < end
  })
}
