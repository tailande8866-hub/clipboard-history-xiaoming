import { useState } from 'react'
import type { ClipboardItem } from '../types/clipboard'
import { formatTime } from '../utils/time'
import TextDetailPopup from './TextDetailPopup'

interface Props {
  item: ClipboardItem
}

export default function TextCard({ item }: Props) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <>
      <div className="text-card" onClick={() => setShowDetail(true)}>
        <div className="text-card-content">{item.content}</div>
        <div className="text-card-footer">
          {item.is_pinned ? <span className="pin-badge">已置顶</span> : <span />}
          <span className="text-card-time">{formatTime(item.created_at)}</span>
        </div>
      </div>

      {showDetail && (
        <TextDetailPopup content={item.content!} onClose={() => setShowDetail(false)} />
      )}
    </>
  )
}
