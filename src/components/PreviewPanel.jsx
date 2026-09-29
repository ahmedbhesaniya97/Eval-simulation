import { useState } from 'react'
import { Maximize2, AudioLines } from 'lucide-react'

const ORB = [
  '..####..',
  '.######.',
  '##dd.###',
  '##d.#.##',
  '##.#d.##',
  '###dd.##',
  '.######.',
  '..####..',
]

export default function PreviewPanel() {
  const [mode, setMode] = useState('draft')
  return (
    <aside className="preview">
      <div className="preview-head">
        Preview
        <button className="icon-btn" aria-label="Expand"><Maximize2 size={16} /></button>
      </div>
      <div className="preview-body">
        <div className="pixel-orb">
          {ORB.join('').split('').map((c, i) => (
            <span key={i} className={c === '.' ? 'off' : c === 'd' ? 'dim' : ''} />
          ))}
        </div>
      </div>
      <div className="preview-foot">
        <div className="label">Start with</div>
        <div className="segmented">
          <button className={mode === 'draft' ? 'active' : ''} onClick={() => setMode('draft')}>Current draft</button>
          <button className={mode === 'deployed' ? 'active' : ''} onClick={() => setMode('deployed')}>Last deployed</button>
        </div>
        <button className="start-call"><AudioLines size={16} />Start Call</button>
      </div>
    </aside>
  )
}
