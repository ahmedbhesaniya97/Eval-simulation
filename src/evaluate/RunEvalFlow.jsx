import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Radio, FlaskConical, Search, Play, Loader2, ChevronRight } from 'lucide-react'
import { Checkbox, StatusIcon } from '../components/ui'
import { fmtDuration } from '../data'
import { ComboPicker, comboTotal, comboToConfig } from '../test/ComboPicker'
import { findScenario, findPersona } from '../test/helpers'
import { SESSIONS, simulatedCalls, evaluateCalls, checkCall } from './data'

const STEPS = ['Choose calls', 'Select calls', 'Choose evals']

function Stepper({ step }) {
  return (
    <div className="row" style={{ gap: 6, marginBottom: 24 }}>
      {STEPS.map((s, i) => (
        <span key={s} className="row small" style={{ gap: 6, color: i <= step ? 'var(--text)' : 'var(--muted)' }}>
          <span className={`tag ${i === step ? 'accent' : i < step ? 'good' : ''}`}>{i + 1}</span>{s}
          {i < STEPS.length - 1 && <ChevronRight size={12} className="muted" />}
        </span>
      ))}
    </div>
  )
}

function SourceCard({ icon, title, desc, detail, onClick }) {
  return (
    <button className="select-card" onClick={onClick} style={{ padding: 24, gap: 10 }}>
      <span style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}>{icon}</span>
      <div className="title" style={{ fontSize: 16 }}>{title}</div>
      <div className="desc">{desc}</div>
      <div className="muted small">{detail}</div>
    </button>
  )
}

function SessionPicker({ selected, setSelected }) {
  const [q, setQ] = useState('')
  const list = SESSIONS.filter((s) => {
    const text = `${findScenario(s.scenarioId)?.name} ${s.caller} ${s.when}`.toLowerCase()
    return text.includes(q.toLowerCase())
  })
  const allOn = list.length > 0 && list.every((s) => selected.has(s.id))
  const toggle = (id) => setSelected((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected((cur) => { const n = new Set(cur); list.forEach((s) => (allOn ? n.delete(s.id) : n.add(s.id))); return n })

  return (
    <>
      <div className="row-between mb-16">
        <div className="row" style={{ gap: 8, flex: 1, maxWidth: 420, position: 'relative' }}>
          <Search size={15} className="muted" style={{ position: 'absolute', left: 10 }} />
          <input className="input" style={{ paddingLeft: 32 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by topic, caller or day" />
        </div>
        <div className="branch-select" style={{ marginLeft: 0, minWidth: 140 }}>Last 7 days</div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40 }}><button className="btn ghost" style={{ padding: 0, height: 'auto' }} onClick={toggleAll} aria-label="Select all"><Checkbox on={allOn} /></button></th>
              <th>Customer wanted to</th><th>Caller</th><th>When</th><th>Length</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} onClick={() => toggle(s.id)} style={selected.has(s.id) ? { background: 'var(--accent-soft)' } : undefined}>
                <td><Checkbox on={selected.has(s.id)} /></td>
                <td style={{ fontWeight: 500 }}>{findScenario(s.scenarioId)?.name}</td>
                <td className="muted">{s.caller}</td>
                <td className="muted">{s.when}</td>
                <td className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtDuration(s.duration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function EvalPicker({ evals, selected, setSelected }) {
  const toggle = (id) => setSelected((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n })
  return (
    <>
      <div className="row mb-16" style={{ gap: 12 }}>
        <button className="btn link small" onClick={() => setSelected(new Set(evals.map((e) => e.id)))}>Select all</button>
        <button className="btn link small" onClick={() => setSelected(new Set(evals.filter((e) => e.required).map((e) => e.id)))}>Required only</button>
        <button className="btn link small" onClick={() => setSelected(new Set())}>Clear</button>
      </div>
      <div className="card">
        {evals.map((ev) => (
          <button key={ev.id} className="list-item" onClick={() => toggle(ev.id)}>
            <Checkbox on={selected.has(ev.id)} />
            <div className="grow">
              <div className="row" style={{ gap: 8 }}>
                <span className="title">{ev.name}</span>
                {ev.required && <span className="tag">Required</span>}
                {!ev.builtIn && <span className="tag accent">Custom</span>}
              </div>
              <div className="sub">{ev.task}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

export default function RunEvalFlow({ store, scenarios, personas, fixed }) {
  const { evals, setView, setPending } = store
  const [step, setStep] = useState(0)
  const [source, setSource] = useState(null)
  const [sessions, setSessions] = useState(() => new Set())
  const [simName, setSimName] = useState('')
  const [combo, setCombo] = useState(() => ({
    sIds: new Set(scenarios.slice(0, 3).map((s) => s.id)),
    pIds: new Set(['calm', 'impatient', 'confused', 'fast']),
    eIds: new Set(['quiet']),
  }))
  const [evalIds, setEvalIds] = useState(() => new Set(evals.map((e) => e.id)))

  const callCount = source === 'production' ? sessions.size : comboTotal(combo)
  const canNext = step === 1 ? callCount > 0 : evalIds.size > 0

  const run = () => {
    const id = `er-${Date.now()}`
    const calls = source === 'production'
      ? SESSIONS.filter((s) => sessions.has(s.id))
      : simulatedCalls(id, comboToConfig(combo, scenarios, personas), fixed)
    const label = source === 'production' ? `${calls.length} production calls` : (simName.trim() || `${calls.length} simulated calls`)
    setPending({ id, source, label, calls, evalIds: evals.filter((e) => evalIds.has(e.id)).map((e) => e.id) })
    setView('running')
  }

  const back = () => (step === 0 ? setView('list') : setStep(step - 1))

  return (
    <>
      <button className="btn ghost" style={{ paddingLeft: 0, marginBottom: 12 }} onClick={back}><ArrowLeft size={15} />{step === 0 ? 'Evaluations' : 'Back'}</button>
      <div className="page-title" style={{ marginBottom: 6 }}>Run evaluation</div>
      <p className="page-sub">
        {step === 0 && 'Which calls do you want to check?'}
        {step === 1 && (source === 'production' ? 'Pick the real conversations to evaluate.' : 'Pick a scenario and the kinds of customers to try it with. We’ll place a simulated call for each combination.')}
        {step === 2 && 'Pick which evals to check each call against.'}
      </p>
      <Stepper step={step} />

      {step === 0 && (
        <div className="grid-2">
          <SourceCard icon={<Radio size={20} />} title="Production calls" desc="Evaluate real conversations your agent already had with customers."
            detail={`${SESSIONS.length} calls in the last 7 days`} onClick={() => { setSource('production'); setStep(1) }} />
          <SourceCard icon={<FlaskConical size={20} />} title="Simulated calls" desc="Generate new calls with simulated customers and evaluate them — before real customers call."
            detail="Choose scenarios × customer behaviors" onClick={() => { setSource('simulated'); setStep(1) }} />
        </div>
      )}

      {step > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
          <div>
            {step === 1 && source === 'production' && <SessionPicker selected={sessions} setSelected={setSessions} />}
            {step === 1 && source === 'simulated' && (
              <div className="stack" style={{ gap: 28 }}>
                <div>
                  <div className="field-label">Name <span className="hint">optional</span></div>
                  <input className="input" value={simName} placeholder="e.g. Pricing with confused callers" onChange={(e) => setSimName(e.target.value)} style={{ maxWidth: 440 }} />
                </div>
                <ComboPicker scenarios={scenarios} personas={personas} value={combo} onChange={setCombo} />
              </div>
            )}
            {step === 2 && <EvalPicker evals={evals} selected={evalIds} setSelected={setEvalIds} />}
          </div>

          <aside className="card card-pad" style={{ position: 'sticky', top: 16 }}>
            <div className="row" style={{ gap: 8, marginBottom: 12 }}>
              {source === 'production' ? <Radio size={15} className="muted" /> : <FlaskConical size={15} className="muted" />}
              <span className="small muted">{source === 'production' ? 'Production calls' : 'Simulated calls'}</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.1 }}>{callCount}</div>
            <div className="small muted">{source === 'simulated' ? `${combo.sIds.size} scenarios × ${combo.pIds.size} behaviors × ${combo.eIds.size} env.` : 'calls selected'}</div>
            {step === 2 && (
              <div className="small mt-16" style={{ color: 'var(--text-2)' }}>
                Each call is checked against <b style={{ color: 'var(--text)' }}>{evalIds.size} {evalIds.size === 1 ? 'eval' : 'evals'}</b>
                {' '}({evals.filter((e) => e.required && evalIds.has(e.id)).length} required).
              </div>
            )}
            {step === 1 ? (
              <button className="btn primary mt-16" style={{ width: '100%', justifyContent: 'center', height: 38 }} disabled={!canNext} onClick={() => setStep(2)}>Next: choose evals</button>
            ) : (
              <button className="btn primary mt-16" style={{ width: '100%', justifyContent: 'center', height: 38 }} disabled={!canNext} onClick={run}>
                <Play size={14} fill="currentColor" />Run evaluation
              </button>
            )}
          </aside>
        </div>
      )}
    </>
  )
}

export function EvalProgress({ store, evals }) {
  const { pending, setPending, setRuns, setView } = store
  const selected = useMemo(() => evals.filter((e) => pending?.evalIds.includes(e.id)), [pending, evals])
  const total = pending?.calls.length || 0
  const stepMs = Math.max(90, Math.min(320, 6000 / Math.max(total, 1)))
  const [i, setI] = useState(0)
  const done = i >= total

  useEffect(() => {
    if (!pending) { setView('list'); return }
    if (done) {
      const id = setTimeout(() => {
        const run = evaluateCalls({ ...pending, when: 'Just now', evals: selected })
        setRuns((r) => [run, ...r])
        setPending(null)
        setView(`result:${run.id}`)
      }, 400)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => setI((x) => x + 1), stepMs)
    return () => clearTimeout(id)
  }, [i, done, pending])

  if (!pending) return null
  const cur = pending.calls[Math.min(i, total - 1)]
  const statusOf = (call) => {
    const checks = selected.map((ev) => checkCall(call, ev))
    return checks.some((c, k) => c.status === 'fail' && selected[k].required) ? 'failed' : checks.some((c) => c.status === 'fail') ? 'attention' : 'success'
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto 0' }}>
      <div className="card card-pad" style={{ padding: 28 }}>
        <div className="row" style={{ gap: 10, marginBottom: 4 }}>
          <Loader2 size={18} className="spin" style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{done ? 'Wrapping up…' : pending.source === 'simulated' ? 'Simulating and evaluating calls' : 'Evaluating production calls'}</h2>
        </div>
        <p className="muted">Call {Math.min(i + 1, total)} of {total} · {selected.length} evals</p>
        <div className="progress mt-16"><span style={{ width: `${(Math.min(i, total) / total) * 100}%` }} /></div>
        <div className="meta-grid mt-24" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div><div className="k">Customer wanted to</div><div className="v">{findScenario(cur.scenarioId)?.name}</div></div>
          <div><div className="k">{pending.source === 'production' ? 'Caller' : 'Customer'}</div><div className="v">{pending.source === 'production' ? cur.caller : findPersona(cur.personaId)?.name}</div></div>
        </div>
        <div className="mt-24">
          <div className="muted small" style={{ marginBottom: 8 }}>Calls checked</div>
          <div className="dots-grid">
            {pending.calls.map((c, k) => {
              const st = k < i ? statusOf(c) : ''
              return <span key={c.id} className={k < i ? st : k === i && !done ? 'running' : ''}>{k < i && <StatusIcon status={st} size={12} />}</span>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
