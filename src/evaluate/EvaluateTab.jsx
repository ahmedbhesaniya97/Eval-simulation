import EvalList from './EvalList'
import EvalForm from './EvalForm'
import RunEvalFlow, { EvalProgress } from './RunEvalFlow'
import EvalRunResults from './EvalRunResults'
import CallEvalDrawer from './CallEvalDrawer'

// "Test & Evaluate": one list of evals, run against production or simulated calls.
export default function EvaluateTab({ store, scenarios, personas, fixed, notify, startFix }) {
  const { view, evals, editing, setEditing, saveEval, deleteEval, openCall, setOpenCall } = store
  const resultId = view.startsWith('result:') ? view.slice(7) : null

  return (
    <div className="page">
      {view === 'list' && <EvalList store={store} />}
      {view === 'run' && <RunEvalFlow store={store} scenarios={scenarios} personas={personas} fixed={fixed} />}
      {view === 'running' && <EvalProgress store={store} evals={evals} />}
      {resultId && <EvalRunResults key={resultId} runId={resultId} store={store} />}

      {editing && (
        <EvalForm
          ev={editing}
          onClose={() => setEditing(null)}
          onSave={(ev) => { saveEval(ev); setEditing(null); notify(`“${ev.name}” saved`) }}
          onDelete={(id) => { deleteEval(id); setEditing(null); notify('Eval deleted') }}
        />
      )}
      {openCall && (
        <CallEvalDrawer
          run={openCall.run}
          result={openCall.result}
          evals={evals}
          onClose={() => setOpenCall(null)}
          onUpdateAgent={(issueKey) => { setOpenCall(null); startFix(issueKey, 'evaluate') }}
        />
      )}
    </div>
  )
}
