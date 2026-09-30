import { useState } from 'react'
import { Button, Modal } from '../components/ui.jsx'

const EXAMPLE = {
  name: 'Agent verifies customer identity',
  success: "The agent verifies the customer's identity before sharing account information.",
  failure: 'The agent shares account information without verifying the customer.',
}

export default function EvaluationForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial ?? { name: '', description: '', success: '', failure: '', required: false }
  )
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }))
  const valid = form.name.trim() && form.success.trim() && form.failure.trim()
  const isStandard = initial?.type === 'standard'

  const submit = () => {
    if (!valid) return
    onSave({ ...form, description: form.description.trim() || form.success.trim() })
    onClose()
  }

  return (
    <Modal
      title={initial ? `Edit ${initial.name}` : 'Create evaluation'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={submit}>
            {initial ? 'Save changes' : 'Create evaluation'}
          </Button>
        </>
      }
    >
      {!initial && (
        <p className="muted" style={{ marginTop: 0, fontSize: 13.5 }}>
          Describe what a good and a bad conversation look like in plain language. We'll check every session against it.{' '}
          <button className="link" onClick={() => setForm((f) => ({ ...f, ...EXAMPLE }))}>Use an example</button>
        </p>
      )}
      {isStandard && (
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
          This is a standard evaluation. Changes apply to future runs only. Past runs keep the criteria they used.
        </p>
      )}
      <div className="field">
        <label htmlFor="ev-name">Evaluation name</label>
        <input id="ev-name" className="input" value={form.name} onChange={set('name')} placeholder="e.g. Agent verifies customer identity" autoFocus />
      </div>
      <div className="field">
        <label htmlFor="ev-success">Success criteria</label>
        <textarea id="ev-success" className="textarea" value={form.success} onChange={set('success')} placeholder="What does the agent do when this goes right?" />
      </div>
      <div className="field">
        <label htmlFor="ev-failure">Failure criteria</label>
        <textarea id="ev-failure" className="textarea" value={form.failure} onChange={set('failure')} placeholder="What does the agent do when this goes wrong?" />
      </div>
      <div className="field">
        <label>Required</label>
        <div className="radio-cards">
          <button type="button" className={`radio-card ${form.required ? 'on' : ''}`} onClick={() => set('required')(true)}>
            <strong>Yes, required</strong>
            <span>A failure marks the whole session as failed.</span>
          </button>
          <button type="button" className={`radio-card ${!form.required ? 'on' : ''}`} onClick={() => set('required')(false)}>
            <strong>No, optional</strong>
            <span>A failure flags the session for review.</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}
