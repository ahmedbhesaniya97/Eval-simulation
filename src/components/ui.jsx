import { useEffect, useRef, useState } from 'react'
import { Check, Minus, X, AlertTriangle, SkipForward, Loader2, ChevronLeft, ShieldCheck, PenLine } from 'lucide-react'

export function Button({ variant = 'secondary', size, className = '', ...props }) {
  const cls = ['btn', variant !== 'secondary' && `btn-${variant}`, size && `btn-${size}`, className].filter(Boolean).join(' ')
  return <button type="button" className={cls} {...props} />
}

export function Checkbox({ checked, partial, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={partial ? 'mixed' : checked}
      aria-label={label}
      className={`checkbox ${checked ? 'on' : ''} ${partial ? 'partial' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
    >
      {checked && <Check size={12} strokeWidth={3} />}
      {partial && !checked && <Minus size={12} strokeWidth={3} />}
    </button>
  )
}

export function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle ${on ? 'on' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!on)
      }}
    />
  )
}

const STATUS = {
  passed: { label: 'Passed', Icon: Check },
  failed: { label: 'Failed', Icon: X },
  review: { label: 'Needs review', Icon: AlertTriangle },
  skipped: { label: 'Skipped', Icon: SkipForward },
  running: { label: 'Running', Icon: Loader2 },
  completed: { label: 'Completed', Icon: Check },
}
export const statusLabel = (s) => STATUS[s]?.label ?? s

export function StatusBadge({ status, large, children }) {
  const { label, Icon } = STATUS[status]
  return (
    <span className={`badge ${status} ${large ? 'badge-lg' : ''}`}>
      <Icon size={large ? 14 : 12} strokeWidth={2.5} className={status === 'running' ? 'spin' : ''} />
      {children ?? label}
    </span>
  )
}

export function StatusIcon({ status, size = 22 }) {
  const { Icon } = STATUS[status]
  return (
    <span className={`status-ico ${status}`} style={{ width: size, height: size }} title={STATUS[status].label}>
      <Icon size={size * 0.58} strokeWidth={2.75} />
    </span>
  )
}

export function TypeBadge({ type }) {
  return type === 'standard' ? (
    <span className="badge standard"><ShieldCheck size={12} /> Standard</span>
  ) : (
    <span className="badge custom"><PenLine size={12} /> Custom</span>
  )
}

export function RequiredBadge({ required }) {
  return required ? <span className="badge required">Required</span> : <span className="badge optional">Optional</span>
}

export function PageHeader({ crumbs = [], title, badge, subtitle, back, actions }) {
  return (
    <header className="page-header">
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i} className="row" style={{ gap: 8 }}>
            {i > 0 && <span className="faint">/</span>}
            {c.href && i < crumbs.length - 1 ? <a href={c.href}>{c.label}</a> : <span className={i === crumbs.length - 1 ? 'current' : ''}>{c.label}</span>}
          </span>
        ))}
      </nav>
      <div className="title-row">
        {back && (
          <a className="back-btn" href={back} aria-label="Back">
            <ChevronLeft size={18} />
          </a>
        )}
        <h1 className="page-title">{title}</h1>
        {badge}
        <div className="title-actions">
          {actions}
          <Button>Feedback</Button>
        </div>
      </div>
      {subtitle && <div className="page-sub">{subtitle}</div>}
    </header>
  )
}

export function Menu({ trigger, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div className="menu-wrap" ref={ref} onClick={(e) => e.stopPropagation()}>
      {trigger(() => setOpen((o) => !o))}
      {open && (
        <div className="menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  )
}

function useEscape(onClose) {
  useEffect(() => {
    const on = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onClose])
}

export function Modal({ title, onClose, children, footer, width }) {
  useEscape(onClose)
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" style={width ? { width } : null} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ onClose, header, children }) {
  useEscape(onClose)
  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>{header}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      <div className="ico"><Icon size={20} /></div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  )
}

export function PassBar({ rate }) {
  return (
    <div className="bar split-bar" aria-hidden>
      <span style={{ width: `${rate * 100}%`, background: 'var(--pass)' }} />
      <span style={{ width: `${(1 - rate) * 100}%`, background: 'var(--fail)', opacity: 0.85 }} />
    </div>
  )
}
