import { Clock, MessagesSquare, PhoneIncoming, PhoneOutgoing } from 'lucide-react'
import { Drawer } from './ui.jsx'
import Transcript from './Transcript.jsx'
import { dateTime, duration } from '../format.js'

const OUTCOME_COLOR = {
  Completed: 'var(--pass)',
  Escalated: 'var(--warn)',
  Dropped: 'var(--fail)',
  Abandoned: 'var(--fail)',
  Voicemail: 'var(--skip)',
}

export function OutcomeBadge({ outcome }) {
  return (
    <span className="badge">
      <span className="dot" style={{ background: OUTCOME_COLOR[outcome] }} />
      {outcome}
    </span>
  )
}

export function SessionMeta({ session }) {
  const Dir = session.direction === 'Inbound' ? PhoneIncoming : PhoneOutgoing
  return (
    <div className="row muted" style={{ gap: 16, fontSize: 13, flexWrap: 'wrap' }}>
      <span>{dateTime(session.startedAt)}</span>
      <span className="row" style={{ gap: 5 }}><Clock size={13} /> {duration(session.duration)}</span>
      <span className="row" style={{ gap: 5 }}><MessagesSquare size={13} /> {session.turnCount} turns</span>
      <span className="row" style={{ gap: 5 }}><Dir size={13} /> {session.direction} · {session.caller}</span>
    </div>
  )
}

export function SessionPreviewDrawer({ session, onClose, action }) {
  return (
    <Drawer
      onClose={onClose}
      header={
        <>
          <div className="row" style={{ gap: 10, marginBottom: 6 }}>
            <span className="mono" style={{ fontSize: 17, fontWeight: 500 }}>{session.id}</span>
            <OutcomeBadge outcome={session.outcome} />
            <div className="spacer" />
            {action}
          </div>
          <SessionMeta session={session} />
          <div className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>Topic: {session.topic}</div>
        </>
      }
    >
      <div style={{ padding: '0 20px' }}>
        <Transcript session={session} compact />
      </div>
    </Drawer>
  )
}
