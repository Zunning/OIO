# OIO 英文学习软件开发计划

## 1. 当前状态

OIO 第一版已经完成。

当前版本是一个本地静态 Web App，不依赖 Node、后端或 AI API。直接打开 `index.html` 即可使用，数据保存在浏览器 `localStorage` 中。

当前文件：

```text
index.html
styles.css
app.js
```

## 2. 产品目标

OIO 是一个个人英文表达学习工具。

它的核心不是背孤立单词，而是把“我真实想表达但不会自然说的内容”转化为可复习的英文表达。

核心闭环：

```text
输入原始想法
-> 粘贴 AI 改写英文
-> 在原始输入中标出不会说的表达意图
-> 在英文改写中高亮 chunk
-> 在 chunk 内选择单词挖空
-> 绑定原始意图
-> 在语境中复习
```

第一版不接 AI API。用户先在 ChatGPT、Claude、Gemini 等工具里生成英文改写，再粘贴到 OIO 中加工。

## 3. 第一版已完成功能

### 3.1 文本管理

已完成：

- 新建文本
- 编辑文本
- 删除文本
- 文本列表
- 搜索文本
- 标签
- 日期字段
- 文本类型字段，默认 `dialogue`

文本字段：

```ts
type TextItem = {
  id: string;
  title: string;
  originalText?: string;
  rewrittenText: string;
  note?: string;
  tags: string[];
  textType: "story" | "expression_set" | "dialogue" | "writing" | "other";
  sourceDate: string;
  createdAt: string;
  updatedAt: string;
};
```

### 3.2 原始输入高亮 Source Intent

已完成：

- 如果新建文本时填写了原始输入，保存后先弹出原始输入高亮界面
- 用户可以在原始输入中高亮“想说但说不出来”的地方
- 保存为 Source Intent
- 备注默认等于高亮文本
- 可以编辑备注
- 可以跳过
- 文本详情页可以重新打开原始意图面板
- 原始输入高亮时支持按 `Enter` 快捷保存
- 原始输入高亮时如果只选中半个英文单词，会自动扩展到完整单词

数据结构：

```ts
type SourceIntent = {
  id: string;
  textId: string;
  selectedText: string;
  note: string;
  createdAt: string;
};
```

### 3.3 英文 Chunk 高亮

已完成：

- 在英文改写文本中选中表达
- 点击按钮或按 `Enter` 直接生成 chunk
- 生成 chunk 后自动进入挖空界面
- 如果只选中半个英文单词，会自动扩展到完整单词
- 已高亮的 chunk 会在英文文本中显示

数据结构：

```ts
type Chunk = {
  id: string;
  textId: string;
  sourceIntentId?: string;
  selectedText: string;
  sentence: string;
  explanation?: string;
  usageNote?: string;
  personalNote?: string;
  tags: string[];
  createdAt: string;
};
```

### 3.4 Chunk 内挖空

已完成：

- 在 chunk 内点击选择要挖空的单词
- 支持多个空
- 支持非连续挖空
- 自动生成挖空句
- 卡片保存 `maskedChunk`，复习时能高亮完整 chunk 的挖空版本
- 生成卡片时可以绑定 Source Intent

示例：

```text
chunk:
in the mood for small talk

挖空:
in / mood / for

复习显示:
[___ the ___ ___ small talk]
```

### 3.5 卡片与复习

已完成：

- 卡片库
- 删除卡片
- 按同一文本分组复习
- 每次复习最多取 7 张到期卡片
- 复习时显示挖空句
- 高亮整个 chunk 的挖空版本
- 支持输入答案
- 点击检查后验证拼写
- 检查规则：忽略大小写和多余空格，但要求词序和拼写一致
- 检查后显示正确答案
- 评分：Again / Good / Easy
- Again：10 分钟后复习
- Good：明天复习
- Easy：3 天后复习
- 可滚动查看英文上下文
- 上下文中隐藏答案，避免泄露
- 可显示绑定的原始意图
- 可选择显示完整原始输入，并高亮对应 Source Intent

卡片结构：

```ts
type Card = {
  id: string;
  textId: string;
  chunkId?: string;
  sourceIntentId?: string;
  sentence: string;
  clozeText: string;
  maskedChunk: string;
  answer: string;
  hint?: string;
  focusNote?: string;
  reviewCount: number;
  dueAt: string;
  lastReviewedAt?: string;
  createdAt: string;
};
```

### 3.6 本地存储

已完成：

- 使用 `localStorage`
- 保存文本、原始意图、chunk、卡片、复习记录
- 不需要登录
- 不需要后端
- 不需要网络

## 4. 当前用户流程

### 4.1 新建文本

```text
点击新建文本
-> 填写标题
-> 填写原始输入，可选
-> 粘贴 AI 改写英文
-> 保存
```

如果有原始输入：

```text
-> 弹出原始输入高亮界面
-> 高亮想说但不会说的地方
-> 保存为原始意图
-> 完成，进入英文文本
```

### 4.2 创建卡片

```text
在英文文本中选中 chunk
-> 按 Enter 或点击挖空选中内容
-> 自动保存 chunk
-> 自动打开挖空界面
-> 在 chunk 内选择要挖空的单词
-> 选择绑定的原始意图，可选
-> 保存卡片
```

### 4.3 复习

```text
进入复习页
-> 选择一组到期卡片
-> 查看英文挖空句
-> 可查看上下文
-> 可显示原始输入
-> 输入答案
-> 检查
-> 评分 Again / Good / Easy
```

## 5. 第一版暂不做

第一版已明确不做：

- AI API 自动改写
- AI 自动推荐 Source Intent
- AI 自动匹配 Source Intent 与英文 chunk
- 用户登录
- 云同步
- 多设备同步
- 移动端 App
- 复杂富文本编辑器
- 复杂间隔重复算法
- 发音
- 模糊拼写容错
- 语义答案判断

## 6. 后续开发方向

### 6.1 数据可靠性

下一步优先级较高：

- 数据导出
- 数据导入
- localStorage 数据备份
- 删除前更细的确认
- 修复或迁移旧卡片数据

### 6.2 复习体验

可继续优化：

- 复习完成后的本组总结
- 错题快速重做
- 更清晰的到期数量
- 按 Source Intent 复习
- 按标签复习
- 支持多答案
- 拼写差异提示

### 6.3 编辑能力

可继续优化：

- 编辑 chunk
- 编辑卡片
- 编辑 Source Intent
- 删除单个 Source Intent
- 手动调整 chunk 与 Source Intent 的绑定

### 6.4 AI 能力

手动版稳定后可以加入：

- 一键 AI 改写
- AI 推荐 Source Intent
- AI 推荐英文 chunk
- AI 自动解释 chunk
- AI 推荐挖空位置
- AI 自动匹配原始意图与英文表达
- AI 检查答案是否语义正确

### 6.5 技术升级

后续可以从静态版升级为：

```text
React + Vite
IndexedDB / SQLite
Electron / Tauri
OpenAI API
```

## 7. 第一版结论

第一版已经打通了 OIO 最重要的学习闭环：

```text
我想表达的内容
-> 我标出不会说的地方
-> 我看到自然英文怎么说
-> 我高亮完整 chunk
-> 我只挖真正需要记住的部分
-> 我在语境中打字复习
```

这个版本已经可以投入日常使用。
