import { useMemo, useState } from 'react'
import { Plus, Sparkles, MoreHorizontal, Pencil, Copy, Trash2, Map as MapIcon } from 'lucide-react'
import { useStore } from '../../store.jsx'
import { simSessionStatus } from '../../data/simulation.js'
import { Button, Menu, Modal, EmptyState, PassBar } from '../../components/ui.jsx'
import { DifficultyBadge, SourceBadge } from '../../components/SimBits.jsx'
import ScenarioForm from './ScenarioForm.jsx'
import GenerateScenarios from './GenerateScenarios.jsx'
import { dateShort, pct } from '../../format.js'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'manual', label: 'Manual' },
  { id: 'generated', label: 'Generated' },
]

export default function ScenariosTab({ query }) {
  const { scenarios, simRuns, saveScenario, addScenarios, duplicateScenario, deleteScenario } = useStore()
  const [tab, setTab] = useState('all')
  const [editing, setEditing] = useState(null) // null | 'new' | scenario
  const [generating, setGenerating] = useState(query.get('generate') === '1')
  const [deleting, setDeleting] = useState(null)

  const list = scenarios.filter((s) => tab === 'all' || s.source === tab)
  const count = (t) => scenarios.filter((s) => t === 'all' || s.source === t).length

  // The most recent completed simulation that included each scenario.
  const lastTested = useMemo(() => {
    const out = {}
    for (const r of simRuns) {
      if (r.status !== 'completed') continue
      for (const sc of r.scenarios) {
        if (out[sc.id]) continue
        const sessions = r.sessions.filter((s) => s.scenarioId === sc.id)
        const passed = sessions.filter((s) => simSessionStatus(s, r.evaluations) === 'passed').length
        out[sc.id] = { run: r, rate: passed / sessions.length, total: sessions.length }
      }
    }
    return out
  }, [simRuns])

  return (
    <>
      <div className="page-inner">
        <div className="row" style={{ margin: '18px 0 0', flexWrap: 'wrap' }}>
          <div className="seg" role="group" aria-label="Source">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
                {t.label} <span className="faint num">{count(t.id)}</span>
              </button>
            ))}
          </div>
          <span className="faint" style={{ fontSize: 13 }}>Each scenario has its own success and failure criteria.</span>
          <div className="spacer" />
          <Button onClick={() => setGenerating(true)}><Sparkles size={14} /> Generate from system prompt</Button>
          <Button onClick={() => setEditing('new')}><Plus size={15} /> Add scenario</Button>
        </div>

        <div style={{ marginTop: 16 }}>
          {scenarios.length === 0 ? (
            <EmptyState
              icon={MapIcon}
              title="No scenarios yet"
              action={
                <div className="row" style={{ justifyContent: 'center' }}>
                  <Button variant="primary" onClick={() => setGenerating(true)}><Sparkles size={14} /> Generate from system prompt</Button>
                  <Button onClick={() => setEditing('new')}><Plus size={15} /> Add manually</Button>
                </div>
              }
            >
              Paste your agent's system prompt and we'll write difficult scenarios that test its rules. Or write your own.
            </EmptyState>
          ) : list.length === 0 ? (
            <EmptyState icon={MapIcon} title={`No ${tab} scenarios`} action={<Button onClick={() => (tab === 'generated' ? setGenerating(true) : setEditing('new'))}>{tab === 'generated' ? 'Generate scenarios' : 'Add scenario'}</Button>}>
              {tab === 'generated' ? 'Generate scenarios from the system prompt to see them here.' : 'Scenarios you write yourself appear here.'}
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Scenario</th>
                    <th>Difficulty</th>
                    <th>Source</th>
                    <th style={{ width: 220 }}>Last tested</th>
                    <th style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => {
                    const last = lastTested[s.id]
                    return (
                      <tr key={s.id} className="clickable" onClick={() => setEditing(s)}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{s.name}</div>
                          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>Caller wants to {s.goal}.</div>
                        </td>
                        <td><DifficultyBadge level={s.difficulty} /></td>
                        <td><SourceBadge source={s.source} /></td>
                        <td>
                          {last ? (
                            <a href={`#/simulation/runs/${last.run.id}?scenario=${s.id}`} onClick={(e) => e.stopPropagation()} style={{ display: 'block' }}>
                              <div className="eval-row-bar" style={{ minWidth: 0 }}>
                                <span className="num" style={{ width: 38, fontWeight: 600 }}>{pct(last.rate)}</span>
                                <PassBar rate={last.rate} />
                              </div>
                              <div className="faint" style={{ fontSize: 12 }}>{dateShort(last.run.createdAt)} · {last.total} conversations</div>
                            </a>
                          ) : <span className="faint">Not tested yet</span>}
                        </td>
                        <td>
                          <Menu trigger={(toggle) => (
                            <button className="icon-btn" onClick={toggle} aria-label={`Actions for ${s.name}`}><MoreHorizontal size={16} /></button>
                          )}>
                            <button onClick={() => setEditing(s)}><Pencil size={14} /> Edit</button>
                            <button onClick={() => duplicateScenario(s.id)}><Copy size={14} /> Duplicate</button>
                            <hr />
                            <button className="danger" onClick={() => setDeleting(s)}><Trash2 size={14} /> Delete</button>
                          </Menu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing && <ScenarioForm initial={editing === 'new' ? null : editing} onSave={saveScenario} onClose={() => setEditing(null)} />}
      {generating && <GenerateScenarios onAdd={(items) => { addScenarios(items); setTab('all') }} onClose={() => setGenerating(false)} />}
      {deleting && (
        <Modal
          title="Delete scenario?"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { deleteScenario(deleting.id); setDeleting(null) }}>Delete</Button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}><strong>{deleting.name}</strong> won't be available for new simulations. Past simulations that used it keep their results.</p>
        </Modal>
      )}
    </>
  )
}
