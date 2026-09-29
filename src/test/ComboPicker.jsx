import { Info } from 'lucide-react'
import { Checkbox } from '../components/ui'
import { ENVIRONMENTS } from '../data'

const flip = (set, id) => { const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); return n }

// Scenario × customer behavior × environment picker, shared by simulations and evaluation suites.
export function ComboPicker({ scenarios, personas, value, onChange }) {
  const { sIds, pIds, eIds } = value
  const allS = sIds.size === scenarios.length
  const set = (k, v) => onChange({ ...value, [k]: v })

  return (
    <div className="stack" style={{ gap: 28 }}>
      <section>
        <div className="row-between">
          <div className="section-title">Scenarios <span className="muted" style={{ fontWeight: 400 }}>— what the customer wants</span></div>
          <button className="btn link small" onClick={() => set('sIds', allS ? new Set() : new Set(scenarios.map((s) => s.id)))}>{allS ? 'Clear all' : 'Select all'}</button>
        </div>
        <div className="card mt-8">
          {scenarios.map((s) => (
            <button key={s.id} className="list-item" onClick={() => set('sIds', flip(sIds, s.id))} style={{ padding: '10px 16px' }}>
              <Checkbox on={sIds.has(s.id)} />
              <div className="grow"><span className="title">{s.name}</span> <span className="muted small">— {s.goal}</span></div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="section-title">Customer behaviors <span className="muted" style={{ fontWeight: 400 }}>— how the customer acts</span></div>
        <div className="chips mt-8">
          {personas.map((p) => (
            <button key={p.id} className={`chip ${pIds.has(p.id) ? 'on' : ''}`} onClick={() => set('pIds', flip(pIds, p.id))} title={p.desc}>{p.name}</button>
          ))}
        </div>
      </section>

      <section>
        <div className="section-title">Environment <span className="muted" style={{ fontWeight: 400 }}>— where the customer is calling from</span></div>
        <div className="grid-2 mt-8" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
          {ENVIRONMENTS.map((e) => (
            <button key={e.id} className={`select-card ${eIds.has(e.id) ? 'selected' : ''}`} onClick={() => set('eIds', flip(eIds, e.id))} style={{ padding: '10px 12px' }}>
              <div className="title" style={{ fontSize: 13 }}>{e.name}</div>
              <div className="desc" style={{ fontSize: 12 }}>{e.desc}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export function comboTotal({ sIds, pIds, eIds }) {
  return sIds.size * pIds.size * eIds.size
}

export function comboToConfig({ sIds, pIds, eIds }, scenarios, personas) {
  return {
    scenarioIds: scenarios.filter((s) => sIds.has(s.id)).map((s) => s.id),
    personaIds: personas.filter((p) => pIds.has(p.id)).map((p) => p.id),
    envIds: ENVIRONMENTS.filter((e) => eIds.has(e.id)).map((e) => e.id),
  }
}

export const configToCombo = (c) => ({ sIds: new Set(c.scenarioIds), pIds: new Set(c.personaIds), eIds: new Set(c.envIds) })

// Sticky summary card: "20 simulated calls", with the Scenario × Persona explanation (UX §14).
export function ComboSummary({ value, children }) {
  const { sIds, pIds, eIds } = value
  const total = comboTotal(value)
  return (
    <aside className="card card-pad" style={{ position: 'sticky', top: 16 }}>
      <div className="muted small">Total simulated calls</div>
      <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.1, margin: '4px 0 8px' }}>{total}</div>
      <div className="small muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {sIds.size} scenarios × {pIds.size} behaviors × {eIds.size} {eIds.size === 1 ? 'environment' : 'environments'}
      </div>
      {pIds.size > 1 && sIds.size > 0 && (
        <div className="callout info mt-16" style={{ padding: 12 }}>
          <Info size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
          <div className="body" style={{ margin: 0 }}>
            Each scenario runs with {pIds.size} different customer behaviors — no need to write {pIds.size} versions yourself.
          </div>
        </div>
      )}
      <div className="row-between mt-16 small"><span className="muted">Estimated time</span><span>~{Math.max(1, Math.round((total * 12) / 60))} min</span></div>
      {children}
    </aside>
  )
}
