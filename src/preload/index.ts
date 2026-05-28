import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getHistory: (search?: string, limit?: number, offset?: number) =>
    ipcRenderer.invoke('history:get', search, limit, offset),

  copyToClipboard: (id: number) =>
    ipcRenderer.invoke('clipboard:copy', id),

  pinItem: (id: number, pinned: boolean) =>
    ipcRenderer.invoke('history:pin', id, pinned),

  deleteItem: (id: number) =>
    ipcRenderer.invoke('history:delete', id),

  readImageData: (imagePath: string) =>
    ipcRenderer.invoke('image:read', imagePath),

  getSetting: (key: string) =>
    ipcRenderer.invoke('settings:get', key),

  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke('settings:set', key, value),

  onNewItem: (callback: (item: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, item: unknown) => callback(item)
    ipcRenderer.on('clipboard:new-item', listener)
    return () => ipcRenderer.removeListener('clipboard:new-item', listener)
  },
})
