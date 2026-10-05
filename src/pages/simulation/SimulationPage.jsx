import { Play } from 'lucide-react'
import { navigate } from '../../store.jsx'
import { Button, PageHeader } from '../../components/ui.jsx'
import RunTab from './RunTab.jsx'
import ScenariosTab from './ScenariosTab.jsx'
import PersonasTab from './PersonasTab.jsx'

const TABS = [
  { id: 'run', label: 'Run', href: '#/simulation' },
  { id: 'scenarios', label: 'Scenarios', href: '#/simulation/scenarios' },
  { id: 'personas', label: 'Personas', href: '#/simulation/personas' },
]

// One Simulation page: past runs, the scenario library and the personas, as tabs.
export default function SimulationPage({ tab, query }) {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Home', href: '#/home' }, { label: 'Simulation' }]}
        title="Simulation"
        actions={<Button variant="primary" onClick={() => navigate('#/simulation/new')}><Play size={14} fill="currentColor" /> New simulation</Button>}
      />
      <nav className="page-tabs" aria-label="Simulation">
        {TABS.map((t) => (
          <a key={t.id} href={t.href} className={`page-tab ${tab === t.id ? 'active' : ''}`} aria-current={tab === t.id ? 'page' : undefined}>{t.label}</a>
        ))}
      </nav>
      {tab === 'run' && <RunTab />}
      {tab === 'scenarios' && <ScenariosTab query={query} />}
      {tab === 'personas' && <PersonasTab />}
    </>
  )
}
