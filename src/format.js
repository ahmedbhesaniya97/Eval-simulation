export const pct = (v, digits = 0) => `${(v * 100).toFixed(digits)}%`
export const n = (v) => v.toLocaleString('en-US')

export function clock(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function duration(sec) {
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`
}

export const dateShort = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
export const dateTime = (iso) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
export const time = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

export const plural = (count, word, pluralWord = `${word}s`) => `${n(count)} ${count === 1 ? word : pluralWord}`

// '23:30' → '11:30 PM'
export function timeLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

// Simulation cost: cents matter for a single conversation.
// Pass digits = 3 for unit prices like $0.002 per turn.
export const money = (v, digits = 2) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: digits })}`
