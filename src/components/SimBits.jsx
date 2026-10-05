import { MessageSquareText, AudioLines, PhoneCall, Sparkles, PenLine, Volume2, VolumeX, Building2, WifiOff } from 'lucide-react'
import { DIFFICULTY, ENV_BY_ID } from '../data/simulation.js'

export function ModeBadge({ mode }) {
  if (mode === 'telephony') return <span className="badge mode-telephony"><PhoneCall size={12} /> Telephony</span>
  return mode === 'audio'
    ? <span className="badge mode-audio"><AudioLines size={12} /> Audio</span>
    : <span className="badge mode-text"><MessageSquareText size={12} /> Text only</span>
}

export function DifficultyBadge({ level }) {
  return <span className={`badge diff-${level}`}>{DIFFICULTY[level].label}</span>
}

export function SourceBadge({ source }) {
  return source === 'generated'
    ? <span className="badge generated" title="Generated from the agent's system prompt"><Sparkles size={12} /> Generated</span>
    : <span className="badge"><PenLine size={12} /> Manual</span>
}

const ENV_ICON = { quiet: VolumeX, noisy: Volume2, office: Building2, poor: WifiOff }
export function EnvIcon({ env, size = 14 }) {
  const Icon = ENV_ICON[env]
  return <Icon size={size} />
}
export function EnvLabel({ env }) {
  if (!env) return <span className="faint">—</span>
  return <span className="row" style={{ gap: 6, display: 'inline-flex' }}><EnvIcon env={env} size={13} /> {ENV_BY_ID[env].label}</span>
}
