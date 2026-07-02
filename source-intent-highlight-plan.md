# OIO 原始输入高亮与表达意图绑定方案

## 1. 功能目标

新增“原始输入高亮”功能。

用户在保存文本后，如果填写了原始输入，系统先弹出原始输入文本，让用户高亮自己“想说但说不出来”的地方。

这个步骤的目的不是大量标注，而是提前告诉大脑：

```text
这几个意思是我不会自然表达的。
接下来我要在英文改写里看看它们应该怎么说。
```

之后用户在英文改写中高亮 chunk、生成挖空卡片时，可以把英文 chunk 与原始输入中的高亮意图进行匹配或绑定。

复习时，也可以选择显示原始输入，帮助用户从“中文/原始意图”回忆“英文表达”。

## 2. 核心流程

### 2.1 新建文本

用户输入：

- 标题
- 原始输入，可选
- 英文改写，必填
- 日期
- 标签

点击保存后：

```text
如果没有原始输入：
-> 直接进入英文文本详情页

如果有原始输入：
-> 先弹出原始输入高亮界面
-> 用户高亮想说但说不出来的地方
-> 完成后进入英文文本详情页
```

### 2.2 原始输入高亮

用户在原始输入中选中一段内容。

例如：

```text
我今天不太想和别人寒暄。
```

用户高亮：

```text
不太想和别人寒暄
```

保存为一个“表达意图”。

可以备注：

```text
想表达：没心情闲聊，不是讨厌别人
```

如果用户不备注，则默认用高亮文本作为备注：

```text
不太想和别人寒暄
```

## 3. 核心概念

### 3.1 Source Intent

Source Intent 是用户在原始输入中高亮的“表达意图”。

它代表的是：

```text
我脑子里有这个意思
但我不知道自然英文怎么说
```

它不是英文卡片本身，而是英文 chunk 的学习目标。

### 3.2 Chunk 与 Source Intent 绑定

用户在英文改写中高亮 chunk 后，可以选择绑定一个 Source Intent。

例如：

原始输入高亮：

```text
不太想和别人寒暄
```

英文 chunk：

```text
in the mood for small talk
```

绑定后形成：

```text
Source Intent -> English Chunk -> Cloze Card
```

这样复习时可以从原始意图回忆英文表达。

## 4. 数据结构设计

### 4.1 TextItem 增加字段

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

### 4.2 SourceIntent

```ts
type SourceIntent = {
  id: string;
  textId: string;
  selectedText: string;
  note: string;
  createdAt: string;
};
```

规则：

```text
如果用户填写 note：
-> 使用用户填写的 note

如果用户不填写 note：
-> note = selectedText
```

### 4.3 Chunk 增加绑定字段

```ts
type Chunk = {
  id: string;
  textId: string;
  sourceIntentId?: string;
  selectedText: string;
  sentence: string;
  sentenceIndex?: number;
  explanation?: string;
  usageNote?: string;
  personalNote?: string;
  tags: string[];
  createdAt: string;
};
```

### 4.4 Card 增加原始意图字段

卡片可以通过 chunk 间接拿到 sourceIntentId，也可以为了查询方便冗余一份。

```ts
type Card = {
  id: string;
  textId: string;
  chunkId?: string;
  sourceIntentId?: string;
  reviewPackId?: string;
  sentence: string;
  clozeText: string;
  answer: string;
  hint?: string;
  focusNote?: string;
  reviewCount: number;
  dueAt: string;
  lastReviewedAt?: string;
  createdAt: string;
};
```

## 5. 页面与交互设计

### 5.1 原始输入高亮弹窗

触发时机：

```text
保存新文本后，如果 originalText 不为空，则打开该弹窗。
```

界面内容：

```text
标题：先标出你想说但说不出来的地方

原始输入文本：
我今天不太想和别人寒暄。

操作：
选中文本 -> 保存为意图

右侧/下方列表：
- 不太想和别人寒暄
- 今天不太想
```

按钮：

```text
完成，进入英文文本
跳过
```

### 5.2 保存 Source Intent

交互：

```text
用户选中原始文本
-> 点击“保存意图”
-> 弹出备注输入框
-> 用户可填写备注
-> 如果留空，用选中文本作为备注
-> 保存
```

第一版也可以做得更轻：

```text
选中文本 -> 点击保存意图 -> 直接保存
备注默认等于选中文本
之后再编辑备注
```

### 5.3 英文 Chunk 绑定 Source Intent

用户在英文文本中高亮 chunk 后，进入挖空界面。

在挖空界面增加一个选择框：

```text
绑定原始意图：
[不绑定]
[不太想和别人寒暄]
[今天不太想]
```

选择后：

```text
chunk.sourceIntentId = selectedSourceIntentId
card.sourceIntentId = selectedSourceIntentId
```

如果只有一个 Source Intent，可以默认选中。

如果没有 Source Intent，则隐藏这个选择框。

### 5.4 Chunk 列表显示绑定关系

Chunk 卡片中显示：

```text
原始意图：不太想和别人寒暄
英文 chunk：in the mood for small talk
```

这样用户可以看到“我当时不会说的东西”对应到了哪个英文表达。

## 6. 复习页设计

### 6.1 显示原始文本开关

复习页增加选项：

```text
[ ] 显示原始输入
```

或者：

```text
显示模式：
- 只看英文语境
- 显示原始意图
- 显示完整原始输入
```

第一版建议用简单开关：

```text
显示原始输入
```

### 6.2 复习时显示绑定的 Source Intent

如果卡片绑定了 sourceIntentId，复习时可以显示：

```text
原始意图：
不太想和别人寒暄
```

或者显示备注：

```text
想表达：没心情闲聊，不是讨厌别人
```

如果用户打开“显示原始输入”，则显示完整原始输入，并高亮对应 Source Intent。

### 6.3 复习页信息层级

默认不显示太多信息，避免干扰。

推荐层级：

```text
第一层：英文挖空句
第二层：输入答案
第三层：可滚动英文上下文
可选层：原始意图 / 原始输入
```

## 7. 使用示例

### 7.1 输入阶段

原始输入：

```text
我今天不太想和别人寒暄。
```

英文改写：

```text
I'm not really in the mood for small talk today.
```

### 7.2 原始输入高亮

用户高亮：

```text
不太想和别人寒暄
```

保存为 Source Intent。

备注默认：

```text
不太想和别人寒暄
```

### 7.3 英文 Chunk 高亮

用户高亮：

```text
in the mood for small talk
```

绑定 Source Intent：

```text
不太想和别人寒暄
```

### 7.4 生成挖空卡片

挖空：

```text
in the mood for
```

卡片：

```text
I'm not really ___ ___ ___ ___ small talk today.
```

### 7.5 复习

复习时显示：

```text
原始意图：
不太想和别人寒暄

英文挖空：
I'm not really [___ ___ ___ ___ small talk] today.

输入答案：
________________
```

这样用户练的是：

```text
从我原本想表达的意思 -> 调出自然英文 chunk
```

而不是只做机械填空。

## 8. MVP 实现顺序

### 阶段一：Source Intent 数据

- 新增 sourceIntents 存储数组
- 新增 SourceIntent 类型
- 保存文本后，如果有 originalText，进入原始输入高亮弹窗

### 阶段二：原始输入高亮弹窗

- 展示 originalText
- 支持选中文本保存为 Source Intent
- 备注默认等于 selectedText
- 支持跳过 / 完成

### 阶段三：Chunk 绑定 Source Intent

- Chunk 创建时支持 sourceIntentId
- 挖空弹窗中显示 Source Intent 下拉选择
- 保存 Card 时写入 sourceIntentId

### 阶段四：复习显示原始意图

- 复习页显示绑定的 Source Intent note
- 增加显示原始输入开关
- 完整原始输入中高亮 Source Intent

## 9. 暂不做

第一版暂不做：

- AI 自动匹配原始意图和英文 chunk
- 一个 chunk 绑定多个 Source Intent
- 一个 Source Intent 自动推荐多个英文表达
- 原始输入复杂富文本编辑
- 自动翻译原始输入
- 跨文本复用 Source Intent

## 10. 后续扩展

后续可以加入：

- AI 推荐 Source Intent 与英文 chunk 的对应关系
- AI 解释“这个中文意图为什么不能直译”
- AI 给出多个英文表达方案
- 按 Source Intent 复习
- 统计哪些“中文表达意图”最常不会说
- 从复习错误反推需要强化的 Source Intent
