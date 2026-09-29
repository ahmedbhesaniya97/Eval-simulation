import { useState } from 'react'
import { ChevronRight, ChevronsUpDown, Wrench, ListPlus, FlaskConical, Lightbulb, TrendingDown, TrendingUp, Minus, Sparkle } from 'lucide-react'
import { SplitBar, StatusIcon, StatusPill } from '../components/ui'
import { PROD_SUMMARY, PROD_CONVERSATIONS, ISSUES, SCENARIOS, CATEGORIES, buildEvaluation, fmtDuration } from '../data'

const S = PROD_SUMMARY
const pct = (n) => `${Math.round((n / S.total) * 100)}%`

const convEval = (c) => ({
  ...buildEvaluation({ id: c.id, scenarioId: c.scenarioId, status: c.status, issue: c.issue, kind: 'production' }),
  meta: { caller: c.caller, when: c.when },
})

function Trend({ trend }) {
  if (trend === 'new') return <span className="tag new">New</span>
  if (trend === 'down') return <span className="s-success row small" style={{ gap: 3 }}><TrendingDown size={13} />Less often</span>
  if (trend === 'up') return <span className="s-failed row small" style={{ gap: 3 }}><TrendingUp size={13} />More often</span>
  return <span className="muted row small" style={{ gap: 3 }}><Minus size={13} />Same</span>
}

function DailyBars() {
  const max = Math.max(...S.daily.map((d) => d.v.reduce((a, b) => a + b, 0)))
  const colors = ['var(--success)', 'var(--attention)', 'var(--failed)']
  return (
    <div className="bars">
      {S.daily.map((d) => (
        <div key={d.day} className="bar-col" title={`${d.day}: ${d.v[0]} successful, ${d.v[1]} need attention, ${d.v[2]} failed`}>
          <div className="bar-stack" style={{ height: `${(d.v.reduce((a, b) => a + b, 0) / max) * 100}%` }}>
            {d.v.map((n, i) => n > 0 && <span key={i} style={{ flex: n, background: colors[i] }} />)}
          </div>
          <span className="d">{d.day}</span>
        </div>
      ))}
    </div>
  )
}

function Overview({ setView, setEvaluation, setIssue }) {
  const rate = S.success / S.total
  const newIssue = S.issues.find((i) => i.trend === 'new')
  const toReview = PROD_CONVERSATIONS.filter((c) => c.status !== 'success').slice(0, 4)
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="card verdict">
        <div className="verdict-main">
          <div className="verdict-eyebrow">Production evaluation · {S.period}</div>
          <h1 className="verdict-title">
            {S.success} of {S.total} <span className="muted" style={{ fontWeight: 500 }}>customers got what they needed.</span>
          </h1>
          <p className="verdict-desc">
            {S.attention + S.failed} conversations had a problem. That’s {rate > S.prevSuccessRate ? 'better' : 'worse'} than the week before ({Math.round(S.prevSuccessRate * 100)}% → {Math.round(rate * 100)}% successful).
          </p>
          <SplitBar success={S.success} attention={S.attention} failed={S.failed} />
        </div>
        <div style={{ width: 300 }}>
          <div className="muted small" style={{ marginBottom: 10 }}>Conversations per day</div>
          <DailyBars />
        </div>
      </div>

      {newIssue && (
        <div className="callout failed" style={{ alignItems: 'center' }}>
          <Sparkle size={18} className="s-failed" />
          <div style={{ flex: 1 }}>
            <div className="title">New issue since your last deploy: {ISSUES[newIssue.key].title}</div>
            <div className="body">Found in {newIssue.count} real conversations. It also showed up in your latest test run.</div>
          </div>
          <button className="btn sm" onClick={() => setIssue(newIssue.key)}>Look into it</button>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Common issues</h3><button className="btn link small" onClick={() => setView('issues')}>View all</button></div>
          <div className="list">
            {S.issues.map((i) => (
              <button key={i.key} className="list-item" onClick={() => setIssue(i.key)} style={{ alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 600, width: 36, color: 'var(--text-2)' }}>{pct(i.count)}</span>
                <div className="grow">
                  <div className="row-between"><span className="title">{ISSUES[i.key].title}</span><Trend trend={i.trend} /></div>
                  <div className="sub">{i.count} conversations</div>
                  <div className="issue-bar"><span style={{ width: `${(i.count / S.issues[0].count) * 100}%`, background: ISSUES[i.key].severity === 'failed' ? 'var(--failed)' : undefined }} /></div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Worth a listen</h3><button className="btn link small" onClick={() => setView('conversations')}>All conversations</button></div>
          <div className="list">
            {toReview.map((c) => (
              <button key={c.id} className="list-item" onClick={() => setEvaluation(convEval(c))}>
                <StatusIcon status={c.status} />
                <div className="grow">
                  <div className="title">{ISSUES[c.issue].title}</div>
                  <div className="sub">{SCENARIOS.find((s) => s.id === c.scenarioId).name} · {c.when}</div>
                </div>
                <ChevronRight size={16} className="chev" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Conversations({ setEvaluation }) {
  const [f, setF] = useState('all')
  const list = PROD_CONVERSATIONS.filter((c) => f === 'all' || c.status === f)
  const counts = { all: S.total, attention: S.attention, failed: S.failed, success: S.success }
  return (
    <>
      <div className="chips mb-16">
        {[['all', 'All'], ['attention', 'Needs attention'], ['failed', 'Failed'], ['success', 'Successful']].map(([k, l]) => (
          <button key={k} className={`chip ${f === k ? 'on' : ''}`} onClick={() => setF(k)}>{l} <span className="muted">{counts[k]}</span></button>
        ))}
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Result</th><th>Customer wanted to</th><th>What happened</th><th>Caller</th><th>When</th><th>Length</th></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} onClick={() => setEvaluation(convEval(c))}>
                <td><StatusPill status={c.status} /></td>
                <td style={{ fontWeight: 500 }}>{SCENARIOS.find((s) => s.id === c.scenarioId).name}</td>
                <td className={c.issue ? '' : 'muted'}>{c.issue ? ISSUES[c.issue].short : 'Completed'}</td>
                <td className="muted">{c.caller}</td>
                <td className="muted">{c.when}</td>
                <td className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtDuration(c.duration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint mt-16" style={{ textAlign: 'center' }}>Showing the {list.length} most recent conversations</p>
    </>
  )
}

const FIX_PATH = ['Understand', 'Review conversations', 'Update agent', 'Run evaluation', 'Deploy']

function Issues({ issue, setIssue, setEvaluation, startFix, goTest, addScenarioFromIssue }) {
  const selected = issue || S.issues[0].key
  const info = S.issues.find((i) => i.key === selected)
  const def = ISSUES[selected]
  const convs = PROD_CONVERSATIONS.filter((c) => c.issue === selected)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
      <div className="card">
        <div className="card-head"><h3>Most common this week</h3></div>
        <div className="list">
          {S.issues.map((i, n) => (
            <button key={i.key} className="list-item" onClick={() => setIssue(i.key)}
              style={i.key === selected ? { background: 'var(--surface-3)', boxShadow: 'inset 2px 0 0 var(--accent)' } : undefined}>
              <span className="muted" style={{ width: 14 }}>{n + 1}.</span>
              <div className="grow">
                <div className="title">{ISSUES[i.key].title}</div>
                <div className="sub row" style={{ gap: 8 }}>{i.count} conversations {i.trend === 'new' && <span className="tag new">New</span>}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="card card-pad" style={{ padding: 24 }}>
        <div className="row" style={{ gap: 8, marginBottom: 6 }}>
          <StatusIcon status={def.severity} size={20} />
          <h2 style={{ fontSize: 19, fontWeight: 600 }}>{def.title}</h2>
        </div>
        <div className="row muted small" style={{ gap: 10, marginLeft: 28 }}>
          <span>Found in {info.count} conversations ({pct(info.count)})</span>·<span>{CATEGORIES[def.category].label}</span>·<Trend trend={info.trend} />
          {info.seenInTests && <span className="tag accent">Also seen in testing</span>}
        </div>

        <p className="mt-24" style={{ color: 'var(--text-2)' }}>{def.explanation}</p>

        <div className="suggestion mt-16">
          <div className="lbl"><Lightbulb size={12} />Possible cause</div>
          {def.cause}
        </div>

        <div className="mt-24">
          <div className="section-title">Affected conversations</div>
          <div className="card mt-8">
            <div className="list">
              {convs.map((c) => (
                <button key={c.id} className="list-item" onClick={() => setEvaluation(convEval(c))}>
                  <StatusIcon status={c.status} />
                  <div className="grow">
                    <div className="title">{SCENARIOS.find((s) => s.id === c.scenarioId).name}</div>
                    <div className="sub">{c.caller} · {c.when} · {fmtDuration(c.duration)}</div>
                  </div>
                  <span className="muted small">Listen</span>
                  <ChevronRight size={16} className="chev" />
                </button>
              ))}
            </div>
          </div>
          {convs.length < info.count && <p className="hint mt-8">Showing {convs.length} of {info.count}</p>}
        </div>

        <div className="mt-24">
          <div className="section-title">How to fix it</div>
          <div className="row mt-8" style={{ flexWrap: 'wrap', gap: 6 }}>
            {FIX_PATH.map((s, i) => (
              <span key={s} className="row small" style={{ gap: 6, color: i < 2 ? 'var(--text)' : 'var(--muted)' }}>
                <span className={`tag ${i < 2 ? 'accent' : ''}`}>{i + 1}</span>{s}{i < FIX_PATH.length - 1 && <ChevronRight size={12} className="muted" />}
              </span>
            ))}
          </div>
          <div className="suggestion mt-16">
            <div className="lbl"><Wrench size={12} />Suggested change</div>
            {def.suggestion}
          </div>
          <p className="hint mt-8">Nothing changes automatically — you decide what to update.</p>
          <div className="row mt-16">
            <button className="btn primary" onClick={() => startFix(selected)}><Wrench size={15} />Update agent</button>
            <button className="btn" onClick={() => addScenarioFromIssue(selected)}><ListPlus size={15} />Add to evaluation suite</button>
            <button className="btn ghost" onClick={() => goTest('evaluations')}><FlaskConical size={15} />Run evaluation</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MonitorTab({ view, setView, ...props }) {
  const [issue, setIssueState] = useState(null)
  const setIssue = (k) => { setIssueState(k); setView('issues') }

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title">Monitor</div>
        <div className="branch-select" style={{ marginLeft: 0, minWidth: 150 }}>{S.period}<ChevronsUpDown size={14} className="muted" /></div>
      </div>
      <p className="page-sub">See how your agent is doing with real customers. Every call is evaluated automatically.</p>
      <div className="subnav">
        {[['evaluations', 'Evaluations'], ['conversations', 'Conversations', S.total], ['issues', 'Issues', S.issues.length]].map(([k, l, n]) => (
          <button key={k} className={view === k ? 'active' : ''} onClick={() => setView(k)}>{l}{n != null && <span className="count">{n}</span>}</button>
        ))}
      </div>
      {view === 'evaluations' && <Overview setView={setView} setIssue={setIssue} {...props} />}
      {view === 'conversations' && <Conversations {...props} />}
      {view === 'issues' && <Issues issue={issue} setIssue={setIssueState} {...props} />}
    </div>
  )
}
