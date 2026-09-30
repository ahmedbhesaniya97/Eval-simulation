import { useMemo, useState } from 'react'
import { Check, X, ChevronRight, Search, RotateCcw, SearchX, Info } from 'lucide-react'
import { useStore, navigate } from '../store.jsx'
import { SESSION_BY_ID } from '../data/sessions.js'
import { AGENT_BY_ID } from '../data/agents.js'
import { TriggerBadge } from './RunsPage.jsx'
import { summarizeRun, sessionStatus } from '../data/engine.js'
import { Button, PageHeader, StatusBadge, StatusIcon, RequiredBadge, EmptyState, PassBar, statusLabel } from '../components/ui.jsx'
import { dateTime, dateShort, duration, n, pct, plural } from '../format.js'

const ORDER = { failed: 0, review: 1, passed: 2, skipped: 3 }
const FILTERS = ['all', 'passed', 'review', 'failed', 'skipped']
const PAGE = 30

export default function RunResults({ run, query }) {
  const { automations } = useStore()
  const agent = AGENT_BY_ID[run.agentId]
  const runsHref = `#/runs?agent=${run.agentId}`
  const crumbs = [{ label: 'Home', href: '#/home' }, { label: 'Runs', href: runsHref }, { label: agent.name, href: runsHref }, { label: run.name }]
  return (
    <>
      <PageHeader
        crumbs={crumbs}
        title={run.name}
        back={runsHref}
        badge={<><StatusBadge status={run.status} large /><TriggerBadge run={run} automations={automations} /></>}
        actions={run.status === 'completed' && run.trigger.type === 'manual' && <Button onClick={() => navigate(`#/runs/new?agent=${run.agentId}`)}><RotateCcw size={14} /> Run again</Button>}
      />
      <div className="page-inner">
        <div className="row muted" style={{ gap: 14, fontSize: 13, padding: '14px 0 0', flexWrap: 'wrap' }}>
          <span>{dateTime(run.createdAt)}</span>
          <span className="faint">·</span>
          <span>{run.trigger.type === 'automation' ? `Automated · ${dateShort(run.trigger.day + 'T12:00:00')} sessions` : `by ${run.createdBy}`}</span>
          <span className="faint">·</span>
          <span>{agent.name} <span className="mono faint">({agent.id}) v{run.agentVersion}</span></span>
          <span className="faint">·</span>
          <span>{plural(run.evaluations.length, 'evaluation')}</span>
          <span className="faint">·</span>
          <span>{n(run.sessionIds.length)} selected → {n(Object.keys(run.skipped).length)} skipped → {n(run.evaluated.length)} evaluated</span>
        </div>
        {run.status === 'running' ? <Running run={run} /> : <Results run={run} query={query} />}
      </div>
    </>
  )
}

function Running({ run }) {
  const per = run.evaluations.length
  const sessionsDone = per ? Math.floor(run.doneChecks / per) : 0
  const remainingSec = run.totalChecks ? Math.max(1, Math.round(((run.totalChecks - run.doneChecks) / run.totalChecks) * 16)) : 0
  return (
    <div className="card" style={{ marginTop: 24, maxWidth: 720 }}>
      <div className="card-body" style={{ padding: 28 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600 }}>Running evaluation…</h2>
        <p className="muted" style={{ margin: '0 0 24px' }}>
          You can leave this page. The run continues in the background, and we'll let you know when it's done.
        </p>
        <div className="row" style={{ marginBottom: 8 }}>
          <span>Sessions</span>
          <div className="spacer" />
          <span className="num">{n(sessionsDone)} / {n(run.evaluated.length)}</span>
        </div>
        <div className="bar bar-lg"><span className="fill" style={{ width: `${run.evaluated.length ? (sessionsDone / run.evaluated.length) * 100 : 100}%` }} /></div>
        <div className="row" style={{ margin: '22px 0 8px' }}>
          <span>Evaluations</span>
          <div className="spacer" />
          <span className="num">{n(run.doneChecks)} / {n(run.totalChecks)} checks completed</span>
        </div>
        <div className="bar bar-lg"><span className="fill" style={{ width: `${run.totalChecks ? (run.doneChecks / run.totalChecks) * 100 : 100}%`, background: 'var(--text-2)' }} /></div>
        <div className="row" style={{ marginTop: 24 }}>
          <span className="muted">Estimated remaining: ~{remainingSec}s</span>
          <div className="spacer" />
          <Button onClick={() => navigate('#/runs')}>Back to runs</Button>
          <Button onClick={() => navigate('#/evaluations')}>Go to evaluations</Button>
        </div>
      </div>
    </div>
  )
}

function Results({ run, query }) {
  const summary = useMemo(() => summarizeRun(run), [run])
  const [status, setStatus] = useState(query.get('status') || 'all')
  const [evalFilter, setEvalFilter] = useState(query.get('eval') || 'any')
  const [search, setSearch] = useState('')
  const [shown, setShown] = useState(PAGE)

  const evals = [...run.evaluations].sort((a, b) => b.required - a.required)
  const rows = useMemo(() => {
    const list = run.sessionIds.map((sid) => {
      if (run.skipped[sid]) return { sid, status: 'skipped', reason: run.skipped[sid] }
      return { sid, status: sessionStatus(run.results[sid], run.evaluations), results: run.results[sid] }
    })
    return list.sort((a, b) => ORDER[a.status] - ORDER[b.status] || SESSION_BY_ID[b.sid].startedAt.localeCompare(SESSION_BY_ID[a.sid].startedAt))
  }, [run])

  const filtered = rows.filter((r) => {
    if (status !== 'all' && r.status !== status) return false
    if (evalFilter !== 'any' && r.results?.[evalFilter]?.status !== 'failed') return false
    if (search && !r.sid.includes(search.trim().toLowerCase())) return false
    return true
  })
  const countFor = (f) => (f === 'all' ? rows.length : summary.counts[f])
  const focus = (evalId) => {
    setEvalFilter(evalId)
    setStatus('all')
    setShown(PAGE)
    document.getElementById('sessions')?.scrollIntoView({ behavior: 'smooth' })
  }
  const total = run.sessionIds.length
  const segs = [
    ['passed', 'var(--pass)'], ['review', 'var(--warn)'], ['failed', 'var(--fail)'], ['skipped', 'var(--skip)'],
  ]

  if (run.evaluated.length === 0) {
    return (
      <div style={{ marginTop: 24 }}>
        <EmptyState icon={SearchX} title="No sessions were evaluated" action={<Button variant="primary" onClick={() => navigate('#/runs/new')}>Review Skip Rules</Button>}>
          All selected sessions were excluded by your skip rules.
        </EmptyState>
      </div>
    )
  }

  return (
    <>
      {/* ---- Aggregate summary ---- */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1.35fr', marginTop: 20 }}>
        <div className="card card-body">
          <div className="eyebrow">Overall</div>
          <div className="stat-value num" style={{ fontSize: 36 }}>{pct(summary.passRate)} <small>passed</small></div>
          <div className="stat-note">{n(summary.checksPassed)} of {n(summary.checks)} checks across {n(run.evaluated.length)} sessions</div>
        </div>
        <div className="card card-body" style={{ borderColor: 'var(--border-strong)' }}>
          <div className="row" style={{ gap: 6 }}><span className="eyebrow">Required evaluations</span><RequiredBadge required /></div>
          {summary.required.evals.length ? (
            <>
              <div className="stat-value num">{n(summary.required.sessionsPassing)} <small>/ {n(run.evaluated.length)} sessions</small></div>
              <div className="stat-note">passed every required check · {pct(summary.required.passed / summary.required.checks)} of required checks</div>
            </>
          ) : <div className="stat-note" style={{ marginTop: 10 }}>No required evaluations in this run.</div>}
        </div>
        <div className="card card-body">
          <div className="row" style={{ gap: 6 }}><span className="eyebrow">Optional evaluations</span><RequiredBadge required={false} /></div>
          {summary.optional.evals.length ? (
            <>
              <div className="stat-value num">{pct(summary.optional.passed / summary.optional.checks)} <small>passed</small></div>
              <div className="stat-note">{n(summary.counts.review)} sessions need review because of an optional failure</div>
            </>
          ) : <div className="stat-note" style={{ marginTop: 10 }}>No optional evaluations in this run.</div>}
        </div>
        <div className="card card-body">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Sessions</div>
          <div className="stack" role="img" aria-label="Session outcomes">
            {segs.map(([k, c]) => summary.counts[k] > 0 && <span key={k} style={{ width: `${(summary.counts[k] / total) * 100}%`, background: c }} title={`${statusLabel(k)}: ${summary.counts[k]}`} />)}
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginTop: 14 }}>
            {segs.map(([k]) => (
              <button key={k} className="row" style={{ gap: 8, background: 'none', border: 0, padding: 0, fontSize: 13 }} onClick={() => { setStatus(k); setEvalFilter('any'); document.getElementById('sessions')?.scrollIntoView({ behavior: 'smooth' }) }}>
                <StatusIcon status={k} size={16} />
                <span className="muted">{statusLabel(k)}</span>
                <span className="num" style={{ marginLeft: 'auto', fontWeight: 600 }}>{n(summary.counts[k])}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Per-evaluation breakdown ---- */}
      <div className="section">
        <div className="section-head">
          <div>
            <h2 className="section-title">By evaluation</h2>
            <div className="section-desc">A required failure fails the session. An optional failure flags it for review.</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Evaluation</th>
                <th className="right">Passed</th>
                <th className="right">Failed</th>
                <th style={{ width: '30%' }} />
                <th />
              </tr>
            </thead>
            {[['Required', summary.perEval.filter((e) => e.required)], ['Optional', summary.perEval.filter((e) => !e.required)]].map(([label, list]) =>
              list.length > 0 && (
                <tbody key={label}>
                  <tr>
                    <td colSpan={5} style={{ background: 'var(--bg)', padding: '8px 14px', fontSize: 12, color: 'var(--text-2)' }}>
                      {label} evaluations
                      <span className="faint"> · {list.reduce((a, e) => a + (e.failed === 0 ? 1 : 0), 0)} / {list.length} with no failures</span>
                    </td>
                  </tr>
                  {list.map((e) => (
                    <tr key={e.id} className="clickable" onClick={() => focus(e.id)}>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <span style={{ fontWeight: 500 }}>{e.name}</span>
                          <RequiredBadge required={e.required} />
                        </div>
                      </td>
                      <td className="right num" style={{ color: 'var(--pass)', fontWeight: 600 }}>{pct(e.passRate)}</td>
                      <td className="right num" style={{ color: e.failed ? 'var(--fail)' : 'var(--text-3)', fontWeight: 600 }}>{pct(1 - e.passRate)}</td>
                      <td><PassBar rate={e.passRate} /></td>
                      <td className="right">
                        {e.failed > 0 ? (
                          <button className="link" onClick={(ev) => { ev.stopPropagation(); focus(e.id) }}>
                            Show {n(e.failed)} failed <ChevronRight size={13} style={{ verticalAlign: -2 }} />
                          </button>
                        ) : <span className="faint">No failures</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              )
            )}
          </table>
        </div>
      </div>

      {/* ---- Session-level results ---- */}
      <div className="section" id="sessions" style={{ scrollMarginTop: 120 }}>
        <div className="section-head"><h2 className="section-title">Sessions</h2></div>
        <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
          <div className="seg" role="group" aria-label="Filter by result">
            {FILTERS.map((f) => (
              <button key={f} className={status === f ? 'active' : ''} onClick={() => { setStatus(f); setShown(PAGE) }}>
                {f === 'all' ? 'All' : statusLabel(f)} <span className="faint num">{countFor(f)}</span>
              </button>
            ))}
          </div>
          <select className="select" value={evalFilter} onChange={(e) => { setEvalFilter(e.target.value); setShown(PAGE) }} aria-label="Failed evaluation">
            <option value="any">Any evaluation</option>
            {evals.map((e) => <option key={e.id} value={e.id}>{e.name} failed</option>)}
          </select>
          <label className="search">
            <Search size={15} />
            <input className="input" style={{ width: 200 }} placeholder="Session ID" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </div>
        {evalFilter !== 'any' && (
          <div className="row" style={{ marginBottom: 12, fontSize: 13.5 }}>
            <Info size={14} className="muted" />
            <span>Showing sessions where <strong>{evals.find((e) => e.id === evalFilter)?.name}</strong> failed</span>
            <button className="link" onClick={() => setEvalFilter('any')}>Clear</button>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState icon={SearchX} title="No sessions match" action={<Button onClick={() => { setStatus('all'); setEvalFilter('any'); setSearch('') }}>Clear filters</Button>}>
            No sessions in this run match the current filters.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 36 }} />
                  <th>Session</th>
                  <th>Result</th>
                  <th>Evaluations</th>
                  <th style={{ width: 30 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, shown).map((r) => {
                  const s = SESSION_BY_ID[r.sid]
                  const failedReq = r.results ? evals.filter((e) => e.required && r.results[e.id].status === 'failed').length : 0
                  return (
                    <tr key={r.sid} className={r.status === 'skipped' ? '' : 'clickable'} onClick={() => r.status !== 'skipped' && navigate(`#/runs/${run.id}/sessions/${r.sid}`)}>
                      <td><StatusIcon status={r.status} /></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="mono" style={{ fontSize: 13 }}>{r.sid}</div>
                        <div className="faint" style={{ fontSize: 12.5 }}>{dateTime(s.startedAt)} · {duration(s.duration)} · {s.turnCount} turns</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{statusLabel(r.status)}</div>
                        <div className="faint" style={{ fontSize: 12 }}>
                          {r.status === 'skipped' ? r.reason : r.status === 'failed' ? `${failedReq} required failed` : r.status === 'review' ? 'Optional failed' : 'All checks passed'}
                        </div>
                      </td>
                      <td>
                        {r.results ? (
                          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                            {evals.map((e) => {
                              const v = r.results[e.id]
                              return (
                                <span key={e.id} className={`chip ${v.status} ${e.required ? 'req' : ''}`} title={v.reason}>
                                  {v.status === 'passed' ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                                  {e.name}
                                </span>
                              )
                            })}
                          </div>
                        ) : <span className="faint" style={{ fontSize: 13 }}>Not evaluated · {r.reason}</span>}
                      </td>
                      <td>{r.status !== 'skipped' && <ChevronRight size={16} className="faint" />}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length > shown && (
              <div style={{ padding: 12, textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                <Button size="sm" onClick={() => setShown(shown + PAGE * 2)}>Show more <span className="faint">· {n(filtered.length - shown)} remaining</span></Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
