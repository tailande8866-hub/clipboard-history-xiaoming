import { clipboard, nativeImage } from 'electron'
import { createHash } from 'crypto'
import { writeFileSync } from 'fs'
import { join } from 'path'
import {
  addText,
  addImage,
  getLatestTextItem,
  getItemByImageHash,
  updateItemTime,
  getImagesDir,
} from './database'

import type { ClipboardItem } from './database'

let lastTextHash: string | null = null
let lastImageHash: string | null = null
let intervalId: ReturnType<typeof setInterval> | null = null
let onNewItemCallback: ((item: ClipboardItem) => void) | null = null

export function onNewItem(cb: (item: ClipboardItem) => void): void {
  onNewItemCallback = cb
}

function hashDjb2(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & 0xffffffff
  }
  return hash.toString(16)
}

function processImage(): boolean {
  const img = clipboard.readImage()
  if (img.isEmpty()) return false

  let pngBuffer = img.toPNG()
  const md5 = createHash('md5').update(pngBuffer).digest('hex')

  if (md5 === lastImageHash) return true
  lastImageHash = md5

  const existing = getItemByImageHash(md5)
  if (existing) {
    updateItemTime(existing.id)
    return true
  }

  const size = img.getSize()
  if (size.width > 1920) {
    const ratio = 1920 / size.width
    const resized = img.resize({ width: 1920, height: Math.round(size.height * ratio) })
    pngBuffer = resized.toPNG()
  }

  const filename = `${md5}.png`
  const filepath = join(getImagesDir(), filename)
  writeFileSync(filepath, pngBuffer)

  const item = addImage(filepath, md5)
  if (onNewItemCallback) onNewItemCallback(item)
  return true
}

function processText(): void {
  const text = clipboard.readText()
  if (!text) return

  const currentHash = hashDjb2(text)
  if (currentHash === lastTextHash) return
  lastTextHash = currentHash

  const lastItem = getLatestTextItem()
  if (lastItem && lastItem.content === text) {
    updateItemTime(lastItem.id)
  } else {
    const item = addText(text)
    if (onNewItemCallback) onNewItemCallback(item)
  }
}

function poll(): void {
  if (!processImage()) {
    processText()
  }
}

export function startMonitoring(intervalMs = 500): void {
  lastTextHash = null
  lastImageHash = null
  stopMonitoring()
  intervalId = setInterval(poll, intervalMs)
}

export function stopMonitoring(): void {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
  lastTextHash = null
  lastImageHash = null
}
