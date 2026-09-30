import { Bot } from 'lucide-react'
import { AGENTS } from '../data/agents.js'

// Agent picker, shown as "Name (agt_id)".
export default function AgentSelect({ value, onChange, id }) {
  return (
    <div className="agent-select">
      <Bot size={15} />
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Agent">
        {AGENTS.map((a) => (
          <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
        ))}
      </select>
    </div>
  )
}
