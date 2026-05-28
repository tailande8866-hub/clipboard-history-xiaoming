import { useState } from 'react'
import type { ClipboardItem } from '../types/clipboard'
import TextCard from './TextCard'
import ImageCard from './ImageCard'
import ConfirmDialog from './ConfirmDialog'

interface Props {
  item: ClipboardItem
  onChanged: () => void
}

export default function ClipboardCard({ item, onChanged }: Props) {
  const [confirming, setConfirming] = useState(false)

  async function handleCopy() {
    await window.electronAPI.copyToClipboard(item.id)
  }

  async function handlePin() {
    await window.electronAPI.pinItem(item.id, !item.is_pinned)
    onChanged()
  }

  async function handleDelete() {
    await window.electronAPI.deleteItem(item.id)
    setConfirming(false)
    onChanged()
  }

  return (
    <div className="clipboard-card">
      {item.type === 'text' ? <TextCard item={item} /> : <ImageCard item={item} />}

      <div className="card-actions">
        <button className="action-btn" title="复制" onClick={handleCopy}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
        <button
          className={`action-btn ${item.is_pinned ? 'action-btn-active' : ''}`}
          title={item.is_pinned ? '取消置顶' : '置顶'}
          onClick={handlePin}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L15 9H9L12 2Z" />
            <line x1="12" y1="9" x2="12" y2="22" />
          </svg>
        </button>
        <button className="action-btn action-btn-danger" title="删除" onClick={() => setConfirming(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {confirming && (
        <ConfirmDialog
          message="确定要删除这条记录吗？"
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
