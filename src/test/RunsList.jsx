import { tally, StatusIcon } from '../components/ui'
import { passed, suiteRuns } from './helpers'

// Evaluation run history. "Compared to previous" is always within the same suite.
export default function RunsList({ runs, suites, setView, showSuite = true }) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr><th>Evaluation</th>{showSuite && <th>Test suite</th>}<th>Agent version</th><th>Result</th><th style={{ width: 200 }}></th><th>Compared to previous</th></tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const t = tally(r.results)
            const total = r.results.length
            const same = suiteRuns(runs, r.suiteId)
            const prev = same[same.indexOf(r) + 1]
            const d = prev ? passed(r) - passed(prev) : null
            return (
              <tr key={r.id} onClick={() => setView(`run:${r.id}`)}>
                <td>
                  <div className="row"><StatusIcon status={t.success === total ? 'success' : t.failed ? 'failed' : 'attention'} /><b style={{ fontWeight: 500 }}>{r.name}</b></div>
                  <div className="muted small" style={{ marginLeft: 24 }}>{r.when}</div>
                </td>
                {showSuite && <td>{suites.find((s) => s.id === r.suiteId)?.name}</td>}
                <td><span className="tag">{r.version}</span></td>
                <td style={{ fontWeight: 500 }}>{t.success}/{total} passed</td>
                <td>
                  <div className="split-bar" style={{ marginTop: 0, height: 6 }}>
                    {t.success > 0 && <span style={{ flex: t.success, background: 'var(--success)' }} />}
                    {t.attention > 0 && <span style={{ flex: t.attention, background: 'var(--attention)' }} />}
                    {t.failed > 0 && <span style={{ flex: t.failed, background: 'var(--failed)' }} />}
                  </div>
                </td>
                <td>
                  {d == null ? <span className="muted">—</span> : d > 0 ? <span className="s-success">↑ {d} more passed</span> : d < 0 ? <span className="s-failed">↓ {-d} fewer passed</span> : <span className="muted">No change</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
