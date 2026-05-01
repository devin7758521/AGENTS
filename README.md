# AGENTS.md

## 🎯 目标
构建一个可运行的 Agent Worker 系统，具备：

- dashboard 前端面板
- trace/debug/replay
- analyzer 分析器
- 多账号调度（matrix）
- 风控系统
- 支持 X / 小红书 / 抖音（后两者为草稿模式）

---

## ⚙️ 技术要求

- 使用 Cloudflare Workers
- 使用 KV 存储状态
- 前端为纯静态 HTML + JS
- 所有 API 走 /api/*
- 不依赖本地服务器

---

## 🧠 功能模块（必须全部实现）

### 1. Dashboard
- /public/index.html
- 展示状态 / history / matrix

### 2. Trace系统
- 每次运行生成 traceId
- 记录 steps（generate / select / risk / publish / score）
- API: /api/trace?id=

### 3. Debug系统
- API: /api/debug
- 返回最近 trace / errors / queue

### 4. Replay
- API: /api/replay
- 支持 dryRun=true

### 5. Analyzer
- API: /api/analyze
- 能输出：
  - 失败原因统计
  - 风控命中率
  - 哪一步是瓶颈
  - 优化建议

### 6. Matrix调度
- 支持多个账号
- 每账号：
  - postCapPerDay
  - cooldown
  - riskLevel

### 7. 风控
- 限流
- 去重
- 熔断
- 高频检测

### 8. 发布系统
- X：真实接口（占位 token）
- 小红书 / 抖音：只生成草稿

---

## 🧩 代码结构

agent-worker/
- worker.js
- state.js
- analyzer.js
- debug.js
- matrix.js
- risk.js
- publish/
- public/

---

## 🔥 规则（非常重要）

- 必须可直接部署（wrangler publish）
- 不允许伪代码
- 所有接口必须可访问
- 默认 mode = semi-auto（必须人工确认）
- 所有发布必须经过风控
- 所有执行必须写 trace

---

## 🚀 执行方式

请完成：

1. 创建完整项目结构
2. 实现所有 API
3. 实现前端页面
4. 提交为 PR
