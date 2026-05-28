import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { app } from 'electron'
import fs from 'fs'
import { join } from 'path'

export interface ClipboardItem {
  id: number
  type: 'text' | 'image'
  content: string | null
  image_path: string | null
  image_hash: string | null
  created_at: number
  is_pinned: number
}

let db: SqlJsDatabase | null = null
let dbPath: string = ''
let imagesDir: string = ''

export function getDbPath(): string {
  return dbPath
}

export function getImagesDir(): string {
  return imagesDir
}

export async function initDatabase(dataDir?: string): Promise<void> {
  const SQL = await initSqlJs()

  const dir = dataDir || join(app.getPath('userData'))
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  dbPath = join(dir, 'data.db')
  imagesDir = join(dir, 'images')
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
  }

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  createTables()
  save()
}

function createTables(): void {
  db!.run(`
    CREATE TABLE IF NOT EXISTS clipboard_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('text', 'image')),
      content TEXT,
      image_path TEXT,
      image_hash TEXT,
      created_at INTEGER NOT NULL,
      is_pinned INTEGER NOT NULL DEFAULT 0
    )
  `)
  db!.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON clipboard_history(created_at DESC)`)
  db!.run(`CREATE INDEX IF NOT EXISTS idx_pinned ON clipboard_history(is_pinned)`)
  db!.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_image_hash ON clipboard_history(image_hash) WHERE image_hash IS NOT NULL`)

  db!.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
}

function save(): void {
  const data = db!.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

function rowToItem(row: Record<string, unknown>): ClipboardItem {
  return {
    id: row.id as number,
    type: row.type as 'text' | 'image',
    content: row.content as string | null,
    image_path: row.image_path as string | null,
    image_hash: row.image_hash as string | null,
    created_at: row.created_at as number,
    is_pinned: row.is_pinned as number,
  }
}

export function getHistory(search?: string, limit = 50, offset = 0): ClipboardItem[] {
  if (!db) return []

  let sql: string
  let params: (string | number)[] = []

  if (search) {
    sql = `
      SELECT * FROM clipboard_history
      WHERE type = 'image' OR content LIKE ?
      ORDER BY is_pinned DESC, created_at DESC
      LIMIT ? OFFSET ?
    `
    params = [`%${search}%`, limit, offset]
  } else {
    sql = `
      SELECT * FROM clipboard_history
      ORDER BY is_pinned DESC, created_at DESC
      LIMIT ? OFFSET ?
    `
    params = [limit, offset]
  }

  const stmt = db!.prepare(sql)
  stmt.bind(params)
  const results: ClipboardItem[] = []
  while (stmt.step()) {
    results.push(rowToItem(stmt.getAsObject()))
  }
  stmt.free()
  return results
}

export function addText(text: string): ClipboardItem {
  const now = Date.now()
  db!.run('INSERT INTO clipboard_history (type, content, created_at) VALUES (?, ?, ?)', ['text', text, now])
  save()

  const result = db!.exec('SELECT last_insert_rowid() as id')
  const id = result[0].values[0][0] as number

  return {
    id,
    type: 'text',
    content: text,
    image_path: null,
    image_hash: null,
    created_at: now,
    is_pinned: 0,
  }
}

export function addImage(imagePath: string, imageHash: string): ClipboardItem {
  const now = Date.now()
  db!.run(
    'INSERT INTO clipboard_history (type, image_path, image_hash, created_at) VALUES (?, ?, ?, ?)',
    ['image', imagePath, imageHash, now],
  )
  save()

  const result = db!.exec('SELECT last_insert_rowid() as id')
  const id = result[0].values[0][0] as number

  return {
    id,
    type: 'image',
    content: null,
    image_path: imagePath,
    image_hash: imageHash,
    created_at: now,
    is_pinned: 0,
  }
}

export function updateItemTime(id: number): void {
  db!.run('UPDATE clipboard_history SET created_at = ? WHERE id = ?', [Date.now(), id])
  save()
}

export function getLatestTextItem(): ClipboardItem | null {
  if (!db) return null
  const stmt = db!.prepare('SELECT * FROM clipboard_history WHERE type = ? ORDER BY created_at DESC LIMIT 1')
  stmt.bind(['text'])
  if (stmt.step()) {
    const item = rowToItem(stmt.getAsObject())
    stmt.free()
    return item
  }
  stmt.free()
  return null
}

export function getItemByImageHash(hash: string): ClipboardItem | null {
  if (!db) return null
  const stmt = db!.prepare('SELECT * FROM clipboard_history WHERE image_hash = ?')
  stmt.bind([hash])
  if (stmt.step()) {
    const item = rowToItem(stmt.getAsObject())
    stmt.free()
    return item
  }
  stmt.free()
  return null
}

export function getItemById(id: number): ClipboardItem | null {
  if (!db) return null
  const stmt = db!.prepare('SELECT * FROM clipboard_history WHERE id = ?')
  stmt.bind([id])
  if (stmt.step()) {
    const item = rowToItem(stmt.getAsObject())
    stmt.free()
    return item
  }
  stmt.free()
  return null
}

export function pinItem(id: number, pinned: boolean): void {
  db!.run('UPDATE clipboard_history SET is_pinned = ? WHERE id = ?', [pinned ? 1 : 0, id])
  save()
}

export function deleteItem(id: number): ClipboardItem | null {
  const item = getItemById(id)
  if (!item) return null
  db!.run('DELETE FROM clipboard_history WHERE id = ?', [id])
  save()
  return item
}

export function deleteImageItems(ids: number[]): ClipboardItem[] {
  const items: ClipboardItem[] = []
  for (const id of ids) {
    const item = deleteItem(id)
    if (item && item.image_path) {
      items.push(item)
    }
  }
  return items
}

export function getSetting(key: string): string | null {
  if (!db) return null
  const stmt = db!.prepare('SELECT value FROM settings WHERE key = ?')
  stmt.bind([key])
  if (stmt.step()) {
    const val = stmt.getAsObject().value as string
    stmt.free()
    return val
  }
  stmt.free()
  return null
}

export function setSetting(key: string, value: string): void {
  db!.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
  save()
}

export function cleanupExpired(retentionDays: number): string[] {
  if (!db) return []
  const cutoff = Date.now() - retentionDays * 86400000

  const stmt = db!.prepare(
    'SELECT id, image_path FROM clipboard_history WHERE is_pinned = 0 AND created_at < ? AND type = ?',
  )
  stmt.bind([cutoff, 'image'])
  const deletedPaths: string[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    if (row.image_path) {
      deletedPaths.push(row.image_path as string)
    }
  }
  stmt.free()

  db!.run('DELETE FROM clipboard_history WHERE is_pinned = 0 AND created_at < ?', [cutoff])
  save()
  return deletedPaths
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
