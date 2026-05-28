# CLAUDE.md — Windows 历史粘贴板

## 项目简介

一款 Windows 本地历史粘贴板管理软件，基于 Electron + React + TypeScript + SQLite。自动记录文字和图片复制内容，支持搜索、置顶、删除、重新粘贴，带系统托盘和全局快捷键。

## 标准文件路径

| 路径 | 用途 |
|---|---|
| `docs/requirements.md` | 产品需求文档 |
| `docs/technical-design.md` | 技术设计规范（架构、数据库、IPC 接口） |
| `docs/execution-steps.md` | 分阶段执行步骤清单（勾选进度） |
| `devlog/YYYY-MM-DD.md` | 每日开发日志 |
| `src/main/` | Electron 主进程代码 |
| `src/preload/` | 预加载脚本（contextBridge） |
| `src/renderer/` | React 前端代码（组件、样式、hooks） |
| `resources/` | 图标等静态资源 |

## 开发约定

1. **开发前**：先阅读 `docs/execution-steps.md` 了解当前进度和下一个待办阶段
2. **开发中**：严格遵守"一阶段一验证"，每个阶段完成并通过验证标准后，再进入下一阶段
3. **阶段完成**：更新 `docs/execution-steps.md` 中对应阶段的勾选状态，将 `[ ]` 改为 `[x]`
4. **每天结束**：在 `devlog/` 中创建或更新当日日志（`YYYY-MM-DD.md`），包含：
   - 今日完成事项
   - 待办事项
   - 遇到的问题和解决方案
   - 下一步计划
5. **保持小步快跑**：每次只做一个阶段，一个阶段通常不应超过 5-8 个子任务
6. **不要过度设计**：三个相似的代码行好过一套过早的抽象。做完当前功能就停手，不要顺手重构
7. **安全第一**：所有粘贴板数据存储在 `%APPDATA%/clipboard-history/`，不上传网络
8. **代码风格**：不写文档注释（docstring），代码命名即文档。只有行为意图不明显时才加简短注释

## 常用命令

```bash
# 开发模式（热重载）
npm run dev

# 编译
npm run build

# 预览编译结果
npm run preview

# 打包 NSIS 安装程序
npm run package

# 打包便携版
npm run package:portable
```
