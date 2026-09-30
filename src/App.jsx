import { useEffect } from 'react'
import { CheckCircle2, X, Construction } from 'lucide-react'
import { useRoute, useStore, navigate } from './store.jsx'
import { SESSION_BY_ID } from './data/sessions.js'
import Sidebar from './components/Sidebar.jsx'
import { Button, PageHeader } from './components/ui.jsx'
import EvaluationsPage from './pages/EvaluationsPage.jsx'
import RunWizard from './pages/RunWizard.jsx'
import RunsPage from './pages/RunsPage.jsx'
import RunResults from './pages/RunResults.jsx'
import SessionResult from './pages/SessionResult.jsx'
import { SessionsPage, SessionDetail } from './pages/SessionsPage.jsx'

function NotInPrototype({ section }) {
  const label = section.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
  return (
    <>
      <PageHeader crumbs={[{ label: 'Home', href: '#/home' }, { label }]} title={label} />
      <div className="placeholder">
        <div>
          <Construction size={28} style={{ marginBottom: 10 }} />
          <div>This area isn't part of the evaluation prototype.</div>
          <div style={{ marginTop: 16 }}><Button onClick={() => navigate('#/evaluations')}>Go to Evaluation</Button></div>
        </div>
      </div>
    </>
  )
}

function NotFound() {
  return <NotInPrototype section="not-found" />
}

function Toast() {
  const { toast, dismissToast } = useStore()
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(dismissToast, 10000)
    return () => clearTimeout(t)
  }, [toast]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!toast) return null
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={20} style={{ color: 'var(--pass)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>Evaluation completed</div>
        <div className="muted" style={{ fontSize: 13 }}>{toast.name} is ready to review.</div>
      </div>
      <Button size="sm" onClick={() => { navigate(`#/runs/${toast.runId}`); dismissToast() }}>View results</Button>
      <button className="icon-btn" onClick={dismissToast} aria-label="Dismiss"><X size={15} /></button>
    </div>
  )
}

export default function App() {
  const { parts, query } = useRoute()
  const { runs } = useStore()
  const [section, id, sub, subId] = parts

  let page
  if (section === 'evaluations') page = <EvaluationsPage query={query} />
  else if (section === 'runs' && id === 'new') page = <RunWizard />
  else if (section === 'runs' && id) {
    const run = runs.find((r) => r.id === id)
    if (!run) page = <NotFound />
    else if (sub === 'sessions' && subId && run.results[subId]) page = <SessionResult key={subId} run={run} sessionId={subId} />
    else page = <RunResults key={run.id + query.toString()} run={run} query={query} />
  } else if (section === 'runs') page = <RunsPage />
  else if (section === 'sessions' && id && SESSION_BY_ID[id]) page = <SessionDetail key={id} sessionId={id} />
  else if (section === 'sessions') page = <SessionsPage />
  else page = <NotInPrototype section={section || 'home'} />

  return (
    <div className="app">
      <Sidebar section={section} />
      <main className="main">
        <div className="page" key={parts.join('/')}>{page}</div>
      </main>
      <Toast />
    </div>
  )
}
