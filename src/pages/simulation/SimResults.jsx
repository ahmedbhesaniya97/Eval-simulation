import { useMemo, useState } from 'react'
import { ChevronRight, RotateCcw, SearchX, Info } from 'lucide-react'
import { navigate } from '../../store.jsx'
import { ENV_BY_ID, MODES, PER_CHECK, isVoice, summarizeSimRun } from '../../data/simulation.js'
import { AGENT_BY_ID } from '../../data/agents.js'
import { Button, PageHeader, StatusBadge, StatusIcon, EmptyState, PassBar, statusLabel } from '../../components/ui.jsx'
import { ModeBadge, EnvLabel, EnvIcon } from '../../components/SimBits.jsx'
import { dateTime, duration, money, n, pct, plural } from '../../format.js'

const ORDER = { failed: 0, review: 1, passed: 2 }
const FILTERS = ['all', 'passed', 'failed']
const PAGE = 30

export default function SimResults({ run, query }) {
  const listHref = '#/simulation'
  const summary = useMemo(() => summarizeSimRun(run), [run])
  const dims = [run.scenarios.length, run.personas.length, isVoice(run.mode) ? run.environments.length : null, run.repeats > 1 ? run.repeats : null].filter(Boolean)
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', href: '#/home' }, { label: 'Simulation', href: listHref }, { label: run.name }]}
        title={run.name}
        back={listHref}
        badge={<><StatusBadge status={run.status} large /><ModeBadge mode={run.mode} /></>}
        actions={run.status === 'completed' && <Button onClick={() => navigate('#/simulation/new')}><RotateCcw size={14} /> New simulation</Button>}
      />
      <div className="page-inner">
        <div className="row muted" style={{ gap: 14, fontSize: 13, padding: '14px 0 0', flexWrap: 'wrap' }}>
          <span>{dateTime(run.createdAt)}</span>
          <span className="faint">·</span>
          <span>by {run.createdBy}</span>
          <span className="faint">·</span>
          <span>{AGENT_BY_ID[run.agentId].name} <span className="mono faint">({run.agentId})</span></span>
          <span className="faint">·</span>
          {run.phoneNumber && <><span>Called {run.phoneNumber}</span><span className="faint">·</span></>}
          <span>{dims.join(' × ')} = {plural(run.total, 'conversation')}</span>
          <span className="faint">·</span>
          <span>{money(summary.cost)}{run.status === 'running' && ' so far'}</span>
        </div>
        {run.status === 'running' ? <Running run={run} summary={summary} /> : <Results run={run} summary={summary} query={query} />}
      </div>
    </>
  )
}

function Running({ run, summary }) {
  const remaining = Math.max(1, Math.round(((run.total - run.done) / run.total) * 14))
  return (
    <div className="card" style={{ marginTop: 24, maxWidth: 720 }}>
      <div className="card-body" style={{ padding: 28 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600 }}>Running simulation…</h2>
        <p className="muted" style={{ margin: '0 0 24px' }}>
          Simulated callers are talking to {AGENT_BY_ID[run.agentId].name}. You can leave this page. We'll let you know when it's done.
        </p>
        <div className="row" style={{ marginBottom: 8 }}>
          <span>Conversations</span>
          <div className="spacer" />
          <span className="num">{n(run.done)} / {n(run.total)}</span>
        </div>
        <div className="bar bar-lg"><span className="fill" style={{ width: `${(run.done / run.total) * 100}%` }} /></div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 22 }}>
          <div><div className="eyebrow">Passed so far</div><div className="stat-value num" style={{ fontSize: 22, color: 'var(--pass)' }}>{summary.counts.passed}</div></div>
          <div><div className="eyebrow">Failed so far</div><div className="stat-value num" style={{ fontSize: 22, color: summary.counts.failed ? 'var(--fail)' : undefined }}>{summary.counts.failed}</div></div>
          <div><div className="eyebrow">Spent so far</div><div className="stat-value num" style={{ fontSize: 22 }}>{money(summary.cost)}</div></div>
        </div>
        <div className="row" style={{ marginTop: 24 }}>
          <span className="muted">Estimated remaining: ~{remaining}s</span>
          <div className="spacer" />
          <Button onClick={() => navigate('#/simulation')}>Back to simulations</Button>
        </div>
      </div>
    </div>
  )
}

// Red → amber → green for a 0..1 pass rate.
const heat = (rate) => ({
  background: `hsla(${rate * 140}, 60%, 45%, 0.28)`,
  color: `hsl(${rate * 140}, 65%, 68%)`,
})

function Results({ run, summary, query }) {
  const audio = isVoice(run.mode)
  const [status, setStatus] = useState('all')
  const [scenario, setScenario] = useState(query.get('scenario') || 'any')
  const [persona, setPersona] = useState('any')
  const [env, setEnv] = useState('any')
  const [matrixEnv, setMatrixEnv] = useState('any')
  const [shown, setShown] = useState(PAGE)

  const scenarioName = (id) => run.scenarios.find((s) => s.id === id)?.name
  const personaOf = (id) => run.personas.find((p) => p.id === id)

  const rows = useMemo(
    () => [...run.sessions].sort((a, b) => ORDER[summary.statusOf[a.id]] - ORDER[summary.statusOf[b.id]]),
    [run, summary]
  )
  const filtered = rows.filter((s) =>
    (status === 'all' || summary.statusOf[s.id] === status) &&
    (scenario === 'any' || s.scenarioId === scenario) &&
    (persona === 'any' || s.personaId === persona) &&
    (env === 'any' || s.env === env)
  )
  const toSessions = (patch) => {
    setStatus('all')
    setScenario(patch.scenario ?? 'any')
    setPersona(patch.persona ?? 'any')
    setEnv(patch.env ?? 'any')
    setShown(PAGE)
    document.getElementById('conversations')?.scrollIntoView({ behavior: 'smooth' })
  }
  const filtersOn = scenario !== 'any' || persona !== 'any' || env !== 'any'
  const avg = summary.cost / run.total

  return (
    <>
      {/* ---- Aggregate ---- */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 20 }}>
        <div className="card card-body">
          <div className="eyebrow">Overall</div>
          <div className="stat-value num" style={{ fontSize: 36 }}>{pct(summary.passRate)} <small>passed</small></div>
          <div className="stat-note">{n(summary.counts.passed)} of {plural(run.total, 'conversation')} met their scenario's success criteria</div>
        </div>
        <div className="card card-body">
          <div className="eyebrow">Needs attention</div>
          <div className="stat-value num" style={{ color: summary.counts.failed ? 'var(--fail)' : undefined }}>{n(summary.counts.failed)} <small>failed</small></div>
          <div className="stat-note">{summary.counts.failed ? 'Open a failed conversation to see why it failed' : 'Every conversation passed'}</div>
        </div>
        <div className="card card-body">
          <div className="eyebrow">Cost</div>
          <div className="stat-value num">{money(summary.cost)}</div>
          <div className="stat-note">{money(avg)} per conversation · {audio ? `${Math.round(summary.minutes)} min of calls` : `${n(summary.turns)} turns`}</div>
        </div>
      </div>

      {/* ---- Scenario × persona ---- */}
      <div className="grid" style={{ gridTemplateColumns: audio ? 'minmax(0, 1fr) 300px' : '1fr', marginTop: 14, alignItems: 'start' }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Scenario × persona</h3>
              <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>Share of conversations passed. Click a cell to see its conversations.</div>
            </div>
            {audio && run.environments.length > 1 && (
              <select className="select" style={{ marginLeft: 'auto' }} value={matrixEnv} onChange={(e) => setMatrixEnv(e.target.value)} aria-label="Environment">
                <option value="any">All environments</option>
                {run.environments.map((e) => <option key={e} value={e}>{ENV_BY_ID[e].label}</option>)}
              </select>
            )}
          </div>
          <div className="card-body" style={{ overflowX: 'auto', padding: '10px 14px' }}>
            <table className="heat">
              <thead>
                <tr>
                  <th />
                  {run.personas.map((p) => <th key={p.id} className="col">{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {run.scenarios.map((sc) => (
                  <tr key={sc.id}>
                    <th style={{ maxWidth: 240 }}>{sc.name}</th>
                    {run.personas.map((p) => {
                      const c = summary.cell((s) => s.scenarioId === sc.id && s.personaId === p.id && (matrixEnv === 'any' || s.env === matrixEnv))
                      return c.total ? (
                        <td key={p.id} className="cell" style={heat(c.rate)} onClick={() => toSessions({ scenario: sc.id, persona: p.id, env: matrixEnv === 'any' ? undefined : matrixEnv })} title={`${sc.name} · ${p.name}`}>
                          {pct(c.rate)}<small>{c.passed}/{c.total}</small>
                        </td>
                      ) : <td key={p.id} className="cell empty">—</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {audio && (
          <div className="card">
            <div className="card-head"><h3 className="card-title">By environment</h3></div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              {run.environments.map((e) => {
                const c = summary.cell((s) => s.env === e)
                return (
                  <button key={e} onClick={() => toSessions({ env: e })} style={{ display: 'block', width: '100%', background: 'none', border: 0, padding: '8px 0', textAlign: 'left' }}>
                    <div className="row" style={{ marginBottom: 5, gap: 8 }}>
                      <EnvIcon env={e} />
                      <span style={{ flex: 1 }}>{ENV_BY_ID[e].label}</span>
                      <span className="num" style={{ fontWeight: 600 }}>{pct(c.rate ?? 0)}</span>
                    </div>
                    <PassBar rate={c.rate ?? 0} />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ---- Conversations ---- */}
      <div className="section" id="conversations" style={{ scrollMarginTop: 120 }}>
        <div className="section-head">
          <div>
            <h2 className="section-title">Conversations</h2>
            <div className="section-desc">Simulated conversations from this run only. They don't appear in production Sessions.</div>
          </div>
        </div>
        <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
          <div className="seg" role="group" aria-label="Filter by result">
            {FILTERS.map((f) => (
              <button key={f} className={status === f ? 'active' : ''} onClick={() => { setStatus(f); setShown(PAGE) }}>
                {f === 'all' ? 'All' : statusLabel(f)} <span className="faint num">{f === 'all' ? run.total : summary.counts[f]}</span>
              </button>
            ))}
          </div>
          <select className="select" value={scenario} onChange={(e) => setScenario(e.target.value)} aria-label="Scenario">
            <option value="any">All scenarios</option>
            {run.scenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="select" value={persona} onChange={(e) => setPersona(e.target.value)} aria-label="Persona">
            <option value="any">All personas</option>
            {run.personas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {audio && (
            <select className="select" value={env} onChange={(e) => setEnv(e.target.value)} aria-label="Environment">
              <option value="any">All environments</option>
              {run.environments.map((e) => <option key={e} value={e}>{ENV_BY_ID[e].label}</option>)}
            </select>
          )}
          {filtersOn && <button className="link" onClick={() => toSessions({})}>Clear filters</button>}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={SearchX} title="No conversations match" action={<Button onClick={() => toSessions({})}>Clear filters</Button>}>
            No conversations in this simulation match the current filters.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 36 }} />
                  <th>Conversation</th>
                  <th>Scenario</th>
                  <th>Persona</th>
                  {audio && <th>Environment</th>}
                  <th style={{ width: '32%' }}>Result</th>
                  <th className="right">{audio ? 'Duration' : 'Turns'}</th>
                  <th className="right">Cost</th>
                  <th style={{ width: 30 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, shown).map((s) => {
                  const st = summary.statusOf[s.id]
                  const firstFail = [{ id: 'criteria' }, ...run.evaluations].map((e) => s.results[e.id]).find((v) => v.status === 'failed')
                  return (
                    <tr key={s.id} className="clickable" onClick={() => navigate(`#/simulation/runs/${run.id}/sessions/${s.id}`)}>
                      <td><StatusIcon status={st} /></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="mono" style={{ fontSize: 13 }}>{s.id}</div>
                        <div className="faint" style={{ fontSize: 12.5 }}>{s.caller}{run.repeats > 1 && ` · run ${s.rep}`}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{scenarioName(s.scenarioId)}</td>
                      <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{personaOf(s.personaId).name}</td>
                      {audio && <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}><EnvLabel env={s.env} /></td>}
                      <td style={{ fontSize: 13 }}>
                        {firstFail ? <span className="muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{firstFail.reason}</span> : <span className="faint">Met the success criteria</span>}
                      </td>
                      <td className="right num">{audio ? duration(s.duration) : s.turnCount}</td>
                      <td className="right num">{money(s.cost.total)}</td>
                      <td><ChevronRight size={16} className="faint" /></td>
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
        <div className="row faint" style={{ fontSize: 12.5, marginTop: 10, gap: 6 }}>
          <Info size={13} />
          {audio ? `${MODES[run.mode].label} is billed at ${money(MODES[run.mode].perMinute)} per minute of call` : `Text is billed at ${money(MODES.text.perTurn, 3)} per turn`}, plus {money(PER_CHECK, 3)} per check.
        </div>
      </div>
    </>
  )
}
