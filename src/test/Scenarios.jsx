import { useEffect, useState } from 'react'
import { Sparkles, Plus, ChevronRight, Trash2, X, FileText, Zap, Target } from 'lucide-react'
import { Modal, Drawer, Checkbox, StatusIcon } from '../components/ui'
import { SCENARIOS, CUSTOM_SCENARIOS } from '../data'
import { suiteRuns } from './helpers'

function GenerateModal({ existing, onClose, onAdd }) {
  const [phase, setPhase] = useState(0)
  const [picked, setPicked] = useState(() => new Set(SCENARIOS.filter((s) => !existing.has(s.id)).map((s) => s.id)))
  const steps = ['Reading your instructions', 'Looking at your actions', 'Finding edge cases']

  useEffect(() => {
    if (phase >= steps.length) return
    const id = setTimeout(() => setPhase((p) => p + 1), 650)
    return () => clearTimeout(id)
  }, [phase])

  const toggle = (id) => setPicked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const done = phase >= steps.length

  return (
    <Modal
      title="Generate test scenarios"
      subtitle={done ? `Based on your agent’s configuration, we found ${SCENARIOS.length} customer scenarios.` : 'Looking at what your agent is set up to do…'}
      onClose={onClose}
      footer={done && (
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!picked.size} onClick={() => onAdd([...picked])}>
            Add {picked.size} {picked.size === 1 ? 'scenario' : 'scenarios'}
          </button>
        </>
      )}
    >
      {!done ? (
        <div className="stack" style={{ gap: 10, padding: '12px 0 8px' }}>
          {steps.map((s, i) => (
            <div key={s} className={`phase ${i < phase ? 'done' : i === phase ? 'active' : ''}`}>
              <span className="bullet" />{s}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          {SCENARIOS.map((s) => {
            const has = existing.has(s.id)
            return (
              <button key={s.id} className="list-item" disabled={has} onClick={() => toggle(s.id)} style={{ opacity: has ? 0.55 : 1, cursor: has ? 'default' : 'pointer' }}>
                <Checkbox on={has || picked.has(s.id)} />
                <div className="grow">
                  <div className="title">{s.name}</div>
                  <div className="sub">From: {s.source}</div>
                </div>
                {has && <span className="tag">Already added</span>}
              </button>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

function EditableList({ items, onChange, placeholder, numbered }) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      {items.map((it, i) => (
        <div key={i} className="row">
          <span className="muted small" style={{ width: 16 }}>{numbered ? `${i + 1}.` : '•'}</span>
          <input className="input" value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button className="icon-btn" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove"><X size={14} /></button>
        </div>
      ))}
      <button className="btn link small" style={{ alignSelf: 'flex-start', marginLeft: 24 }} onClick={() => onChange([...items, ''])}>
        <Plus size={13} />{placeholder}
      </button>
    </div>
  )
}

function ScenarioEditor({ scenario, onClose, onSave, onDelete }) {
  const [s, setS] = useState(scenario)
  const set = (k) => (v) => setS({ ...s, [k]: v })
  const isNew = !scenario.name
  return (
    <Drawer
      title={isNew ? 'New scenario' : 'Edit scenario'}
      onClose={onClose}
      width={600}
      footer={
        <>
          {!isNew && <button className="btn ghost danger" style={{ marginRight: 'auto' }} onClick={() => onDelete(s.id)}><Trash2 size={14} />Remove</button>}
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!s.name.trim()} onClick={() => onSave(s)}>Save scenario</button>
        </>
      }
    >
      <div className="stack" style={{ gap: 22 }}>
        <div>
          <div className="field-label">Name</div>
          <input className="input" value={s.name} placeholder="e.g. Cancel order" onChange={(e) => set('name')(e.target.value)} />
        </div>
        <div>
          <div className="field-label">What does the customer want?</div>
          <textarea className="textarea" rows={2} value={s.goal} placeholder="Customer wants to…" onChange={(e) => set('goal')(e.target.value)} />
          <div className="hint mt-8">How the customer behaves is set separately, with customer behaviors.</div>
        </div>
        <div>
          <div className="field-label">Expected behavior</div>
          <textarea className="textarea" rows={2} value={s.expected} placeholder="What should your agent do?" onChange={(e) => set('expected')(e.target.value)} />
        </div>
        <div>
          <div className="field-label">Required actions <span className="hint">in order</span></div>
          <EditableList numbered items={s.actions} onChange={set('actions')} placeholder="Add action" />
        </div>
        <div>
          <div className="field-label">Counts as a failure if…</div>
          <EditableList items={s.failures} onChange={set('failures')} placeholder="Add failure condition" />
        </div>
      </div>
    </Drawer>
  )
}

export default function Scenarios({ scenarios, setScenarios, runs, suites, notify }) {
  const [generating, setGenerating] = useState(false)
  const [editing, setEditing] = useState(null)
  const latestResults = suites.flatMap((su) => suiteRuns(runs, su.id)[0]?.results || [])

  const resultFor = (id) => {
    const rs = latestResults.filter((r) => r.scenarioId === id)
    if (!rs.length) return null
    const bad = rs.filter((r) => r.status !== 'success')
    return { n: rs.length, bad: bad.length, status: bad.some((r) => r.status === 'failed') ? 'failed' : bad.length ? 'attention' : 'success' }
  }

  const save = (s) => {
    if (!SCENARIOS.some((x) => x.id === s.id)) CUSTOM_SCENARIOS[s.id] = s
    setScenarios((list) => (list.some((x) => x.id === s.id) ? list.map((x) => (x.id === s.id ? s : x)) : [...list, s]))
    setEditing(null)
    notify('Scenario saved')
  }

  const sourceIcon = (src) => (src.startsWith('Your “') ? <Zap size={12} /> : src.startsWith('Your instructions') ? <FileText size={12} /> : <Target size={12} />)

  return (
    <>
      <div className="row-between mb-16">
        <p className="muted" style={{ maxWidth: 560 }}>
          A scenario describes <b style={{ color: 'var(--text)' }}>what the customer wants</b> and what your agent should do. Each one is tested with every customer behavior you choose.
        </p>
        <div className="row">
          <button className="btn" onClick={() => setEditing({ id: `c${Date.now()}`, name: '', goal: '', expected: '', actions: [''], failures: [''], source: 'Added by you', categories: ['goal', 'instructions', 'quality'], outcome: 'Customer request completed.' })}>
            <Plus size={15} />Add scenario
          </button>
          <button className="btn primary" onClick={() => setGenerating(true)}><Sparkles size={15} />Generate from agent</button>
        </div>
      </div>

      <div className="card">
        <div className="list">
          {scenarios.map((s) => {
            const r = resultFor(s.id)
            return (
              <button key={s.id} className="list-item" style={{ alignItems: 'flex-start', padding: '16px 18px' }} onClick={() => setEditing(s)}>
                <div className="grow">
                  <div className="row"><span className="title">{s.name}</span></div>
                  <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 3 }}>{s.goal}</div>
                  <div className="sub row" style={{ gap: 6, marginTop: 8 }}>
                    <span className="tag row" style={{ gap: 4 }}>{sourceIcon(s.source)}{s.source}</span>
                    <span>· {s.actions.filter(Boolean).length} required actions</span>
                  </div>
                </div>
                <div className="row" style={{ gap: 6, fontSize: 13, whiteSpace: 'nowrap', paddingTop: 2 }}>
                  {r ? (
                    <><StatusIcon status={r.status} size={14} /><span className="muted">{r.n - r.bad}/{r.n} passed</span></>
                  ) : (
                    <span className="muted">Not tested yet</span>
                  )}
                </div>
                <ChevronRight size={16} className="chev" style={{ marginTop: 2 }} />
              </button>
            )
          })}
        </div>
      </div>

      {generating && (
        <GenerateModal
          existing={new Set(scenarios.map((s) => s.id))}
          onClose={() => setGenerating(false)}
          onAdd={(ids) => {
            setScenarios((list) => [...list, ...SCENARIOS.filter((s) => ids.includes(s.id))])
            setGenerating(false)
            notify(`${ids.length} scenarios added`)
          }}
        />
      )}
      {editing && (
        <ScenarioEditor
          scenario={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={(id) => { setScenarios((l) => l.filter((x) => x.id !== id)); setEditing(null) }}
        />
      )}
    </>
  )
}

