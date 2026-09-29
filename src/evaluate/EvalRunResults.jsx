import { useState } from 'react'
import { ArrowLeft, Radio, FlaskConical, ChevronDown, ChevronRight, RotateCw } from 'lucide-react'
import { SplitBar, StatusIcon } from '../components/ui'
import { ENVIRONMENTS } from '../data'
import { findScenario, findPersona } from '../test/helpers'
import { evalStats, pct, TARGET } from './data'

const callStatus = (result, evals) => {
  const failed = evals.filter((e) => result.checks[e.id]?.status === 'fail')
  return failed.some((e) => e.required) ? 'failed' : failed.length ? 'attention' : 'success'
}

function callTitle(call) {
  const who = call.source === 'production' ? call.caller : `${findPersona(call.personaId)?.name} customer`
  const where = call.source === 'production' ? call.when : ENVIRONMENTS.find((e) => e.id === call.envId)?.name
  return { name: findScenario(call.scenarioId)?.name, sub: `${who} · ${where}` }
}

export default function EvalRunResults({ runId, store }) {
  const { runs, evals: allEvals, setView, setOpenCall } = store
  const run = runs.find((r) => r.id === runId)
  const [mode, setMode] = useState('evals')
  const [open, setOpen] = useState(null)
  if (!run) return null

  const evals = allEvals.filter((e) => run.evalIds.includes(e.id))
  const stats = evals
    .map((ev) => ({ ev, s: evalStats(run, ev) }))
    .sort((a, b) => (a.s.rate ?? 2) - (b.s.rate ?? 2) || b.ev.required - a.ev.required)
  const ran = stats.filter((x) => x.s.applicable)
  const passedAll = ran.filter((x) => x.s.status === 'success')
  const failingRequired = ran.filter((x) => x.ev.required && x.s.status !== 'success')
  const failing = ran.filter((x) => x.s.status !== 'success')

  const callTally = { success: 0, attention: 0, failed: 0 }
  run.results.forEach((r) => callTally[callStatus(r, evals)]++)

  const openCall = (result) => setOpenCall({ run, result })

  return (
    <div className="stack" style={{ gap: 20 }}>
      <button className="btn ghost" style={{ paddingLeft: 0, alignSelf: 'flex-start', marginBottom: -8 }} onClick={() => setView('list')}><ArrowLeft size={15} />Evaluations</button>

      <div className="card verdict">
        <div className="verdict-main">
          <div className="verdict-eyebrow">
            {run.source === 'production' ? <Radio size={13} /> : <FlaskConical size={13} />}
            Evaluation complete · {run.label} · {run.when}
          </div>
          <h1 className="verdict-title">
            {passedAll.length} of {ran.length} <span className="muted" style={{ fontWeight: 500 }}>evals passed.</span>
          </h1>
          <p className="verdict-desc">
            {failing.length === 0
              ? 'Your agent met every eval across all calls.'
              : <>Needs attention: {failing.slice(0, 3).map((x, i) => (
                  <span key={x.ev.id}>{i > 0 && ', '}<b style={{ fontWeight: 500, color: 'var(--text)' }}>{x.ev.name.toLowerCase()}</b> (failed on {x.s.applicable - x.s.passed} of {x.s.applicable} calls)</span>
                ))}{failing.length > 3 && `, and ${failing.length - 3} more`}.</>}
          </p>
          {failingRequired.length > 0 && (
            <div className="callout failed mt-16" style={{ padding: '10px 12px', maxWidth: 560 }}>
              <StatusIcon status="failed" />
              <div className="body" style={{ margin: 0 }}>{failingRequired.length} required {failingRequired.length === 1 ? 'eval is' : 'evals are'} failing — fix before you deploy.</div>
            </div>
          )}
          <SplitBar {...callTally} />
          <div className="muted small mt-8">An eval passes when at least {pct(TARGET)} of the calls it applies to meet it. The bar shows calls: all evals met / an optional eval failed / a required eval failed.</div>
          <div className="verdict-actions">
            <button className="btn" onClick={() => setView('run')}><RotateCw size={14} />Run another evaluation</button>
          </div>
        </div>
      </div>

      <div className="row-between">
        <div className="segmented" style={{ width: 260 }}>
          <button className={mode === 'evals' ? 'active' : ''} onClick={() => setMode('evals')}>By eval</button>
          <button className={mode === 'calls' ? 'active' : ''} onClick={() => setMode('calls')}>By call</button>
        </div>
        <span className="muted small">{run.results.length} calls × {evals.length} evals</span>
      </div>

      {mode === 'evals' ? (
        <div className="card">
          {stats.map(({ ev, s }) => {
            const fails = run.results.filter((r) => r.checks[ev.id]?.status === 'fail')
            const isOpen = open === ev.id
            return (
              <div key={ev.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <button className="list-item" style={{ borderBottom: 'none' }} onClick={() => setOpen(isOpen ? null : ev.id)} disabled={!s.applicable}>
                  {s.applicable ? <StatusIcon status={s.status} /> : <span className="checkbox" style={{ borderStyle: 'dashed' }} />}
                  <div className="grow">
                    <div className="row" style={{ gap: 8 }}>
                      <span className="title">{ev.name}</span>
                      {ev.required && <span className="tag">Required</span>}
                      {!ev.builtIn && <span className="tag accent">Custom</span>}
                    </div>
                    <div className="sub">{s.applicable ? `${s.passed} of ${s.applicable} calls passed` : 'Didn’t apply to any of these calls'}</div>
                  </div>
                  {s.applicable > 0 && (
                    <>
                      <div className="progress" style={{ width: 90, height: 5 }}><span style={{ width: `${s.rate * 100}%`, background: s.status === 'success' ? 'var(--success)' : s.status === 'failed' ? 'var(--failed)' : 'var(--attention)' }} /></div>
                      <b style={{ width: 44, textAlign: 'right', fontWeight: 600 }}>{pct(s.rate)}</b>
                    </>
                  )}
                  {fails.length > 0 ? (isOpen ? <ChevronDown size={16} className="chev" /> : <ChevronRight size={16} className="chev" />) : <span style={{ width: 16 }} />}
                </button>
                {isOpen && fails.length > 0 && (
                  <div style={{ padding: '0 18px 14px 46px' }}>
                    <div className="card" style={{ background: 'var(--bg)' }}>
                      {fails.map((r) => {
                        const t = callTitle(r.call)
                        return (
                          <button key={r.call.id} className="list-item" onClick={() => openCall(r)}>
                            <div className="grow">
                              <div className="title">{t.name} <span className="muted" style={{ fontWeight: 400 }}>· {t.sub}</span></div>
                              <div className="sub">{r.checks[ev.id].reason}</div>
                            </div>
                            <span className="muted small">Listen</span>
                            <ChevronRight size={16} className="chev" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card">
          <div className="list">
            {[...run.results].sort((a, b) => ['failed', 'attention', 'success'].indexOf(callStatus(a, evals)) - ['failed', 'attention', 'success'].indexOf(callStatus(b, evals))).map((r) => {
              const st = callStatus(r, evals)
              const applicable = evals.filter((e) => r.checks[e.id]?.status !== 'na')
              const failedEvals = applicable.filter((e) => r.checks[e.id].status === 'fail')
              const t = callTitle(r.call)
              return (
                <button key={r.call.id} className="list-item" onClick={() => openCall(r)}>
                  <StatusIcon status={st} />
                  <div className="grow">
                    <div className="title">{t.name} <span className="muted" style={{ fontWeight: 400 }}>· {t.sub}</span></div>
                    <div className="sub">{failedEvals.length ? `Failed: ${failedEvals.map((e) => e.name).join(', ')}` : 'Passed every eval'}</div>
                  </div>
                  <span className="small"><b style={{ fontWeight: 500 }}>{applicable.length - failedEvals.length}/{applicable.length}</b> <span className="muted">evals</span></span>
                  <ChevronRight size={16} className="chev" />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
