import { Rocket, FlaskConical } from 'lucide-react'
import { Modal, StatusIcon, tally } from './ui'
import { ISSUES } from '../data'

// Pre-deploy readiness check: "Is my agent ready to go live?"
export default function DeployModal({ suite, run, draftChanged, onClose, onReview, onRunTests, onDeploy }) {
  if (!run) {
    return (
      <Modal title="Ready to deploy?" subtitle={`Required evaluation: ${suite.name}`} onClose={onClose}
        footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" onClick={onDeploy}><Rocket size={15} />Deploy anyway</button><button className="btn primary" onClick={onRunTests}><FlaskConical size={15} />Run evaluation</button></>}>
        <div className="callout attention"><StatusIcon status="attention" /><div><div className="title">Not evaluated yet</div><div className="body">Run “{suite.name}” to see how your agent does before real customers call.</div></div></div>
      </Modal>
    )
  }
  const t = tally(run.results)
  const total = run.results.length
  const issues = [...new Set(run.results.filter((r) => r.issue).map((r) => r.issue))]
  const ready = t.success === total && !draftChanged

  return (
    <Modal
      title="Ready to deploy?"
      subtitle={`Required evaluation: ${suite.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          {draftChanged ? (
            <button className="btn primary" onClick={onRunTests}><FlaskConical size={15} />Evaluate changes first</button>
          ) : !ready ? (
            <button className="btn" onClick={onReview}>Review issues</button>
          ) : null}
          <button className={`btn ${ready ? 'primary' : ''}`} onClick={onDeploy}><Rocket size={15} />{ready ? 'Deploy' : 'Deploy anyway'}</button>
        </>
      }
    >
      <div className="card card-pad">
        <div className="row" style={{ gap: 12 }}>
          <StatusIcon status={t.success === total ? 'success' : 'attention'} size={22} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{t.success} of {total} scenarios passed</div>
            <div className="muted small">{run.name} · {run.when}</div>
          </div>
        </div>
        {issues.length > 0 && (
          <div className="mt-16">
            {issues.map((k) => (
              <div key={k} className="row" style={{ padding: '4px 0', fontSize: 13 }}>
                <StatusIcon status={ISSUES[k].severity} size={14} />{ISSUES[k].title}
              </div>
            ))}
          </div>
        )}
      </div>
      {draftChanged && (
        <div className="callout attention mt-16">
          <StatusIcon status="attention" />
          <div>
            <div className="title">You’ve changed the agent since this evaluation</div>
            <div className="body">Run the evaluation on your latest changes so you know how they behave before real customers call.</div>
          </div>
        </div>
      )}
    </Modal>
  )
}
