import { useState, useEffect } from 'react'

interface Props {
  onSearch: (query: string) => void
}

export default function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), 300)
    return () => clearTimeout(timer)
  }, [value, onSearch])

  return (
    <div className="search-bar">
      <input
        className="search-input"
        type="text"
        placeholder="搜索历史记录..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {value && (
        <button className="search-clear" onClick={() => setValue('')}>
          &times;
        </button>
      )}
    </div>
  )
}
