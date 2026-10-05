import { useMemo, useState } from 'react'
import { Check, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Clock, MessagesSquare } from 'lucide-react'
import { navigate } from '../../store.jsx'
import { CRITERIA_CHECK, ENV_BY_ID, MODES, isVoice, simSessionStatus } from '../../data/simulation.js'
import { PageHeader, StatusBadge, RequiredBadge, StatusIcon } from '../../components/ui.jsx'
import { ModeBadge, DifficultyBadge, EnvLabel } from '../../components/SimBits.jsx'
import SessionView from '../../components/SessionView.jsx'
import { clock, duration, money } from '../../format.js'

const ORDER = { failed: 0, review: 1, passed: 2 }

export default function SimSessionResult({ run, sessionId }) {
  const session = run.sessions.find((s) => s.id === sessionId)
  const audio = isVoice(run.mode)
  const scenario = run.scenarios.find((s) => s.id === session.scenarioId)
  const persona = run.personas.find((p) => p.id === session.personaId)
  const status = simSessionStatus(session, run.evaluations)
  // The scenario's own criteria come first; they're always required.
  const checks = useMemo(() => [{ ...CRITERIA_CHECK, success: scenario.success, failure: scenario.failure }, ...[...run.evaluations].sort((a, b) => b.required - a.required)], [run, scenario])
  const results = session.results

  const firstFailed = checks.find((c) => results[c.id].status === 'failed')
  const [selectedId, setSelectedId] = useState((firstFailed ?? checks[0]).id)
  const [focusTurn, setFocusTurn] = useState(() => (firstFailed ? { idx: results[firstFailed.id].turns[0] } : null))
  const selected = checks.find((c) => c.id === selectedId)
  const verdict = selectedId ? results[selectedId] : null

  // Prev / next through this simulation, worst first.
  const order = useMemo(() =>
    [...run.sessions].sort((a, b) => ORDER[simSessionStatus(a, run.evaluations)] - ORDER[simSessionStatus(b, run.evaluations)]).map((s) => s.id), [run])
  const pos = order.indexOf(sessionId)

  const select = (id) => {
    setSelectedId(id)
    if (results[id].turns.length) setFocusTurn({ idx: results[id].turns[0] })
  }
  const stamp = (i) => (audio ? clock(session.turns[i].t) : `#${i + 1}`)

  return (
    <>
      <PageHeader
        crumbs={[
          { label: 'Home', href: '#/home' },
          { label: 'Simulation', href: '#/simulation' },
          { label: run.name, href: `#/simulation/runs/${run.id}` },
          { label: sessionId },
        ]}
        title={sessionId}
        back={`#/simulation/runs/${run.id}`}
        badge={<><StatusBadge status={status} large /><ModeBadge mode={run.mode} /></>}
        actions={
          <div className="row" style={{ gap: 4 }}>
            <span className="faint num" style={{ fontSize: 12.5, marginRight: 6 }}>{pos + 1} of {order.length}</span>
            <button className="icon-btn" disabled={pos <= 0} onClick={() => navigate(`#/simulation/runs/${run.id}/sessions/${order[pos - 1]}`)} aria-label="Previous conversation"><ChevronLeft size={16} /></button>
            <button className="icon-btn" disabled={pos >= order.length - 1} onClick={() => navigate(`#/simulation/runs/${run.id}/sessions/${order[pos + 1]}`)} aria-label="Next conversation"><ChevronRight size={16} /></button>
          </div>
        }
      />
      <div className="page-inner">
        <div className="row muted" style={{ gap: 16, fontSize: 13, flexWrap: 'wrap', paddingTop: 12 }}>
          <span>{scenario.name}</span>
          <span className="faint">·</span>
          <span>{persona.name} <span className="faint">as {session.caller}</span></span>
          {audio && <><span className="faint">·</span><EnvLabel env={session.env} /></>}
          <span className="faint">·</span>
          {audio
            ? <span className="row" style={{ gap: 5 }}><Clock size={13} /> {duration(session.duration)}</span>
            : <span className="row" style={{ gap: 5 }}><MessagesSquare size={13} /> {session.turnCount} turns</span>}
          <span className="faint">·</span>
          <span>{money(session.cost.total)}</span>
          {run.repeats > 1 && <><span className="faint">·</span><span>Run {session.rep} of {run.repeats}</span></>}
        </div>
        <div className="split">
          <div>
            {!audio && <div style={{ height: 8 }} />}
            <SessionView
              session={session}
              audio={audio}
              userLabel={persona.name}
              highlight={verdict?.turns.length ? { turns: verdict.turns, tone: verdict.status === 'passed' ? 'pass' : 'fail', label: selected.name } : null}
              focusTurn={focusTurn}
              markers={audio ? (verdict?.turns ?? []).map((i) => ({ t: session.turns[i].t, color: verdict.status === 'passed' ? 'var(--pass)' : 'var(--fail)', title: selected.name })) : undefined}
            />
          </div>

          <aside className="side" style={{ paddingTop: 16 }}>
            <h2 className="section-title" style={{ marginBottom: 10 }}>Results</h2>
            {checks.map((c) => {
              const v = results[c.id]
              const open = c.id === selectedId
              return (
                <div key={c.id} className={`verdict ${v.status} ${open ? 'selected' : ''}`}>
                  <button className="verdict-head" onClick={() => (open ? setSelectedId(null) : select(c.id))} aria-expanded={open}>
                    <StatusIcon status={v.status} />
                    <span style={{ flex: 1, fontWeight: 500 }}>{c.name}</span>
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
                                {stamp(i)} · {session.turns[i].role === 'agent' ? 'Agent' : 'Caller'}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      <h4>Success criteria</h4>
                      <p className="muted">{c.success}</p>
                      <h4>Failure criteria</h4>
                      <p className="muted">{c.failure}</p>
                      <div style={{ marginTop: 12 }}><RequiredBadge required={c.required} /></div>
                    </div>
                  )}
                </div>
              )
            })}

            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-head"><h3 className="card-title">Setup</h3></div>
              <div className="card-body" style={{ fontSize: 13, display: 'grid', gap: 12 }}>
                <div>
                  <div className="row" style={{ gap: 8, marginBottom: 4 }}><span className="eyebrow">Scenario</span><DifficultyBadge level={scenario.difficulty} /></div>
                  <div style={{ fontWeight: 500 }}>{scenario.name}</div>
                  <div className="muted">Caller wants to {scenario.goal}.</div>
                </div>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>Persona</div>
                  <div style={{ fontWeight: 500 }}>{persona.name}</div>
                  <div className="muted">{persona.description}</div>
                </div>
                {audio && (
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 4 }}>Environment</div>
                    <div style={{ fontWeight: 500 }}><EnvLabel env={session.env} /></div>
                    <div className="muted">{ENV_BY_ID[session.env].desc}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-head"><h3 className="card-title">Cost</h3></div>
              <div className="card-body" style={{ padding: '4px 18px 8px', fontSize: 13 }}>
                <div className="impact-row">
                  <span className="muted">{audio ? `${duration(session.duration)} call × ${money(MODES[run.mode].perMinute)}/min` : `${session.turnCount} turns × ${money(MODES.text.perTurn, 3)}`}</span>
                  <span className="num">{money(session.cost.convo)}</span>
                </div>
                <div className="impact-row"><span className="muted">Judging against criteria</span><span className="num">{money(session.cost.checks)}</span></div>
                <div className="impact-row"><span style={{ fontWeight: 600 }}>Total</span><span className="num" style={{ fontWeight: 600 }}>{money(session.cost.total)}</span></div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
