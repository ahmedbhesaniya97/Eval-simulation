import { Play } from 'lucide-react'
import EvaluationsHome from './EvaluationsHome'
import SuiteDetail from './SuiteDetail'
import { SimulationsHome, NewSimulation, SimulationResults } from './Simulations'
import Scenarios from './Scenarios'
import Personas from './Personas'
import RunProgress from './RunProgress'
import RunResults from './RunResults'
import { requiredSuite } from './helpers'

// Test = Evaluations (is it ready?) + Simulations (what happens if…?), sharing
// one library of scenarios and customer behaviors.
export default function TestTab(props) {
  const { view, setView, scenarios, personas, runs, suites, simulations, runEvaluation } = props
  const [kind, id] = view.includes(':') ? view.split(/:(.*)/s) : [view, null]
  const section = { suite: 'evaluations', run: 'evaluations', sim: 'simulations' }[kind] || kind
  const flow = view === 'running' || view === 'sim:new'

  return (
    <div className="page">
      {!flow && (
        <>
          <div className="page-head">
            <div className="page-title">Test</div>
            {section === 'simulations' ? (
              <button className="btn primary" onClick={() => setView('sim:new')}><Play size={14} fill="currentColor" />New simulation</button>
            ) : (
              <button className="btn primary" onClick={() => runEvaluation(requiredSuite(suites).id)}><Play size={14} fill="currentColor" />Run evaluation</button>
            )}
          </div>
          <p className="page-sub">Check your agent with simulated customers before real customers call.</p>
          <div className="subnav">
            {[
              ['evaluations', 'Evaluations', runs.length],
              ['simulations', 'Simulations', simulations.length],
              ['scenarios', 'Scenarios', scenarios.length],
              ['personas', 'Customer behaviors', personas.length],
            ].map(([k, label, count]) => (
              <button key={k} className={section === k ? 'active' : ''} onClick={() => setView(k)}>
                {label}<span className="count">{count}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {view === 'evaluations' && <EvaluationsHome {...props} />}
      {kind === 'suite' && <SuiteDetail key={id} suiteId={id} {...props} />}
      {kind === 'run' && <RunResults key={id} runId={id} {...props} />}
      {view === 'simulations' && <SimulationsHome {...props} />}
      {view === 'sim:new' && <NewSimulation {...props} />}
      {kind === 'sim' && id !== 'new' && <SimulationResults key={id} simId={id} {...props} />}
      {view === 'scenarios' && <Scenarios {...props} />}
      {view === 'personas' && <Personas {...props} />}
      {view === 'running' && <RunProgress {...props} />}
    </div>
  )
}
