export interface ClipboardItem {
  id: number
  type: 'text' | 'image'
  content: string | null
  image_path: string | null
  image_hash: string | null
  created_at: number
  is_pinned: number
}

export interface ElectronAPI {
  getHistory: (search?: string, limit?: number, offset?: number) => Promise<ClipboardItem[]>
  copyToClipboard: (id: number) => Promise<boolean>
  pinItem: (id: number, pinned: boolean) => Promise<void>
  deleteItem: (id: number) => Promise<void>
  readImageData: (imagePath: string) => Promise<string | null>
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
  onNewItem: (callback: (item: ClipboardItem) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
