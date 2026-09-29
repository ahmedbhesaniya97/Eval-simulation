import { useMemo } from 'react'
import { ChevronRight, RotateCw, Rocket, Play, Plus, ShieldCheck } from 'lucide-react'
import { LoopStepper, Ring, SplitBar, StatusIcon, tally } from '../components/ui'
import { CATEGORIES, ISSUES } from '../data'
import { evalFromResult, issueCounts, becauseSentence, passed, suiteRuns, requiredSuite } from './helpers'
import RunsList from './RunsList'

function SuiteCard({ suite, last, onOpen, onRun }) {
  const t = last ? tally(last.results) : null
  const total = last?.results.length
  const combos = suite.scenarioIds.length * suite.personaIds.length * suite.envIds.length
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <button className="list-item" style={{ alignItems: 'flex-start', padding: '16px 18px', borderBottom: '1px solid var(--border)' }} onClick={onOpen}>
        <div className="grow">
          <div className="row" style={{ gap: 8 }}>
            <span className="title">{suite.name}</span>
            {suite.requiredForDeploy && <span className="tag accent row" style={{ gap: 4 }}><ShieldCheck size={11} />Required before deploy</span>}
          </div>
          <div className="muted small" style={{ marginTop: 3 }}>{suite.desc}</div>
          <div className="muted small" style={{ marginTop: 8 }}>
            {suite.scenarioIds.length} scenarios × {suite.personaIds.length} customer behaviors · {combos} calls
          </div>
        </div>
        <ChevronRight size={16} className="chev" />
      </button>
      <div className="row-between" style={{ padding: '12px 18px', marginTop: 'auto' }}>
        {last ? (
          <div className="row" style={{ gap: 10 }}>
            <StatusIcon status={t.success === total ? 'success' : t.failed ? 'failed' : 'attention'} />
            <span style={{ fontWeight: 500 }}>{t.success}/{total} passed</span>
            <span className="muted small">{last.name} · {last.when}</span>
          </div>
        ) : (
          <span className="muted small">Not run yet</span>
        )}
        <button className="btn sm" onClick={onRun}><Play size={12} fill="currentColor" />Run evaluation</button>
      </div>
    </div>
  )
}

// Pre-production evaluation: "Is my agent ready to go live?" (UX §4, §8)
export default function EvaluationsHome({ runs, suites, setView, setEvaluation, draftChanged, onDeploy, runEvaluation, createSuite }) {
  const req = requiredSuite(suites)
  const history = suiteRuns(runs, req.id)
  const run = history[0]
  const prev = history[1]
  const categories = useMemo(() => {
    const agg = {}
    if (!run) return []
    run.results.forEach((r) =>
      evalFromResult(r).checks.forEach((c) => {
        agg[c.key] ||= { ok: 0, n: 0, worst: 'success' }
        agg[c.key].n++
        if (c.status === 'success') agg[c.key].ok++
        else if (agg[c.key].worst !== 'failed') agg[c.key].worst = c.status
      }),
    )
    return Object.entries(agg)
  }, [run])
  if (!run) {
    return (
      <div className="stack" style={{ gap: 20 }}>
        <div className="card verdict">
          <div className="verdict-main">
            <div className="verdict-eyebrow">Deploy readiness · {req.name}</div>
            <h1 className="verdict-title">Not evaluated yet</h1>
            <p className="verdict-desc">Run your required test suite to find out whether your agent is ready for real customers.</p>
            <div className="verdict-actions"><button className="btn primary" onClick={() => runEvaluation(req.id)}><Play size={14} fill="currentColor" />Run evaluation</button></div>
          </div>
        </div>
        <div className="grid-2">
          {suites.map((s) => (
            <SuiteCard key={s.id} suite={s} last={suiteRuns(runs, s.id)[0]} onOpen={() => setView(`suite:${s.id}`)} onRun={() => runEvaluation(s.id)} />
          ))}
        </div>
      </div>
    )
  }
  const t = tally(run.results)
  const total = run.results.length
  const allGood = t.success === total
  const needs = total - t.success
  const delta = prev ? passed(run) - passed(prev) : 0


  const issues = issueCounts(run.results)
  const openIssue = (key) => setEvaluation(evalFromResult(run.results.find((r) => r.issue === key)))

  return (
    <div className="stack" style={{ gap: 20 }}>
      <LoopStepper current={draftChanged ? 'Test' : allGood ? 'Deploy' : 'Review issues'} />

      <div className="card verdict">
        <div className="verdict-main">
          <div className="verdict-eyebrow">
            Deploy readiness · {req.name} · {run.name} · {run.when}
            {draftChanged && <span className="tag accent">Draft changed since</span>}
          </div>
          <h1 className="verdict-title">
            {allGood ? 'Ready to deploy. ' : 'Almost ready. '}
            <span className="muted" style={{ fontWeight: 500 }}>Your agent completed </span>
            {t.success} of {total}
            <span className="muted" style={{ fontWeight: 500 }}> test scenarios.</span>
          </h1>
          <p className="verdict-desc">
            {allGood
              ? 'Every simulated customer got what they needed. Deploy when you’re ready — we’ll keep evaluating real conversations in Monitor.'
              : `${needs} ${needs === 1 ? 'scenario needs' : 'scenarios need'} attention ${becauseSentence(run.results)}.`}
          </p>
          <SplitBar {...t} />
          <div className="verdict-actions">
            {allGood ? (
              <button className="btn primary" onClick={onDeploy}><Rocket size={15} />Deploy</button>
            ) : (
              <button className="btn primary" onClick={() => setView(`run:${run.id}`)}>Review issues</button>
            )}
            <button className="btn" onClick={() => runEvaluation(req.id)}><RotateCw size={14} />Run evaluation again</button>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Ring value={t.success} total={total} label="passed" />
          {prev && delta !== 0 && (
            <div className={`small mt-8 ${delta > 0 ? 's-success' : 's-failed'}`}>
              {delta > 0 ? '↑' : '↓'} {Math.abs(delta)} {delta > 0 ? 'more' : 'fewer'} than {prev.name}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="row-between" style={{ marginBottom: 10 }}>
          <div>
            <div className="section-title">Test suites</div>
            <div className="muted small">A fixed set of scenarios and customers you re-run before every release.</div>
          </div>
          <button className="btn sm" onClick={createSuite}><Plus size={14} />New test suite</button>
        </div>
        <div className="grid-2">
          {suites.map((s) => (
            <SuiteCard key={s.id} suite={s} last={suiteRuns(runs, s.id)[0]} onOpen={() => setView(`suite:${s.id}`)} onRun={() => runEvaluation(s.id)} />
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Needs attention</h3><span className="muted small">{issues.length} {issues.length === 1 ? 'issue' : 'issues'}</span></div>
          {issues.length === 0 ? (
            <div className="card-pad muted">No issues found in the latest evaluation.</div>
          ) : (
            <div className="list">
              {issues.map(([k, n]) => (
                <button key={k} className="list-item" onClick={() => openIssue(k)}>
                  <StatusIcon status={ISSUES[k].severity} />
                  <div className="grow">
                    <div className="title">{ISSUES[k].title}</div>
                    <div className="sub">{n} {n === 1 ? 'scenario' : 'scenarios'} · {CATEGORIES[ISSUES[k].category].label}</div>
                  </div>
                  <ChevronRight size={16} className="chev" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h3>How your agent did</h3><span className="muted small">across {total} calls</span></div>
          <div style={{ padding: '0 18px' }}>
            {categories.map(([k, v]) => (
              <div key={k} className="check-row" style={{ alignItems: 'center' }}>
                <StatusIcon status={v.worst} />
                <div>
                  <div className="title">{CATEGORIES[k].label}</div>
                  <div className="note">{CATEGORIES[k].question}</div>
                </div>
                <span className="meta">{v.ok}/{v.n} calls</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 10 }}>Evaluation history</div>
        <RunsList runs={runs} suites={suites} setView={setView} />
      </div>
    </div>
  )
}
