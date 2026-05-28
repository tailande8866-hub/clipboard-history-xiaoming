import { ipcMain, clipboard, BrowserWindow, nativeImage } from 'electron'
import { getHistory, getItemById, pinItem, deleteItem, getSetting, setSetting, cleanupExpired, ClipboardItem } from './database'
import { existsSync, unlinkSync, readFileSync } from 'fs'

let mainWindow: BrowserWindow | null = null

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win
}

export function registerIpcHandlers(): void {
  ipcMain.handle('history:get', (_event, search?: string, limit?: number, offset?: number) => {
    return getHistory(search, limit, offset)
  })

  ipcMain.handle('clipboard:copy', (_event, id: number) => {
    const item = getItemById(id)
    if (!item) return false

    if (item.type === 'text' && item.content) {
      clipboard.writeText(item.content)
    } else if (item.type === 'image' && item.image_path && existsSync(item.image_path)) {
      const img = nativeImage.createFromPath(item.image_path)
      clipboard.writeImage(img)
    } else {
      return false
    }
    return true
  })

  ipcMain.handle('history:pin', (_event, id: number, pinned: boolean) => {
    pinItem(id, pinned)
  })

  ipcMain.handle('history:delete', (_event, id: number) => {
    const item = deleteItem(id)
    if (item && item.image_path && existsSync(item.image_path)) {
      unlinkSync(item.image_path)
    }
  })

  ipcMain.handle('settings:get', (_event, key: string) => {
    return getSetting(key)
  })

  ipcMain.handle('image:read', (_event, imagePath: string) => {
    if (!existsSync(imagePath)) return null
    const buf = readFileSync(imagePath)
    return 'data:image/png;base64,' + buf.toString('base64')
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    setSetting(key, value)
    if (key === 'retention_days') {
      const paths = cleanupExpired(parseInt(value, 10))
      for (const p of paths) {
        if (existsSync(p)) unlinkSync(p)
      }
    }
  })
}

export function notifyNewItem(item: ClipboardItem): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('clipboard:new-item', item)
  }
}
