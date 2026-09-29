import { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, X, Check } from 'lucide-react'
import { statusLabel } from '../data'

export function StatusIcon({ status, size = 16 }) {
  const props = { size, className: `status-icon s-${status}` }
  if (status === 'success') return <CheckCircle2 {...props} />
  if (status === 'failed') return <XCircle {...props} />
  return <AlertTriangle {...props} />
}

export function StatusPill({ status, label }) {
  return (
    <span className={`status-pill ${status}`}>
      <StatusIcon status={status} size={13} />
      {label || statusLabel[status]}
    </span>
  )
}

export function Checkbox({ on }) {
  return <span className={`checkbox ${on ? 'on' : ''}`}>{on && <Check size={12} strokeWidth={3} />}</span>
}

export function Toggle({ on, onChange }) {
  return <button type="button" className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on} />
}

function useEscape(onClose) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
}

export function Drawer({ title, onClose, children, footer, width }) {
  useEscape(onClose)
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer" style={width ? { width } : undefined}>
        <div className="drawer-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </>
  )
}

export function Modal({ title, subtitle, onClose, children, footer }) {
  useEscape(onClose)
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" role="dialog">
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="muted mt-8" style={{ fontSize: 13 }}>{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </>
  )
}

export function Ring({ value, total, label }) {
  const r = 56
  const c = 2 * Math.PI * r
  const pct = total ? value / total : 0
  const color = pct === 1 ? 'var(--success)' : pct >= 0.85 ? 'var(--success)' : pct >= 0.7 ? 'var(--attention)' : 'var(--failed)'
  return (
    <div className="ring">
      <svg width="132" height="132">
        <circle cx="66" cy="66" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="10" />
        <circle cx="66" cy="66" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`} style={{ transition: 'stroke-dasharray .6s' }} />
      </svg>
      <div className="ring-label">
        <b>{value}/{total}</b>
        <span>{label}</span>
      </div>
    </div>
  )
}

export function SplitBar({ success, attention, failed }) {
  const total = success + attention + failed || 1
  return (
    <>
      <div className="split-bar">
        {success > 0 && <span style={{ flex: success / total, background: 'var(--success)' }} />}
        {attention > 0 && <span style={{ flex: attention / total, background: 'var(--attention)' }} />}
        {failed > 0 && <span style={{ flex: failed / total, background: 'var(--failed)' }} />}
      </div>
      <div className="legend">
        <span><b>{success}</b>Successful</span>
        <span><b>{attention}</b>Need attention</span>
        {failed > 0 && <span><b>{failed}</b>Failed</span>}
      </div>
    </>
  )
}

const LOOP = ['Build', 'Test', 'Review issues', 'Improve', 'Deploy', 'Monitor']
export function LoopStepper({ current }) {
  const idx = LOOP.indexOf(current)
  return (
    <div className="card loop">
      {LOOP.map((s, i) => (
        <div key={s} style={{ display: 'contents' }}>
          <div className={`loop-step ${i < idx ? 'done' : i === idx ? 'current' : ''}`}>
            <span className="n">{i < idx ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
            {s}
          </div>
          {i < LOOP.length - 1 && <div className="loop-line" />}
        </div>
      ))}
    </div>
  )
}

export function Toast({ children }) {
  return <div className="toast">{children}</div>
}

export function tally(results) {
  const t = { success: 0, attention: 0, failed: 0 }
  results.forEach((r) => t[r.status]++)
  return t
}
