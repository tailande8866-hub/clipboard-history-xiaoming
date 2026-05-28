import { app, BrowserWindow, protocol, net, screen, Tray, Menu, globalShortcut, nativeImage } from 'electron'
import { join } from 'path'
import { initDatabase, closeDatabase } from './database'
import { startMonitoring, stopMonitoring, onNewItem } from './clipboard-monitor'
import { registerIpcHandlers, setMainWindow, notifyNewItem } from './ipc-handlers'
import { startCleanupScheduler, stopCleanupScheduler } from './cleanup-scheduler'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let blurHideReady = false

function getWindowPosition(): { x: number; y: number } {
  const display = screen.getPrimaryDisplay()
  const { width, height } = display.workArea
  const winWidth = 240
  const winHeight = 300
  return {
    x: width - winWidth - 16,
    y: height - winHeight - 16,
  }
}

function createWindow(): void {
  const { x, y } = getWindowPosition()

  mainWindow = new BrowserWindow({
    width: 240,
    height: 300,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  setMainWindow(mainWindow)

  mainWindow.on('blur', () => {
    if (blurHideReady && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => {
    setMainWindow(null)
    mainWindow = null
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function toggleWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    const { x, y } = getWindowPosition()
    mainWindow.setPosition(x, y)
    mainWindow.show()
    mainWindow.focus()
    blurHideReady = false
    setTimeout(() => { blurHideReady = true }, 1500)
  }
}

function createTray(): void {
  tray = new Tray(createTrayIcon())
  const menu = Menu.buildFromTemplate([
    { label: '显示/隐藏', click: toggleWindow },
    { type: 'separator' },
    { label: '退出', click: () => { isQuitting = true; app.quit() } },
  ])
  tray.setToolTip('小明剪贴板')
  tray.setContextMenu(menu)
  tray.on('click', toggleWindow)
}

function createTrayIcon(): Electron.NativeImage {
  const paths = [
    join(__dirname, '../../resources/icon.png'),
    join(process.resourcesPath, 'icon.png'),
  ]
  for (const p of paths) {
    try {
      const img = nativeImage.createFromPath(p)
      if (!img.isEmpty()) return img.resize({ width: 16, height: 16 })
    } catch { /* try next */ }
  }
  const buf = Buffer.alloc(16 * 16 * 4)
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const i = (y * 16 + x) * 4
      const dx = x - 7, dy = y - 7
      if (dx * dx + dy * dy <= 36) { buf[i] = 74; buf[i + 1] = 144; buf[i + 2] = 217; buf[i + 3] = 255 }
    }
  }
  return nativeImage.createFromBuffer(buf, { width: 16, height: 16 })
}

app.whenReady().then(async () => {
  protocol.handle('clipboard-image', (request) => {
    const filePath = request.url.slice('clipboard-image://'.length).replace(/\\/g, '/')
    return net.fetch('file:///' + filePath)
  })

  await initDatabase()
  registerIpcHandlers()
  onNewItem(notifyNewItem)
  startMonitoring()
  startCleanupScheduler()

  app.setLoginItemSettings({ openAtLogin: true })

  createWindow()
  createTray()

  // Show window on first launch; blur will auto-hide after a short delay
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
    setTimeout(() => { blurHideReady = true }, 1500)
  }

  globalShortcut.register('Ctrl+Shift+V', toggleWindow)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  stopMonitoring()
  stopCleanupScheduler()
  closeDatabase()
})

app.on('activate', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
  }
})
