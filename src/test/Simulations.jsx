import { useState } from 'react'
import { ArrowLeft, Play, ChevronRight, Compass, ListPlus, Info } from 'lucide-react'
import { SplitBar, StatusIcon, tally } from '../components/ui'
import { ISSUES, ENVIRONMENTS, ISSUE_BECAUSE, fmtDuration, transcriptFor } from '../data'
import { ComboPicker, ComboSummary, comboTotal, comboToConfig } from './ComboPicker'
import { CommonIssues, BehaviorPerformance } from './ResultParts'
import { evalFromResult, findScenario, findPersona, worst } from './helpers'

const scenarioNames = (run) => {
  const names = run.scenarioIds.map((id) => findScenario(id)?.name)
  return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ')
}

// "What happens when different customers call?" — exploration, never gates deploy (UX §9, §15, §16)
export function SimulationsHome({ simulations, setView }) {
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="callout info" style={{ alignItems: 'center' }}>
        <Compass size={18} style={{ color: 'var(--accent)' }} />
        <div style={{ flex: 1 }}>
          <div className="title">Explore how different customers interact with your agent</div>
          <div className="body">Try any scenario with any mix of customers while you build. Simulations don’t affect deploy readiness — when you find something worth checking every release, add it to an evaluation suite.</div>
        </div>
        <button className="btn primary" onClick={() => setView('sim:new')}><Play size={14} fill="currentColor" />New simulation</button>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 10 }}>Recent simulations</div>
        <div className="card">
          <div className="list">
            {simulations.map((s) => {
              const t = tally(s.results)
              return (
                <button key={s.id} className="list-item" onClick={() => setView(`sim:${s.id}`)}>
                  <StatusIcon status={worst(s.results)} />
                  <div className="grow">
                    <div className="title">{s.name}</div>
                    <div className="sub">{scenarioNames(s)} · {s.personaIds.length} customer behaviors · {s.when}</div>
                  </div>
                  <span className="small" style={{ textAlign: 'right' }}>
                    <b style={{ fontWeight: 500 }}>{s.results.length} calls</b>
                    <div className="muted">{t.success} successful{t.attention + t.failed ? ` · ${t.attention + t.failed} need attention` : ''}</div>
                  </span>
                  <ChevronRight size={16} className="chev" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function NewSimulation({ scenarios, personas, setView, startSimulation }) {
  const [name, setName] = useState('')
  const [combo, setCombo] = useState(() => ({
    sIds: new Set([scenarios[0]?.id].filter(Boolean)),
    pIds: new Set(['calm', 'impatient', 'confused', 'fast'].filter((id) => personas.some((p) => p.id === id))),
    eIds: new Set(['quiet']),
  }))
  const total = comboTotal(combo)
  const run = () => {
    const config = comboToConfig(combo, scenarios, personas)
    const fallback = `${findScenario(config.scenarioIds[0])?.name}${config.scenarioIds.length > 1 ? ` +${config.scenarioIds.length - 1}` : ''} with ${config.personaIds.length} customers`
    startSimulation({ ...config, name: name.trim() || fallback })
  }

  return (
    <>
      <button className="btn ghost" style={{ paddingLeft: 0, marginBottom: 12 }} onClick={() => setView('simulations')}><ArrowLeft size={15} />Simulations</button>
      <div className="page-title" style={{ marginBottom: 6 }}>New simulation</div>
      <p className="page-sub">Pick a scenario and the kinds of customers to try it with. We’ll place a simulated call for each combination.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div className="stack" style={{ gap: 28 }}>
          <div>
            <div className="field-label">Name <span className="hint">optional</span></div>
            <input className="input" value={name} placeholder="e.g. Rescheduling with difficult callers" onChange={(e) => setName(e.target.value)} style={{ maxWidth: 440 }} />
          </div>
          <ComboPicker scenarios={scenarios} personas={personas} value={combo} onChange={setCombo} />
        </div>
        <ComboSummary value={combo}>
          <button className="btn primary mt-16" style={{ width: '100%', justifyContent: 'center', height: 38 }} disabled={!total} onClick={run}>
            <Play size={14} fill="currentColor" />Run {total} {total === 1 ? 'simulation' : 'simulations'}
          </button>
        </ComboSummary>
      </div>
    </>
  )
}

function patternSentence(run) {
  const bad = run.personaIds.filter((p) => run.results.some((r) => r.personaId === p && r.status !== 'success'))
  if (!bad.length) return 'Every simulated customer got what they needed.'
  const names = bad.map((p) => findPersona(p)?.name)
  const firstIssue = run.results.find((r) => r.issue)?.issue
  return `${names.join(' and ')} customers caused problems — ${ISSUE_BECAUSE[firstIssue]}.`
}

export function SimulationResults({ simId, simulations, setView, setEvaluation, openAddToSuite }) {
  const run = simulations.find((s) => s.id === simId)
  const [filter, setFilter] = useState(null)
  if (!run) return null
  const t = tally(run.results)
  const needs = t.attention + t.failed
  const calls = run.results
    .filter((r) => !filter || r.issue === filter)
    .sort((a, b) => (a.status === 'success') - (b.status === 'success'))
  const problem = run.results.filter((r) => r.status !== 'success')
  const suggest = {
    scenarioIds: [...new Set((problem.length ? problem : run.results).map((r) => r.scenarioId))],
    personaIds: [...new Set((problem.length ? problem : run.results).map((r) => r.personaId))],
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      <button className="btn ghost" style={{ paddingLeft: 0, alignSelf: 'flex-start', marginBottom: -8 }} onClick={() => setView('simulations')}><ArrowLeft size={15} />Simulations</button>

      <div className="card verdict">
        <div className="verdict-main">
          <div className="verdict-eyebrow">Simulation results · {run.name} · {run.when}</div>
          <h1 className="verdict-title">{run.results.length} simulations completed</h1>
          <p className="verdict-desc">{patternSentence(run)}</p>
          <SplitBar {...t} />
          <div className="verdict-actions">
            {needs > 0 && <button className="btn primary" onClick={() => setEvaluation(evalFromResult(problem[0]))}>Review results</button>}
            <button className="btn" onClick={() => openAddToSuite(suggest)}><ListPlus size={15} />Add to evaluation suite</button>
          </div>
        </div>
      </div>

      <div className="callout info" style={{ padding: 12 }}>
        <Info size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
        <div className="body" style={{ margin: 0 }}>
          This was an exploration, so it doesn’t count towards deploy readiness. To check this every release, add it to an evaluation suite.
        </div>
      </div>

      <div className="grid-2">
        <CommonIssues results={run.results} filter={filter} onPick={(k) => setFilter(filter === k ? null : k)} onClear={() => setFilter(null)} />
        <BehaviorPerformance run={run} word="successful" />
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Calls</h3>
          <span className="muted small">{filter ? `Showing: ${ISSUES[filter].short}` : 'Listen to any call to hear what happened'}</span>
        </div>
        <div className="list">
          {calls.map((r) => {
            const tr = transcriptFor(r.scenarioId, r.issue)
            return (
              <button key={r.id} className="list-item" onClick={() => setEvaluation(evalFromResult(r))}>
                <StatusIcon status={r.status} />
                <div className="grow">
                  <div className="title">{findScenario(r.scenarioId)?.name} <span className="muted" style={{ fontWeight: 400 }}>· {findPersona(r.personaId)?.name} customer</span></div>
                  <div className="sub">{ENVIRONMENTS.find((e) => e.id === r.envId)?.name} · {fmtDuration(tr[tr.length - 1].t + 4)}</div>
                </div>
                <span className={r.issue ? `s-${r.status} small` : 'muted small'}>{r.issue ? ISSUES[r.issue].short : 'Completed'}</span>
                <span className="muted small">Listen</span>
                <ChevronRight size={16} className="chev" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
