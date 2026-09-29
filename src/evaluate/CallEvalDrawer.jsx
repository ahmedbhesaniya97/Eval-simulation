import { useState } from 'react'
import { Wrench, ChevronDown, ChevronRight, Radio, FlaskConical } from 'lucide-react'
import { Drawer, StatusIcon } from '../components/ui'
import { usePlayback, Player, Transcript } from '../components/Conversation'
import { ENVIRONMENTS, ISSUES, transcriptFor } from '../data'
import { findScenario, findPersona } from '../test/helpers'

// One call, checked against every eval in the run.
export default function CallEvalDrawer({ run, result, evals, onClose, onUpdateAgent }) {
  const { call, checks } = result
  const transcript = transcriptFor(call.scenarioId, call.issue)
  const duration = transcript[transcript.length - 1].t + 4
  const pb = usePlayback(duration)
  const [showPassed, setShowPassed] = useState(false)

  const rows = evals.filter((e) => checks[e.id]).map((ev) => ({ ev, c: checks[ev.id] }))
  const failed = rows.filter((r) => r.c.status === 'fail')
  const passed = rows.filter((r) => r.c.status === 'pass')
  const na = rows.filter((r) => r.c.status === 'na')
  const status = failed.some((r) => r.ev.required) ? 'failed' : failed.length ? 'attention' : 'success'
  const flagStatus = call.issue ? ISSUES[call.issue].severity : 'attention'
  const isProd = call.source === 'production'
  const num = call.id.replace(/\D/g, '').slice(-4)

  return (
    <Drawer
      title={<>{isProd ? <Radio size={16} className="muted" /> : <FlaskConical size={16} className="muted" />}{isProd ? 'Production call' : 'Simulated call'} <span className="id-chip">#{num}</span></>}
      onClose={onClose}
      footer={failed.length ? (
        <button className="btn primary" onClick={() => onUpdateAgent(failed.find((r) => r.ev.issueKey)?.ev.issueKey || call.issue)}><Wrench size={15} />Update agent</button>
      ) : <button className="btn" onClick={onClose}>Close</button>}
    >
      <div className="row" style={{ gap: 12, marginBottom: 6 }}>
        <StatusIcon status={status} size={26} />
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          {failed.length ? `${failed.length} of ${failed.length + passed.length} evals failed` : `All ${passed.length} evals passed`}
        </div>
      </div>
      <p style={{ color: 'var(--text-2)', marginBottom: 20 }}>
        {failed.some((r) => r.ev.required) ? 'A required eval failed on this call.' : failed.length ? 'Only optional evals failed on this call.' : 'This call met every eval that applied to it.'}
      </p>

      <div className="meta-grid">
        <div><div className="k">Customer wanted to</div><div className="v">{findScenario(call.scenarioId)?.name}</div></div>
        {isProd ? (
          <>
            <div><div className="k">Caller</div><div className="v">{call.caller}</div></div>
            <div><div className="k">When</div><div className="v">{call.when}</div></div>
          </>
        ) : (
          <>
            <div><div className="k">Customer behavior</div><div className="v">{findPersona(call.personaId)?.name}</div></div>
            <div><div className="k">Environment</div><div className="v">{ENVIRONMENTS.find((e) => e.id === call.envId)?.name}</div></div>
          </>
        )}
      </div>

      <div className="mt-24">
        <div className="section-title">Eval results</div>
        <div className="card" style={{ padding: '0 16px', marginTop: 8 }}>
          {failed.map(({ ev, c }) => (
            <div key={ev.id} className="check-row">
              <StatusIcon status={ev.required ? 'failed' : 'attention'} />
              <div>
                <div className="title row" style={{ gap: 8 }}>{ev.name}{ev.required && <span className="tag">Required</span>}</div>
                <div className="note">{c.reason}</div>
              </div>
            </div>
          ))}
          {(showPassed || !failed.length) && passed.map(({ ev, c }) => (
            <div key={ev.id} className="check-row">
              <StatusIcon status="success" />
              <div>
                <div className="title">{ev.name}</div>
                <div className="note">{c.reason}</div>
              </div>
            </div>
          ))}
          {failed.length > 0 && passed.length > 0 && (
            <button className="check-row btn ghost" style={{ width: '100%', height: 'auto', border: 'none', borderRadius: 0, color: 'var(--text-2)', fontWeight: 500, paddingLeft: 0 }} onClick={() => setShowPassed(!showPassed)}>
              {showPassed ? <ChevronDown size={16} /> : <ChevronRight size={16} />}{showPassed ? 'Hide' : 'Show'} {passed.length} passed evals
            </button>
          )}
        </div>
        {na.length > 0 && <p className="hint mt-8">{na.length} {na.length === 1 ? 'eval didn’t' : 'evals didn’t'} apply to this call: {na.map((r) => r.ev.name).join(', ')}.</p>}
      </div>

      <div className="mt-24">
        <div className="section-title">Conversation</div>
        <div className="mt-8"><Player transcript={transcript} duration={duration} flagStatus={flagStatus} pb={pb} /></div>
        <div className="mt-16"><Transcript transcript={transcript} flagStatus={flagStatus} flagLabel={call.issue && ISSUES[call.issue].short} pb={pb} /></div>
      </div>
    </Drawer>
  )
}
