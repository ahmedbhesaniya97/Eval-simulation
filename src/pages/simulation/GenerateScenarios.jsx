import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Button, Checkbox, Modal } from '../../components/ui.jsx'
import { DifficultyBadge } from '../../components/SimBits.jsx'
import { EXAMPLE_PROMPT, generateScenarios } from '../../data/simulation.js'
import { plural } from '../../format.js'

const STAGES = ['Reading your prompt…', 'Finding rules and edge cases…', 'Writing success and failure criteria…']

// System prompt → list of generated scenarios → pick which ones to keep.
export default function GenerateScenarios({ onAdd, onClose }) {
  const [prompt, setPrompt] = useState('')
  const [phase, setPhase] = useState('prompt') // prompt | loading | results
  const [stage, setStage] = useState(0)
  const [items, setItems] = useState([])
  const [picked, setPicked] = useState(() => new Set())
  const [open, setOpen] = useState(null)

  useEffect(() => {
    if (phase !== 'loading') return
    const t = setInterval(() => setStage((s) => s + 1), 650)
    const done = setTimeout(() => {
      const list = generateScenarios(prompt)
      setItems(list)
      setPicked(new Set(list.filter((g) => g.difficulty !== 'easy').map((g) => g.tempId)))
      setPhase('results')
    }, 650 * STAGES.length)
    return () => { clearInterval(t); clearTimeout(done) }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const generate = () => { setStage(0); setOpen(null); setPhase('loading') }
  const toggle = (id) => setPicked((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const add = () => { onAdd(items.filter((g) => picked.has(g.tempId))); onClose() }

  return (
    <Modal
      title="Generate scenarios from system prompt"
      width={760}
      onClose={onClose}
      footer={
        phase === 'results' ? (
          <>
            <Button variant="ghost" onClick={() => setPhase('prompt')}>Edit prompt</Button>
            <Button onClick={generate}><RefreshCw size={14} /> Regenerate</Button>
            <div className="spacer" />
            <Button variant="primary" disabled={picked.size === 0} onClick={add}>Add {plural(picked.size, 'scenario')}</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" disabled={!prompt.trim() || phase === 'loading'} onClick={generate}><Sparkles size={14} /> Generate scenarios</Button>
          </>
        )
      }
    >
      {phase === 'prompt' && (
        <>
          <p className="muted" style={{ marginTop: 0, fontSize: 13.5 }}>
            Paste the agent's system prompt. We'll read its rules and write difficult scenarios that test them, each with success and failure criteria. You choose which ones to keep.
          </p>
          <div className="field">
            <div className="row">
              <label htmlFor="gen-prompt">System prompt</label>
              <div className="spacer" />
              <button className="link" style={{ fontSize: 13 }} onClick={() => setPrompt(EXAMPLE_PROMPT)}>Use an example prompt</button>
            </div>
            <textarea id="gen-prompt" className="textarea mono" style={{ minHeight: 200, fontSize: 12.5 }} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="You are a voice assistant for…" autoFocus />
          </div>
        </>
      )}

      {phase === 'loading' && (
        <div style={{ padding: '40px 0 48px', textAlign: 'center' }}>
          <Loader2 size={26} className="spin" style={{ color: 'var(--accent)' }} />
          <div style={{ marginTop: 14, fontWeight: 500 }}>{STAGES[Math.min(stage, STAGES.length - 1)]}</div>
          <div className="faint" style={{ fontSize: 13, marginTop: 4 }}>This usually takes a few seconds.</div>
        </div>
      )}

      {phase === 'results' && (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <strong>{plural(items.length, 'scenario')} generated</strong>
            <span className="faint">·</span>
            <span className="muted">{picked.size} selected</span>
            <div className="spacer" />
            <button className="link" onClick={() => setPicked(new Set(items.map((g) => g.tempId)))}>Select all</button>
            <button className="link" onClick={() => setPicked(new Set())}>None</button>
          </div>
          <div className="gen-list">
            {items.map((g) => {
              const on = picked.has(g.tempId)
              const expanded = open === g.tempId
              return (
                <div key={g.tempId} className={`eval-pick ${on ? 'on' : ''}`} onClick={() => toggle(g.tempId)}>
                  <Checkbox checked={on} onChange={() => toggle(g.tempId)} label={g.name} />
                  <div style={{ flex: 1, marginTop: -2, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                      <strong>{g.name}</strong>
                      <DifficultyBadge level={g.difficulty} />
                      <span className="badge">{g.category}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>Caller wants to {g.goal}.</div>
                    {expanded && (
                      <div style={{ fontSize: 13, marginTop: 10, lineHeight: 1.55 }}>
                        <div className="faint">Caller opens with</div>
                        <div style={{ marginBottom: 8 }}>“{g.opening}”</div>
                        <div className="faint">Success</div>
                        <div style={{ marginBottom: 8 }}>{g.success}</div>
                        <div className="faint">Failure</div>
                        <div>{g.failure}</div>
                      </div>
                    )}
                  </div>
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setOpen(expanded ? null : g.tempId) }} aria-label={expanded ? 'Hide criteria' : 'Show criteria'}>
                    {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              )
            })}
          </div>
          <p className="faint" style={{ fontSize: 12.5, marginBottom: 8 }}>You can edit any scenario and its criteria after adding it.</p>
        </>
      )}
    </Modal>
  )
}
