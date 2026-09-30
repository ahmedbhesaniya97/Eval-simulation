import {
  Home, Bot, BookOpen, Rocket, LayoutList, ClipboardCheck, PenTool, BellRing, PhoneCall, Webhook,
  PhoneOutgoing, FileLock2, ChevronsUpDown, PanelLeftClose, ListChecks, History, CalendarClock,
} from 'lucide-react'
import { useStore } from '../store.jsx'

function Logo() {
  // Pixel-ring mark, echoing the Zero Runtime logo.
  const dots = []
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2
    dots.push(<rect key={i} x={16 + Math.cos(a) * 11 - 1.5} y={16 + Math.sin(a) * 11 - 1.5} width="3" height="3" fill="#5aa9e6" opacity={0.55 + (i % 3) * 0.2} />)
  }
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="4" fill="#1d1d21" />
      {dots}
      <path d="M12 21l8-10" stroke="#e8e8ea" strokeWidth="2.4" strokeLinecap="square" />
    </svg>
  )
}

const TOP = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'agents', label: 'Agents', Icon: Bot },
  { id: 'knowledge', label: 'Knowledge Base', Icon: BookOpen, tag: 'New' },
  { id: 'deployments', label: 'Deployments', Icon: Rocket },
  { id: 'sessions', label: 'Sessions', Icon: LayoutList },
]
const BOTTOM = [
  { id: 'voice-studio', label: 'Voice Studio', Icon: PenTool, tag: 'New' },
  { id: 'alerts', label: 'Alerts', Icon: BellRing },
  { id: 'telephony', label: 'Telephony', Icon: PhoneCall },
  { id: 'webhook', label: 'Webhook', Icon: Webhook },
  { id: 'batch', label: 'Batch Calling', Icon: PhoneOutgoing },
  { id: 'compliance', label: 'Compliance Center', Icon: FileLock2 },
]

function Item({ id, label, Icon, tag, active, extra }) {
  return (
    <a href={`#/${id}`} className={`nav-item ${active ? 'active' : ''}`}>
      <Icon size={18} strokeWidth={1.7} />
      <span>{label}</span>
      {tag && <span className="tag">{tag}</span>}
      {extra}
    </a>
  )
}

export default function Sidebar({ section }) {
  const { runs } = useStore()
  const running = runs.some((r) => r.status === 'running')
  const inEval = ['evaluations', 'runs', 'automations'].includes(section)

  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo />
        <div className="brand-name">
          ZERO<span>_RUNTIME</span>
        </div>
        <button className="collapse" aria-label="Collapse sidebar">
          <PanelLeftClose size={18} />
        </button>
      </div>
      <button className="workspace" type="button">
        <span className="workspace-avatar" />
        <span className="workspace-name">Videosdk</span>
        <ChevronsUpDown size={16} className="muted" />
      </button>
      <nav className="nav">
        {TOP.map((i) => <Item key={i.id} {...i} active={section === i.id} />)}

        <a href="#/evaluations" className={`nav-item ${inEval ? 'active' : ''}`}>
          <ClipboardCheck size={18} strokeWidth={1.7} />
          <span>Evaluation</span>
          <span className="tag">New</span>
        </a>
        <div className="nav-sub">
          <a href="#/evaluations" className={`nav-item ${section === 'evaluations' ? 'active' : ''}`}>
            <ListChecks size={16} strokeWidth={1.7} /> Evaluations
          </a>
          <a href="#/runs" className={`nav-item ${section === 'runs' ? 'active' : ''}`}>
            <History size={16} strokeWidth={1.7} /> Runs
            {running && <span className="run-dot" title="A run is in progress" />}
          </a>
          <a href="#/automations" className={`nav-item ${section === 'automations' ? 'active' : ''}`}>
            <CalendarClock size={16} strokeWidth={1.7} /> Automations
          </a>
        </div>

        {BOTTOM.map((i) => <Item key={i.id} {...i} active={section === i.id} />)}
      </nav>
    </aside>
  )
}
