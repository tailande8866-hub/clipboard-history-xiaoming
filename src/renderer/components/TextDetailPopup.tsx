interface Props {
  content: string
  onClose: () => void
}

export default function TextDetailPopup({ content, onClose }: Props) {
  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-box" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <span className="detail-title">文字详情</span>
          <button className="detail-close" onClick={onClose}>&times;</button>
        </div>
        <div className="detail-body">{content}</div>
      </div>
    </div>
  )
}
