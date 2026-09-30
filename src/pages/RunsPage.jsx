import { useMemo } from 'react'
import { Play, TrendingUp, TrendingDown, History, Loader2 } from 'lucide-react'
import { useStore, navigate } from '../store.jsx'
import { summarizeRun } from '../data/engine.js'
import { Button, PageHeader, StatusBadge, EmptyState, PassBar } from '../components/ui.jsx'
import TrendChart from '../components/TrendChart.jsx'
import { dateShort, pct, n, time } from '../format.js'

export default function RunsPage() {
  const { runs } = useStore()
  const completed = useMemo(
    () => runs.filter((r) => r.status === 'completed').map((r) => ({ run: r, summary: summarizeRun(r) })),
    [runs]
  )

  const latest = completed[0]
  const previous = completed[1]
  const delta = latest && previous ? latest.summary.passRate - previous.summary.passRate : null
  const trend = [...completed].reverse().map(({ run, summary }) => ({ id: run.id, date: run.createdAt, label: run.name, value: summary.passRate }))
  const worst = latest ? [...latest.summary.perEval].sort((a, b) => a.passRate - b.passRate) : []

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', href: '#/home' }, { label: 'Evaluation', href: '#/evaluations' }, { label: 'Runs' }]}
        title="Evaluation Runs"
        subtitle="Every time you run evaluations against sessions. Is your agent getting better, or are problems increasing?"
        actions={<Button variant="primary" onClick={() => navigate('#/runs/new')}><Play size={14} fill="currentColor" /> Run Evaluation</Button>}
      />
      <div className="page-inner">
        {runs.length === 0 ? (
          <div style={{ marginTop: 28 }}>
            <EmptyState icon={History} title="No runs yet" action={<Button variant="primary" onClick={() => navigate('#/runs/new')}>Run Evaluation</Button>}>
              Run your evaluations against past sessions to see how your agent performs.
            </EmptyState>
          </div>
        ) : (
          <>
            {latest && (
              <div className="grid" style={{ gridTemplateColumns: '260px 1fr 1.4fr', marginTop: 24 }}>
                <div className="card card-body">
                  <div className="eyebrow">Overall pass rate</div>
                  <div className="stat-value num" style={{ fontSize: 40, marginTop: 6 }}>{pct(latest.summary.passRate)}</div>
                  {delta != null && (
                    <div className="row" style={{ gap: 6, marginTop: 6, fontSize: 13, color: delta >= 0 ? 'var(--pass)' : 'var(--fail)' }}>
                      {delta >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                      {delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)} pts
                      <span className="muted">vs previous run</span>
                    </div>
                  )}
                  <div className="stat-note" style={{ marginTop: 14 }}>
                    Latest run: <a className="link" href={`#/runs/${latest.run.id}`}>{latest.run.name}</a>, {dateShort(latest.run.createdAt)}
                    <br />{n(latest.summary.checksPassed)} of {n(latest.summary.checks)} checks passed
                  </div>
                </div>

                <div className="card">
                  <div className="card-head"><h3 className="card-title">Evaluations with most failures</h3><span className="faint" style={{ fontSize: 12.5, marginLeft: 'auto' }}>Latest run</span></div>
                  <div className="card-body" style={{ paddingTop: 8 }}>
                    {worst.map((e) => (
                      <a key={e.id} href={`#/runs/${latest.run.id}?eval=${e.id}`} style={{ display: 'block', padding: '7px 0' }}>
                        <div className="row" style={{ marginBottom: 5 }}>
                          <span style={{ flex: 1 }}>{e.name}</span>
                          <span className="num" style={{ color: 'var(--fail)', fontWeight: 600 }}>{pct(1 - e.passRate)}</span>
                          <span className="faint" style={{ fontSize: 12.5, width: 42 }}>failed</span>
                        </div>
                        <div className="bar"><span style={{ width: `${(1 - e.passRate) * 100}%`, background: 'var(--fail)' }} /></div>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-head">
                    <h3 className="card-title">Pass rate trend</h3>
                    <span className="faint" style={{ fontSize: 12.5, marginLeft: 'auto' }}>{trend.length} runs · click a point to open</span>
                  </div>
                  <div className="card-body" style={{ padding: '8px 12px 6px' }}>
                    <TrendChart points={trend} onSelect={(p) => navigate(`#/runs/${p.id}`)} />
                  </div>
                </div>
              </div>
            )}

            <div className="section">
              <div className="section-head">
                <div>
                  <h2 className="section-title">Run history</h2>
                  <div className="section-desc">Each run keeps the evaluations and criteria it used, even if you edit them later.</div>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Run</th>
                      <th className="right">Sessions</th>
                      <th className="right">Evaluations</th>
                      <th style={{ width: 260 }}>Pass rate</th>
                      <th className="right">Failed required</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r) => {
                      const s = r.status === 'completed' ? completed.find((c) => c.run.id === r.id).summary : null
                      return (
                        <tr key={r.id} className="clickable" onClick={() => navigate(`#/runs/${r.id}`)}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{r.name}</div>
                            <div className="faint mono" style={{ fontSize: 12 }}>{r.id} · agent v{r.agentVersion}</div>
                          </td>
                          <td className="right num">{n(r.evaluated.length)}</td>
                          <td className="right num">{r.evaluations.length}</td>
                          <td>
                            {s ? (
                              <div className="eval-row-bar">
                                <span className="num" style={{ width: 40, fontWeight: 600 }}>{pct(s.passRate)}</span>
                                <PassBar rate={s.passRate} />
                              </div>
                            ) : (
                              <div className="eval-row-bar">
                                <Loader2 size={14} className="spin" style={{ color: 'var(--accent)' }} />
                                <div className="bar"><span className="fill" style={{ width: `${(r.doneChecks / r.totalChecks) * 100}%` }} /></div>
                                <span className="num muted" style={{ fontSize: 12.5 }}>{Math.round((r.doneChecks / r.totalChecks) * 100)}%</span>
                              </div>
                            )}
                          </td>
                          <td className="right num">
                            {s ? (s.counts.failed ? <span style={{ color: 'var(--fail)' }}>{n(s.counts.failed)} sessions</span> : <span className="faint">None</span>) : <span className="faint">—</span>}
                          </td>
                          <td className="muted">{dateShort(r.createdAt)} <span className="faint">· {time(r.createdAt)}</span></td>
                          <td><StatusBadge status={r.status} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
