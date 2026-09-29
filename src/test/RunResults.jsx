import { useRef, useState } from 'react'
import { ArrowLeft, RotateCw, Rocket, ShieldCheck } from 'lucide-react'
import { Ring, SplitBar, tally } from '../components/ui'
import { becauseSentence, passed, suiteRuns, evalFromResult } from './helpers'
import { CommonIssues, BehaviorPerformance, ResultsMatrix, compareRuns } from './ResultParts'

// "Evaluation complete — 18 / 20 scenarios passed" (UX §8)
export default function RunResults({ runId, runs, suites, setView, setEvaluation, onDeploy, runEvaluation }) {
  const run = runs.find((r) => r.id === runId)
  const [filter, setFilter] = useState(null)
  const matrixRef = useRef(null)
  if (!run) return null

  const suite = suites.find((s) => s.id === run.suiteId)
  const history = suiteRuns(runs, run.suiteId)
  const prev = history[history.indexOf(run) + 1]
  const t = tally(run.results)
  const total = run.results.length
  const allGood = t.success === total
  const delta = prev ? passed(run) - passed(prev) : 0
  const changes = compareRuns(run, prev)

  const reviewIssues = () => {
    const first = run.results.find((r) => r.status !== 'success')
    if (first) setEvaluation(evalFromResult(first))
  }
  const pickIssue = (k) => {
    setFilter(filter === k ? null : k)
    matrixRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      <button className="btn ghost" style={{ paddingLeft: 0, alignSelf: 'flex-start', marginBottom: -8 }} onClick={() => setView(`suite:${suite.id}`)}>
        <ArrowLeft size={15} />{suite.name}
      </button>

      <div className="card verdict">
        <div className="verdict-main">
          <div className="verdict-eyebrow">
            Evaluation complete · {run.name} · {run.when} · <span className="tag">{run.version}</span>
            {suite.requiredForDeploy && <span className="tag accent row" style={{ gap: 4 }}><ShieldCheck size={11} />Required before deploy</span>}
          </div>
          <h1 className="verdict-title">
            {allGood ? `All ${total} scenarios passed` : `${t.success} / ${total} scenarios passed`}
          </h1>
          <p className="verdict-desc">
            {allGood
              ? suite.requiredForDeploy ? 'Your agent handled every simulated customer. It’s ready to deploy.' : 'Your agent handled every simulated customer in this suite.'
              : `${total - t.success} ${total - t.success === 1 ? 'scenario needs' : 'scenarios need'} attention ${becauseSentence(run.results)}.`}
          </p>
          <SplitBar {...t} />
          <div className="verdict-actions">
            {allGood && suite.requiredForDeploy ? (
              <button className="btn primary" onClick={onDeploy}><Rocket size={15} />Deploy</button>
            ) : !allGood ? (
              <button className="btn primary" onClick={reviewIssues}>Review issues</button>
            ) : null}
            <button className="btn" onClick={() => runEvaluation(suite.id)}><RotateCw size={14} />Run evaluation again</button>
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 170 }}>
          <Ring value={t.success} total={total} label="passed" />
          {prev && (
            <div className="small mt-8 stack" style={{ gap: 2 }}>
              <span className="muted">vs {prev.name}</span>
              {delta !== 0 && <span className={delta > 0 ? 's-success' : 's-failed'}>{delta > 0 ? '↑' : '↓'} {Math.abs(delta)} {delta > 0 ? 'more' : 'fewer'} passed</span>}
              {changes.fixed > 0 && <span className="s-success">{changes.fixed} fixed</span>}
              {changes.new > 0 ? <span className="s-failed">{changes.new} new {changes.new === 1 ? 'issue' : 'issues'}</span> : <span className="muted">No new issues</span>}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <CommonIssues results={run.results} filter={filter} onPick={pickIssue} onClear={() => setFilter(null)} />
        <BehaviorPerformance run={run} />
      </div>

      <ResultsMatrix ref={matrixRef} run={run} prev={prev} filter={filter} onClearFilter={() => setFilter(null)} onOpen={setEvaluation} />
    </div>
  )
}
