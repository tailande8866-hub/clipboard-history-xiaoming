import { useState, useEffect, useCallback, useRef } from 'react'
import type { ClipboardItem } from '../types/clipboard'

export function useClipboardHistory(search?: string) {
  const [items, setItems] = useState<ClipboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const searchRef = useRef(search)

  const refresh = useCallback(async () => {
    const result = await window.electronAPI.getHistory(searchRef.current || undefined, 100, 0)
    setItems(result)
    setLoading(false)
  }, [])

  useEffect(() => {
    searchRef.current = search
    refresh()
  }, [search, refresh])

  useEffect(() => {
    const unsubscribe = window.electronAPI.onNewItem((item) => {
      if (!searchRef.current) {
        setItems((prev) => [item, ...prev])
      }
    })
    return unsubscribe
  }, [])

  return { items, loading, refresh }
}
