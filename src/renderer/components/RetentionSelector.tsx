import { useState, useEffect } from 'react'

const OPTIONS = [
  { value: '1', label: '1 天' },
  { value: '3', label: '3 天' },
  { value: '5', label: '5 天' },
  { value: '7', label: '7 天' },
  { value: '14', label: '14 天' },
  { value: '30', label: '30 天' },
]

export default function RetentionSelector() {
  const [days, setDays] = useState('3')

  useEffect(() => {
    window.electronAPI.getSetting('retention_days').then((val) => {
      if (val) setDays(val)
    })
  }, [])

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setDays(value)
    await window.electronAPI.setSetting('retention_days', value)
  }

  return (
    <select className="retention-select" value={days} onChange={handleChange}>
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
