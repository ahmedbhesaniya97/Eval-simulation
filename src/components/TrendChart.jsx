import { useEffect, useRef, useState } from 'react'
import { dateShort, pct } from '../format.js'

// Single-series pass-rate line with crosshair + tooltip.
export default function TrendChart({ points, height = 170, onSelect }) {
  const wrap = useRef(null)
  const [width, setWidth] = useState(480)
  const [hover, setHover] = useState(null)

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(wrap.current)
    return () => ro.disconnect()
  }, [])

  if (points.length === 0) return <div ref={wrap} className="muted">No completed runs yet.</div>

  const pad = { l: 38, r: 24, t: 14, b: 26 }
  const w = width - pad.l - pad.r
  const h = height - pad.t - pad.b
  const lo = Math.max(0, Math.floor((Math.min(...points.map((p) => p.value)) * 100 - 6) / 10) * 10)
  const ticks = []
  for (let v = lo; v <= 100; v += lo >= 60 ? 10 : 20) ticks.push(v)
  const x = (i) => pad.l + (points.length === 1 ? w / 2 : (i / (points.length - 1)) * w)
  const y = (v) => pad.t + h - ((v * 100 - lo) / (100 - lo)) * h
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ')
  const area = `${d} L${x(points.length - 1)},${pad.t + h} L${x(0)},${pad.t + h} Z`

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - r.left
    let best = 0
    points.forEach((_, i) => Math.abs(x(i) - mx) < Math.abs(x(best) - mx) && (best = i))
    setHover(best)
  }
  const last = points.length - 1

  return (
    <div ref={wrap} style={{ position: 'relative' }}>
      <svg width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)}
        onClick={() => hover != null && onSelect?.(points[hover])} style={{ display: 'block', cursor: onSelect ? 'pointer' : 'default' }}
        role="img" aria-label={`Pass rate over ${points.length} runs, from ${pct(points[0].value)} to ${pct(points[last].value)}`}>
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={pad.l + w} y1={y(t / 100)} y2={y(t / 100)} stroke="var(--border)" strokeDasharray={t === lo ? '' : '2 4'} />
            <text x={pad.l - 8} y={y(t / 100) + 4} textAnchor="end" fontSize="11" fill="var(--text-3)">{t}%</text>
          </g>
        ))}
        {points.map((p, i) => (
          (points.length <= 8 || i % 2 === last % 2) && (
            <text key={p.id} x={x(i)} y={height - 6} textAnchor={i === last && points.length > 1 ? 'end' : i === 0 && points.length > 1 ? 'start' : 'middle'} fontSize="11" fill="var(--text-3)">{dateShort(p.date)}</text>
          )
        ))}
        <path d={area} fill="url(#trendFill)" />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + h} stroke="var(--border-strong)" />}
        {points.map((p, i) => (
          <circle key={p.id} cx={x(i)} cy={y(p.value)} r={hover === i || i === last ? 5 : 3.5} fill="var(--accent)" stroke="var(--bg-panel)" strokeWidth="2" />
        ))}
        <text x={x(last)} y={y(points[last].value) - 12} textAnchor="end" fontSize="12" fontWeight="600" fill="var(--text)">{pct(points[last].value)}</text>
      </svg>
      {hover != null && (
        <div className="chart-tip" style={{ left: x(hover), top: y(points[hover].value) }}>
          <div className="faint">{dateShort(points[hover].date)} · {points[hover].label}</div>
          <div><strong>{pct(points[hover].value, 1)}</strong> <span className="muted">checks passed</span></div>
        </div>
      )}
    </div>
  )
}
