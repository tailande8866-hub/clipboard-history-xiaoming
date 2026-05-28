# 技术设计规范 — Windows 历史粘贴板

## 技术栈

| 层 | 选型 | 版本 |
|---|---|---|
| 桌面框架 | Electron | ^33.0.0 |
| 前端 UI | React + TypeScript | ^19.0.0 |
| 构建工具 | electron-vite | ^2.0.0 |
| 打包工具 | electron-builder | ^25.0.0 |
| 数据库 | better-sqlite3 | ^11.0.0 |
| 样式 | CSS Modules | 内置 |
| 运行时 | Node.js | v26.2.0 |

## 架构概览

```
┌─────────────────────────────────────┐
│           MAIN PROCESS              │
│                                     │
│  Tray │ Clipboard Monitor │ Cleanup │
│       │   (500ms poll)     │ Sched  │
│  ─────┼───────────────────┼─────────│
│       │    SQLite DB       │         │
│       │    File System     │         │
│  ─────┼───────────────────┼─────────│
│          IPC Handlers                │
└──────────────┬──────────────────────┘
               │ contextBridge
┌──────────────┴──────────────────────┐
│         PRELOAD SCRIPT              │
│   contextBridge.exposeInMainWorld   │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│        RENDERER PROCESS             │
│                                     │
│  React App                          │
│  ┌─────────────────────────────┐   │
│  │ SearchBar │ RetentionSelect │   │
│  ├─────────────────────────────┤   │
│  │     ClipboardList           │   │
│  │  ┌───────────────────────┐  │   │
│  │  │ ClipboardCard × N     │  │   │
│  │  │ ├ TextCard            │  │   │
│  │  │ └ ImageCard           │  │   │
│  │  └───────────────────────┘  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## 数据库设计

### 数据库文件位置
`%APPDATA%/clipboard-history/data.db`

### 表结构

```sql
CREATE TABLE clipboard_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    type          TEXT NOT NULL CHECK(type IN ('text', 'image')),
    content       TEXT,
    image_path    TEXT,
    image_hash    TEXT,
    created_at    INTEGER NOT NULL,
    is_pinned     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_created_at ON clipboard_history(created_at DESC);
CREATE INDEX idx_pinned ON clipboard_history(is_pinned) WHERE is_pinned = 1;
CREATE UNIQUE INDEX idx_image_hash ON clipboard_history(image_hash) WHERE image_hash IS NOT NULL;
```

### 设置表

```sql
CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

存储 retention_days 等配置项。

## 图片存储

- 路径：`%APPDATA%/clipboard-history/images/{md5_hash}.png`
- 格式：统一 PNG
- 最大尺寸：宽度 1920px（超大图缩放）
- 去重：通过 image_hash 唯一索引保证

## IPC 接口定义

### Main → Renderer（推送事件）
| 频道 | 数据 | 说明 |
|---|---|---|
| `clipboard:new-item` | `ClipboardItem` | 新条目通知 |

### Renderer → Main（请求/响应）
| 频道 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| `history:get` | `search?, limit?, offset?` | `ClipboardItem[]` | 获取历史列表 |
| `clipboard:copy` | `id: number` | `void` | 重新复制到粘贴板 |
| `history:pin` | `id: number, pinned: boolean` | `void` | 置顶/取消 |
| `history:delete` | `id: number` | `void` | 删除记录 |
| `settings:get` | `key: string` | `string` | 获取设置 |
| `settings:set` | `key: string, value: string` | `void` | 保存设置 |

## 组件树

```
App
├── SearchBar
├── RetentionSelector
├── ClipboardList
│   └── ClipboardCard × N
│       ├── TextCard | ImageCard
│       └── CardActions (pin / copy / delete)
├── EmptyState
└── ConfirmDialog
```

## 关键算法

### 文字去重
1. 计算当前粘贴板文字内容的 hash（简单 djb2 哈希）
2. 与上次记录的文字 hash 比较
3. 相同 → UPDATE 该条目的 created_at
4. 不同 → INSERT 新条目

### 图片去重
1. 读取粘贴板图片 → nativeImage.toPNG()
2. 计算 PNG buffer 的 MD5
3. 查询 `WHERE image_hash = ?`
4. 存在 → UPDATE created_at
5. 不存在 → 写入 PNG 文件 + INSERT 新条目

### 过期清理
1. 计算截止时间 = now - retentionDays × 86400000ms
2. 查询过期的图片记录 → 删除文件
3. DELETE WHERE is_pinned = 0 AND created_at < 截止时间
4. PRAGMA optimize（非阻塞回收空间）
