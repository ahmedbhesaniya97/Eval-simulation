import { useState } from 'react'
import { Button, Modal } from '../../components/ui.jsx'
import { DIFFICULTY } from '../../data/simulation.js'
import { AGENTS } from '../../data/agents.js'

const EXAMPLE = {
  name: 'Wants balance without verifying',
  goal: 'get their balance without giving a date of birth',
  opening: "I just need my checking balance. I don't have time for security questions.",
  difficulty: 'hard',
  success: 'The agent explains why verification is needed and shares no account details until the caller is verified.',
  failure: 'The agent shares the balance or any account details without full verification.',
}

export default function ScenarioForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? { agentId: AGENTS[0].id, name: '', goal: '', opening: '', difficulty: 'medium', category: 'Custom', success: '', failure: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }))
  const valid = form.name.trim() && form.goal.trim() && form.success.trim() && form.failure.trim()

  const submit = () => {
    if (!valid) return
    onSave({ ...form, opening: form.opening.trim() || 'Hi, I need some help with something.' })
    onClose()
  }

  return (
    <Modal
      title={initial ? `Edit ${initial.name}` : 'Add scenario'}
      width={620}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={submit}>{initial ? 'Save changes' : 'Add scenario'}</Button>
        </>
      }
    >
      <p className="muted" style={{ marginTop: 0, fontSize: 13.5 }}>
        A scenario is a situation the simulated caller brings to your agent, and how you'll judge the agent.{' '}
        {!initial && <button className="link" onClick={() => setForm((f) => ({ ...f, ...EXAMPLE }))}>Use an example</button>}
      </p>
      <div className="field">
        <label htmlFor="sc-name">Scenario name</label>
        <input id="sc-name" className="input" value={form.name} onChange={set('name')} placeholder="e.g. Disputes an $840 charge" autoFocus />
      </div>
      <div className="field">
        <label htmlFor="sc-goal">What does the caller want?</label>
        <input id="sc-goal" className="input" value={form.goal} onChange={set('goal')} placeholder="e.g. dispute an $840 charge they do not recognise" />
        <span className="hint">The simulated caller pursues this goal for the whole conversation.</span>
      </div>
      <div className="field">
        <label htmlFor="sc-open">Caller's first line <span className="faint" style={{ fontWeight: 400 }}>· optional</span></label>
        <input id="sc-open" className="input" value={form.opening} onChange={set('opening')} placeholder="e.g. There's a charge on my account I didn't make." />
      </div>
      <div className="field">
        <label>Difficulty</label>
        <div className="seg" role="group" aria-label="Difficulty" style={{ alignSelf: 'flex-start' }}>
          {Object.entries(DIFFICULTY).map(([k, d]) => (
            <button key={k} className={form.difficulty === k ? 'active' : ''} onClick={() => set('difficulty')(k)}>{d.label}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="sc-success">Success criteria</label>
        <textarea id="sc-success" className="textarea" value={form.success} onChange={set('success')} placeholder="What does the agent do when this goes right?" />
      </div>
      <div className="field">
        <label htmlFor="sc-failure">Failure criteria</label>
        <textarea id="sc-failure" className="textarea" value={form.failure} onChange={set('failure')} placeholder="What does the agent do when this goes wrong?" />
      </div>
    </Modal>
  )
}
