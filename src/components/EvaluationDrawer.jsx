import { useState } from 'react'
import { Play, Wrench, ListPlus, Lightbulb, ChevronDown, ChevronRight } from 'lucide-react'
import { Drawer, StatusIcon } from './ui'
import { CATEGORIES, statusLabel } from '../data'
import { usePlayback, Player, Transcript } from './Conversation'

export default function EvaluationDrawer({ evaluation: ev, onClose, onUpdateAgent, onAddScenario, onAddToSuite }) {
  const pb = usePlayback(ev.duration)
  const [showAll, setShowAll] = useState(false)

  const flagStatus = ev.issue?.severity || 'attention'
  const issueChecks = ev.checks.filter((c) => c.status !== 'success')
  const okChecks = ev.checks.filter((c) => c.status === 'success')
  const isProd = ev.kind === 'production'
  const isSim = ev.kind === 'simulation'

  const jumpToIssue = () => {
    const l = ev.transcript.find((x) => x.flag)
    if (l) pb.playFrom(l.t)
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
          <Player transcript={ev.transcript} duration={ev.duration} flagStatus={flagStatus} pb={pb} />
        </div>
        <div className="mt-16">
          <Transcript transcript={ev.transcript} flagStatus={flagStatus} flagLabel={ev.issue?.short} pb={pb} />
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

