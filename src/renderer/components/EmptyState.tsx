export default function EmptyState() {
  return (
    <div className="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
      </svg>
      <p className="empty-state-text">还没有复制记录</p>
      <p className="empty-state-hint">试试复制一些文字或图片吧</p>
    </div>
  )
}
