import { forwardRef } from 'react'
import { X } from 'lucide-react'
import { StatusIcon } from '../components/ui'
import { ISSUES, ENVIRONMENTS } from '../data'
import { evalFromResult, issueCounts, worst, findScenario, findPersona } from './helpers'

export function CommonIssues({ results, filter, onPick, onClear }) {
  const issues = issueCounts(results)
  return (
    <div className="card">
      <div className="card-head"><h3>Common issues</h3>{filter && <button className="btn link small" onClick={onClear}>Clear filter</button>}</div>
      {issues.length === 0 ? <div className="card-pad muted">No issues found.</div> : (
        <div className="list">
          {issues.map(([k, n]) => (
            <button key={k} className="list-item" onClick={() => onPick(k)} style={filter === k ? { background: 'var(--surface-2)' } : undefined}>
              <span style={{ fontWeight: 600, width: 28, color: 'var(--text-2)' }}>{n}×</span>
              <div className="grow"><div className="title">{ISSUES[k].title}</div></div>
              <StatusIcon status={ISSUES[k].severity} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function BehaviorPerformance({ run, word = 'passed' }) {
  return (
    <div className="card">
      <div className="card-head"><h3>Customer behavior performance</h3></div>
      <div className="list">
        {run.personaIds.map((p) => {
          const rs = run.results.filter((r) => r.personaId === p)
          const ok = rs.filter((r) => r.status === 'success').length
          return (
            <div key={p} className="list-item" style={{ padding: '10px 18px' }}>
              <div className="grow title">{findPersona(p)?.name} customer</div>
              <span className="muted small">{ok}/{rs.length} {word}</span>
              <StatusIcon status={worst(rs)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Scenario rows × customer-behavior columns, with "Fixed" / "New" against the previous run.
export const ResultsMatrix = forwardRef(function ResultsMatrix({ run, prev, filter, onClearFilter, onOpen }, ref) {
  const prevOf = (r) => prev?.results.find((x) => x.scenarioId === r.scenarioId && x.personaId === r.personaId && x.envId === r.envId)
  const rows = []
  run.scenarioIds.forEach((s) => run.envIds.forEach((e) => rows.push({ s, e })))

  return (
    <div className="card" ref={ref}>
      <div className="card-head">
        <h3>All results</h3>
        {filter ? (
          <span className="tag row" style={{ gap: 4 }}>Showing: {ISSUES[filter].short}<X size={11} style={{ cursor: 'pointer' }} onClick={onClearFilter} /></span>
        ) : (
          <span className="muted small">Click any result to see what happened</span>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="matrix">
          <thead>
            <tr>
              <th>Scenario</th>
              {run.personaIds.map((p) => <th key={p}>{findPersona(p)?.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, e }) => (
              <tr key={s + e}>
                <td>
                  {findScenario(s)?.name}
                  {run.envIds.length > 1 && <div className="muted small" style={{ fontWeight: 400 }}>{ENVIRONMENTS.find((x) => x.id === e).name}</div>}
                </td>
                {run.personaIds.map((p) => {
                  const r = run.results.find((x) => x.scenarioId === s && x.personaId === p && x.envId === e)
                  const pr = prevOf(r)
                  const change = pr && pr.status !== r.status ? (r.status === 'success' ? 'Fixed' : 'New') : null
                  const dim = filter && r.issue !== filter
                  return (
                    <td key={p}>
                      <button className={`cell ${r.status} ${dim ? 'dim' : ''}`} onClick={() => onOpen(evalFromResult(r))}>
                        <StatusIcon status={r.status} size={14} />
                        {r.issue ? ISSUES[r.issue].short : 'Passed'}
                        {change && <span className={`tag ${change === 'New' ? 'new' : 'good'}`} style={{ marginLeft: 2 }}>{change}</span>}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

// Compares two evaluation runs cell by cell.
export function compareRuns(run, prev) {
  const out = { fixed: 0, new: 0 }
  if (!prev) return out
  run.results.forEach((r) => {
    const p = prev.results.find((x) => x.scenarioId === r.scenarioId && x.personaId === r.personaId && x.envId === r.envId)
    if (!p) return
    if (p.status !== 'success' && r.status === 'success') out.fixed++
    if (p.status === 'success' && r.status !== 'success') out.new++
  })
  return out
}
