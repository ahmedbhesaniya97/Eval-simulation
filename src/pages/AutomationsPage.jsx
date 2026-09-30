import { useMemo, useState } from 'react'
import { Plus, MoreHorizontal, Play, Pause, Trash2, History, CalendarClock, CheckCircle2, X } from 'lucide-react'
import { useStore, navigate } from '../store.jsx'
import { summarizeRun } from '../data/engine.js'
import { AGENTS, AGENT_BY_ID } from '../data/agents.js'
import { NOW } from '../data/sessions.js'
import { Button, PageHeader, Toggle, Menu, Modal, EmptyState, PassBar } from '../components/ui.jsx'
import { dateShort, pct, timeLabel } from '../format.js'

function nextRun(a) {
  if (!a.enabled) return null
  const [h, m] = a.time.split(':').map(Number)
  const today = NOW.getHours() * 60 + NOW.getMinutes() < h * 60 + m
  return `${today ? 'Today' : 'Tomorrow'}, ${timeLabel(a.time)}`
}

export default function AutomationsPage({ query }) {
  const { automations, runs, evaluations, toggleAutomation, deleteAutomation, runAutomationNow } = useStore()
  const [agentFilter, setAgentFilter] = useState('all')
  const [deleting, setDeleting] = useState(null)
  const [banner, setBanner] = useState(query.get('created'))
  const created = automations.find((a) => a.id === banner)

  const lastRuns = useMemo(() => {
    const out = {}
    for (const r of runs) {
      if (r.trigger.type !== 'automation' || out[r.trigger.automationId]) continue
      out[r.trigger.automationId] = r // runs are newest first
    }
    return out
  }, [runs])

  const list = automations.filter((a) => agentFilter === 'all' || a.agentId === agentFilter)
  const evalName = (id) => evaluations.find((e) => e.id === id)?.name ?? 'Deleted evaluation'

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', href: '#/home' }, { label: 'Evaluation', href: '#/evaluations' }, { label: 'Automations' }]}
        title="Automations"
        subtitle="Evaluate every session automatically. Each automation runs once a day on all sessions its agent handled that day."
        actions={<Button variant="primary" onClick={() => navigate('#/runs/new?mode=auto')}><Plus size={15} /> New automation</Button>}
      />
      <div className="page-inner">
        {created && (
          <div className="card row" style={{ marginTop: 20, padding: '12px 16px', borderColor: 'rgba(76,195,138,.4)', background: 'var(--pass-bg)' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--pass)' }} />
            <span><strong>{created.name}</strong> is on. The first run starts tonight at {timeLabel(created.time)} on {AGENT_BY_ID[created.agentId].name}'s sessions from today.</span>
            <div className="spacer" />
            <button className="icon-btn" onClick={() => setBanner(null)} aria-label="Dismiss"><X size={15} /></button>
          </div>
        )}

        <div className="row" style={{ margin: '20px 0 12px' }}>
          <select className="select" value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} aria-label="Agent">
            <option value="all">All agents</option>
            {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
          </select>
        </div>

        {list.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No automations yet" action={<Button variant="primary" onClick={() => navigate('#/runs/new?mode=auto')}><Plus size={15} /> New automation</Button>}>
            Set up a daily evaluation so every session gets checked without anyone starting a run.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Automation</th>
                  <th>Agent</th>
                  <th>Schedule</th>
                  <th>Evaluations</th>
                  <th style={{ width: 220 }}>Last run</th>
                  <th>Next run</th>
                  <th>Status</th>
                  <th style={{ width: 48 }} />
                </tr>
              </thead>
              <tbody>
                {list.map((a) => {
                  const last = lastRuns[a.id]
                  const s = last?.status === 'completed' && last.evaluated.length ? summarizeRun(last) : null
                  const viewRuns = () => navigate(`#/runs?agent=${a.agentId}&trigger=automation`)
                  return (
                    <tr key={a.id} className={`clickable ${a.id === banner ? 'selected' : ''}`} onClick={viewRuns} style={{ opacity: a.enabled ? 1 : 0.65 }}>
                      <td>
                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{a.name}</div>
                        <div className="faint mono" style={{ fontSize: 12 }}>{a.id}</div>
                      </td>
                      <td>
                        <div style={{ whiteSpace: 'nowrap' }}>{AGENT_BY_ID[a.agentId].name}</div>
                        <div className="faint mono" style={{ fontSize: 12 }}>{a.agentId}</div>
                      </td>
                      <td>
                        <div className="row" style={{ gap: 6, whiteSpace: 'nowrap' }}><CalendarClock size={14} className="muted" /> Daily · {timeLabel(a.time)}</div>
                        <div className="faint" style={{ fontSize: 12 }}>That day's sessions</div>
                      </td>
                      <td title={a.evalIds.map(evalName).join(', ')}>
                        <div>{a.evalIds.length} evaluations</div>
                        <div className="faint" style={{ fontSize: 12, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.evalIds.map(evalName).join(', ')}</div>
                      </td>
                      <td style={{ minWidth: 200 }}>
                        {!last ? (
                          <span className="faint">Not run yet</span>
                        ) : last.status === 'running' ? (
                          <a className="link" href={`#/runs/${last.id}`} onClick={(e) => e.stopPropagation()}>Running…</a>
                        ) : (
                          <a href={`#/runs/${last.id}`} onClick={(e) => e.stopPropagation()} style={{ display: 'block' }}>
                            <div className="eval-row-bar" style={{ minWidth: 0 }}>
                              <span className="num" style={{ width: 38, fontWeight: 600 }}>{s ? pct(s.passRate) : '—'}</span>
                              {s && <PassBar rate={s.passRate} />}
                            </div>
                            <div className="faint" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{dateShort(last.createdAt)} · {last.evaluated.length} sessions</div>
                          </a>
                        )}
                      </td>
                      <td className={a.enabled ? '' : 'faint'} style={{ whiteSpace: 'nowrap' }}>{nextRun(a) ?? 'Paused'}</td>
                      <td>
                        <div className="row">
                          <Toggle on={a.enabled} onChange={() => toggleAutomation(a.id)} label={`${a.enabled ? 'Pause' : 'Resume'} ${a.name}`} />
                          <span className={a.enabled ? '' : 'faint'} style={{ fontSize: 13 }}>{a.enabled ? 'Active' : 'Paused'}</span>
                        </div>
                      </td>
                      <td>
                        <Menu trigger={(toggle) => (
                          <button className="icon-btn" onClick={toggle} aria-label={`Actions for ${a.name}`}><MoreHorizontal size={16} /></button>
                        )}>
                          <button onClick={() => navigate(`#/runs/${runAutomationNow(a)}`)}><Play size={14} /> Run now on today's sessions</button>
                          <button onClick={viewRuns}><History size={14} /> View runs</button>
                          <button onClick={() => toggleAutomation(a.id)}>{a.enabled ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}</button>
                          <hr />
                          <button className="danger" onClick={() => setDeleting(a)}><Trash2 size={14} /> Delete</button>
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

      {deleting && (
        <Modal
          title="Delete automation?"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { deleteAutomation(deleting.id); setDeleting(null) }}>Delete</Button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            <strong>{deleting.name}</strong> will stop running. Runs it already created stay in Runs.
          </p>
        </Modal>
      )}
    </>
  )
}
