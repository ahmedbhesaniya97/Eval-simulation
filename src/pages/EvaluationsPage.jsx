import { useState } from 'react'
import { Plus, Play, MoreHorizontal, Pencil, Copy, Power, Trash2, ListChecks } from 'lucide-react'
import { useStore, navigate } from '../store.jsx'
import { Button, PageHeader, TypeBadge, RequiredBadge, Toggle, Menu, Modal, EmptyState } from '../components/ui.jsx'
import EvaluationForm from './EvaluationForm.jsx'
import { n } from '../format.js'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'standard', label: 'Standard' },
  { id: 'custom', label: 'Custom' },
]

export default function EvaluationsPage({ query }) {
  const { evaluations, usage, saveEvaluation, duplicateEvaluation, toggleEvaluation, deleteEvaluation } = useStore()
  const tab = query.get('tab') || 'all'
  const [editing, setEditing] = useState(null) // null | 'new' | evaluation
  const [deleting, setDeleting] = useState(null)

  const list = evaluations.filter((e) => tab === 'all' || e.type === tab)
  const count = (t) => evaluations.filter((e) => t === 'all' || e.type === t).length

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', href: '#/home' }, { label: 'Evaluation', href: '#/evaluations' }, { label: 'Evaluations' }]}
        title="Evaluations"
        subtitle="What should we check in each conversation? Evaluations run against real sessions to show how your agent performs."
        actions={
          <>
            <Button onClick={() => setEditing('new')}><Plus size={15} /> Create evaluation</Button>
            <Button variant="primary" onClick={() => navigate('#/runs/new')} disabled={!evaluations.some((e) => e.enabled)}>
              <Play size={14} fill="currentColor" /> Run Evaluation
            </Button>
          </>
        }
      />
      <div className="page-inner">
        <div className="tabs" style={{ marginTop: 8 }}>
          {TABS.map((t) => (
            <a key={t.id} href={`#/evaluations?tab=${t.id}`} className={`tab ${tab === t.id ? 'active' : ''}`}>
              {t.label} <span className="count">{count(t.id)}</span>
            </a>
          ))}
        </div>

        {tab === 'standard' && list.length > 0 && (
          <p className="muted" style={{ fontSize: 13.5 }}>Built-in evaluations that work out of the box for any voice agent.</p>
        )}
        {tab === 'custom' && list.length > 0 && (
          <p className="muted" style={{ fontSize: 13.5 }}>Evaluations your team wrote for this agent's specific rules.</p>
        )}

        <div style={{ marginTop: tab === 'all' ? 20 : 4 }}>
          {evaluations.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No evaluations yet"
              action={<Button variant="primary" onClick={() => setEditing('new')}><Plus size={15} /> Create Evaluation</Button>}
            >
              Create your first evaluation to start measuring your agent.
            </EmptyState>
          ) : list.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title={`No ${tab} evaluations`}
              action={<Button onClick={() => setEditing('new')}><Plus size={15} /> Create evaluation</Button>}
            >
              {tab === 'custom' ? "Write an evaluation for a rule that's specific to your agent." : 'Standard evaluations have been removed from this workspace.'}
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '42%' }}>Evaluation</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th className="right">Usage</th>
                    <th>Status</th>
                    <th style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {list.map((e) => (
                    <tr key={e.id} className="clickable" onClick={() => setEditing(e)} style={{ opacity: e.enabled ? 1 : 0.6 }}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{e.name}</div>
                        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{e.description}</div>
                      </td>
                      <td><TypeBadge type={e.type} /></td>
                      <td><RequiredBadge required={e.required} /></td>
                      <td className="right num">{usage[e.id] ? `${n(usage[e.id])} sessions` : <span className="faint">Not run yet</span>}</td>
                      <td>
                        <div className="row">
                          <Toggle on={e.enabled} onChange={() => toggleEvaluation(e.id)} label={`${e.enabled ? 'Disable' : 'Enable'} ${e.name}`} />
                          <span className={e.enabled ? '' : 'faint'} style={{ fontSize: 13 }}>{e.enabled ? 'Active' : 'Disabled'}</span>
                        </div>
                      </td>
                      <td>
                        <Menu trigger={(toggle) => (
                          <button className="icon-btn" onClick={toggle} aria-label={`Actions for ${e.name}`}><MoreHorizontal size={16} /></button>
                        )}>
                          <button onClick={() => setEditing(e)}><Pencil size={14} /> Edit</button>
                          <button onClick={() => duplicateEvaluation(e.id)}><Copy size={14} /> Duplicate</button>
                          <button onClick={() => toggleEvaluation(e.id)}><Power size={14} /> {e.enabled ? 'Disable' : 'Enable'}</button>
                          <hr />
                          <button className="danger" onClick={() => setDeleting(e)}><Trash2 size={14} /> Delete</button>
                        </Menu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <EvaluationForm
          initial={editing === 'new' ? null : editing}
          onSave={saveEvaluation}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <Modal
          title="Delete evaluation?"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { deleteEvaluation(deleting.id); setDeleting(null) }}>Delete</Button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            <strong>{deleting.name}</strong> won't be available for new runs. Past runs that used it keep their results.
          </p>
        </Modal>
      )}
    </>
  )
}
