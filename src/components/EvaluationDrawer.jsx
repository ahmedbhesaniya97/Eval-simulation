import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, Wrench, ListPlus, Lightbulb, ChevronDown, ChevronRight } from 'lucide-react'
import { Drawer, StatusIcon } from './ui'
import { CATEGORIES, statusLabel, fmtDuration } from '../data'

function Player({ transcript, duration, flagStatus, position, setPosition, playing, setPlaying }) {
  const bars = useMemo(() => Array.from({ length: 90 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.37)) * 0.75), [])
  const waveRef = useRef(null)
  const seek = (e) => {
    const r = waveRef.current.getBoundingClientRect()
    setPosition(Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration)))
  }
  const flags = transcript.filter((l) => l.flag)
  return (
    <div className="card player">
      <button className="play-btn" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}
      </button>
      <div className="wave" ref={waveRef} onClick={seek}>
        {bars.map((h, i) => (
          <span key={i} className={i / bars.length <= position / duration ? 'played' : ''} style={{ height: `${h * 100}%` }} />
        ))}
        {flags.map((l, i) => (
          <div key={i} className={`marker ${flagStatus}`} style={{ left: `${(l.t / duration) * 100}%` }} title="Issue here" />
        ))}
      </div>
      <span className="time">{fmtDuration(Math.floor(position))} / {fmtDuration(duration)}</span>
    </div>
  )
}

export default function EvaluationDrawer({ evaluation: ev, onClose, onUpdateAgent, onAddScenario, onAddToSuite }) {
  const [position, setPosition] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setPosition((p) => {
        if (p + 0.25 >= ev.duration) { setPlaying(false); return ev.duration }
        return p + 0.25
      })
    }, 250 / 2) // 2× speed so the demo doesn't drag
    return () => clearInterval(id)
  }, [playing, ev.duration])

  const currentIdx = ev.transcript.reduce((acc, l, i) => (l.t <= position ? i : acc), -1)
  const flagStatus = ev.issue?.severity || 'attention'
  const issueChecks = ev.checks.filter((c) => c.status !== 'success')
  const okChecks = ev.checks.filter((c) => c.status === 'success')
  const isProd = ev.kind === 'production'
  const isSim = ev.kind === 'simulation'

  const jumpToIssue = () => {
    const l = ev.transcript.find((x) => x.flag)
    if (l) { setPosition(l.t); setPlaying(true) }
  }

  return (
    <Drawer
      title={<>{isProd ? 'Conversation' : isSim ? 'Simulated call' : 'Evaluation'} <span className="id-chip">#{ev.number}</span></>}
      onClose={onClose}
      footer={
        ev.issue ? (
          <>
            {isProd && <button className="btn" onClick={() => onAddScenario(ev.issue.key)}><ListPlus size={15} />Add to evaluation suite</button>}
            {isSim && <button className="btn" onClick={() => onAddToSuite({ scenarioIds: [ev.scenario.id], personaIds: [ev.persona.id] })}><ListPlus size={15} />Add to evaluation suite</button>}
            <button className="btn primary" onClick={() => onUpdateAgent(ev.issue.key)}><Wrench size={15} />Update agent</button>
          </>
        ) : (
          <button className="btn" onClick={onClose}>Close</button>
        )
      }
    >
      {/* What happened? Was it successful? */}
      <div className="row" style={{ gap: 12, marginBottom: 6 }}>
        <StatusIcon status={ev.status} size={26} />
        <div style={{ fontSize: 20, fontWeight: 600 }}>{statusLabel[ev.status]}</div>
      </div>
      <p style={{ color: 'var(--text-2)', marginBottom: 20 }}>{ev.outcome}</p>

      <div className="meta-grid">
        <div><div className="k">Scenario</div><div className="v">{ev.scenario.name}</div></div>
        {isProd ? (
          <>
            <div><div className="k">Caller</div><div className="v">{ev.meta.caller}</div></div>
            <div><div className="k">When</div><div className="v">{ev.meta.when}</div></div>
          </>
        ) : (
          <>
            <div><div className="k">Customer behavior</div><div className="v">{ev.persona.name}</div></div>
            <div><div className="k">Environment</div><div className="v">{ev.env.name}</div></div>
          </>
        )}
      </div>

      {/* Why? */}
      {ev.issue && (
        <div className="mt-24">
          <div className="section-title">What went wrong</div>
          <div className={`callout ${ev.issue.severity} mt-8`}>
            <StatusIcon status={ev.issue.severity} size={18} />
            <div style={{ flex: 1 }}>
              <div className="title">{ev.issue.title}</div>
              <div className="body">{ev.issue.explanation}</div>
              <button className="btn link mt-8" onClick={jumpToIssue} style={{ fontSize: 13 }}>
                <Play size={12} fill="currentColor" /> Hear this moment
              </button>
            </div>
          </div>
          <div className="suggestion mt-8">
            <div className="lbl"><Lightbulb size={12} />Why it probably happened</div>
            {ev.issue.cause}
          </div>
        </div>
      )}

      {/* Evaluation checks — problems first, passes collapsed */}
      <div className="mt-24">
        <div className="section-title">Evaluation</div>
        <div className="card" style={{ padding: '0 16px', marginTop: 8 }}>
          {issueChecks.map((c) => (
            <div key={c.key} className="check-row">
              <StatusIcon status={c.status} />
              <div>
                <div className="title">{CATEGORIES[c.key].label}</div>
                <div className="note">{c.note}</div>
              </div>
            </div>
          ))}
          {(showAll || issueChecks.length === 0 ? okChecks : []).map((c) => (
            <div key={c.key} className="check-row">
              <StatusIcon status="success" />
              <div>
                <div className="title">{CATEGORIES[c.key].label}</div>
                <div className="note">{c.note}</div>
              </div>
            </div>
          ))}
          {issueChecks.length > 0 && okChecks.length > 0 && (
            <button className="check-row btn ghost" style={{ width: '100%', height: 'auto', border: 'none', borderRadius: 0, color: 'var(--text-2)', fontWeight: 500, paddingLeft: 0 }} onClick={() => setShowAll(!showAll)}>
              {showAll ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {showAll ? 'Hide' : 'Show'} {okChecks.length} passed checks
              <span className="row" style={{ marginLeft: 8, gap: 4 }}>{okChecks.map((c) => <StatusIcon key={c.key} status="success" size={13} />)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="mt-24">
        <div className="row-between">
          <div className="section-title">Conversation</div>
          <span className="muted small">Avg. response time {ev.stats.responseTime} · {ev.stats.turns} turns</span>
        </div>
        <div className="mt-8">
          <Player transcript={ev.transcript} duration={ev.duration} flagStatus={flagStatus}
            position={position} setPosition={setPosition} playing={playing} setPlaying={setPlaying} />
        </div>
        <div className="transcript mt-16">
          {ev.transcript.map((l, i) => (
            <div key={i}
              className={`line ${l.who} ${i === currentIdx && (playing || position > 0) ? 'playing' : ''} ${l.flag ? `flag-${flagStatus}` : ''}`}
              onClick={() => { setPosition(l.t); setPlaying(true) }}>
              <div className="who">{l.who === 'agent' ? 'Agent' : 'Customer'}</div>
              <div>
                {l.text}
                {l.flag && (
                  <div className={`flag-note s-${flagStatus}`}><StatusIcon status={flagStatus} size={12} />{ev.issue.short}</div>
                )}
              </div>
              <div className="ts">{fmtDuration(l.t)}</div>
            </div>
          ))}
        </div>
      </div>

      {!isProd && (
        <details className="mt-24">
          <summary className="muted small" style={{ cursor: 'pointer' }}>Expected behavior for this scenario</summary>
          <div className="card card-pad mt-8" style={{ fontSize: 13 }}>
            <p style={{ color: 'var(--text-2)' }}>{ev.scenario.expected}</p>
            <div className="muted small mt-16">Required actions</div>
            <ol style={{ margin: '4px 0 0', paddingLeft: 18, color: 'var(--text-2)' }}>{ev.scenario.actions.map((a) => <li key={a}>{a}</li>)}</ol>
          </div>
        </details>
      )}
    </Drawer>
  )
}

