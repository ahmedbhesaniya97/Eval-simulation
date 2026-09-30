import { useMemo, useState } from 'react'
import { Check, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { navigate } from '../store.jsx'
import { SESSION_BY_ID } from '../data/sessions.js'
import { sessionStatus } from '../data/engine.js'
import { PageHeader, StatusBadge, RequiredBadge, StatusIcon } from '../components/ui.jsx'
import { SessionMeta } from '../components/SessionBits.jsx'
import SessionView from '../components/SessionView.jsx'
import { clock } from '../format.js'

const ORDER = { failed: 0, review: 1, passed: 2 }

export default function SessionResult({ run, sessionId }) {
  const session = SESSION_BY_ID[sessionId]
  const results = run.results[sessionId]
  const evals = useMemo(() => [...run.evaluations].sort((a, b) => b.required - a.required), [run])
  const status = sessionStatus(results, run.evaluations)

  // Default to the most important failure so the "why" is visible immediately.
  const firstFailed = evals.find((e) => results[e.id].status === 'failed')
  const [selectedId, setSelectedId] = useState((firstFailed ?? evals[0]).id)
  // Jump straight to the turn that explains the failure.
  const [focusTurn, setFocusTurn] = useState(() => (firstFailed && results[firstFailed.id].turns.length ? { idx: results[firstFailed.id].turns[0] } : null))
  const selected = evals.find((e) => e.id === selectedId)
  const verdict = selectedId ? results[selectedId] : null

  // Prev / next through this run's evaluated sessions, worst first.
  const order = useMemo(() =>
    run.evaluated
      .map((sid) => ({ sid, s: sessionStatus(run.results[sid], run.evaluations) }))
      .sort((a, b) => ORDER[a.s] - ORDER[b.s] || SESSION_BY_ID[b.sid].startedAt.localeCompare(SESSION_BY_ID[a.sid].startedAt))
      .map((r) => r.sid), [run])
  const pos = order.indexOf(sessionId)

  const select = (id) => {
    setSelectedId(id)
    const turns = results[id].turns
    if (turns.length) setFocusTurn({ idx: turns[0] })
  }

  const group = (required) => evals.filter((e) => e.required === required)
  const passedIn = (list) => list.filter((e) => results[e.id].status === 'passed').length

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Home', href: '#/home' },
          { label: 'Runs', href: '#/runs' },
          { label: run.name, href: `#/runs/${run.id}` },
          { label: sessionId },
        ]}
        title={sessionId}
        back={`#/runs/${run.id}`}
        badge={<StatusBadge status={status} large />}
        actions={
          <div className="row" style={{ gap: 4 }}>
            <span className="faint num" style={{ fontSize: 12.5, marginRight: 6 }}>{pos + 1} of {order.length}</span>
            <button className="icon-btn" disabled={pos <= 0} onClick={() => navigate(`#/runs/${run.id}/sessions/${order[pos - 1]}`)} aria-label="Previous session"><ChevronLeft size={16} /></button>
            <button className="icon-btn" disabled={pos >= order.length - 1} onClick={() => navigate(`#/runs/${run.id}/sessions/${order[pos + 1]}`)} aria-label="Next session"><ChevronRight size={16} /></button>
          </div>
        }
      />
      <div className="page-inner">
        <div style={{ paddingTop: 12 }}><SessionMeta session={session} /></div>
        <div className="split">
          <div>
            <SessionView
              session={session}
              highlight={verdict?.turns.length ? { turns: verdict.turns, tone: verdict.status === 'passed' ? 'pass' : 'fail', label: selected.name } : null}
              focusTurn={focusTurn}
              markers={(verdict?.turns ?? []).map((i) => ({ t: session.turns[i].t, color: verdict.status === 'passed' ? 'var(--pass)' : 'var(--fail)', title: selected.name }))}
            />
          </div>

          <aside className="side" style={{ paddingTop: 16 }}>
            <h2 className="section-title" style={{ marginBottom: 4 }}>Evaluation results</h2>
            <div className="row muted" style={{ fontSize: 13, marginBottom: 14, gap: 14 }}>
              {group(true).length > 0 && <span>Required <strong style={{ color: passedIn(group(true)) === group(true).length ? 'var(--pass)' : 'var(--fail)' }}>{passedIn(group(true))} / {group(true).length}</strong> passed</span>}
              {group(false).length > 0 && <span>Optional <strong style={{ color: passedIn(group(false)) === group(false).length ? 'var(--pass)' : 'var(--warn)' }}>{passedIn(group(false))} / {group(false).length}</strong> passed</span>}
            </div>

            {[true, false].map((req) => group(req).length > 0 && (
              <div key={String(req)} style={{ marginBottom: 14 }}>
                <div className="faint" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 6px' }}>{req ? 'Required' : 'Optional'}</div>
                {group(req).map((e) => {
                  const v = results[e.id]
                  const open = e.id === selectedId
                  return (
                    <div key={e.id} className={`verdict ${v.status} ${open ? 'selected' : ''}`}>
                      <button className="verdict-head" onClick={() => (open ? setSelectedId(null) : select(e.id))} aria-expanded={open}>
                        <StatusIcon status={v.status} />
                        <span style={{ flex: 1, fontWeight: 500 }}>{e.name}</span>
                        <span className={`badge ${v.status}`}>{v.status === 'passed' ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}{v.status === 'passed' ? 'PASSED' : 'FAILED'}</span>
                        {open ? <ChevronUp size={15} className="faint" /> : <ChevronDown size={15} className="faint" />}
                      </button>
                      {open && (
                        <div className="verdict-body">
                          <h4>Why?</h4>
                          <p className="why">{v.reason}</p>
                          {v.turns.length > 0 && (
                            <>
                              <h4>Relevant turns</h4>
                              <div className="turn-links">
                                {v.turns.map((i) => (
                                  <button key={i} className="turn-link" onClick={() => setFocusTurn({ idx: i })}>
                                    {clock(session.turns[i].t)} · {session.turns[i].role === 'agent' ? 'Agent' : 'User'}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                          <h4>Success criteria</h4>
                          <p className="muted">{e.success}</p>
                          <h4>Failure criteria</h4>
                          <p className="muted">{e.failure}</p>
                          <div style={{ marginTop: 12 }}><RequiredBadge required={e.required} /></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </aside>
        </div>
      </div>
    </>
  )
}
