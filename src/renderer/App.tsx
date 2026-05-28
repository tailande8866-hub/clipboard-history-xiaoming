import { useState, useCallback } from 'react'
import './App.css'
import { useClipboardHistory } from './hooks/useClipboardHistory'
import SearchBar from './components/SearchBar'
import RetentionSelector from './components/RetentionSelector'
import ClipboardList from './components/ClipboardList'
import EmptyState from './components/EmptyState'

export default function App() {
  const [search, setSearch] = useState('')
  const { items, refresh } = useClipboardHistory(search)

  const handleSearch = useCallback((query: string) => {
    setSearch(query)
  }, [])

  return (
    <>
      <header className="app-header">
        <h1>历史粘贴板</h1>
        <RetentionSelector />
      </header>

      <SearchBar onSearch={handleSearch} />

      <div className="list-area">
        {items.length === 0 ? <EmptyState /> : <ClipboardList items={items} onChanged={refresh} />}
      </div>
    </>
  )
}
