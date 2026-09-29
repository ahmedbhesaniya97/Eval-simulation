import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Volume2, UserRound } from 'lucide-react'
import { Drawer, Checkbox } from '../components/ui'
import { PERSONA_SETTINGS, BEHAVIORS, PERSONAS, CUSTOM_PERSONAS } from '../data'

// Describes the non-default traits in words, e.g. "Very fast · Interrupts often"
export function traitSummary(p) {
  const out = []
  PERSONA_SETTINGS.forEach(({ key, label, levels }) => {
    const v = p.settings[key]
    const neutral = key === 'speed' || key === 'length' ? 2 : 1
    if (v !== neutral && v >= 3) out.push(key === 'speed' || key === 'length' ? `${levels[v]} ${key === 'speed' ? 'speech' : 'answers'}` : `${label.split(' (')[0]}: ${levels[v].toLowerCase()}`)
    if (key === 'speed' && v <= 1) out.push(`${levels[v]} speech`)
  })
  p.behaviors.forEach((b) => out.push(BEHAVIORS.find((x) => x.key === b).label))
  return out.slice(0, 3)
}

function PersonaEditor({ persona, onClose, onSave }) {
  const [p, setP] = useState(persona)
  const [advanced, setAdvanced] = useState(!persona.name)
  const isNew = !persona.name
  const toggleBehavior = (k) => setP({ ...p, behaviors: p.behaviors.includes(k) ? p.behaviors.filter((x) => x !== k) : [...p.behaviors, k] })

  return (
    <Drawer
      title={isNew ? 'New customer behavior' : `${persona.name} customer`}
      onClose={onClose}
      width={600}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!p.name.trim()} onClick={() => onSave(p)}>Save behavior</button>
        </>
      }
    >
      <div className="stack" style={{ gap: 22 }}>
        <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr' }}>
          <div>
            <div className="field-label">Name</div>
            <input className="input" value={p.name} placeholder="e.g. Elderly caller" onChange={(e) => setP({ ...p, name: e.target.value })} />
          </div>
          <div>
            <div className="field-label">Description</div>
            <input className="input" value={p.desc} placeholder="How does this customer act?" onChange={(e) => setP({ ...p, desc: e.target.value })} />
          </div>
        </div>

        {p.sample && (
          <div className="card row" style={{ padding: '12px 14px', gap: 12 }}>
            <button className="play-btn" style={{ width: 30, height: 30 }} aria-label="Play sample"><Volume2 size={14} /></button>
            <div>
              <div className="muted small">How they sound</div>
              <div style={{ fontStyle: 'italic', color: 'var(--text-2)' }}>{p.sample}</div>
            </div>
          </div>
        )}

        <button className="btn ghost" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => setAdvanced(!advanced)}>
          {advanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}Advanced settings
        </button>

        {advanced && (
          <>
            <div>
              <div className="section-title">How they talk</div>
              <div className="card" style={{ padding: '8px 16px', marginTop: 8 }}>
                {PERSONA_SETTINGS.map(({ key, label, levels }) => (
                  <div key={key} className="slider-row">
                    <span>{label}</span>
                    <input type="range" min={0} max={4} step={1} value={p.settings[key]}
                      onChange={(e) => setP({ ...p, settings: { ...p.settings, [key]: +e.target.value } })} />
                    <span className="val">{levels[p.settings[key]]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="section-title">How they act</div>
              <div className="grid-2 mt-8" style={{ gap: 8 }}>
                {BEHAVIORS.map((b) => (
                  <button key={b.key} className="select-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: '10px 12px' }} onClick={() => toggleBehavior(b.key)}>
                    <Checkbox on={p.behaviors.includes(b.key)} />{b.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="hint">Audio conditions like background noise or a poor phone line are chosen when you start a test run, so you can combine them with any behavior.</p>
          </>
        )}
      </div>
    </Drawer>
  )
}

export default function Personas({ personas, setPersonas, notify }) {
  const [editing, setEditing] = useState(null)

  const save = (p) => {
    if (!PERSONAS.some((x) => x.id === p.id)) CUSTOM_PERSONAS[p.id] = p
    setPersonas((list) => (list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p]))
    setEditing(null)
    notify('Customer behavior saved')
  }

  return (
    <>
      <div className="row-between mb-16">
        <p className="muted" style={{ maxWidth: 560 }}>
          Customer behaviors control <b style={{ color: 'var(--text)' }}>how the simulated customer acts</b> — not what they want. Test the same scenario with different customers to see where your agent struggles.
        </p>
        <button className="btn" onClick={() => setEditing({ id: `p${Date.now()}`, name: '', desc: '', sample: '', settings: { ...PERSONAS[0].settings }, behaviors: [] })}>
          <Plus size={15} />Create behavior
        </button>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {personas.map((p) => (
          <button key={p.id} className="select-card" onClick={() => setEditing(p)} style={{ minHeight: 150 }}>
            <div className="title"><UserRound size={15} className="muted" />{p.name}</div>
            <div className="desc">{p.desc}</div>
            {p.sample && <div className="sample">{p.sample}</div>}
            <div className="row" style={{ flexWrap: 'wrap', gap: 4, marginTop: 'auto', paddingTop: 6 }}>
              {traitSummary(p).map((t) => <span key={t} className="tag">{t}</span>)}
              {!traitSummary(p).length && <span className="tag">Cooperative</span>}
            </div>
          </button>
        ))}
      </div>

      {editing && <PersonaEditor persona={editing} onClose={() => setEditing(null)} onSave={save} />}
    </>
  )
}
