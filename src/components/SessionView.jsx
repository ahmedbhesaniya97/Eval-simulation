import { useState } from 'react'
import Transcript, { Player } from './Transcript.jsx'
import { clock } from '../format.js'

function Traces({ session }) {
  const agentTurns = session.turns.filter((t) => t.role === 'agent')
  const max = Math.max(...agentTurns.map((t) => t.e2e))
  return (
    <div style={{ padding: '18px 0' }}>
      {agentTurns.map((t) => {
        const prev = session.turns[t.idx - 1]
        const eou = prev?.eou ?? 0
        const spans = [
          ['EOU', eou, 'var(--user)'],
          ['LLM', t.llm, 'var(--accent)'],
          ['TTS', t.tts, 'var(--agent)'],
        ]
        let offset = 0
        return (
          <div key={t.idx} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 80px', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span className="mono muted" style={{ fontSize: 12.5 }}>turn {t.idx} · {clock(t.t)}</span>
            <div style={{ position: 'relative', height: 18 }}>
              {spans.map(([label, ms, color]) => {
                const left = (offset / max) * 100
                offset += ms
                return (
                  <span key={label} title={`${label} ${ms} ms`} style={{ position: 'absolute', left: `${left}%`, width: `${Math.max(1, (ms / max) * 100)}%`, top: 3, height: 12, background: color, opacity: 0.8, borderRadius: 2 }} />
                )
              })}
            </div>
            <span className="num" style={{ textAlign: 'right', fontSize: 13 }}>{t.e2e} ms</span>
          </div>
        )
      })}
      <div className="row faint" style={{ gap: 14, fontSize: 12, marginTop: 12 }}>
        <span className="row" style={{ gap: 5 }}><span className="dot" style={{ background: 'var(--user)' }} /> End of utterance</span>
        <span className="row" style={{ gap: 5 }}><span className="dot" style={{ background: 'var(--accent)' }} /> LLM</span>
        <span className="row" style={{ gap: 5 }}><span className="dot" style={{ background: 'var(--agent)' }} /> TTS</span>
      </div>
    </div>
  )
}

function Logs({ session }) {
  const lines = [[0, 'INFO', `session.start id=${session.id} direction=${session.direction.toLowerCase()}`]]
  for (const t of session.turns) {
    if (t.role === 'user') lines.push([t.t, 'INFO', `stt.final eou_ms=${t.eou} chars=${t.text.length}`])
    else {
      lines.push([t.t, 'INFO', `llm.completion latency_ms=${t.llm} model=gpt-4.1-mini`])
      if (t.e2e > 2500) lines.push([t.t, 'WARN', `pipeline.slow e2e_ms=${t.e2e} threshold_ms=2500`])
      lines.push([t.t, 'INFO', `tts.stream first_byte_ms=${t.tts} voice=ava-en-US`])
    }
  }
  lines.push([session.duration, 'INFO', `session.end outcome=${session.outcome.toLowerCase()} duration_s=${session.duration}`])
  return (
    <pre className="mono" style={{ fontSize: 12.5, lineHeight: 1.8, padding: '18px 0', margin: 0, whiteSpace: 'pre-wrap' }}>
      {lines.map(([t, lvl, msg], i) => (
        <div key={i}>
          <span className="faint">{clock(t)}</span>{'  '}
          <span style={{ color: lvl === 'WARN' ? 'var(--warn)' : 'var(--text-3)' }}>{lvl.padEnd(4)}</span>{'  '}
          <span className="muted">{msg}</span>
        </div>
      ))}
    </pre>
  )
}

// Player + Transcript/Traces/Logs tabs — same layout as the Sessions page.
export default function SessionView({ session, highlight, focusTurn, markers }) {
  const [tab, setTab] = useState('transcript')
  const [position, setPosition] = useState(0)
  return (
    <>
      <Player duration={session.duration} position={position} setPosition={setPosition} markers={markers} />
      <div className="tabs" style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 2 }}>
        {['transcript', 'traces', 'logs'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>
      {tab === 'transcript' && <Transcript session={session} highlight={highlight} focusTurn={focusTurn} position={position} />}
      {tab === 'traces' && <Traces session={session} />}
      {tab === 'logs' && <Logs session={session} />}
    </>
  )
}
