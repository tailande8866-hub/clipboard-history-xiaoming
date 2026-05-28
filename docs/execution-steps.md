# 执行步骤 — Windows 历史粘贴板

> 每完成一个子任务勾选 `[x]`，每个阶段完成后验证通过才进入下一阶段。

---

## 阶段 1：项目脚手架

- [x] 创建 docs/ 和 devlog/ 文件夹
- [x] 编写 docs/requirements.md
- [x] 编写 docs/technical-design.md
- [x] 编写 docs/execution-steps.md
- [x] 编写 CLAUDE.md
- [x] 初始化 npm 项目，安装全部依赖
- [x] 配置 tsconfig（三份）、electron-builder.yml
- [x] 创建最小 Electron 入口（index.ts），验证窗口能启动
- [x] 创建 preload 占位、renderer 占位（index.html + index.tsx）

**验证标准**：`npm run dev` 能打开一个空白 Electron 窗口，显示 "Hello"

---

## 阶段 2：数据库层

- [x] 实现 src/main/database.ts：建表、迁移、所有 CRUD 函数
- [x] 编写数据库单元测试脚本，验证 CRUD 正确
- [x] 确认数据存储在 `%APPDATA%/clipboard-history/data.db`

**验证标准**：独立运行测试脚本，插入/查询/更新/删除均正确

---

## 阶段 3：粘贴板监控 — 文字

- [x] 实现 src/main/clipboard-monitor.ts（先只做文字监控）
- [x] 实现连续相同文字去重（hash 比对，更新 created_at）
- [x] 主进程启动时自动开始监控

**验证标准**：启动应用，复制文字，数据库中出现记录；连续复制相同文字，只更新时间不新增

---

## 阶段 4：图片监控 + 存储

- [x] 扩展 clipboard-monitor.ts 支持图片检测
- [x] 实现图片 MD5 计算和文件写入
- [x] 实现图片全局去重
- [x] 大图自动缩放到合理尺寸（最大宽度 1920px）

**验证标准**：截图或复制图片文件，images/ 文件夹出现 PNG，数据库出现记录

---

## 阶段 5：IPC 通信桥

- [x] 实现 preload/index.ts（contextBridge 暴露全部 API）
- [x] 实现 ipc-handlers.ts（注册所有 handler）
- [x] 实现实时推送（新条目到达时通知渲染进程）

**验证标准**：渲染进程能通过 IPC 获取历史列表、收到新条目通知

---

## 阶段 6：React UI 骨架

- [x] 实现 App.tsx 布局框架（header / search / list 三区域）
- [x] 编写 App.css 全局样式（CSS 变量定义淡蓝主题色板）
- [x] 实现 EmptyState 组件（无历史时的提示）

**验证标准**：界面显示标题栏、搜索框占位、空状态提示，配色为淡蓝色

---

## 阶段 7：文字卡片展示

- [x] 实现 useClipboardHistory hook（调用 IPC 获取数据）
- [x] 实现 ClipboardList 组件（滚动容器）
- [x] 实现 ClipboardCard 组件（卡片外壳：圆角、阴影、边框）
- [x] 实现 TextCard 组件（文字截断显示，最多 5 行）
- [x] 卡片底部显示时间戳

**验证标准**：复制几段文字，界面按时间倒序显示卡片

---

## 阶段 8：图片卡片展示

- [x] 实现 ImageCard 组件（缩略图渲染，固定最大高度）
- [x] 配置 Electron 安全加载本地图片路径
- [x] 卡片区分文字/图片类型

**验证标准**：复制图片后，界面显示图片缩略图卡片

---

## 阶段 9：搜索功能

- [x] 实现 SearchBar 组件（输入框 + 清空按钮 + 300ms 防抖）
- [x] 实现搜索 IPC（后端 SQL LIKE 查询）
- [x] 搜索时仅显示匹配的文字卡片
- [x] 清空搜索恢复全部显示

---

## 阶段 10：置顶与删除

- [x] 实现置顶/取消置顶按钮（IPC → DB UPDATE → 刷新列表）
- [x] 实现删除按钮
- [x] 实现 ConfirmDialog（删除前确认弹窗）
- [x] 删除图片记录时同步删除文件
- [x] 实现复制按钮（IPC → clipboard.writeText/writeImage → 隐藏窗口）

---

## 阶段 11：保留天数设置

- [x] 实现 RetentionSelector 组件（下拉：1天/3天/5天）
- [x] 默认值 3 天，设置持久化存储
- [x] 切换天数时触发即时清理

---

## 阶段 12：系统托盘 + 全局快捷键

- [x] 制作托盘图标（16x16 蓝色圆点）
- [x] 实现托盘图标 + 右键菜单：显示/退出
- [x] 注册 Ctrl+Shift+V 全局快捷键
- [x] 关闭窗口时隐藏到托盘（不退出）
- [x] 点击托盘图标显示/隐藏窗口

---

## 阶段 13：开机自启 + 收尾优化

- [x] 实现开机自启（app.setLoginItemSettings）
- [x] UI 半透明玻璃质感淡蓝主题
- [x] 窗口固定屏幕右下角，失去焦点自动隐藏
- [x] 定期清理过期记录（每小时 + 启动时）

---

## 阶段 14：打包

- [x] 确认 electron-builder.yml 配置
- [x] 生成应用图标 PNG 文件
- [ ] 构建 NSIS 安装包
- [ ] 在干净环境安装测试
- [ ] 确认卸载后注册表和文件清理干净
