import { useState } from 'react'
import { ArrowLeft, Play, ShieldCheck } from 'lucide-react'
import { Toggle } from '../components/ui'
import { ComboPicker, ComboSummary, comboTotal, comboToConfig, configToCombo } from './ComboPicker'
import { suiteRuns } from './helpers'
import RunsList from './RunsList'

export default function SuiteDetail({ suiteId, suites, updateSuite, runs, scenarios, personas, runEvaluation, setView, notify }) {
  const suite = suites.find((s) => s.id === suiteId)
  const [combo, setCombo] = useState(() => configToCombo(suite))
  if (!suite) return null

  const config = comboToConfig(combo, scenarios, personas)
  const dirty = JSON.stringify(config) !== JSON.stringify({ scenarioIds: suite.scenarioIds, personaIds: suite.personaIds, envIds: suite.envIds })
  const history = suiteRuns(runs, suite.id)
  const total = comboTotal(combo)

  const save = () => { updateSuite(suite.id, config); notify('Test suite saved') }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <button className="btn ghost" style={{ paddingLeft: 0, alignSelf: 'flex-start', marginBottom: -12 }} onClick={() => setView('evaluations')}><ArrowLeft size={15} />Evaluations</button>

      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="muted small" style={{ marginBottom: 4 }}>Test suite</div>
          <input className="input" value={suite.name} onChange={(e) => updateSuite(suite.id, { name: e.target.value })}
            style={{ fontSize: 20, fontWeight: 500, background: 'none', border: '1px solid transparent', padding: '0 6px', marginLeft: -7, height: 36, maxWidth: 520 }} />
          <input className="input" value={suite.desc} placeholder="What is this suite for?" onChange={(e) => updateSuite(suite.id, { desc: e.target.value })}
            style={{ background: 'none', border: '1px solid transparent', padding: '0 6px', marginLeft: -7, color: 'var(--text-2)', maxWidth: 620 }} />
        </div>
      </div>

      <div className="card row" style={{ padding: '14px 18px', gap: 14 }}>
        <ShieldCheck size={18} style={{ color: suite.requiredForDeploy ? 'var(--accent)' : 'var(--muted)' }} />
        <div style={{ flex: 1 }}>
          <div className="title" style={{ fontWeight: 500 }}>Required before deploy</div>
          <div className="muted small">When on, the Deploy button checks this suite’s latest result first.</div>
        </div>
        <Toggle on={suite.requiredForDeploy} onChange={(v) => updateSuite(suite.id, { requiredForDeploy: v })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <ComboPicker scenarios={scenarios} personas={personas} value={combo} onChange={setCombo} />
        <ComboSummary value={combo}>
          <button className="btn primary mt-16" style={{ width: '100%', justifyContent: 'center', height: 38 }} disabled={!total}
            onClick={() => { if (dirty) updateSuite(suite.id, config); runEvaluation(suite.id, config) }}>
            <Play size={14} fill="currentColor" />Run evaluation
          </button>
          {dirty && <button className="btn mt-8" style={{ width: '100%', justifyContent: 'center' }} onClick={save}>Save changes</button>}
        </ComboSummary>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 10 }}>Past evaluations of this suite</div>
        {history.length ? (
          <RunsList runs={history} suites={suites} setView={setView} showSuite={false} />
        ) : (
          <div className="card card-pad muted">This suite hasn’t been run yet.</div>
        )}
      </div>
    </div>
  )
}
