import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { StatusIcon } from '../components/ui'
import { SCENARIOS, PERSONAS, ENVIRONMENTS, CUSTOM_SCENARIOS, CUSTOM_PERSONAS, simulateOutcome, transcriptFor } from '../data'

const PHASES = ['Connecting', 'Conversation', 'Evaluating']
const STEP_MS = 380

export default function RunProgress({ pendingRun, finishRun, setView }) {
  const combos = useMemo(() => {
    if (!pendingRun) return []
    const out = []
    pendingRun.scenarioIds.forEach((s) => pendingRun.personaIds.forEach((p) => pendingRun.envIds.forEach((e) => out.push({ s, p, e, ...simulateOutcome(s, p, e, pendingRun.fixed) }))))
    return out
  }, [pendingRun])

  const [tick, setTick] = useState(0) // each combo takes 3 ticks (one per phase)
  const idx = Math.min(Math.floor(tick / 3), combos.length - 1)
  const phase = tick % 3
  const done = tick >= combos.length * 3

  useEffect(() => {
    if (!pendingRun) { setView('evaluations'); return }
    if (done) { const id = setTimeout(finishRun, 500); return () => clearTimeout(id) }
    const id = setTimeout(() => setTick((t) => t + 1), STEP_MS)
    return () => clearTimeout(id)
  }, [tick, done, pendingRun])

  if (!pendingRun) return null
  const cur = combos[idx]
  const scenario = SCENARIOS.find((x) => x.id === cur.s) || CUSTOM_SCENARIOS[cur.s]
  const persona = PERSONAS.find((x) => x.id === cur.p) || CUSTOM_PERSONAS[cur.p]
  const env = ENVIRONMENTS.find((x) => x.id === cur.e)
  const line = transcriptFor(cur.s, null)[1]
  const completed = done ? combos.length : idx
  const issuesSoFar = combos.slice(0, completed).filter((c) => c.status !== 'success').length

  return (
    <div style={{ maxWidth: 640, margin: '40px auto 0' }}>
      <div className="card card-pad" style={{ padding: 28 }}>
        <div className="row" style={{ gap: 10, marginBottom: 4 }}>
          <Loader2 size={18} className="spin" style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{done ? 'Wrapping up…' : pendingRun.kind === 'simulation' ? 'Running simulation' : 'Running evaluation'}</h2>
        </div>
        <p className="muted">{pendingRun.label && <>{pendingRun.label} · </>}Call {Math.min(idx + 1, combos.length)} of {combos.length}</p>
        <div className="progress mt-16"><span style={{ width: `${(completed / combos.length) * 100}%` }} /></div>

        <div className="meta-grid mt-24">
          <div><div className="k">Scenario</div><div className="v">{scenario.name}</div></div>
          <div><div className="k">Customer</div><div className="v">{persona.name}</div></div>
          <div><div className="k">Environment</div><div className="v">{env.name}</div></div>
        </div>

        <div className="grid-2 mt-24" style={{ alignItems: 'start' }}>
          <div>
            {PHASES.map((p, i) => (
              <div key={p} className={`phase ${done || i < phase ? 'done' : i === phase ? 'active' : ''}`}>
                <span className="bullet" />{p}
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '10px 12px', minHeight: 70, fontSize: 13, background: 'var(--bg)' }}>
            {phase === 1 && !done ? (
              <><div className="muted small">Simulated customer</div><div style={{ color: 'var(--text-2)' }}>“{line.text}”</div></>
            ) : phase === 2 && !done ? (
              <span className="muted">Checking against expected behavior…</span>
            ) : (
              <span className="muted">Placing call…</span>
            )}
          </div>
        </div>

        <div className="mt-24">
          <div className="row-between small mb-16" style={{ marginBottom: 8 }}>
            <span className="muted">Results so far</span>
            <span className="muted">{completed - issuesSoFar} passed{issuesSoFar ? ` · ${issuesSoFar} need attention` : ''}</span>
          </div>
          <div className="dots-grid">
            {combos.map((c, i) => (
              <span key={i} className={i < completed ? c.status : i === idx && !done ? 'running' : ''}>
                {i < completed && <StatusIcon status={c.status} size={12} />}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="hint mt-16" style={{ textAlign: 'center' }}>You can leave this page — we’ll keep testing and show the results here when it’s done.</p>
    </div>
  )
}
