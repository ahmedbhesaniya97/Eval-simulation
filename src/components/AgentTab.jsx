import { useState } from 'react'
import { Copy, ChevronsUpDown, Sparkles, Plus, Languages, Wrench, FlaskConical, X, Lightbulb, CheckCircle2 } from 'lucide-react'
import { AGENT, ISSUES } from '../data'
import { Toggle } from './ui'

export default function AgentTab({ prompt, onPromptChange, fixingIssue, fixed, onApplySuggestion, onDismissFix, onRunTests, suiteName, draftChanged }) {
  const [welcomeOn, setWelcomeOn] = useState(true)
  const [welcome, setWelcome] = useState(AGENT.welcome)
  const [interrupt, setInterrupt] = useState(false)
  const issue = fixingIssue ? ISSUES[fixingIssue] : null
  const applied = fixingIssue && fixed.has(fixingIssue)

  return (
    <div className="page agent-form">
      {issue && (
        <div className={`callout ${applied ? 'success' : 'info'} mb-16`} style={{ marginBottom: 24 }}>
          {applied ? <CheckCircle2 size={18} className="s-success" style={{ marginTop: 2 }} /> : <Wrench size={18} style={{ color: 'var(--accent)', marginTop: 2 }} />}
          <div style={{ flex: 1 }}>
            <div className="title">{applied ? 'Change made — now run the evaluation' : `Fixing: ${issue.title}`}</div>
            <div className="body">
              {applied
                ? `Run ${suiteName} again to check the issue is gone and nothing else broke.`
                : issue.cause}
            </div>
            {!applied && (
              <div className="suggestion mt-8">
                <div className="lbl"><Lightbulb size={12} />Suggested change</div>
                {issue.suggestion}
              </div>
            )}
            <div className="row mt-16">
              {!applied && <button className="btn sm primary" onClick={() => onApplySuggestion(fixingIssue)}><Plus size={14} />Add to system prompt</button>}
              <button className={`btn sm ${applied ? 'primary' : ''}`} onClick={onRunTests}><FlaskConical size={14} />Run evaluation again</button>
            </div>
          </div>
          <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={onDismissFix} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      {!issue && draftChanged && (
        <div className="callout info" style={{ marginBottom: 24, alignItems: 'center' }}>
          <FlaskConical size={18} style={{ color: 'var(--accent)' }} />
          <div style={{ flex: 1 }}>
            <div className="title">Your draft has changed since the last evaluation</div>
            <div className="body">Run {suiteName} again to make sure nothing broke before you deploy.</div>
          </div>
          <button className="btn sm" onClick={onRunTests}>Run evaluation</button>
        </div>
      )}

      <div className="row-between" style={{ marginBottom: 28 }}>
        <div className="page-title">Agent <span className="id-chip">{AGENT.id} <Copy size={12} /></span></div>
        <div className="lang-select"><span className="row"><span className="flag" />Primary (English)</span><ChevronsUpDown size={14} className="muted" /></div>
      </div>

      <div className="block">
        <div className="field-label">
          <span>System prompt<span className="req">*</span></span>
          <span className="row" style={{ gap: 16, fontSize: 13 }}>
            <Sparkles size={15} />
            <span className="row" style={{ gap: 6, fontWeight: 600 }}><Plus size={15} />Insert Variable</span>
          </span>
        </div>
        <textarea className="textarea" value={prompt} onChange={(e) => onPromptChange(e.target.value)} />
        <div className="under"><span>Type {'{{'} to insert a variable</span><span className="act"><Languages size={14} />Translate to all</span></div>
      </div>

      <div className="block">
        <div className="field-label">
          <span>Welcome message</span>
          <span className="row" style={{ gap: 20, fontSize: 13 }}>
            <span className="row" style={{ gap: 6, fontWeight: 600 }}><Plus size={15} />Insert Variable</span>
            <Toggle on={welcomeOn} onChange={setWelcomeOn} />
          </span>
        </div>
        <textarea className="textarea short" value={welcome} onChange={(e) => setWelcome(e.target.value)} disabled={!welcomeOn} />
        <div className="under">
          <label className="row" style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={interrupt} onChange={(e) => setInterrupt(e.target.checked)} />
            Allow users to interrupt the greeting.
          </label>
          <span className="act"><Languages size={14} />Translate to all</span>
        </div>
      </div>

      <div className="block row-between">
        <div>
          <div className="field-label" style={{ marginBottom: 2 }}>Call ending</div>
          <div className="hint">Define how the call should end.</div>
        </div>
        <button className="btn sm">Configure</button>
      </div>
    </div>
  )
}
