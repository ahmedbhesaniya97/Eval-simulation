import { useState } from 'react'
import { Button, Modal } from '../../components/ui.jsx'

const EXAMPLE = {
  name: 'Elderly caller, hard of hearing',
  description: 'Speaks slowly, often asks the agent to repeat itself and gets flustered by long numbers or menus.',
}

export default function PersonaForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? { name: '', description: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form.name.trim() && form.description.trim()

  return (
    <Modal
      title={initial ? `Edit ${initial.name}` : 'Create persona'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={() => { onSave(form); onClose() }}>{initial ? 'Save changes' : 'Create persona'}</Button>
        </>
      }
    >
      <p className="muted" style={{ marginTop: 0, fontSize: 13.5 }}>
        A persona is who the simulated caller is and how they behave. The same persona works with every scenario.{' '}
        {!initial && <button className="link" onClick={() => setForm(EXAMPLE)}>Use an example</button>}
      </p>
      <div className="field">
        <label htmlFor="p-name">Persona name</label>
        <input id="p-name" className="input" value={form.name} onChange={set('name')} placeholder="e.g. Elderly caller, hard of hearing" autoFocus />
      </div>
      <div className="field">
        <label htmlFor="p-desc">How do they behave?</label>
        <textarea id="p-desc" className="textarea" value={form.description} onChange={set('description')} placeholder="e.g. Speaks slowly and asks the agent to repeat long numbers." />
        <span className="hint">Describe it in plain words. The simulated caller follows this description.</span>
      </div>
    </Modal>
  )
}
