import { useMemo, useState } from 'react'
import { Plus, MoreHorizontal, Pencil, Copy, Trash2, Lock } from 'lucide-react'
import { useStore } from '../../store.jsx'
import { Button, Menu, Modal } from '../../components/ui.jsx'
import PersonaForm from './PersonaForm.jsx'
import { n } from '../../format.js'

export default function PersonasTab() {
  const { personas, simRuns, savePersona, duplicatePersona, deletePersona } = useStore()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const usage = useMemo(() => {
    const u = {}
    for (const r of simRuns) for (const s of r.sessions) u[s.personaId] = (u[s.personaId] || 0) + 1
    return u
  }, [simRuns])

  const card = (p) => (
    <div key={p.id} className="pick-card" style={{ cursor: p.builtIn ? 'default' : 'pointer' }} onClick={() => !p.builtIn && setEditing(p)}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{p.name}</div>
        </div>
        <Menu trigger={(toggle) => (
          <button className="icon-btn" onClick={toggle} aria-label={`Actions for ${p.name}`}><MoreHorizontal size={16} /></button>
        )}>
          {!p.builtIn && <button onClick={() => setEditing(p)}><Pencil size={14} /> Edit</button>}
          <button onClick={() => duplicatePersona(p.id)}><Copy size={14} /> {p.builtIn ? 'Duplicate and customise' : 'Duplicate'}</button>
          {!p.builtIn && <><hr /><button className="danger" onClick={() => setDeleting(p)}><Trash2 size={14} /> Delete</button></>}
        </Menu>
      </div>
      <div className="desc">{p.description}</div>
      <div className="faint" style={{ fontSize: 12.5, marginTop: 'auto' }}>
        {usage[p.id] ? `Used in ${n(usage[p.id])} conversations` : 'Not used yet'}
      </div>
    </div>
  )

  const builtIn = personas.filter((p) => p.builtIn)
  const custom = personas.filter((p) => !p.builtIn)

  return (
    <>
      <div className="page-inner">
        <div className="section" style={{ marginTop: 18 }}>
          <div className="section-head">
            <div>
              <h2 className="section-title row" style={{ gap: 8 }}>Default personas <Lock size={13} className="faint" /></h2>
              <div className="section-desc">Ready to use with any agent. Duplicate one to make your own version.</div>
            </div>
            <div className="spacer" />
            <Button onClick={() => setEditing('new')}><Plus size={15} /> Create persona</Button>
          </div>
          <div className="pick-grid">{builtIn.map(card)}</div>
        </div>
        <div className="section">
          <div className="section-head">
            <div>
              <h2 className="section-title">Your personas</h2>
              <div className="section-desc">Personas your team created for the callers you actually get.</div>
            </div>
          </div>
          <div className="pick-grid">
            {custom.map(card)}
            <button className="pick-card" style={{ alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', minHeight: 120, color: 'var(--text-2)' }} onClick={() => setEditing('new')}>
              <Plus size={18} />
              Create persona
            </button>
          </div>
        </div>
      </div>

      {editing && <PersonaForm initial={editing === 'new' ? null : editing} onSave={savePersona} onClose={() => setEditing(null)} />}
      {deleting && (
        <Modal
          title="Delete persona?"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { deletePersona(deleting.id); setDeleting(null) }}>Delete</Button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}><strong>{deleting.name}</strong> won't be available for new simulations. Past simulations keep their results.</p>
        </Modal>
      )}
    </>
  )
}
