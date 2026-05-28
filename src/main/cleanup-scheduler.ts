import { existsSync, unlinkSync } from 'fs'
import { cleanupExpired, getSetting } from './database'

let intervalId: ReturnType<typeof setInterval> | null = null

function runCleanup(): void {
  const days = parseInt(getSetting('retention_days') || '3', 10)
  const deletedPaths = cleanupExpired(days)
  for (const p of deletedPaths) {
    if (existsSync(p)) unlinkSync(p)
  }
}

export function startCleanupScheduler(): void {
  runCleanup()
  intervalId = setInterval(runCleanup, 3600000) // hourly
}

export function stopCleanupScheduler(): void {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

export { runCleanup }
