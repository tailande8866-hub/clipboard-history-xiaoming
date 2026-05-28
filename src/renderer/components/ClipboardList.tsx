import type { ClipboardItem } from '../types/clipboard'
import ClipboardCard from './ClipboardCard'

interface Props {
  items: ClipboardItem[]
  onChanged: () => void
}

export default function ClipboardList({ items, onChanged }: Props) {
  if (items.length === 0) return null

  return (
    <div className="clipboard-list">
      {items.map((item) => (
        <ClipboardCard key={item.id} item={item} onChanged={onChanged} />
      ))}
    </div>
  )
}
