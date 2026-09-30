import { useMemo, useState } from 'react'
import { Search, ChevronRight, ClipboardCheck } from 'lucide-react'
import { navigate, useStore } from '../store.jsx'
import { SESSIONS, SESSION_BY_ID } from '../data/sessions.js'
import { sessionStatus } from '../data/engine.js'
import { Button, PageHeader, StatusIcon, statusLabel } from '../components/ui.jsx'
import { OutcomeBadge, SessionMeta } from '../components/SessionBits.jsx'
import SessionView from '../components/SessionView.jsx'
import { dateTime, dateShort, duration, n } from '../format.js'

export function SessionsPage() {
  const [search, setSearch] = useState('')
  const [shown, setShown] = useState(50)
  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? SESSIONS.filter((s) => s.id.includes(q) || s.topic.toLowerCase().includes(q)) : SESSIONS
  }, [search])
  return (
    <>
      <PageHeader crumbs={[{ label: 'Home', href: '#/home' }, { label: 'Sessions' }]} title="Sessions" subtitle={`${n(SESSIONS.length)} production sessions for Northwind Support`} />
      <div className="page-inner">
        <div className="row" style={{ margin: '18px 0 12px' }}>
          <label className="search"><Search size={15} /><input className="input" placeholder="Search sessions" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Session</th><th>Started</th><th>Topic</th><th className="right">Duration</th><th className="right">Turns</th><th>Outcome</th><th /></tr></thead>
            <tbody>
              {list.slice(0, shown).map((s) => (
                <tr key={s.id} className="clickable" onClick={() => navigate(`#/sessions/${s.id}`)}>
                  <td className="mono" style={{ fontSize: 13 }}>{s.id}</td>
                  <td className="muted">{dateTime(s.startedAt)}</td>
                  <td className="muted">{s.topic}</td>
                  <td className="right num">{duration(s.duration)}</td>
                  <td className="right num">{s.turnCount}</td>
                  <td><OutcomeBadge outcome={s.outcome} /></td>
                  <td><ChevronRight size={16} className="faint" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length > shown && (
            <div style={{ padding: 12, textAlign: 'center', borderTop: '1px solid var(--border)' }}>
              <Button size="sm" onClick={() => setShown(shown + 100)}>Show more</Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export function SessionDetail({ sessionId }) {
  const { runs } = useStore()
  const session = SESSION_BY_ID[sessionId]
  // Which completed runs evaluated this session — links production data back to evaluation.
  const appearances = runs.filter((r) => r.status === 'completed' && r.results[sessionId])
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', href: '#/home' }, { label: 'Sessions', href: '#/sessions' }, { label: sessionId }]}
        title={sessionId}
        back="#/sessions"
        badge={<span className="badge badge-lg">Closed</span>}
      />
      <div className="page-inner">
        <div style={{ paddingTop: 12 }}><SessionMeta session={session} /></div>
        {appearances.length > 0 && (
          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-body row" style={{ padding: '10px 14px', flexWrap: 'wrap', gap: 12 }}>
              <ClipboardCheck size={16} className="muted" />
              <span className="muted" style={{ fontSize: 13 }}>Evaluated in</span>
              {appearances.map((r) => {
                const st = sessionStatus(r.results[sessionId], r.evaluations)
                return (
                  <a key={r.id} href={`#/runs/${r.id}/sessions/${sessionId}`} className="chip" style={{ gap: 7 }}>
                    <StatusIcon status={st} size={16} />
                    {r.name} · {dateShort(r.createdAt)}
                    <span className="faint">{statusLabel(st)}</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}
        <SessionView session={session} />
      </div>
    </>
  )
}
