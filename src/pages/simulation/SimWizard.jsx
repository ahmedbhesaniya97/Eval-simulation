import { useMemo, useState } from 'react'
import { ArrowRight, Check, Play, Plus, Sparkles, MessageSquareText, AudioLines, PhoneCall, Map as MapIcon, Info } from 'lucide-react'
import { useStore, navigate } from '../../store.jsx'
import { MODES, ENVIRONMENTS, ENV_BY_ID, PER_CHECK, PHONE_NUMBERS, isVoice, estimate } from '../../data/simulation.js'
import { AGENTS, AGENT_BY_ID } from '../../data/agents.js'
import AgentSelect from '../../components/AgentSelect.jsx'
import { Button, Checkbox, PageHeader, EmptyState } from '../../components/ui.jsx'
import { DifficultyBadge, SourceBadge, EnvIcon, ModeBadge } from '../../components/SimBits.jsx'
import ScenarioForm from './ScenarioForm.jsx'
import GenerateScenarios from './GenerateScenarios.jsx'
import PersonaForm from './PersonaForm.jsx'
import { money, n, plural } from '../../format.js'

const STEPS = ['Scenarios', 'Personas', 'Mode', 'Review']
const REPEATS = [1, 2, 3, 5]

const toggleIn = (setter) => (id) => setter((prev) => {
  const next = new Set(prev)
  next.has(id) ? next.delete(id) : next.add(id)
  return next
})

export default function SimWizard({ query }) {
  const { scenarios, personas, saveScenario, addScenarios, savePersona, startSimulation } = useStore()
  const [step, setStep] = useState(0)
  const [agentId, setAgentId] = useState(() => (AGENT_BY_ID[query.get('agent')] ? query.get('agent') : AGENTS[0].id))
  const [phoneNumber, setPhoneNumber] = useState(() => PHONE_NUMBERS[agentId][0])
  const [scenarioIds, setScenarioIds] = useState(() => new Set())
  const [personaIds, setPersonaIds] = useState(() => new Set(['per_calm']))
  const [mode, setMode] = useState('text')
  const [envIds, setEnvIds] = useState(() => new Set(['quiet']))
  const [repeats, setRepeats] = useState(1)
  const [name, setName] = useState('Pre-release check')
  const [modal, setModal] = useState(null) // 'scenario' | 'generate' | 'persona'

  const chosenScenarios = scenarios.filter((s) => scenarioIds.has(s.id))
  const chosenPersonas = personas.filter((p) => personaIds.has(p.id))
  const chosenEnvs = ENVIRONMENTS.filter((e) => envIds.has(e.id)).map((e) => e.id)

  const voice = isVoice(mode)
  const config = { agentId, mode, phoneNumber: mode === 'telephony' ? phoneNumber : undefined, scenarios: chosenScenarios, personas: chosenPersonas, environments: chosenEnvs, repeats }
  const est = useMemo(() => estimate(config), [JSON.stringify(config)]) // eslint-disable-line react-hooks/exhaustive-deps
  // Per-conversation price of each mode, for the mode cards.
  const perMode = useMemo(() => {
    const base = { ...config, scenarios: chosenScenarios.length ? chosenScenarios : scenarios.slice(0, 3), personas: chosenPersonas.length ? chosenPersonas : personas.slice(0, 1), repeats: 1 }
    const environments = chosenEnvs.length ? chosenEnvs : ['quiet']
    return Object.fromEntries(Object.keys(MODES).map((m) => [m, estimate({ ...base, mode: m, environments }).perConversation]))
  }, [JSON.stringify(config)]) // eslint-disable-line react-hooks/exhaustive-deps

  const canNext = [chosenScenarios.length > 0, chosenPersonas.length > 0, mode === 'text' || chosenEnvs.length > 0, name.trim() && est.conversations > 0][step]
  const hint = [
    'Select at least one scenario',
    'Select at least one persona',
    'Select at least one environment',
    'Give this simulation a name',
  ][step]

  const changeAgent = (id) => {
    setAgentId(id)
    setPhoneNumber(PHONE_NUMBERS[id][0])
  }
  const finish = () => {
    const id = startSimulation({ ...config, name: name.trim() })
    navigate(`#/simulation/runs/${id}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <PageHeader
        crumbs={[{ label: 'Home', href: '#/home' }, { label: 'Simulation', href: '#/simulation' }, { label: 'New simulation' }]}
        title="New simulation"
        back="#/simulation"
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
              </button>
            </span>
          ))}
        </div>

        <div className="wizard">
          <div>
            {step === 0 && (
              <ScenariosStep
                {...{ agentId, changeAgent, scenarios, scenarioIds, setScenarioIds }}
                onAdd={() => setModal('scenario')}
                onGenerate={() => setModal('generate')}
              />
            )}
            {step === 1 && <PersonasStep {...{ personas, personaIds, setPersonaIds }} onCreate={() => setModal('persona')} />}
            {step === 2 && <ModeStep {...{ agentId, mode, setMode, phoneNumber, setPhoneNumber, envIds, setEnvIds, repeats, setRepeats, perMode }} />}
            {step === 3 && <ReviewStep {...{ name, setName, est, mode, phoneNumber, chosenScenarios, chosenPersonas, chosenEnvs, repeats }} goTo={setStep} />}
          </div>

          <aside className="card impact">
            <div className="card-head"><h3 className="card-title">What will run</h3></div>
            <div className="card-body" style={{ paddingTop: 4, paddingBottom: 6 }}>
              <div className="impact-row" style={{ alignItems: 'center' }}>
                <span className="muted">Agent</span>
                <span style={{ textAlign: 'right', fontSize: 13 }}>{AGENT_BY_ID[agentId].name}<br /><span className="mono faint" style={{ fontSize: 11.5 }}>{agentId}</span></span>
              </div>
              <div className="impact-row"><span className="muted">Scenarios</span><span className="v">{chosenScenarios.length}</span></div>
              <div className="impact-row"><span className="muted">Personas</span><span className="v">× {chosenPersonas.length}</span></div>
              {voice && <div className="impact-row"><span className="muted">Environments</span><span className="v">× {chosenEnvs.length}</span></div>}
              {repeats > 1 && <div className="impact-row"><span className="muted">Repeats</span><span className="v">× {repeats}</span></div>}
              <div className="impact-row"><span>Conversations</span><span className="v">{n(est.conversations)}</span></div>
              <div className="impact-row" style={{ alignItems: 'center' }}><span className="muted">Mode</span><ModeBadge mode={mode} /></div>
              <div className="impact-row">
                <span>Estimated cost</span>
                <span className="v">≈ {money(est.cost)}</span>
              </div>
            </div>
            <div className="faint" style={{ padding: '0 18px 14px', fontSize: 12.5 }}>
              {est.conversations > 0 ? `About ${money(est.perConversation)} per conversation. You're only charged for what runs.` : 'Pick scenarios and personas to see the cost.'}
            </div>
          </aside>
        </div>
      </div>

      <div className="wizard-foot" style={{ position: 'sticky', bottom: 0 }}>
        <Button variant="ghost" onClick={() => (step === 0 ? navigate('#/simulation') : setStep(step - 1))}>{step === 0 ? 'Cancel' : 'Back'}</Button>
        <div className="spacer" />
        {!canNext && <span className="faint" style={{ fontSize: 13 }}>{hint}</span>}
        {step < 3 ? (
          <Button variant="primary" disabled={!canNext} onClick={() => setStep(step + 1)}>{step === 2 ? 'Review' : 'Continue'} <ArrowRight size={15} /></Button>
        ) : (
          <Button variant="primary" size="lg" disabled={!canNext} onClick={finish}>
            <Play size={14} fill="currentColor" /> Run simulation · ≈ {money(est.cost)}
          </Button>
        )}
      </div>

      {modal === 'scenario' && (
        <ScenarioForm onClose={() => setModal(null)} onSave={(sc) => { const id = saveScenario(sc); setScenarioIds((prev) => new Set([...prev, id])) }} />
      )}
      {modal === 'generate' && (
        <GenerateScenarios
          onClose={() => setModal(null)}
          onAdd={(items) => {
            const ids = addScenarios(items)
            setScenarioIds((prev) => new Set([...prev, ...ids]))
          }}
        />
      )}
      {modal === 'persona' && <PersonaForm onClose={() => setModal(null)} onSave={savePersona} />}
    </div>
  )
}

function ScenariosStep({ agentId, changeAgent, scenarios, scenarioIds, setScenarioIds, onAdd, onGenerate }) {
  const toggle = toggleIn(setScenarioIds)
  return (
    <>
      <div className="field" style={{ maxWidth: 440 }}>
        <label htmlFor="agent">Agent</label>
        <AgentSelect id="agent" value={agentId} onChange={changeAgent} />
        <span className="hint">Simulated callers talk to this agent's current version.</span>
      </div>
      <div className="section-head">
        <div>
          <h2 className="section-title">Which situations should we test?</h2>
          <div className="section-desc">Pick saved scenarios, write one, or generate difficult ones from your agent's system prompt. Each scenario carries its own success and failure criteria.</div>
        </div>
      </div>
      {scenarios.length === 0 ? (
        <EmptyState
          icon={MapIcon}
          title="No scenarios yet"
          action={
            <div className="row" style={{ justifyContent: 'center' }}>
              <Button variant="primary" onClick={onGenerate}><Sparkles size={14} /> Generate from system prompt</Button>
              <Button onClick={onAdd}><Plus size={15} /> Add manually</Button>
            </div>
          }
        >
          Don't want to write scenarios by hand? Paste the system prompt and we'll generate them.
        </EmptyState>
      ) : (
        <>
          <div className="row" style={{ marginBottom: 12 }}>
            <strong>{plural(scenarioIds.size, 'scenario')} selected</strong>
            <span className="faint">·</span>
            <button className="link" onClick={() => setScenarioIds(new Set(scenarios.map((s) => s.id)))}>Select all</button>
            <button className="link" onClick={() => setScenarioIds(new Set())}>None</button>
            <div className="spacer" />
            <Button size="sm" onClick={onGenerate}><Sparkles size={13} /> Generate from system prompt</Button>
            <Button size="sm" onClick={onAdd}><Plus size={14} /> Add scenario</Button>
          </div>
          <div className="grid" style={{ gap: 8 }}>
            {scenarios.map((s) => (
              <div key={s.id} className={`eval-pick ${scenarioIds.has(s.id) ? 'on' : ''}`} onClick={() => toggle(s.id)}>
                <Checkbox checked={scenarioIds.has(s.id)} onChange={() => toggle(s.id)} label={s.name} />
                <div style={{ flex: 1, marginTop: -2 }}>
                  <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <strong>{s.name}</strong>
                    <DifficultyBadge level={s.difficulty} />
                    <SourceBadge source={s.source} />
                  </div>
                  <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>Caller wants to {s.goal}.</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function PersonasStep({ personas, personaIds, setPersonaIds, onCreate }) {
  const toggle = toggleIn(setPersonaIds)
  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="section-title">Who is calling?</h2>
          <div className="section-desc">Every selected scenario runs once with each persona. Start with the defaults, or create your own.</div>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        <strong>{plural(personaIds.size, 'persona')} selected</strong>
        <span className="faint">·</span>
        <button className="link" onClick={() => setPersonaIds(new Set(personas.map((p) => p.id)))}>Select all</button>
        <button className="link" onClick={() => setPersonaIds(new Set())}>None</button>
      </div>
      <div className="pick-grid">
        {personas.map((p) => (
          <div key={p.id} className={`pick-card ${personaIds.has(p.id) ? 'on' : ''}`} onClick={() => toggle(p.id)}>
            <Checkbox checked={personaIds.has(p.id)} onChange={() => toggle(p.id)} label={p.name} />
            <div style={{ fontWeight: 600, paddingRight: 24 }}>{p.name}</div>
            {!p.builtIn && <div><span className="badge custom">Custom</span></div>}
            <div className="desc">{p.description}</div>
          </div>
        ))}
        <button className="pick-card" style={{ alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', minHeight: 140, color: 'var(--text-2)' }} onClick={onCreate}>
          <Plus size={18} />
          Create persona
        </button>
      </div>
    </>
  )
}

const MODE_CARDS = [
  { id: 'text', Icon: MessageSquareText, points: ['Tests decisions, policy and wording', 'Finishes in seconds'], unit: () => `${money(MODES.text.perTurn, 3)} per turn` },
  { id: 'audio', Icon: AudioLines, points: ['Adds speech recognition, voice and latency', 'Tests background noise and interruptions'], unit: () => `${money(MODES.audio.perMinute)} per minute of call` },
  { id: 'telephony', Icon: PhoneCall, points: ["Dials the agent's real phone number", 'Tests connect, line quality and transfers'], unit: () => `${money(MODES.telephony.perMinute)} per minute of call` },
]

function ModeStep({ agentId, mode, setMode, phoneNumber, setPhoneNumber, envIds, setEnvIds, repeats, setRepeats, perMode }) {
  const toggleEnv = toggleIn(setEnvIds)
  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="section-title">How should the conversations happen?</h2>
          <div className="section-desc">Start with Text only to check what the agent says. Use Audio to hear how it sounds, and Telephony to test the full phone call.</div>
        </div>
      </div>
      <div className="mode-cards">
        {MODE_CARDS.map(({ id, Icon, points, unit }) => {
          const ratio = id !== 'text' && perMode.text ? Math.round(perMode[id] / perMode.text) : 0
          return (
            <button key={id} type="button" className={`mode-card ${mode === id ? 'on' : ''}`} onClick={() => setMode(id)}>
              <strong className="row" style={{ gap: 8 }}>
                <Icon size={16} /> {MODES[id].label}
                {id === 'text' ? <span className="badge passed" style={{ marginLeft: 'auto' }}>Cheapest</span> : ratio > 1 && <span className="badge review" style={{ marginLeft: 'auto' }}>~{ratio}× the cost</span>}
              </strong>
              <div className="price">≈ {money(perMode[id])}<small>per conversation</small></div>
              <ul>
                {points.map((p) => <li key={p}>{p}</li>)}
                <li>{unit()}</li>
              </ul>
            </button>
          )
        })}
      </div>

      {mode === 'telephony' && (
        <div className="field" style={{ marginTop: 18, maxWidth: 440 }}>
          <label htmlFor="phone">Number to call</label>
          <select id="phone" className="select" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}>
            {PHONE_NUMBERS[agentId].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <span className="hint">Phone numbers connected to {AGENT_BY_ID[agentId].name} in Telephony.</span>
        </div>
      )}

      {isVoice(mode) && (
        <div className="section">
          <div className="section-head">
            <div>
              <h2 className="section-title">Environment</h2>
              <div className="section-desc">Where the caller is calling from. Each environment adds a full set of conversations.</div>
            </div>
          </div>
          <div className="pick-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {ENVIRONMENTS.map((e) => (
              <div key={e.id} className={`pick-card ${envIds.has(e.id) ? 'on' : ''}`} onClick={() => toggleEnv(e.id)}>
                <Checkbox checked={envIds.has(e.id)} onChange={() => toggleEnv(e.id)} label={e.label} />
                <div className="row" style={{ gap: 8, fontWeight: 600 }}><EnvIcon env={e.id} size={16} /> {e.label}</div>
                <div className="desc">{e.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="field">
          <label>Repeat each conversation</label>
          <div className="row">
            <div className="seg" role="group" aria-label="Repeats">
              {REPEATS.map((r) => (
                <button key={r} className={repeats === r ? 'active' : ''} onClick={() => setRepeats(r)}>{r === 1 ? 'Once' : `${r} times`}</button>
              ))}
            </div>
          </div>
          <span className="hint">Simulated callers say things a little differently each time. Repeating shows whether a pass is reliable or lucky.</span>
        </div>
      </div>
    </>
  )
}

function ReviewStep({ name, setName, est, mode, phoneNumber, chosenScenarios, chosenPersonas, chosenEnvs, repeats, goTo }) {
  const checks = est.conversations
  const convoCost = est.cost - checks * PER_CHECK
  const list = (items, step) => (
    <div className="card-body" style={{ padding: '6px 18px' }}>
      {items.map((label, i) => (
        <div key={i} className="row" style={{ padding: '8px 0', borderBottom: '1px dashed var(--border)', fontSize: 13.5 }}>{label}</div>
      ))}
      <div style={{ padding: '8px 0' }}><button className="link" style={{ fontSize: 13 }} onClick={() => goTo(step)}>Change</button></div>
    </div>
  )
  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="section-title">Simulation summary</h2>
          <div className="section-desc">Check what will run and what it will cost. Results appear as each conversation finishes.</div>
        </div>
      </div>
      <div className="field" style={{ maxWidth: 420 }}>
        <label htmlFor="sim-name">Simulation name</label>
        <input id="sim-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pre-release check" />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card card-body">
          <div className="eyebrow">Conversations</div>
          <div className="stat-value num">{n(est.conversations)}</div>
          <div className="stat-note">{chosenScenarios.length} × {chosenPersonas.length}{isVoice(mode) ? ` × ${chosenEnvs.length}` : ''}{repeats > 1 ? ` × ${repeats}` : ''}</div>
        </div>
        <div className="card card-body">
          <div className="eyebrow">Mode</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{MODES[mode].label}</div>
          <div className="stat-note">{mode === 'telephony' ? `Calls ${phoneNumber}` : isVoice(mode) ? `≈ ${Math.round(est.minutes)} min of calls` : `≈ ${n(est.turns)} turns`}</div>
        </div>
        <div className="card card-body" style={{ borderColor: 'var(--border-strong)' }}>
          <div className="eyebrow">Estimated cost</div>
          <div className="stat-value num">≈ {money(est.cost)}</div>
          <div className="stat-note">≈ {money(est.perConversation)} per conversation</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 14, alignItems: 'start' }}>
        <div className="card"><div className="card-head"><h3 className="card-title">Scenarios</h3></div>{list(chosenScenarios.map((s) => s.name), 0)}</div>
        <div className="card"><div className="card-head"><h3 className="card-title">Personas</h3></div>{list(chosenPersonas.map((p) => p.name), 1)}</div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-head"><h3 className="card-title">Cost breakdown</h3><span className="faint" style={{ fontSize: 12.5, marginLeft: 'auto' }}>Estimate</span></div>
        <div className="card-body" style={{ padding: '6px 18px' }}>
          <div className="impact-row">
            <span className="muted">{isVoice(mode) ? `Calls · ≈ ${Math.round(est.minutes)} min × ${money(MODES[mode].perMinute)}` : `Conversations · ≈ ${n(est.turns)} turns × ${money(MODES.text.perTurn, 3)}`}</span>
            <span className="num">{money(convoCost)}</span>
          </div>
          <div className="impact-row"><span className="muted">Judging against scenario criteria · {n(checks)} × {money(PER_CHECK, 3)}</span><span className="num">{money(checks * PER_CHECK)}</span></div>
          <div className="impact-row"><span style={{ fontWeight: 600 }}>Total</span><span className="v">≈ {money(est.cost)}</span></div>
        </div>
      </div>
      {isVoice(mode) && (
        <div className="notice" style={{ marginTop: 14 }}>
          <Info size={15} />
          Environments: {chosenEnvs.map((e) => ENV_BY_ID[e].label).join(', ')}. Want to check the logic first? A Text only run of the same set costs much less.
        </div>
      )}
    </>
  )
}
