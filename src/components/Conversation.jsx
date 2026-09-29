import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { StatusIcon } from './ui'
import { fmtDuration } from '../data'

// Mock playback clock (runs at 2× so the demo doesn't drag).
export function usePlayback(duration) {
  const [position, setPosition] = useState(0)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setPosition((p) => {
        if (p + 0.25 >= duration) { setPlaying(false); return duration }
        return p + 0.25
      })
    }, 250 / 2)
    return () => clearInterval(id)
  }, [playing, duration])
  const playFrom = (t) => { setPosition(t); setPlaying(true) }
  return { position, setPosition, playing, setPlaying, playFrom }
}

export function Player({ transcript, duration, flagStatus, pb }) {
  const bars = useMemo(() => Array.from({ length: 90 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.37)) * 0.75), [])
  const waveRef = useRef(null)
  const seek = (e) => {
    const r = waveRef.current.getBoundingClientRect()
    pb.setPosition(Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration)))
  }
  return (
    <div className="card player">
      <button className="play-btn" onClick={() => pb.setPlaying(!pb.playing)} aria-label={pb.playing ? 'Pause' : 'Play'}>
        {pb.playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}
      </button>
      <div className="wave" ref={waveRef} onClick={seek}>
        {bars.map((h, i) => (
          <span key={i} className={i / bars.length <= pb.position / duration ? 'played' : ''} style={{ height: `${h * 100}%` }} />
        ))}
        {transcript.filter((l) => l.flag).map((l, i) => (
          <div key={i} className={`marker ${flagStatus}`} style={{ left: `${(l.t / duration) * 100}%` }} title="Issue here" />
        ))}
      </div>
      <span className="time">{fmtDuration(Math.floor(pb.position))} / {fmtDuration(duration)}</span>
    </div>
  )
}

// Transcript synced to the player; flagged lines are highlighted with `flagLabel`.
export function Transcript({ transcript, flagStatus, flagLabel, pb }) {
  const currentIdx = transcript.reduce((acc, l, i) => (l.t <= pb.position ? i : acc), -1)
  return (
    <div className="transcript">
      {transcript.map((l, i) => (
        <div key={i}
          className={`line ${l.who} ${i === currentIdx && (pb.playing || pb.position > 0) ? 'playing' : ''} ${l.flag ? `flag-${flagStatus}` : ''}`}
          onClick={() => pb.playFrom(l.t)}>
          <div className="who">{l.who === 'agent' ? 'Agent' : 'Customer'}</div>
          <div>
            {l.text}
            {l.flag && flagLabel && <div className={`flag-note s-${flagStatus}`}><StatusIcon status={flagStatus} size={12} />{flagLabel}</div>}
          </div>
          <div className="ts">{fmtDuration(l.t)}</div>
        </div>
      ))}
    </div>
  )
}
