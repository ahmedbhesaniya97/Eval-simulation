import { ChevronLeft, Pencil, ChevronsUpDown, GitCommitHorizontal, Rocket, MoreHorizontal } from 'lucide-react'
import { AGENT } from '../data'

export default function TopBar({ onDeploy }) {
  return (
    <header className="topbar">
      <button className="back" aria-label="Back"><ChevronLeft size={16} /></button>
      <div className="agent-name">{AGENT.name}<Pencil size={15} /></div>
      <div className="branch-select">Main <ChevronsUpDown size={14} className="muted" /></div>
      <span className="deployed-badge">100% Deployed</span>
      <div className="spacer" />
      <span className="autosave">Draft auto-saved just now</span>
      <span className="draft-tag">Draft</span>
      <button className="btn">Variable</button>
      <button className="btn">Secrets</button>
      <button className="btn"><GitCommitHorizontal size={16} />Commit</button>
      <button className="btn deploy" onClick={onDeploy}><Rocket size={16} />Deploy</button>
      <button className="icon-btn" aria-label="More"><MoreHorizontal size={18} /></button>
    </header>
  )
}
