import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Modal } from './ui'
import { findScenario, findPersona } from '../test/helpers'

// Turns something found while exploring into a check that runs every release.
export default function AddToSuiteModal({ draft, suites, onClose, onAdd }) {
  const [suiteId, setSuiteId] = useState(suites[0]?.id)
  const suite = suites.find((s) => s.id === suiteId)
  const newS = draft.scenarioIds.filter((id) => !suite.scenarioIds.includes(id))
  const newP = draft.personaIds.filter((id) => !suite.personaIds.includes(id))
  const nothingNew = !newS.length && !newP.length

  return (
    <Modal
      title="Add to evaluation suite"
      subtitle="It will be checked every time you run this suite."
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={nothingNew} onClick={() => onAdd(suiteId, draft)}>Add to {suite.name}</button>
        </>
      }
    >
      <div className="stack" style={{ gap: 8 }}>
        {suites.map((s) => (
          <button key={s.id} className={`select-card ${s.id === suiteId ? 'selected' : ''}`} onClick={() => setSuiteId(s.id)}>
            <div className="title">{s.name}{s.requiredForDeploy && <span className="tag accent row" style={{ gap: 4 }}><ShieldCheck size={11} />Required before deploy</span>}</div>
            <div className="desc">{s.scenarioIds.length} scenarios × {s.personaIds.length} customer behaviors</div>
          </button>
        ))}
      </div>
      <div className="card card-pad mt-16" style={{ fontSize: 13 }}>
        {nothingNew ? (
          <span className="muted">{suite.name} already covers this.</span>
        ) : (
          <>
            <div className="muted small" style={{ marginBottom: 6 }}>This will add</div>
            {newS.length > 0 && <div>Scenarios: <b style={{ fontWeight: 500 }}>{newS.map((id) => findScenario(id)?.name).join(', ')}</b></div>}
            {newP.length > 0 && <div>Customer behaviors: <b style={{ fontWeight: 500 }}>{newP.map((id) => findPersona(id)?.name).join(', ')}</b></div>}
          </>
        )}
      </div>
    </Modal>
  )
}
