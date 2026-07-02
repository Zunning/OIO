# OIO 手动 AI 提示词工作流优化方案

## 1. 优化目标

OIO 目前不接 AI API，这样适合个人使用，成本低，也不需要处理 API Key。

下一步可以优化“手动使用 AI”的流程：

```text
在 OIO 里选择提示词风格
-> 一键复制提示词
-> 粘贴到 ChatGPT / Claude / Gemini
-> AI 按固定格式输出
-> 把结果粘贴回 OIO
-> OIO 自动识别标题、标签、原始输入、英文改写、中文翻译
```

这样不用花 API 钱，但体验会接近半自动。

## 2. 网页新增功能

### 2.1 Prompt 面板

新增一个页面或侧边栏入口：

```text
Prompts
```

功能：

- 选择提示词风格
- 查看当前提示词
- 一键复制提示词
- 可复制“只含提示词”的版本
- 可复制“提示词 + 当前原始输入”的版本

第一版建议内置这些风格：

```text
dialogue
writing
casual
work
story
```

新增 Prompt 配置：

```text
模式：Everyday Expression / IELTS Training
英语变体：British English / American English
Everyday 模式：CEFR 难度 A1 / A2 / B1 / B2 / C1 / C2
IELTS 模式：Speaking / Writing / Listening / Reading + 5.5 / 6.0 / 6.5 / 7.0 / 7.5 / 8.0
Emoji：允许自然使用 / 不要 emoji
```

CEFR 和 IELTS 不同时作为硬约束生效，避免提示词互相打架。选择 Everyday 模式时只使用 CEFR；选择 IELTS 模式时只使用 IELTS 分数，并在页面显示对应 CEFR 参考和预估词汇量。

标签暂时不做：提示词会保留 `tags:` 字段以兼容 OIO 格式，但要求 AI 留空，OIO 解析时也不主动填充标签。

### 2.2 新建文本页增强

新建文本页增加：

```text
[选择 AI 输出格式]
[复制对应提示词]
[粘贴 AI 结果并自动解析]
```

用户流程：

```text
输入原始内容
-> 选择 dialogue / writing / work 等风格
-> 点击复制提示词
-> 去 ChatGPT 使用
-> 把 AI 输出粘贴回 OIO
-> OIO 自动填充标题、标签、原始输入、英文改写、中文翻译
```

## 3. AI 输出格式设计

为了方便 OIO 自动解析，AI 不应该只输出两段无标签文本。

用户原始提示词里要求：

```text
Do NOT include any labels, explanations, or extra text.
```

这适合人工阅读，但不适合软件解析。

OIO 版本可以改成固定块格式：

```text
:::OIO
title: ...
tags: tag1, tag2, tag3
style: dialogue

original:
...

rewrite:
...

translation:
...
:::
```

优点：

- 人眼能看懂
- 程序容易解析
- 不容易把英文改写和中文翻译混在一起
- 以后能扩展字段

## 4. 通用提示词模板

所有模板都会追加这些动态约束：

```text
Use British English / American English.
Everyday 模式：Keep the rewrite around CEFR B2.
IELTS 模式：Tune the rewrite for IELTS Speaking Band 7.0.
Emoji are allowed only when natural. / Do not use emoji.
Do not generate tags in the output. Leave the tags field blank.
```

### 4.1 Dialogue Prompt

```text
You’re my good British friend helping me express myself naturally in English.

No matter what language I use, rewrite my message based on the intended meaning, not the original wording. Make it sound natural, native, and conversational. Preserve my emotional tone. Do not summarize. It should sound like something I would actually say.

Also provide a conversational Chinese translation of the original message.

Output must follow this exact format:

:::OIO
title: Generate a short Chinese title, no more than 12 characters.
tags: Generate 2-4 short tags in English, separated by commas.
style: dialogue

original:
Paste my original message here exactly.

rewrite:
Write one natural English paragraph here. No line breaks.

translation:
Write one conversational Chinese paragraph here. No line breaks.
:::

Do not include any extra explanations outside the :::OIO block.
```

### 4.2 Writing Prompt

```text
You’re my thoughtful British English writing coach.

No matter what language I use, rewrite my message into natural, polished English based on the intended meaning, not the original wording. Preserve my emotional tone and personal voice. Do not summarize. Make it suitable for written communication, but not stiff or overly formal.

Also provide a conversational Chinese translation of the original message.

Output must follow this exact format:

:::OIO
title: Generate a short Chinese title, no more than 12 characters.
tags: Generate 2-4 short tags in English, separated by commas.
style: writing

original:
Paste my original message here exactly.

rewrite:
Write one polished English paragraph here. No line breaks.

translation:
Write one conversational Chinese paragraph here. No line breaks.
:::

Do not include any extra explanations outside the :::OIO block.
```

### 4.3 Work Prompt

```text
You’re my British English communication coach for work situations.

No matter what language I use, rewrite my message into clear, natural, professional English based on the intended meaning, not the original wording. Preserve the emotional tone, but make it suitable for workplace communication. Do not summarize. Avoid sounding robotic or overly formal.

Also provide a conversational Chinese translation of the original message.

Output must follow this exact format:

:::OIO
title: Generate a short Chinese title, no more than 12 characters.
tags: Generate 2-4 short tags in English, separated by commas.
style: work

original:
Paste my original message here exactly.

rewrite:
Write one professional English paragraph here. No line breaks.

translation:
Write one conversational Chinese paragraph here. No line breaks.
:::

Do not include any extra explanations outside the :::OIO block.
```

### 4.4 Casual Prompt

```text
You’re my funny, warm British friend.

No matter what language I use, rewrite my message into casual, natural English based on the intended meaning, not the original wording. Preserve the emotional tone. Make it sound friendly, relaxed, and native, with a little humor if it fits. Do not summarize.

Also provide a conversational Chinese translation of the original message.

Output must follow this exact format:

:::OIO
title: Generate a short Chinese title, no more than 12 characters.
tags: Generate 2-4 short tags in English, separated by commas.
style: casual

original:
Paste my original message here exactly.

rewrite:
Write one casual English paragraph here. No line breaks.

translation:
Write one conversational Chinese paragraph here. No line breaks.
:::

Do not include any extra explanations outside the :::OIO block.
```

## 5. 粘贴自动解析

### 5.1 解析规则

OIO 识别：

```text
:::OIO
...
:::
```

然后解析字段：

```text
title
tags
style
original
rewrite
translation
```

对应填入：

```text
title -> 标题
tags -> 标签
style -> 文本类型
original -> 原始输入
rewrite -> 英文改写
translation -> 备注 / 中文翻译字段
```

当前 `TextItem` 里还没有单独的 `translation` 字段。第一版可以先放进 `note`。

后续可以增加：

```ts
translation?: string;
```

### 5.2 兼容普通粘贴

如果粘贴内容不是 `:::OIO` 格式：

```text
按普通文本处理
```

这样不会破坏现在的使用方式。

## 6. 数据结构调整

建议给 `TextItem` 增加：

```ts
type TextItem = {
  id: string;
  title: string;
  originalText?: string;
  rewrittenText: string;
  translation?: string;
  note?: string;
  tags: string[];
  textType: "story" | "expression_set" | "dialogue" | "writing" | "work" | "casual" | "other";
  sourceDate: string;
  createdAt: string;
  updatedAt: string;
};
```

第一版如果不想动太多，可以先：

```text
translation -> note
style -> textType
```

## 7. UI 设计建议

### 7.1 Prompt 页面

页面结构：

```text
风格选择：
[dialogue] [writing] [work] [casual] [story]

提示词预览：
大文本框，只读或可编辑

按钮：
[复制提示词]
[复制提示词 + 当前原始输入]
```

### 7.2 新建文本页

新增区域：

```text
AI 手动工作流

风格：[dialogue ▼]
[复制提示词]

粘贴 AI 输出：
[_____________________]
[自动解析]
```

自动解析成功后显示：

```text
已识别：
标题：...
标签：...
类型：...
原始输入：...
英文改写：...
中文翻译：...
```

## 8. MVP 实现顺序

### 阶段一：提示词内置

- 新增 prompt 模板对象
- 增加 Prompt 页面
- 支持风格选择
- 支持一键复制

### 阶段二：OIO 格式解析

- 增加 `parseOioBlock(text)` 函数
- 支持解析 title / tags / style / original / rewrite / translation
- 新建文本页支持粘贴 AI 输出并自动填充

### 阶段三：数据字段优化

- 给 TextItem 增加 `translation`
- 文本详情页显示中文翻译
- 兼容旧数据

### 阶段四：体验优化

- 复制提示词时可自动带入当前原始输入
- 解析失败时显示友好提示
- 支持用户编辑提示词模板
- 支持保存自定义提示词

## 9. 暂不做

第一版优化暂不做：

- API 调用
- 自动打开 ChatGPT
- 多轮对话管理
- 自定义模板持久化
- AI 输出质量评分

## 10. 总结

这个优化的核心是：

```text
不接 API
但把手动 AI 使用流程标准化
```

它能让 OIO 继续保持低成本、本地优先，同时明显减少复制粘贴和手动整理的麻烦。
