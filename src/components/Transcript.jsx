import { useEffect, useRef, useState } from 'react'
import { Bot, User, Play, Pause, RotateCcw, RotateCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { clock } from '../format.js'

// Audio player bar — mocked playback that walks through the transcript.
export function Player({ duration, position, setPosition, markers = [] }) {
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setPosition((p) => {
      if (p + 0.25 >= duration) {
        setPlaying(false)
        return duration
      }
      return p + 0.25
    }), 250)
    return () => clearInterval(t)
  }, [playing, duration, setPosition])

  const pct = (position / duration) * 100
  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setPosition(Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration)))
  }
  return (
    <div className="player">
      <div className="player-controls">
        <button aria-label="Back 10 seconds" onClick={() => setPosition((p) => Math.max(0, p - 10))}>
          <RotateCcw size={22} strokeWidth={1.6} /><small>10</small>
        </button>
        <button aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause size={24} strokeWidth={1.6} /> : <Play size={24} strokeWidth={1.6} />}
        </button>
        <button aria-label="Forward 10 seconds" onClick={() => setPosition((p) => Math.min(duration, p + 10))}>
          <RotateCw size={22} strokeWidth={1.6} /><small>10</small>
        </button>
      </div>
      <div className="player-track">
        <span className="time">{clock(position)} <span className="faint">/ {clock(duration)}</span></span>
        <div className="track" onClick={seek}>
          <div className="done" style={{ width: `${pct}%` }} />
          {markers.map((m, i) => (
            <span key={i} className="mark" title={m.title} style={{ left: `${(m.t / duration) * 100}%`, background: m.color }} />
          ))}
          <div className="knob" style={{ left: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

function Latency({ turn }) {
  if (turn.eou == null && turn.e2e == null) return null // text-only simulations have no audio pipeline
  const cells =
    turn.role === 'user'
      ? [['EOU Latency', turn.eou]]
      : [['LLM Latency', turn.llm], ['TTS Latency', turn.tts], ['E2E Latency', turn.e2e]]
  return (
    <div className="latency">
      {cells.map(([l, v]) => (
        <div key={l}>
          <div className="l">{l}</div>
          <div className={`v ${l.startsWith('E2E') && v > 2500 ? 'slow' : ''}`}>
            {v}<small>ms</small>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * highlight: { turns: number[], tone: 'fail' | 'pass', label: string } | null
 * focusTurn: turn index to scroll into view (changes trigger a scroll)
 */
export default function Transcript({ session, highlight, focusTurn, position, compact, userLabel = 'User' }) {
  const refs = useRef({})
  const relevant = new Set(highlight?.turns ?? [])

  useEffect(() => {
    if (focusTurn == null) return
    refs.current[focusTurn.idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusTurn])

  const playingIdx = position == null ? -1 : session.turns.findLastIndex((t) => t.t <= position)

  return (
    <div className="transcript">
      {session.turns.map((turn) => {
        const isRel = relevant.has(turn.idx)
        return (
          <div
            key={turn.idx}
            ref={(el) => (refs.current[turn.idx] = el)}
            className={`turn ${isRel ? 'relevant' : ''} ${isRel && highlight.tone === 'pass' ? 'pass' : ''} ${playingIdx === turn.idx ? 'playing' : ''}`}
          >
            <div className="ts" style={compact ? { fontSize: 15 } : null}>{turn.t == null ? <span className="faint">#{turn.idx + 1}</span> : clock(turn.t)}</div>
            <div>
              <span className={`speaker ${turn.role}`}>
                {turn.role === 'agent' ? <Bot size={15} /> : <User size={15} />}
                {turn.role === 'agent' ? 'Agent' : userLabel}
              </span>
              {isRel && (
                <span className={`relevant-tag ${highlight.tone === 'pass' ? 'pass' : ''}`}>
                  {highlight.tone === 'pass' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  Relevant to {highlight.label}
                </span>
              )}
              <p className="turn-text" style={compact ? { fontSize: 15 } : null}>{turn.text}</p>
              <Latency turn={turn} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
