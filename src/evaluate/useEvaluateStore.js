import { useState } from 'react'
import { INITIAL_EVALS, INITIAL_EVAL_RUNS } from './data'

// State for the Test & Evaluate section, held in App so it survives tab switches.
export function useEvaluateStore() {
  const [evals, setEvals] = useState(INITIAL_EVALS)
  const [runs, setRuns] = useState(INITIAL_EVAL_RUNS)
  const [view, setView] = useState('list') // list | run | running | result:<id>
  const [pending, setPending] = useState(null) // { source, label, calls, evalIds }
  const [editing, setEditing] = useState(null) // eval being added / edited
  const [openCall, setOpenCall] = useState(null) // { run, result }

  const saveEval = (ev) =>
    setEvals((list) => (list.some((e) => e.id === ev.id) ? list.map((e) => (e.id === ev.id ? ev : e)) : [...list, ev]))
  const deleteEval = (id) => setEvals((list) => list.filter((e) => e.id !== id))

  return { evals, saveEval, deleteEval, runs, setRuns, view, setView, pending, setPending, editing, setEditing, openCall, setOpenCall }
}
