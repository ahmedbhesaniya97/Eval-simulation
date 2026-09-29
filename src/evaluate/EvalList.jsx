import { useState } from 'react'
import { Play, Plus, ChevronRight, Radio, FlaskConical } from 'lucide-react'
import { StatusIcon } from '../components/ui'
import { evalStats, pct, TARGET } from './data'

// Latest result for an eval = the newest run that included it.
export function latestStats(runs, ev) {
  const run = runs.find((r) => r.evalIds.includes(ev.id))
  if (!run) return null
  const s = evalStats(run, ev)
  return s.applicable ? { ...s, run } : null
}

function RateCell({ s }) {
  if (!s) return <span className="muted">Not run yet</span>
  const color = s.status === 'success' ? 'var(--success)' : s.status === 'failed' ? 'var(--failed)' : 'var(--attention)'
  return (
    <div className="row" style={{ gap: 10 }}>
      <b style={{ fontWeight: 600, width: 40, fontVariantNumeric: 'tabular-nums' }}>{pct(s.rate)}</b>
      <div className="progress" style={{ width: 90, height: 5 }}><span style={{ width: `${s.rate * 100}%`, background: color }} /></div>
      <span className="muted small">{s.passed}/{s.applicable} calls</span>
    </div>
  )
}

const SourceIcon = ({ source }) => (source === 'production' ? <Radio size={14} className="muted" /> : <FlaskConical size={14} className="muted" />)

export default function EvalList({ store }) {
  const { evals, runs, setView, setEditing } = store
  const [filter, setFilter] = useState('all')

  const rows = evals.map((ev) => ({ ev, s: latestStats(runs, ev) }))
  const shown = rows.filter(({ ev, s }) =>
    filter === 'all' || (filter === 'required' && ev.required) || (filter === 'custom' && !ev.builtIn) || (filter === 'attention' && s && s.status !== 'success'))
  const required = rows.filter((r) => r.ev.required)
  const reqOk = required.filter((r) => r.s && r.s.status === 'success').length
  const attention = rows.filter((r) => r.s && r.s.status !== 'success').length

  const newEval = () => setEditing({ id: `c_${Date.now()}`, builtIn: false, required: false, scenarios: 'all', name: '', task: '', success: '', failure: '' })

  return (
    <>
      <div className="page-head">
        <div className="page-title">Evaluations</div>
        <div className="row">
          <button className="btn" onClick={newEval}><Plus size={15} />Add custom eval</button>
          <button className="btn primary" onClick={() => setView('run')}><Play size={14} fill="currentColor" />Run evaluation</button>
        </div>
      </div>
      <p className="page-sub">The checks your agent is scored on. Run them on real production calls or on simulated calls.</p>

      <div className="grid-3 mb-16" style={{ marginBottom: 20 }}>
        <div className="card card-pad" style={{ padding: 16 }}>
          <div className="muted small">Required evals passing</div>
          <div className="row" style={{ gap: 8, marginTop: 4 }}>
            <StatusIcon status={reqOk === required.length ? 'success' : 'attention'} size={18} />
            <span style={{ fontSize: 22, fontWeight: 600 }}>{reqOk} of {required.length}</span>
          </div>
        </div>
        <div className="card card-pad" style={{ padding: 16 }}>
          <div className="muted small">Need attention</div>
          <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{attention} {attention === 1 ? 'eval' : 'evals'}</div>
        </div>
        <div className="card card-pad" style={{ padding: 16 }}>
          <div className="muted small">Last run</div>
          <div className="row" style={{ gap: 8, marginTop: 6 }}><SourceIcon source={runs[0].source} /><span style={{ fontWeight: 500 }}>{runs[0].label}</span></div>
          <div className="muted small">{runs[0].when}</div>
        </div>
      </div>

      <div className="chips mb-16">
        {[['all', 'All', rows.length], ['required', 'Required', required.length], ['custom', 'Custom', rows.filter((r) => !r.ev.builtIn).length], ['attention', 'Needs attention', attention]].map(([k, l, n]) => (
          <button key={k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{l} <span className="muted">{n}</span></button>
        ))}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th style={{ width: 28 }}></th><th>Name</th><th style={{ width: 110 }}>Required</th><th style={{ width: 260 }}>Success rate <span style={{ fontWeight: 400 }}>· target {pct(TARGET)}</span></th><th style={{ width: 24 }}></th></tr>
          </thead>
          <tbody>
            {shown.map(({ ev, s }) => (
              <tr key={ev.id} onClick={() => setEditing(ev)}>
                <td style={{ paddingRight: 0 }}>{s ? <StatusIcon status={s.status} /> : <span className="checkbox" style={{ borderStyle: 'dashed' }} />}</td>
                <td>
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ fontWeight: 500 }}>{ev.name}</span>
                    <span className={`tag ${ev.builtIn ? '' : 'accent'}`}>{ev.builtIn ? 'Built-in' : 'Custom'}</span>
                  </div>
                  <div className="muted small" style={{ marginTop: 2 }}>{ev.task}</div>
                </td>
                <td>{ev.required ? <span style={{ fontWeight: 500 }}>Yes</span> : <span className="muted">No</span>}</td>
                <td><RateCell s={s} /></td>
                <td><ChevronRight size={16} className="chev" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-32">
        <div className="section-title" style={{ marginBottom: 10 }}>Recent evaluation runs</div>
        <div className="card">
          <div className="list">
            {runs.map((r) => {
              const evs = evals.filter((e) => r.evalIds.includes(e.id))
              const ok = evs.filter((e) => evalStats(r, e).status === 'success').length
              return (
                <button key={r.id} className="list-item" onClick={() => setView(`result:${r.id}`)}>
                  <SourceIcon source={r.source} />
                  <div className="grow">
                    <div className="title">{r.label}</div>
                    <div className="sub">{r.source === 'production' ? 'Production calls' : 'Simulated calls'} · {r.when}</div>
                  </div>
                  <span className="small"><b style={{ fontWeight: 500 }}>{ok}/{evs.length}</b> <span className="muted">evals passed</span></span>
                  <ChevronRight size={16} className="chev" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
