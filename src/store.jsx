import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { INITIAL_EVALUATIONS } from './data/evaluations.js'
import { buildSeedRuns, INITIAL_AUTOMATIONS } from './data/runs.js'
import { computeRun } from './data/engine.js'
import { NOW, sessionsOnDay } from './data/sessions.js'
import { currentVersion } from './data/agents.js'
import { INITIAL_SCENARIOS, INITIAL_PERSONAS, buildSeedSimRuns, buildSimRun, inferMood } from './data/simulation.js'

const StoreContext = createContext(null)
export const useStore = () => useContext(StoreContext)

// Tiny hash router: #/runs/abc → ['runs', 'abc']
export function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/evaluations')
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/evaluations')
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const [path, query = ''] = hash.slice(1).split('?')
  return { parts: path.split('/').filter(Boolean), query: new URLSearchParams(query) }
}
export const navigate = (to) => {
  window.location.hash = to
}

const RUN_SECONDS = 16 // how long a mock run takes end-to-end
const SIM_SECONDS = 14 // how long a mock simulation takes end-to-end
const TICK_MS = 250

let seq = 0
const newId = (prefix) => `${prefix}_${Date.now().toString(36).slice(-4)}${(seq++).toString(36)}`

export function StoreProvider({ children }) {
  const [evaluations, setEvaluations] = useState(INITIAL_EVALUATIONS)
  const [runs, setRuns] = useState(buildSeedRuns)
  const [automations, setAutomations] = useState(INITIAL_AUTOMATIONS)
  const [scenarios, setScenarios] = useState(INITIAL_SCENARIOS)
  const [personas, setPersonas] = useState(INITIAL_PERSONAS)
  const [simRuns, setSimRuns] = useState(buildSeedSimRuns)
  const [toast, setToast] = useState(null)
  const runsRef = useRef(runs)
  runsRef.current = runs
  const simRunsRef = useRef(simRuns)
  simRunsRef.current = simRuns

  // Background execution: keeps ticking no matter which page is open.
  useEffect(() => {
    const timer = setInterval(() => {
      if (!runsRef.current.some((r) => r.status === 'running')) return
      setRuns((prev) =>
        prev.map((r) => {
          if (r.status !== 'running') return r
          const step = Math.max(1, Math.ceil(r.totalChecks / ((RUN_SECONDS * 1000) / TICK_MS)))
          const jitter = Math.round(step * (0.6 + Math.random() * 0.8))
          const doneChecks = Math.min(r.totalChecks, r.doneChecks + jitter)
          if (doneChecks >= r.totalChecks) {
            setToast({ title: 'Evaluation completed', name: r.name, href: `#/runs/${r.id}` })
            return { ...r, doneChecks, status: 'completed', durationSec: Math.round((Date.now() - r.startedMs) / 1000) }
          }
          return { ...r, doneChecks }
        })
      )
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [])

  // Simulations run in the background too, one conversation at a time.
  useEffect(() => {
    const timer = setInterval(() => {
      if (!simRunsRef.current.some((r) => r.status === 'running')) return
      setSimRuns((prev) =>
        prev.map((r) => {
          if (r.status !== 'running') return r
          const step = r.total / ((SIM_SECONDS * 1000) / TICK_MS)
          const done = Math.min(r.total, r.progress + step * (0.5 + Math.random()))
          if (done >= r.total) {
            setToast({ title: 'Simulation completed', name: r.name, href: `#/simulation/runs/${r.id}` })
            return { ...r, done: r.total, progress: r.total, status: 'completed', durationSec: Math.round((Date.now() - r.startedMs) / 1000) }
          }
          return { ...r, progress: done, done: Math.floor(done) }
        })
      )
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const saveEvaluation = useCallback((ev) => {
    setEvaluations((list) =>
      ev.id
        ? list.map((e) => (e.id === ev.id ? { ...e, ...ev } : e))
        : [...list, { ...ev, id: newId('ev'), key: null, type: 'custom', enabled: true, createdAt: NOW.toISOString() }]
    )
  }, [])

  const duplicateEvaluation = useCallback((id) => {
    setEvaluations((list) => {
      const src = list.find((e) => e.id === id)
      const copy = { ...src, id: newId('ev'), name: `${src.name} (copy)`, type: 'custom', createdAt: NOW.toISOString() }
      const i = list.indexOf(src)
      return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)]
    })
  }, [])

  const toggleEvaluation = useCallback((id) => {
    setEvaluations((list) => list.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e)))
  }, [])

  const deleteEvaluation = useCallback((id) => {
    setEvaluations((list) => list.filter((e) => e.id !== id))
  }, [])

  const startRun = useCallback(({ name, agentId, sessionIds, evaluations: evals, skipRules, trigger = { type: 'manual' } }) => {
    // Snapshot the definitions: later edits to an evaluation must not rewrite history.
    const snapshot = evals.map((e) => ({ ...e }))
    const version = currentVersion(agentId)
    const computed = computeRun({ sessionIds, evaluations: snapshot, skipRules, version })
    const run = {
      id: newId('run'),
      name,
      agentId,
      trigger,
      createdAt: new Date(NOW.getTime() + (Date.now() % 600000)).toISOString(),
      createdBy: trigger.type === 'automation' ? 'Automation' : 'Ahmed Bhesaniya',
      agentVersion: version,
      sessionIds,
      evaluations: snapshot,
      skipRules: structuredClone(skipRules),
      ...computed,
      status: 'running',
      totalChecks: computed.evaluated.length * snapshot.length,
      doneChecks: 0,
      startedMs: Date.now(),
    }
    setRuns((list) => [run, ...list])
    return run.id
  }, [])

  const createAutomation = useCallback((a) => {
    const id = newId('aut')
    setAutomations((list) => [{ ...a, id, enabled: true, createdAt: NOW.toISOString(), createdBy: 'Ahmed Bhesaniya' }, ...list])
    return id
  }, [])
  const toggleAutomation = useCallback((id) => {
    setAutomations((list) => list.map((a) => (a.id === id ? { ...a, enabled: !a.enabled, pausedAt: a.enabled ? NOW.toISOString() : undefined } : a)))
  }, [])
  const deleteAutomation = useCallback((id) => {
    setAutomations((list) => list.filter((a) => a.id !== id))
  }, [])

  const saveScenario = useCallback((sc) => {
    const id = sc.id ?? newId('scn')
    setScenarios((list) =>
      sc.id
        ? list.map((x) => (x.id === sc.id ? { ...x, ...sc } : x))
        : [...list, { source: 'manual', ...sc, id, createdAt: NOW.toISOString(), createdBy: 'Ahmed Bhesaniya' }]
    )
    return id
  }, [])
  // Bulk add (generated scenarios). Returns the new ids so the caller can select them.
  const addScenarios = useCallback((items) => {
    const added = items.map(({ tempId, ...sc }) => ({ ...sc, id: newId('scn'), createdAt: NOW.toISOString(), createdBy: 'Ahmed Bhesaniya' }))
    setScenarios((list) => [...list, ...added])
    return added.map((sc) => sc.id)
  }, [])
  const duplicateScenario = useCallback((id) => {
    setScenarios((list) => {
      const src = list.find((x) => x.id === id)
      const copy = { ...src, id: newId('scn'), name: `${src.name} (copy)`, source: 'manual', createdAt: NOW.toISOString(), createdBy: 'Ahmed Bhesaniya' }
      const i = list.indexOf(src)
      return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)]
    })
  }, [])
  const deleteScenario = useCallback((id) => setScenarios((list) => list.filter((x) => x.id !== id)), [])

  const savePersona = useCallback((input) => {
    const p = { ...input, mood: inferMood(`${input.name} ${input.description}`) }
    setPersonas((list) =>
      p.id
        ? list.map((x) => (x.id === p.id ? { ...x, ...p } : x))
        : [...list, { ...p, id: newId('per'), builtIn: false, createdAt: NOW.toISOString(), createdBy: 'Ahmed Bhesaniya' }]
    )
  }, [])
  const duplicatePersona = useCallback((id) => {
    setPersonas((list) => {
      const src = list.find((x) => x.id === id)
      return [...list, { ...src, id: newId('per'), name: `${src.name} (copy)`, builtIn: false, createdAt: NOW.toISOString(), createdBy: 'Ahmed Bhesaniya' }]
    })
  }, [])
  const deletePersona = useCallback((id) => setPersonas((list) => list.filter((x) => x.id !== id)), [])

  const startSimulation = useCallback((config) => {
    // Snapshot scenarios, personas and evaluations so later edits don't rewrite history.
    const run = buildSimRun({
      ...structuredClone(config),
      id: newId('sim'),
      createdAt: new Date(NOW.getTime() + (Date.now() % 600000)).toISOString(),
      createdBy: 'Ahmed Bhesaniya',
    })
    setSimRuns((list) => [{ ...run, status: 'running', done: 0, progress: 0, startedMs: Date.now() }, ...list])
    return run.id
  }, [])

  // How many sessions each evaluation has been run against, across all runs.
  const usage = useMemo(() => {
    const u = {}
    for (const r of runs) for (const e of r.evaluations) u[e.id] = (u[e.id] || 0) + r.evaluated.length
    return u
  }, [runs])

  const value = {
    evaluations, runs, automations, usage, toast,
    saveEvaluation, duplicateEvaluation, toggleEvaluation, deleteEvaluation, startRun,
    createAutomation, toggleAutomation, deleteAutomation,
    scenarios, personas, simRuns,
    saveScenario, addScenarios, duplicateScenario, deleteScenario,
    savePersona, duplicatePersona, deletePersona, startSimulation,
    // Run an automation right away on today's sessions so far.
    runAutomationNow: (a) => startRun({
      name: a.name,
      agentId: a.agentId,
      sessionIds: sessionsOnDay(a.agentId, NOW.toISOString().slice(0, 10), NOW.toISOString()).map((s) => s.id),
      evaluations: evaluations.filter((e) => a.evalIds.includes(e.id)),
      skipRules: a.skipRules,
      trigger: { type: 'automation', automationId: a.id, day: NOW.toISOString().slice(0, 10) },
    }),
    dismissToast: () => setToast(null),
  }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
