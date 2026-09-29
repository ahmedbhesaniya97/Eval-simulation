import { useState } from 'react'
import { Trash2, Sparkles } from 'lucide-react'
import { Drawer } from '../components/ui'

// "Add Custom Eval": name, task, success & failure criteria, required.
export default function EvalForm({ ev, onClose, onSave, onDelete }) {
  const [e, setE] = useState(ev)
  const set = (k) => (x) => setE({ ...e, [k]: x.target ? (x.target.type === 'checkbox' ? x.target.checked : x.target.value) : x })
  const isNew = !ev.name
  const valid = e.name.trim() && e.success.trim()

  return (
    <Drawer
      title={isNew ? 'Add custom eval' : 'Edit eval'}
      onClose={onClose}
      width={620}
      footer={
        <>
          {!isNew && !ev.builtIn && <button className="btn ghost danger" style={{ marginRight: 'auto' }} onClick={() => onDelete(ev.id)}><Trash2 size={14} />Delete</button>}
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!valid} onClick={() => onSave({ ...e, name: e.name.trim() })}>Save</button>
        </>
      }
    >
      <div className="stack" style={{ gap: 22 }}>
        {ev.builtIn && (
          <div className="callout info" style={{ padding: 12 }}>
            <Sparkles size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
            <div className="body" style={{ margin: 0 }}>Built-in eval, generated from your agent’s instructions and actions. You can adjust the wording or whether it’s required.</div>
          </div>
        )}
        <div>
          <div className="field-label">Name of the eval</div>
          <input className="input" value={e.name} onChange={set('name')} placeholder="e.g. Asks about insurance before quoting a price" />
        </div>
        <div>
          <div className="field-label">Task</div>
          <input className="input" value={e.task} onChange={set('task')} placeholder="What should the agent do, and when?" />
        </div>
        <div className="grid-2">
          <div>
            <div className="field-label">Success criteria</div>
            <textarea className="textarea" rows={5} value={e.success} onChange={set('success')} placeholder="What does a good call look like?" />
          </div>
          <div>
            <div className="field-label">Failure criteria</div>
            <textarea className="textarea" rows={5} value={e.failure} onChange={set('failure')} placeholder="What counts as a failure?" />
          </div>
        </div>
        <label className="card row" style={{ padding: '14px 16px', gap: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={e.required} onChange={set('required')} />
          <div>
            <div style={{ fontWeight: 500 }}>Required</div>
            <div className="muted small">Required evals must pass before you deploy.</div>
          </div>
        </label>
        <p className="hint">Write it the way you’d explain it to a new colleague. We check every call against it — no scoring rules needed.</p>
      </div>
    </Drawer>
  )
}
