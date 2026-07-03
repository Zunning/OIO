# OIO

OIO 是一个个人英文表达学习工具。

核心流程：

```text
原始输入
-> AI 改写
-> 原始意图高亮
-> 英文 chunk
-> 挖空卡片
-> 语境复习
-> 签到与导出
```

## 项目入口

当前是本地静态版，项目根目录保留可运行文件：

```text
index.html
styles.css
app.js
```

直接打开 `index.html` 即可使用。

数据保存在浏览器 `localStorage` 中，建议固定使用同一个浏览器。

## 文档索引

- `user-guide.md`：日常使用说明。
- `docs/overall/development-plan.md`：总体开发计划。
- `docs/overall/development-log.md`：开发日志。
- `docs/OIO-V3-and-3.1-development-plan(4).md`：V3 与 3.1 原始开发方案。
- `docs/OIO-V3-split-roadmap.md`：V3 拆分路线图。
- `docs/已实行方案/review-system-v2-plan.md`：复习系统 V2 方案。
- `docs/已实行方案/source-intent-highlight-plan.md`：原始输入高亮与 Source Intent 绑定方案。
- `docs/已实行方案/review-experience-change-plan.md`：复习体验优化方案。
- `docs/已实行方案/prompt-workflow-optimization-plan.md`：手动 AI 提示词工作流优化方案。
- `docs/已实行方案/image-export-temp-plan.md`：图片上传与导出方案。
