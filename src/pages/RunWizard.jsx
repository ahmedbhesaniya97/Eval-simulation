import { useMemo, useState } from 'react'
import { Search, Eye, ArrowRight, Play, Check, Inbox, FilterX, Plus, ListChecks } from 'lucide-react'
import { useStore, navigate } from '../store.jsx'
import { SESSIONS, SESSION_BY_ID, NOW } from '../data/sessions.js'
import { DEFAULT_SKIP_RULES, skipReason } from '../data/engine.js'
import { Button, Checkbox, PageHeader, TypeBadge, RequiredBadge, EmptyState } from '../components/ui.jsx'
import { SessionPreviewDrawer } from '../components/SessionBits.jsx'
import EvaluationForm from './EvaluationForm.jsx'
import { dateTime, duration, n, plural } from '../format.js'

const STEPS = ['Select sessions', 'Select evaluations', 'Skip rules', 'Review']
const RANGES = [
  { id: '1', label: 'Today' },
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
]
const PAGE = 40

export default function RunWizard() {
  const { evaluations, startRun, saveEvaluation } = useStore()
  const [step, setStep] = useState(0)

  // Step 1 — sessions
  const [selected, setSelected] = useState(() => new Set())
  const [range, setRange] = useState('7')
  const [search, setSearch] = useState('')
  const [shown, setShown] = useState(PAGE)
  const [preview, setPreview] = useState(null)

  // Step 2 — evaluations
  const [evalIds, setEvalIds] = useState(() => new Set(evaluations.filter((e) => e.enabled).map((e) => e.id)))
  const [creating, setCreating] = useState(false)

  // Step 3 — skip rules
  const [rules, setRules] = useState(() => structuredClone(DEFAULT_SKIP_RULES))

  // Step 4 — review
  const [name, setName] = useState('Weekly QA')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const cutoff = range === 'all' ? 0 : NOW.getTime() - Number(range) * 86400000
    return SESSIONS.filter((s) => {
      if (new Date(s.startedAt).getTime() < cutoff) return false
      if (q && !s.id.includes(q) && !s.topic.toLowerCase().includes(q) && !s.turns.some((t) => t.text.toLowerCase().includes(q))) return false
      return true
    })
  }, [range, search])

  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id))
  const someFilteredSelected = filtered.some((s) => selected.has(s.id))
  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const selectFiltered = (on) => setSelected((prev) => {
    const next = new Set(prev)
    filtered.forEach((s) => (on ? next.add(s.id) : next.delete(s.id)))
    return next
  })

  const chosenEvals = evaluations.filter((e) => evalIds.has(e.id) && e.enabled)
  const selectedSessions = useMemo(() => [...selected].map((id) => SESSION_BY_ID[id]), [selected])
  const skipped = useMemo(() => {
    const out = {}
    for (const s of selectedSessions) {
      const why = skipReason(s, rules)
      if (why) out[s.id] = why
    }
    return out
  }, [selectedSessions, rules])
  const skippedCount = Object.keys(skipped).length
  const evaluatedCount = selected.size - skippedCount
  const checks = evaluatedCount * chosenEvals.length
  const rulesOn = Object.values(rules).filter((r) => r.on).length

  const canNext = [selected.size > 0, chosenEvals.length > 0, true, evaluatedCount > 0 && name.trim()][step]

  const run = () => {
    const id = startRun({ name: name.trim(), sessionIds: [...selected], evaluations: chosenEvals, skipRules: rules })
    navigate(`#/runs/${id}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <PageHeader
        crumbs={[{ label: 'Home', href: '#/home' }, { label: 'Evaluation', href: '#/evaluations' }, { label: 'Runs', href: '#/runs' }, { label: 'New run' }]}
        title="Run Evaluation"
        back="#/runs"
      />
      <div className="page-inner" style={{ flex: 1, width: '100%' }}>
        <div className="stepper" style={{ paddingTop: 20 }}>
          {STEPS.map((label, i) => (
            <span key={label} className="row" style={{ gap: 0 }}>
              {i > 0 && <span className="step-line" />}
              <button
                className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                style={{ cursor: i < step ? 'pointer' : 'default' }}
              >
                <span className="n">{i < step ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
                {label}
                {i === 2 && <span className="faint" style={{ fontSize: 12 }}>(optional)</span>}
              </button>
            </span>
          ))}
        </div>

        <div className="wizard">
          <div>
            {step === 0 && (
              <SessionsStep
                {...{ filtered, selected, toggle, selectFiltered, allFilteredSelected, someFilteredSelected, range, setRange, search, setSearch, shown, setShown, setPreview }}
                clear={() => setSelected(new Set())}
              />
            )}
            {step === 1 && (
              <EvaluationsStep evaluations={evaluations} evalIds={evalIds} setEvalIds={setEvalIds} chosen={chosenEvals} onCreate={() => setCreating(true)} />
            )}
            {step === 2 && (
              <SkipRulesStep rules={rules} setRules={setRules} sessions={selectedSessions} selected={selected.size} skipped={skippedCount} evaluated={evaluatedCount} />
            )}
            {step === 3 && (
              <ReviewStep
                {...{ name, setName, evaluatedCount, skippedCount, checks, rulesOn, skipped }}
                selected={selected.size}
                evals={chosenEvals}
                goToRules={() => setStep(2)}
              />
            )}
          </div>

          <aside className="card impact">
            <div className="card-head"><h3 className="card-title">What will run</h3></div>
            <div className="card-body" style={{ paddingTop: 4, paddingBottom: 6 }}>
              <div className="impact-row"><span className="muted">Sessions selected</span><span className="v">{n(selected.size)}</span></div>
              <div className="impact-row">
                <span className="muted">Skipped by rules</span>
                <span className="v" style={{ color: skippedCount ? 'var(--warn)' : undefined }}>{skippedCount ? `−${n(skippedCount)}` : 0}</span>
              </div>
              <div className="impact-row"><span>Sessions evaluated</span><span className="v">{n(evaluatedCount)}</span></div>
              <div className="impact-row"><span className="muted">Evaluations</span><span className="v">× {chosenEvals.length}</span></div>
              <div className="impact-row"><span>Total checks</span><span className="v">{n(checks)}</span></div>
            </div>
            {step < 2 && selected.size > 0 && (
              <div className="faint" style={{ padding: '0 18px 14px', fontSize: 12.5 }}>
                {rulesOn} skip {rulesOn === 1 ? 'rule is' : 'rules are'} on by default. You can change them in step 3.
              </div>
            )}
          </aside>
        </div>
      </div>

      <div className="wizard-foot" style={{ position: 'sticky', bottom: 0 }}>
        <Button variant="ghost" onClick={() => (step === 0 ? navigate('#/runs') : setStep(step - 1))}>
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        <div className="spacer" />
        {step === 0 && selected.size === 0 && <span className="faint" style={{ fontSize: 13 }}>Select at least one session to continue</span>}
        {step === 1 && chosenEvals.length === 0 && <span className="faint" style={{ fontSize: 13 }}>Select at least one evaluation</span>}
        {step < 3 ? (
          <Button variant="primary" disabled={!canNext} onClick={() => setStep(step + 1)}>
            {step === 2 ? 'Review' : 'Continue'} <ArrowRight size={15} />
          </Button>
        ) : (
          <Button variant="primary" size="lg" disabled={!canNext} onClick={run}>
            <Play size={14} fill="currentColor" /> Run Evaluation
          </Button>
        )}
      </div>

      {preview && (
        <SessionPreviewDrawer
          session={preview}
          onClose={() => setPreview(null)}
          action={
            <Button size="sm" variant={selected.has(preview.id) ? 'secondary' : 'primary'} onClick={() => toggle(preview.id)}>
              {selected.has(preview.id) ? <><Check size={13} /> Selected</> : <><Plus size={13} /> Select session</>}
            </Button>
          }
        />
      )}
      {creating && (
        <EvaluationForm onSave={saveEvaluation} onClose={() => setCreating(false)} />
      )}
    </div>
  )
}

function SessionsStep({ filtered, selected, toggle, selectFiltered, allFilteredSelected, someFilteredSelected, range, setRange, search, setSearch, shown, setShown, setPreview, clear }) {
  if (SESSIONS.length === 0) {
    return <EmptyState icon={Inbox} title="No sessions yet">No sessions are available for evaluation yet.</EmptyState>
  }
  return (
    <>
      <div className="section-head" style={{ marginBottom: 14 }}>
        <div>
          <h2 className="section-title">Which conversations should we check?</h2>
          <div className="section-desc">Pick past production sessions. Open any session to read the conversation first.</div>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <label className="search">
          <Search size={15} />
          <input className="input" placeholder="Search by ID or what was said" value={search} onChange={(e) => { setSearch(e.target.value); setShown(PAGE) }} />
        </label>
        <div className="seg" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button key={r.id} className={range === r.id ? 'active' : ''} onClick={() => { setRange(r.id); setShown(PAGE) }}>{r.label}</button>
          ))}
        </div>
      </div>

      <div className="row" style={{ padding: '10px 14px', border: '1px solid var(--border)', borderBottom: 0, borderRadius: '6px 6px 0 0', background: selected.size ? 'rgba(108,180,240,.06)' : 'var(--bg-panel)' }}>
        <strong className="num">{plural(selected.size, 'session')} selected</strong>
        {selected.size > 0 && <button className="link" onClick={clear}>Clear</button>}
        <div className="spacer" />
        {filtered.length > 0 && !allFilteredSelected && (
          <button className="link" onClick={() => selectFiltered(true)}>Select all {n(filtered.length)} matching</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ border: '1px solid var(--border)', borderRadius: '0 0 6px 6px' }}>
          <div style={{ padding: 20 }}>
            <EmptyState icon={FilterX} title="No sessions match" action={<Button onClick={() => { setSearch(''); setRange('all') }}>Clear filters</Button>}>
              Try a wider date range or a different search.
            </EmptyState>
          </div>
        </div>
      ) : (
        <div className="table-wrap" style={{ borderRadius: '0 0 6px 6px' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <Checkbox checked={allFilteredSelected} partial={someFilteredSelected} onChange={(on) => selectFiltered(on)} label="Select all matching sessions" />
                </th>
                <th>Session</th>
                <th>Topic</th>
                <th className="right">Duration</th>
                <th className="right">Turns</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, shown).map((s) => (
                <tr key={s.id} className={`clickable ${selected.has(s.id) ? 'selected' : ''}`} onClick={() => toggle(s.id)}>
                  <td><Checkbox checked={selected.has(s.id)} onChange={() => toggle(s.id)} label={`Select ${s.id}`} /></td>
                  <td>
                    <div className="mono" style={{ fontSize: 13 }}>{s.id}</div>
                    <div className="faint" style={{ fontSize: 12.5 }}>{dateTime(s.startedAt)}</div>
                  </td>
                  <td className="muted">{s.topic}</td>
                  <td className="right num">{duration(s.duration)}</td>
                  <td className="right num">{s.turnCount}</td>
                  <td className="right">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setPreview(s) }}>
                      <Eye size={14} /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > shown && (
            <div style={{ padding: 12, textAlign: 'center', borderTop: '1px solid var(--border)' }}>
              <Button size="sm" onClick={() => setShown(shown + PAGE * 2)}>
                Show more <span className="faint">· {n(filtered.length - shown)} remaining</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function EvaluationsStep({ evaluations, evalIds, setEvalIds, chosen, onCreate }) {
  const enabled = evaluations.filter((e) => e.enabled)
  const disabled = evaluations.filter((e) => !e.enabled)
  const toggle = (id) => setEvalIds((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  if (enabled.length === 0) {
    return (
      <EmptyState icon={ListChecks} title="No active evaluations" action={<Button variant="primary" onClick={onCreate}><Plus size={15} /> Create Evaluation</Button>}>
        Create your first evaluation to start measuring your agent.
      </EmptyState>
    )
  }
  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="section-title">What should we check?</h2>
          <div className="section-desc">Each evaluation already has its success and failure criteria. Just pick which ones to run.</div>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        <strong>{plural(chosen.length, 'evaluation')} selected</strong>
        <span className="faint">·</span>
        <button className="link" onClick={() => setEvalIds(new Set(enabled.map((e) => e.id)))}>Select all</button>
        <button className="link" onClick={() => setEvalIds(new Set())}>None</button>
        <div className="spacer" />
        <Button size="sm" onClick={onCreate}><Plus size={14} /> New evaluation</Button>
      </div>
      <div className="grid">
        {enabled.map((e) => (
          <div key={e.id} className={`eval-pick ${evalIds.has(e.id) ? 'on' : ''}`} onClick={() => toggle(e.id)}>
            <Checkbox checked={evalIds.has(e.id)} onChange={() => toggle(e.id)} label={e.name} />
            <div style={{ flex: 1, marginTop: -2 }}>
              <div className="row" style={{ gap: 8 }}>
                <strong>{e.name}</strong>
                <TypeBadge type={e.type} />
                <RequiredBadge required={e.required} />
              </div>
              <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>{e.description}</div>
            </div>
          </div>
        ))}
        {disabled.map((e) => (
          <div key={e.id} className="eval-pick disabled" style={{ cursor: 'default' }}>
            <Checkbox checked={false} onChange={() => {}} label={e.name} />
            <div style={{ flex: 1, marginTop: -2 }}>
              <div className="row" style={{ gap: 8 }}>
                <strong>{e.name}</strong>
                <span className="badge">Disabled</span>
              </div>
              <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>
                Enable it on the <a className="link" href="#/evaluations">Evaluations</a> page to use it in runs.
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Funnel({ selected, skipped, evaluated }) {
  return (
    <div className="funnel">
      <div className="cell"><div className="eyebrow">Selected</div><div className="stat-value num">{n(selected)}</div></div>
      <ArrowRight className="arrow" size={18} />
      <div className="cell"><div className="eyebrow">Will be skipped</div><div className="stat-value num" style={{ color: skipped ? 'var(--warn)' : undefined }}>{n(skipped)}</div></div>
      <ArrowRight className="arrow" size={18} />
      <div className="cell" style={{ borderColor: 'var(--border-strong)' }}><div className="eyebrow">Will be evaluated</div><div className="stat-value num">{n(evaluated)}</div></div>
    </div>
  )
}

function SkipRulesStep({ rules, setRules, sessions, selected, skipped, evaluated }) {
  const set = (k, patch) => setRules((r) => ({ ...r, [k]: { ...r[k], ...patch } }))
  const only = (k) => {
    const solo = Object.fromEntries(Object.keys(rules).map((key) => [key, { ...rules[key], on: key === k }]))
    return sessions.filter((s) => skipReason(s, solo)).length
  }
  const num = (k, max = 999, min = 1) => (
    <input
      className="input input-num num"
      type="number"
      min={min}
      max={max}
      value={rules[k].value}
      disabled={!rules[k].on}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => set(k, { value: e.target.value === '' ? '' : Math.max(min, Math.min(max, Number(e.target.value))) })}
      onBlur={() => rules[k].value === '' && set(k, { value: min })}
    />
  )
  const ROWS = [
    { k: 'short', group: 'Call duration', body: <>Skip calls shorter than {num('short')} seconds</> },
    { k: 'long', group: 'Call duration', body: <>Skip calls longer than {num('long', 120)} minutes</> },
    { k: 'fewTurns', group: 'Conversation length', body: <>Skip calls with fewer than {num('fewTurns', 50)} turns</> },
    { k: 'silent', group: 'Agent participation', body: <>Skip calls where the agent never spoke</> },
    { k: 'voicemail', group: 'Voicemail', body: <>Skip voicemail sessions</> },
  ]
  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="section-title">Skip Rules <span className="faint" style={{ fontWeight: 400, fontSize: 14 }}>· optional</span></h2>
          <div className="section-desc">Exclude sessions that aren't useful for this evaluation.</div>
        </div>
      </div>
      <Funnel selected={selected} skipped={skipped} evaluated={evaluated} />
      <div className="card" style={{ marginTop: 16 }}>
        {ROWS.map(({ k, group, body }) => {
          const hits = only(k)
          return (
            <div key={k} className={`rule ${rules[k].on ? '' : 'off'}`}>
              <Checkbox checked={rules[k].on} onChange={(on) => set(k, { on })} label={group} />
              <div style={{ flex: 1 }}>
                <div className="faint" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{group}</div>
                <div className="rule-text">{body}</div>
              </div>
              <div className="affects num">
                {rules[k].on ? (hits ? <span style={{ color: 'var(--warn)' }}>Excludes {n(hits)}</span> : 'Excludes none') : <span className="faint">Would exclude {n(hits)}</span>}
              </div>
            </div>
          )
        })}
      </div>
      {selected > 0 && evaluated === 0 && (
        <div className="empty" style={{ marginTop: 16, padding: 24 }}>
          <h3>All selected sessions were excluded by your skip rules.</h3>
          <p style={{ marginBottom: 0 }}>Turn off a rule or loosen its limit to evaluate at least one session.</p>
        </div>
      )}
    </>
  )
}

function ReviewStep({ name, setName, selected, evaluatedCount, skippedCount, checks, rulesOn, skipped, evals, goToRules }) {
  if (evaluatedCount === 0) {
    return (
      <EmptyState icon={FilterX} title="Nothing left to evaluate" action={<Button variant="primary" onClick={goToRules}>Review Skip Rules</Button>}>
        All selected sessions were excluded by your skip rules.
      </EmptyState>
    )
  }
  const reasons = Object.values(skipped).reduce((acc, r) => ({ ...acc, [r]: (acc[r] || 0) + 1 }), {})
  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="section-title">Evaluation summary</h2>
          <div className="section-desc">Check what will run. Results appear as soon as the run finishes.</div>
        </div>
      </div>
      <div className="field" style={{ maxWidth: 420 }}>
        <label htmlFor="run-name">Run name</label>
        <input id="run-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekly QA" />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="card card-body"><div className="eyebrow">Sessions</div><div className="stat-value num">{n(evaluatedCount)}</div><div className="stat-note">of {n(selected)} selected</div></div>
        <div className="card card-body"><div className="eyebrow">Evaluations</div><div className="stat-value num">{evals.length}</div><div className="stat-note">{evals.filter((e) => e.required).length} required</div></div>
        <div className="card card-body"><div className="eyebrow">Total checks</div><div className="stat-value num">{n(checks)}</div><div className="stat-note">{plural(evals.length, 'check')} per session</div></div>
        <div className="card card-body">
          <div className="eyebrow">Skip rules</div>
          <div className="stat-value num">{rulesOn} <small>enabled</small></div>
          <div className="stat-note">{plural(skippedCount, 'session')} excluded · <button className="link" onClick={goToRules}>Edit</button></div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 14 }}>
        <div className="card">
          <div className="card-head"><h3 className="card-title">Evaluations</h3></div>
          <div className="card-body" style={{ padding: '6px 18px' }}>
            {evals.map((e) => (
              <div key={e.id} className="row" style={{ padding: '9px 0', borderBottom: '1px dashed var(--border)' }}>
                <span style={{ flex: 1 }}>{e.name}</span>
                <RequiredBadge required={e.required} />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3 className="card-title">Excluded sessions</h3></div>
          <div className="card-body" style={{ padding: '6px 18px' }}>
            {Object.keys(reasons).length === 0 ? (
              <div className="muted" style={{ padding: '9px 0' }}>No sessions excluded.</div>
            ) : (
              Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([r, c]) => (
                <div key={r} className="row" style={{ padding: '9px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ flex: 1 }} className="muted">{r}</span>
                  <span className="num">{c}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
