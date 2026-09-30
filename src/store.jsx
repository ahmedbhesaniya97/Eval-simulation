import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { INITIAL_EVALUATIONS } from './data/evaluations.js'
import { buildSeedRuns } from './data/runs.js'
import { computeRun, CURRENT_VERSION } from './data/engine.js'
import { NOW } from './data/sessions.js'

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

  const startRun = useCallback(({ name, sessionIds, evaluations: evals, skipRules }) => {
    // Snapshot the definitions: later edits to an evaluation must not rewrite history.
    const snapshot = evals.map((e) => ({ ...e }))
    const computed = computeRun({ sessionIds, evaluations: snapshot, skipRules, version: CURRENT_VERSION })
    const run = {
      id: newId('run'),
      name,
      createdAt: new Date(NOW.getTime() + (Date.now() % 600000)).toISOString(),
      createdBy: 'Ahmed Bhesaniya',
      agentVersion: CURRENT_VERSION,
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

  // How many sessions each evaluation has been run against, across all runs.
  const usage = useMemo(() => {
    const u = {}
    for (const r of runs) for (const e of r.evaluations) u[e.id] = (u[e.id] || 0) + r.evaluated.length
    return u
  }, [runs])

  const value = {
    evaluations, runs, usage, toast,
    saveEvaluation, duplicateEvaluation, toggleEvaluation, deleteEvaluation, startRun,
    dismissToast: () => setToast(null),
  }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
