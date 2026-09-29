import { useCallback, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import TopBar from './components/TopBar'
import PreviewPanel from './components/PreviewPanel'
import AgentTab from './components/AgentTab'
import EvaluationDrawer from './components/EvaluationDrawer'
import DeployModal from './components/DeployModal'
import AddToSuiteModal from './components/AddToSuiteModal'
import TestTab from './test/TestTab'
import MonitorTab from './monitor/MonitorTab'
import EvaluateTab from './evaluate/EvaluateTab'
import { useEvaluateStore } from './evaluate/useEvaluateStore'
import { Toast } from './components/ui'
import { suiteRuns, requiredSuite } from './test/helpers'
import { AGENT, SCENARIOS, PERSONAS, SUITES, INITIAL_RUNS, INITIAL_SIMULATIONS, ISSUES, makeRun } from './data'

export default function App() {
  const [tab, setTab] = useState('evaluate')
  const evaluate = useEvaluateStore()
  const [fixOrigin, setFixOrigin] = useState('test') // where "run again" should go after a fix
  const [testView, setTestView] = useState('evaluations')
  const [monitorView, setMonitorView] = useState('evaluations')

  // Agent config
  const [prompt, setPrompt] = useState(AGENT.systemPrompt)
  const [fixingIssue, setFixingIssue] = useState(null) // issue key the user came to fix
  const [fixed, setFixed] = useState(() => new Set()) // issues addressed in the draft
  const [draftChanged, setDraftChanged] = useState(false)

  // Shared test library
  const [scenarios, setScenarios] = useState(() => SCENARIOS.filter((s) => ['s1', 's2', 's3', 's5', 's6', 's7', 's8'].includes(s.id)))
  const [personas, setPersonas] = useState(PERSONAS)

  // Evaluations (suites + their runs) and simulations
  const [suites, setSuites] = useState(SUITES)
  const [runs, setRuns] = useState(INITIAL_RUNS)
  const [simulations, setSimulations] = useState(INITIAL_SIMULATIONS)
  const [releaseSeq, setReleaseSeq] = useState(13)
  const [pendingRun, setPendingRun] = useState(null)

  // Overlays
  const [evaluation, setEvaluation] = useState(null)
  const [deployOpen, setDeployOpen] = useState(false)
  const [addDraft, setAddDraft] = useState(null) // { scenarioIds, personaIds } for "Add to evaluation suite"
  const [toast, setToast] = useState(null)

  const notify = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }, [])

  const gate = requiredSuite(suites)
  const gateRun = suiteRuns(runs, gate.id)[0]
  const testNeedsAttention = gateRun?.results.some((r) => r.status !== 'success')

  const goTest = (view) => { setTab('test'); setTestView(view) }
  const goMonitor = (view) => { setTab('monitor'); setMonitorView(view) }

  // ---- Feedback loop: issue → update agent → run evaluation again ----
  const startFix = (issueKey, origin = 'test') => {
    setEvaluation(null)
    setFixOrigin(origin)
    setFixingIssue(issueKey)
    setTab('agent')
  }
  const applySuggestion = (issueKey) => {
    const text = ISSUES[issueKey].suggestion.match(/“(.+)”/)?.[1]
    if (text) setPrompt((p) => `${p}\n\n${text}`)
    setFixed((f) => new Set([...f, issueKey]))
    setDraftChanged(true)
    notify('Instruction added to your draft')
  }
  const onPromptChange = (v) => {
    setPrompt(v)
    setDraftChanged(true)
    if (fixingIssue) setFixed((f) => new Set([...f, fixingIssue]))
  }

  // ---- Running things ----
  const runEvaluation = (suiteId, override) => {
    const suite = suites.find((s) => s.id === suiteId)
    const { scenarioIds, personaIds, envIds } = override || suite
    setEvaluation(null)
    setPendingRun({ kind: 'evaluation', suiteId, label: suite.name, scenarioIds, personaIds, envIds, fixed })
    goTest('running')
  }
  const startSimulation = ({ name, scenarioIds, personaIds, envIds }) => {
    setPendingRun({ kind: 'simulation', name, label: name, scenarioIds, personaIds, envIds, fixed })
    goTest('running')
  }
  const finishRun = () => {
    const { kind, suiteId, name, scenarioIds, personaIds, envIds } = pendingRun
    const combo = { scenarioIds, personaIds, envIds, fixed: pendingRun.fixed }
    if (kind === 'simulation') {
      const sim = makeRun({ id: `sim-${Date.now()}`, kind, name, when: 'Just now', version: `Draft v${releaseSeq - 1}`, ...combo })
      setSimulations((s) => [sim, ...s])
      setTestView(`sim:${sim.id}`)
    } else {
      const run = makeRun({ id: `run-${Date.now()}`, kind, suiteId, name: `Release ${releaseSeq}`, when: 'Just now', version: `Draft v${releaseSeq}`, ...combo })
      setRuns((r) => [run, ...r])
      setReleaseSeq((n) => n + 1)
      setTestView(`run:${run.id}`)
      setDraftChanged(false)
    }
    setPendingRun(null)
  }

  // ---- Suites ----
  const updateSuite = (id, patch) => setSuites((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const createSuite = () => {
    const suite = {
      id: `suite-${Date.now()}`, name: 'New test suite', desc: '', requiredForDeploy: false,
      scenarioIds: scenarios.slice(0, 3).map((s) => s.id), personaIds: ['calm', 'impatient'], envIds: ['quiet'],
    }
    setSuites((l) => [...l, suite])
    goTest(`suite:${suite.id}`)
  }
  const addToSuite = (suiteId, { scenarioIds, personaIds }) => {
    const suite = suites.find((s) => s.id === suiteId)
    updateSuite(suiteId, {
      scenarioIds: [...new Set([...suite.scenarioIds, ...scenarioIds])],
      personaIds: [...new Set([...suite.personaIds, ...personaIds])],
    })
    setAddDraft(null)
    notify(`Added to ${suite.name} — it runs with the next evaluation`)
  }
  // From a production issue: make sure the scenario exists, then offer to add it to a suite.
  const addScenarioFromIssue = (issueKey) => {
    const map = { verification_skipped: 's2', interruption: 's3', repeated_question: 's5', transfer_failed: 's8', incorrect_info: 's4', off_topic: 's7', speech: 's3' }
    const s = SCENARIOS.find((x) => x.id === map[issueKey])
    setScenarios((list) => (list.some((x) => x.id === s.id) ? list : [...list, s]))
    setEvaluation(null)
    setAddDraft({ scenarioIds: [s.id], personaIds: [] })
  }

  const shared = { setEvaluation, notify, goTest, goMonitor, startFix }

  return (
    <div className="app">
      <TopBar onDeploy={() => setDeployOpen(true)} />
      <div className="body">
        <div className="main">
          <div className="tabs-row">
            <div className="tabs-inner">
              {[
                ['agent', 'Agent'],
                ['pipeline', 'Pipeline'],
                ['branches', 'Branches'],
                ['test', 'Test'],
                ['monitor', 'Monitor'],
                ['evaluate', 'Test & Evaluate'],
              ].map(([k, label]) => (
                <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
                  {label}
                  {k === 'test' && testNeedsAttention && <span className="dot" title="Required evaluation needs attention" />}
                  {k === 'monitor' && <span className="dot" style={{ background: 'var(--failed)' }} title="New issue in production" />}
                </button>
              ))}
            </div>
          </div>
          <div className="content">
            {tab === 'agent' && (
              <AgentTab
                prompt={prompt}
                onPromptChange={onPromptChange}
                fixingIssue={fixingIssue}
                fixed={fixed}
                onApplySuggestion={applySuggestion}
                onDismissFix={() => setFixingIssue(null)}
                onRunTests={() => {
                  setFixingIssue(null)
                  if (fixOrigin === 'evaluate') { setTab('evaluate'); evaluate.setView('run') } else runEvaluation(gate.id)
                }}
                suiteName={fixOrigin === 'evaluate' ? 'your evals' : `“${gate.name}”`}
                draftChanged={draftChanged}
              />
            )}
            {(tab === 'pipeline' || tab === 'branches') && (
              <div className="page"><p className="muted">This section is unchanged — it’s out of scope for the evaluation & simulation prototype.</p></div>
            )}
            {tab === 'test' && (
              <TestTab
                view={testView}
                setView={setTestView}
                scenarios={scenarios}
                setScenarios={setScenarios}
                personas={personas}
                setPersonas={setPersonas}
                suites={suites}
                updateSuite={updateSuite}
                createSuite={createSuite}
                runs={runs}
                simulations={simulations}
                pendingRun={pendingRun}
                runEvaluation={runEvaluation}
                startSimulation={startSimulation}
                finishRun={finishRun}
                openAddToSuite={setAddDraft}
                draftChanged={draftChanged}
                onDeploy={() => setDeployOpen(true)}
                {...shared}
              />
            )}
            {tab === 'evaluate' && (
              <EvaluateTab store={evaluate} scenarios={scenarios} personas={personas} fixed={fixed} notify={notify} startFix={startFix} />
            )}
            {tab === 'monitor' && (
              <MonitorTab view={monitorView} setView={setMonitorView} addScenarioFromIssue={addScenarioFromIssue} {...shared} />
            )}
          </div>
        </div>
        {tab === 'agent' && <PreviewPanel />}
      </div>

      {evaluation && (
        <EvaluationDrawer
          evaluation={evaluation}
          onClose={() => setEvaluation(null)}
          onUpdateAgent={startFix}
          onAddScenario={addScenarioFromIssue}
          onAddToSuite={(draft) => { setEvaluation(null); setAddDraft(draft) }}
        />
      )}
      {addDraft && <AddToSuiteModal draft={addDraft} suites={suites} onClose={() => setAddDraft(null)} onAdd={addToSuite} />}
      {deployOpen && (
        <DeployModal
          suite={gate}
          run={gateRun}
          draftChanged={draftChanged}
          onClose={() => setDeployOpen(false)}
          onReview={() => { setDeployOpen(false); goTest(`run:${gateRun.id}`) }}
          onRunTests={() => { setDeployOpen(false); runEvaluation(gate.id) }}
          onDeploy={() => { setDeployOpen(false); notify('Deployed. Real conversations will be evaluated in Monitor.') }}
        />
      )}
      {toast && <Toast><CheckCircle2 size={16} className="s-success" />{toast}</Toast>}
    </div>
  )
}
