import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { INITIAL_EVALUATIONS } from './data/evaluations.js'
import { buildSeedRuns, INITIAL_AUTOMATIONS } from './data/runs.js'
import { computeRun } from './data/engine.js'
import { NOW, sessionsOnDay } from './data/sessions.js'
import { currentVersion } from './data/agents.js'

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
const TICK_MS = 250

let seq = 0
const newId = (prefix) => `${prefix}_${Date.now().toString(36).slice(-4)}${(seq++).toString(36)}`

export function StoreProvider({ children }) {
  const [evaluations, setEvaluations] = useState(INITIAL_EVALUATIONS)
  const [runs, setRuns] = useState(buildSeedRuns)
  const [automations, setAutomations] = useState(INITIAL_AUTOMATIONS)
  const [toast, setToast] = useState(null)
  const runsRef = useRef(runs)
  runsRef.current = runs

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
            setToast({ runId: r.id, name: r.name })
            return { ...r, doneChecks, status: 'completed', durationSec: Math.round((Date.now() - r.startedMs) / 1000) }
          }
          return { ...r, doneChecks }
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
