import { useMemo, useState } from 'react'
import { Search, ChevronRight, FlaskConical, Loader2 } from 'lucide-react'
import { useStore, navigate } from '../../store.jsx'
import { simSessionStatus } from '../../data/simulation.js'
import { AGENT_BY_ID } from '../../data/agents.js'
import { Button, StatusIcon, EmptyState } from '../../components/ui.jsx'
import { ModeBadge, EnvLabel } from '../../components/SimBits.jsx'
import { dateShort, duration, money, n, plural } from '../../format.js'

const PAGE = 50

// Run tab: every past simulated session. Kept apart from production Sessions.
export default function RunTab() {
  const { simRuns } = useStore()
  const [runId, setRunId] = useState('all')
  const [mode, setMode] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [shown, setShown] = useState(PAGE)

  const running = simRuns.filter((r) => r.status === 'running')
  const completed = simRuns.filter((r) => r.status === 'completed')
  const all = useMemo(() => completed.flatMap((r) => r.sessions.map((s) => ({
    s,
    run: r,
    status: simSessionStatus(s, r.evaluations),
    scenario: r.scenarios.find((x) => x.id === s.scenarioId),
    persona: r.personas.find((x) => x.id === s.personaId),
  }))), [simRuns]) // eslint-disable-line react-hooks/exhaustive-deps

  const q = search.trim().toLowerCase()
  const list = all.filter(({ s, run, status: st, scenario, persona }) =>
    (runId === 'all' || run.id === runId) &&
    (mode === 'all' || run.mode === mode) &&
    (status === 'all' || st === status) &&
    (!q || s.id.includes(q) || scenario.name.toLowerCase().includes(q) || persona.name.toLowerCase().includes(q))
  )
  const reset = (fn) => (v) => { fn(v); setShown(PAGE) }

  return (
    <>
      <div className="page-inner">
        {running.map((r) => (
          <a key={r.id} href={`#/simulation/runs/${r.id}`} className="notice" style={{ marginTop: 18, color: 'var(--text)' }}>
            <Loader2 size={15} className="spin" style={{ color: 'var(--accent)' }} />
            <span><strong>{r.name}</strong> is running · {r.done} of {plural(r.total, 'conversation')}</span>
            <div className="bar" style={{ flex: 1, maxWidth: 240 }}><span className="fill" style={{ width: `${(r.done / r.total) * 100}%` }} /></div>
            <span className="link" style={{ marginLeft: 'auto' }}>View</span>
          </a>
        ))}

        {all.length === 0 ? (
          <div style={{ marginTop: 20 }}>
            <EmptyState icon={FlaskConical} title="No simulated sessions yet" action={<Button variant="primary" onClick={() => navigate('#/simulation/new')}>New simulation</Button>}>
              Pick an agent, scenarios and personas, and we'll call it with simulated customers to see how it copes.
            </EmptyState>
          </div>
        ) : (
          <>
            <div className="row" style={{ margin: '18px 0 12px', flexWrap: 'wrap' }}>
              <select className="select" value={runId} onChange={(e) => reset(setRunId)(e.target.value)} aria-label="Simulation">
                <option value="all">All simulations</option>
                {completed.map((r) => <option key={r.id} value={r.id}>{r.name} · {dateShort(r.createdAt)}</option>)}
              </select>
              <div className="seg" role="group" aria-label="Mode">
                {[['all', 'All modes'], ['text', 'Text only'], ['audio', 'Audio'], ['telephony', 'Telephony']].map(([id, label]) => (
                  <button key={id} className={mode === id ? 'active' : ''} onClick={() => reset(setMode)(id)}>{label}</button>
                ))}
              </div>
              <div className="seg" role="group" aria-label="Result">
                {[['all', 'Any result'], ['passed', 'Passed'], ['failed', 'Failed']].map(([id, label]) => (
                  <button key={id} className={status === id ? 'active' : ''} onClick={() => reset(setStatus)(id)}>{label}</button>
                ))}
              </div>
              <span className="faint" style={{ marginLeft: 'auto', fontSize: 13 }}>{plural(list.length, 'session')}</span>
              <label className="search"><Search size={15} /><input className="input" placeholder="Search by ID, scenario or persona" value={search} onChange={(e) => reset(setSearch)(e.target.value)} /></label>
            </div>

            {list.length === 0 ? (
              <EmptyState icon={Search} title="No sessions match" action={<Button onClick={() => { setRunId('all'); setMode('all'); setStatus('all'); setSearch('') }}>Clear filters</Button>}>
                No simulated sessions match these filters.
              </EmptyState>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }} />
                      <th>Session</th>
                      <th>Scenario</th>
                      <th>Persona</th>
                      <th>Mode</th>
                      <th>Simulation</th>
                      <th className="right">Length</th>
                      <th className="right">Cost</th>
                      <th>Date</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {list.slice(0, shown).map(({ s, run, status: st, scenario, persona }) => (
                      <tr key={s.id} className="clickable" onClick={() => navigate(`#/simulation/runs/${run.id}/sessions/${s.id}`)}>
                        <td><StatusIcon status={st} /></td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div className="mono" style={{ fontSize: 13 }}>{s.id}</div>
                          <div className="faint" style={{ fontSize: 12.5 }}>{AGENT_BY_ID[run.agentId].name}</div>
                        </td>
                        <td style={{ fontSize: 13 }}>{scenario.name}</td>
                        <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{persona.name}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <ModeBadge mode={run.mode} />
                          {s.env && <div className="faint" style={{ fontSize: 12, marginTop: 4 }}><EnvLabel env={s.env} /></div>}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          <a className="link" href={`#/simulation/runs/${run.id}`} onClick={(e) => e.stopPropagation()}>{run.name}</a>
                        </td>
                        <td className="right num" style={{ whiteSpace: 'nowrap' }}>{s.duration ? duration(s.duration) : `${s.turnCount} turns`}</td>
                        <td className="right num">{money(s.cost.total)}</td>
                        <td className="muted" style={{ whiteSpace: 'nowrap' }}>{dateShort(run.createdAt)}</td>
                        <td><ChevronRight size={16} className="faint" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {list.length > shown && (
                  <div style={{ padding: 12, textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                    <Button size="sm" onClick={() => setShown(shown + PAGE * 2)}>Show more <span className="faint">· {n(list.length - shown)} remaining</span></Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
