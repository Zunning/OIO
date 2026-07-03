# OIO V3 开发计划（修订版）

## 1. 版本定位

OIO V3 不再继续扩张大量功能，而是围绕现有核心流程完成一次技术升级，并加入两个明确的新方向：

```text
1. AI 自动改写与复习问题生成
2. 基于用户学习词块的听音与跟读练习
```

核心目标仍然是：

```text
把用户真实想表达但不会自然说的内容
转化为能够理解、回忆、听懂并说出来的英文词块
```

新版核心闭环：

```text
原始表达
-> 高质量 AI 改写
-> Source Intent
-> 英文 Chunk
-> Cloze
-> 渐进式 Review
-> 听音识别
-> 跟读模仿
```

---

## 2. 本版开发范围

### 2.1 本版要做

- 技术架构升级
- 数据存储升级
- 旧版数据迁移
- 高质量模型自动改写
- 低成本模型生成第三阶段问题
- Review V3
- 独立的听音练习栏目
- 按文本生成完整情景音频
- 按句子和 Chunk 生成练习音频
- 基于 Chunk 的听音识别练习
- 基于 Chunk 的跟读练习
- 浏览器录音与原音对比
- 数据备份与恢复

### 2.2 本版不做

- IELTS 特化
- AI 自动推荐 Chunk
- AI 自动匹配 Source Intent
- AI 自动推荐挖空
- AI 语义评分
- AI 自动控制复习结果
- 发音自动评分
- 语调自动评分
- 自动语音识别分析
- 复杂学习统计
- 云同步
- 用户账号
- 原生移动端 App
- 复杂间隔重复算法

本版 AI 原则：

```text
效果好的模型只负责英文改写
便宜模型只负责生成第三阶段问题
其他 AI 能力暂不考虑
```

---

# 3. 技术升级

## 3.1 当前技术形态

当前项目仍然是：

```text
index.html
styles.css
app.js
localStorage
```

这种结构适合早期快速开发，但随着以下功能加入：

- AI 请求
- 多阶段 Review
- 音频文件
- 音频生成与切分
- 听音练习
- 跟读与录音

继续在单个 `app.js` 中开发会越来越难维护。

## 3.2 推荐技术栈

```text
React
TypeScript
Vite
IndexedDB
Dexie.js
Zod
Vitest
```

暂时不需要：

- 后端
- Electron
- Tauri
- 用户系统
- 云数据库

新版仍然保持：

```text
本地优先
无需登录
主要功能可离线使用
API 功能可选
```

## 3.3 推荐项目结构

```text
src/
  app/
    router/
    providers/

  features/
    library/
    capture/
    review/
    listening/
    settings/

  components/
    ui/
    editor/
    audio/

  db/
    schema.ts
    migrations.ts
    repositories/

  services/
    ai/
    audio/
    import/
    export/

  domain/
    text/
    chunk/
    review/
    listening/

  utils/
  tests/
```

核心原则：

```text
页面组件不直接操作 IndexedDB
页面组件不直接拼接 API 请求
Review 逻辑与界面分离
音频逻辑与播放器界面分离
```

---

# 4. 数据升级

## 4.1 IndexedDB

新版使用 IndexedDB 代替 localStorage 作为主要存储。

原因：

- 可以保存音频 Blob
- 更适合大量图片
- 可以分表管理数据
- 支持数据库版本迁移
- 查询和更新更稳定
- 不容易因为媒体文件快速触碰容量上限

## 4.2 旧版数据迁移

首次打开新版时：

```text
检测旧版 localStorage
-> 显示检测到的数据
-> 自动创建迁移前备份
-> 转换到新版数据结构
-> 校验数据
-> 写入 IndexedDB
-> 显示迁移结果
```

要求：

- 迁移失败时不删除旧数据
- 可以重新迁移
- 缺少字段时使用默认值
- 迁移完成后生成 JSON 备份
- 保存数据库版本号

## 4.3 备份与恢复

必须支持：

- 全量 JSON 导出
- 全量 JSON 导入
- 导入前预览
- 数据冲突提示
- 图片备份
- 音频备份
- 迁移前自动备份

---

# 5. AI API

## 5.1 AI 使用范围

本版只使用两类 AI 任务。

### 任务一：英文改写

使用效果好的模型。

用途：

- 将中文、英文或中英混合输入改写成自然英文
- 保留用户原本想表达的意思
- 根据设置调整表达风格
- 支持日常表达、对话、随笔和正式写作

### 任务二：生成第三阶段问题

使用价格较低、速度较快的模型。

用途：

- 根据 Chunk、Source Intent 和上下文生成一个简短问题
- 帮助用户根据意义回忆目标表达
- 问题只需清楚、稳定，不要求很强的文风

本版不使用 AI：

- 推荐 Chunk
- 自动选择 Cloze
- 自动评分
- 判断发音
- 分析听力错误
- 生成 IELTS 题目

## 5.2 模型配置

设置页只需要两个模型配置：

```text
Rewrite Model
Question Model
```

### Rewrite Model

要求：

- 语言质量高
- 意思保留准确
- 表达自然
- 能遵循固定输出格式

### Question Model

要求：

- 成本低
- 响应快
- 能生成简单明确的问题
- 能稳定返回结构化结果

## 5.3 API 配置

```ts
type AISettings = {
  provider: string;
  baseUrl?: string;
  apiKey?: string;
  rewriteModel: string;
  questionModel: string;
  storeApiKey: boolean;
};
```

API Key 规则：

- 默认只保存在本地
- 可以选择仅当前会话保存
- 不进入普通数据导出
- 日志中不显示完整 Key
- UI 中只显示掩码

## 5.4 改写流程

### 手动模式

继续保留现有流程：

```text
复制 Prompt
-> 在 ChatGPT 网页中改写
-> 粘贴结果
-> 自动解析
```

### API 模式

```text
输入原始内容
-> 选择表达类型
-> 选择英式 / 美式
-> 选择难度
-> 调用 Rewrite Model
-> 对照原文与改写
-> 用户修改
-> 保存文本
```

要求：

- API 失败时不丢失输入
- 生成结果可以编辑
- 用户确认后才正式保存
- 支持重新生成
- 手动模式长期保留

## 5.5 问题生成流程

第三阶段问题不应在每次复习时重新生成。

推荐流程：

```text
Chunk 创建完成
-> 保存 Review Item
-> 使用 Question Model 生成问题
-> 缓存问题
```

也可以延迟到卡牌即将进入第三阶段时生成。

问题可以：

- 手动编辑
- 重新生成
- 查看生成状态
- 在 API 失败时暂时跳过第三阶段

建议返回格式：

```ts
type GeneratedReviewQuestion = {
  question: string;
};
```

---

# 6. Review V3

## 6.1 Review V3 目标

当前 Review 主要是：

```text
看到挖空
-> 输入缺失内容
```

V3 逐步减少提示，让用户最终能够根据意义和上下文主动回忆目标表达。

Review V3 分为三个阶段：

```text
Stage 1：普通填空
Stage 2：先观察完整 Chunk，再隐藏并填写原空
Stage 3：根据问题和上下文回忆表达
```

## 6.2 Review Item 数据结构

```ts
type ReviewItem = {
  id: string;
  textId: string;
  chunkId: string;
  sourceIntentId?: string;

  clozeTokenIndexes: number[];
  maskedChunk: string;
  answer: string;

  stage: 1 | 2 | 3;
  stageProgress: {
    stage1Completed: number;
    stage2Completed: number;
    stage3Completed: number;
  };

  generatedQuestion?: string;

  importance: "normal" | "important";
  status: "active" | "mastered" | "suspended";

  createdAt: string;
  updatedAt: string;
};
```

本版不设计复杂评分系统，只记录：

```text
当前阶段
每个阶段完成次数
是否查看答案
是否手动标记不熟
```

---

# 7. Stage 1：普通填空

## 7.1 显示内容

Stage 1 和现有复习方式接近：

- 显示英文上下文
- 高亮完整 Chunk
- Chunk 中部分内容挖空
- 可以显示 Source Intent
- 用户输入挖空答案

示例：

```text
I just went straight ___ bed.
```

答案：

```text
to
```

## 7.2 学习目标

- 学习 Chunk 内的具体形式
- 记住介词、搭配和词序
- 降低新卡片难度
- 建立对完整 Chunk 的基础记忆

## 7.3 进入 Stage 2

只有 Stage 1 完成次数达到阈值后才能进入 Stage 2。

默认建议：

```text
Stage 1 完成 2 次
-> Stage 2
```

---

# 8. Stage 2：观察 Chunk 后隐藏

## 8.1 核心交互

Stage 2 并不是一开始就把整个 Chunk 隐藏。

正确流程：

```text
先显示完整上下文
-> 完整 Chunk 保持高亮并可见
-> 用户观察并尝试记住整个 Chunk
-> 点击输入框或开始填写答案
-> 高亮 Chunk 自动隐藏
-> 原来的 Cloze 空格仍然保留
-> 用户只填写原本的挖空答案
```

也就是说：

```text
用户最终填写的答案
仍然只是原 Cloze 的答案
```

但是在开始填写之前，用户需要主动尝试回忆刚刚看到的完整 Chunk。

## 8.2 示例

初始显示：

```text
I just went straight to bed because I did not want to overthink it.
```

其中：

```text
went straight to bed
```

完整高亮并可见。

用户点击答案输入框后，高亮 Chunk 自动隐藏，但实际题目仍然按照原 Cloze 呈现：

```text
I just went straight ___ bed because I did not want to overthink it.
```

用户只填写：

```text
to
```

## 8.3 学习目标

Stage 2 比 Stage 1 多一层完整回忆要求，但不会突然要求用户输入整个 Chunk。

它训练：

- 对完整 Chunk 的短时保持
- Chunk 的整体感
- Cloze 与完整表达之间的连接
- 从识别逐渐过渡到回忆

## 8.4 隐藏触发方式

首版建议：

```text
输入框获得焦点
-> 隐藏高亮 Chunk
```

可以提供一个“重新查看”按钮，但如果用户重新查看，本次练习不计入阶段进度。

## 8.5 进入 Stage 3

只有 Stage 2 完成次数达到阈值后，才能进入 Stage 3。

默认建议：

```text
Stage 2 完成 3 次
-> Stage 3
```

---

# 9. Stage 3：问题驱动回忆

## 9.1 显示内容

Stage 3 使用低成本模型生成的问题。

显示：

- 当前文本标题
- 必要上下文
- Source Intent，可选
- AI 生成的问题
- 答案输入框

不直接显示原句的明显骨架。

示例：

```text
Context:
You were tired and did not want to think about whether the timer would work.

Question:
What did you do instead of checking it?
```

用户尝试回忆：

```text
I just went straight to bed.
```

## 9.2 学习目标

- 根据意义调用英文表达
- 从 Source Intent 回忆 Chunk
- 降低对原句结构的依赖
- 更接近真实口语输出
- 为听音和跟读建立主动记忆

## 9.3 问题生成规则

问题必须：

- 围绕用户原本的情景
- 指向一个明确表达
- 不直接包含目标 Chunk
- 不泄露关键答案词
- 使用简单自然的英文
- 尽量只有一句
- 不变成知识问答
- 不创造与原文无关的新情景

Prompt 输入可以包含：

```text
Chunk
Source Intent
原句
前后上下文
```

## 9.4 答案处理

本版不做 AI 自动评分。

用户提交后：

```text
显示原答案
-> 显示完整 Chunk
-> 用户自行对照
```

可以提供基础文本对比：

- 高亮相同词
- 高亮缺失词
- 显示词序差异

但系统不判断：

```text
正确
部分正确
错误
```

## 9.5 熟练状态

默认建议：

```text
Stage 3 完成 3 次
-> 标记为 Mastered
```

Mastered 卡牌不必删除，可以在卡片库中查看，并允许手动恢复到任意阶段。

---

# 9.5 Review 音频播放

在任何 Review 阶段，用户都可以选择：

```text
播放已有音频
```

如果当前卡片或对应 Chunk 还没有音频，则显示：

```text
生成音频
```

音频内容优先级：

```text
1. 包含目标 Chunk 的句子或半句音频
2. 目标 Chunk 单独音频
3. 当前完整句子的 TTS 音频
```

用途只包括：

- 不确定单词或 Chunk 怎么读时快速听一下
- 建立文字与声音之间的联系
- 在提交答案前后确认发音
- 必要时简单跟读

交互要求：

- 音频按钮不能遮挡题目或打断答题。
- 默认不自动播放，由用户主动点击。
- 可以重复播放。
- 如果已有 Listening 模块生成的音频，直接复用，不重复调用 API。
- 如果没有音频，用户可以选择当前 TTS Provider 临时生成并保存。
- 生成失败不影响正常 Review。
- 播放音频不改变熟练度和评分。

为了避免音频直接泄露 Stage 3 的完整目标答案，可以提供两种播放时机：

```text
答题前播放
答题后播放
```

默认允许用户自行选择，不强制限制。

---

# 10. 熟练度、评分与阶段推进

## 10.1 每张卡牌只有一个统一熟练度

每张正式卡牌都保存一个连续累计的熟练度值：

```ts
type ReviewProgress = {
  reviewItemId: string;
  mastery: number;
  stage: 1 | 2 | 3;
  status: "active" | "graduated" | "suspended";
  dueAt: string;
  lastReviewedAt?: string;
};
```

阶段不是根据“Stage 2 完成了几次”单独计算，而是根据同一个 `mastery` 数值自动切换。

```text
mastery 较低
-> Stage 1

mastery 达到第一个阈值
-> Stage 2

mastery 达到第二个阈值
-> Stage 3

mastery 达到毕业阈值
-> Graduated
```

## 10.2 评分按钮

正式卡片继续保留：

```text
Again
Good
Easy
```

### Again

```text
不增加熟练度
缩短下次出现间隔
```

建议：

```text
mastery += 0
dueAt = 10 分钟后
```

如后续发现用户经常误点或卡牌明显退步，再考虑轻微扣除熟练度；V3 首版不扣分。

### Good

```text
增加一定熟练度
安排正常间隔
```

建议默认：

```text
mastery += 0.5
```

### Easy

```text
增加 1 点熟练度
安排更长间隔
```

默认：

```text
mastery += 1
```

Good 的具体增量可以在设置或常量中调整，但必须小于 Easy。

## 10.3 默认阶段阈值

为了避免一张卡片需要重复过多次，阶段阈值保持较低：

```text
mastery < 1
-> Stage 1

1 <= mastery < 2
-> Stage 2

2 <= mastery < 3
-> Stage 3

3 <= mastery < 4.5
-> 最终巩固

mastery >= 4.5
-> Graduated
```

## 10.4 阶段切换

每次评分后：

```text
更新 mastery
-> 根据阈值重新计算 stage
-> 更新下一次到期时间
```

示例：

```text
当前 mastery = 1.5
当前 Stage = 1

点击 Easy
-> mastery = 2.5
-> 自动进入 Stage 2
```

Stage 2 或 Stage 3 中点击 Again：

```text
mastery 不变
-> 当前阶段不自动下降
-> 10 分钟后重新出现
```

首版暂不自动降级，避免一次失误导致提示方式频繁跳动。

后续可以加入：

```text
连续多次 Again
-> mastery 小幅下降
-> 必要时退回上一阶段
```

但不属于当前 MVP。

## 10.5 毕业

当：

```text
mastery >= 4.5
```

卡片进入：

```text
Graduated
```

毕业卡：

- 不进入普通到期队列
- 保留所有数据与历史
- 可以手动恢复
- 后续可以加入定期抽查


# 11. 听音练习栏目

## 11.1 栏目定位

新版增加一个独立栏目：

```text
Listening Practice
听音练习
```

它不属于普通 Review 页面。

听音练习的目标不是考试，也不是完整听写，而是：

```text
听到用户想学习的词块
-> 能从声音中识别出来
-> 能模仿它的发音、节奏和语调
```

练习主要围绕用户自己的文本和 Chunk 展开。

## 11.2 按文本组织

每一篇文本都可以生成一套听音练习。

基本流程：

```text
进入某篇文本
-> 点击生成听音练习
-> 一键生成整篇文本的情景音频
-> 生成句子和 Chunk 练习音频
-> 将片段与句子和 Chunk 对齐
-> 开始听音与跟读练习
```

Listening 页面按文本分组：

```text
文本 A
  - 完整情景音频
  - 句子片段
  - Chunk 片段
  - 听音进度
  - 跟读记录

文本 B
  - 完整情景音频
  - 句子片段
  - Chunk 片段
```

---

# 12. 音频生成

## 12.1 一键生成完整文本音频

每篇文本可以点击：

```text
生成整篇音频
```

系统将英文改写文本发送到 TTS。

保存：

- 完整情景音频
- 使用的 Voice
- 语速
- 生成时间
- 对应文本版本

如果文本后来被修改：

```text
显示音频与当前文本版本不一致
```

用户可以选择重新生成。

## 12.2 音频层级

建议支持：

```text
完整文本音频
句子音频
Chunk 音频
包含 Chunk 的上下文音频
```

### 完整文本音频

用途：

- 感受完整情景
- 理解整体语流
- 完整跟读

### 句子音频

用途：

- 逐句听音
- 逐句模仿
- 承载自然语境

### Chunk 音频

用途：

- 集中辨认目标表达
- 反复模仿发音
- 熟悉重音和连读

### Chunk 上下文音频

用途：

- 在自然语流中识别 Chunk
- 避免只熟悉孤立发音

## 12.3 首版生成方案

如果 TTS API 不能稳定返回时间戳，不必先生成整段后再强行自动裁切。

推荐首版：

```text
生成一份完整文本音频
+
按句子分别生成句子音频
+
为用户已选择的 Chunk 单独生成 Chunk 音频
```

包含 Chunk 的句子自然成为 Chunk 上下文音频。

这种方式比自动分析整段时间点更稳定。

## 12.4 TTS 设置

首版可以支持：

- Voice
- 英式 / 美式
- 语速
- 是否保留停顿

多角色对话音频可以放到 P2，不作为 MVP 必需功能。

---

# 13. 听音识别练习

## 13.1 目标

听音识别练习只训练：

```text
听到这个声音
-> 能认出对应的 Chunk
```

它不要求用户完整听写整句话。

## 13.2 模式一：先听后看

```text
只播放音频
-> 用户尝试识别
-> 点击显示文本
-> 高亮目标 Chunk
-> 再次播放
```

## 13.3 模式二：看文本听音

```text
显示完整句子
-> 高亮 Chunk
-> 播放音频
```

适合刚开始学习某个 Chunk。

## 13.4 模式三：隐藏 Chunk

```text
显示句子
-> Chunk 隐藏
-> 播放音频
-> 用户尝试辨认
-> 显示答案
```

## 13.5 自我记录

用户可以简单标记：

- 没听出来
- 大概听出来
- 能清楚听出来

这不是正式评分，只用于记录练习感受。

---

# 14. 跟读练习

## 14.1 目标

跟读练习用于：

- 模仿发音
- 模仿重音
- 模仿节奏
- 模仿连读
- 模仿语调
- 让 Chunk 更容易在口语中调出

本版不自动给发音或语调打分。

## 14.2 基本流程

```text
播放原音
-> 显示 Chunk
-> 用户跟读
-> 可录音
-> 播放自己的录音
-> 与原音对比
```

## 14.3 跟读模式

### 立即跟读

```text
播放一句
-> 自动暂停
-> 用户跟读
```

### 循环模仿

```text
原音
-> 停顿
-> 原音
-> 停顿
```

### 录音对比

```text
播放原音
-> 开始录音
-> 用户跟读
-> 播放原音
-> 播放用户录音
```

首版优先实现：

- 立即跟读
- 循环模仿

## 14.4 Chunk 优先

听音和跟读练习不需要覆盖文本中的每一句话。

优先选择：

```text
用户已经高亮并真正想学习的 Chunk
```

推荐生成顺序：

```text
完整文本音频
-> 包含 Chunk 的句子音频
-> Chunk 单独音频
```

---

# 15. Listening 数据结构

## 15.1 AudioAsset

```ts
type AudioAsset = {
  id: string;
  textId: string;

  audioType:
    | "full_text"
    | "sentence"
    | "chunk"
    | "chunk_context";

  chunkId?: string;
  sentenceIndex?: number;

  voice?: string;
  speed?: number;

  blob: Blob;
  durationMs?: number;

  textVersion: string;
  createdAt: string;
};
```

## 15.2 ListeningExercise

```ts
type ListeningExercise = {
  id: string;
  textId: string;
  chunkId: string;
  audioAssetId: string;

  mode:
    | "echo_shadowing"
    | "listen_three_times"
    | "retell"
    | "text_compare";

  createdAt: string;
};
```

## 15.3 ListeningProgress

```ts
type ListeningProgress = {
  exerciseId: string;

  listenCount: number;
  completedThreeListensCount: number;
  retellCount: number;
  revealCount: number;
  shadowingCount: number;

  canRetell: boolean;
  canRetellMarkedAt?: string;

  lastTypedRetelling?: string;
  lastPractisedAt?: string;
};
```

本版不计算复杂得分。

---

# 16. Review 与 Listening 的关系

Review 和 Listening 使用同一个 Chunk，但保持两个独立练习系统。

```text
Review：
从文本、意义和上下文回忆表达

Listening：
从声音识别表达，并模仿说出来
```

同一个 Chunk 可以有：

```text
一个 Review Item
+
多个 Listening Exercise
```

它们共享：

- Chunk
- Text
- Source Intent

但分别保存：

- Review 阶段进度
- Listening 练习次数
- 跟读记录

避免把不同学习任务混在同一套熟练度中。

---

# 17. UI 结构

新版主要导航：

```text
Home
Library
Review
Listening
Prompts
Settings
```

## 17.1 Library

- 文本
- Source Intent
- Chunk
- Cloze
- 图片
- 音频入口

## 17.2 Review

- Stage 1
- Stage 2
- Stage 3
- 阶段完成次数
- 按文本分组

## 17.3 Listening

按文本展示：

- 全篇音频
- 句子 / 半句列表
- 高亮句子筛选
- 听三遍练习
- 复述与文本对比
- 回音跟读
- 可以复述标记

## 17.4 Settings

- Rewrite Model
- Question Model
- API Key
- TTS 设置
- Voice
- 数据导入导出

---

# 18. 开发阶段

## Phase 0：冻结当前版本

开发内容：

- 创建 Git Tag
- 备份当前代码
- 导出真实测试数据
- 整理 localStorage Key
- 保存一份含图片、Chunk、卡片和历史记录的测试数据

验收：

- 可以随时恢复 V2
- 旧数据可用于迁移测试

## Phase 1：React + TypeScript 迁移

开发内容：

- 创建 Vite 项目
- 建立路由和布局
- 迁移 Library
- 迁移文本详情
- 迁移 Source Intent
- 迁移 Chunk 与 Cloze
- 迁移 Review
- 迁移导入导出

要求：

```text
此阶段不增加新功能
```

验收：

- V2 核心流程全部可用
- 不再依赖单个 app.js
- 核心数据结构有 TypeScript 类型
- 主要逻辑可单独测试

## Phase 2：IndexedDB 与数据迁移

开发内容：

- 建立 Dexie Schema
- 将图片改为 Blob
- 增加 AudioAsset 表
- 实现 localStorage 迁移
- 实现 JSON 备份与恢复
- 增加数据库版本

验收：

- 真实旧数据可以迁移
- 迁移失败不破坏旧数据
- 图片正常显示
- 音频可以持久保存

## Phase 3：AI 改写

开发内容：

- AI 设置页
- Rewrite Model 配置
- Question Model 配置
- API Key 管理
- 自动改写
- 手动模式保留
- 输出结构校验
- 请求错误处理

验收：

- 可以直接在 OIO 内生成自然英文
- 失败时不丢失原始输入
- 生成结果可以编辑
- 两个模型可以分别配置

## Phase 4：Review V3

开发内容：

- ReviewItem 数据升级
- Stage 1
- Stage 2 的先显示后隐藏交互
- Stage 3
- 阶段完成次数与升级
- Question Model 问题生成
- 问题缓存
- 手动编辑问题
- 旧卡片迁移到 Stage 1

验收：

- Stage 1 保持普通填空
- Stage 2 在输入时自动隐藏高亮 Chunk
- Stage 2 仍然只填写原 Cloze
- 完成次数达到阈值后才升级
- Stage 3 可以根据问题回忆表达
- 系统不自动给答案评分

## Phase 5：完整文本音频

开发内容：

- TTS 设置
- 一键生成完整文本音频
- 保存 Voice 和语速
- 音频 Blob 存储
- 文本版本检查
- 播放器
- 循环与变速

验收：

- 每篇文本可以生成完整音频
- 刷新后音频仍然存在
- 文本修改后显示版本不一致
- 可以重新生成

## Phase 6：Chunk 音频与听音练习

开发内容：

- 为包含 Chunk 的句子生成音频
- 为 Chunk 单独生成音频
- Listening 独立栏目
- 先听后看
- 看文本听音
- 隐藏 Chunk 听音
- 练习次数记录
- 自我感受记录

验收：

- 每篇文本可以建立自己的听音练习
- 练习围绕用户选择的 Chunk
- 可以单独循环 Chunk 和句子
- 听音进度不影响 Review 进度

## Phase 7：跟读与录音对比

开发内容：

- 立即跟读
- 循环模仿
- 语速控制
- 快捷键

验收：

- 用户可以听原音后录下跟读
- 可以反复比较原音和录音
- 不进行自动发音打分

## Phase 8：测试与体验优化

开发内容：

- Review 流程测试
- 音频生成错误处理
- 录音权限错误处理
- API 取消与重试
- 键盘快捷键
- 移动端基础适配
- 大量数据性能测试
- 备份恢复测试

验收：

- 核心流程稳定
- API 失败有明确提示
- 音频失败不会破坏文本
- 旧数据和媒体文件可以恢复

---

# 19. MVP 范围

OIO V3 MVP：

```text
React + TypeScript
IndexedDB
旧数据迁移
高质量模型自动改写
便宜模型生成第三阶段问题
Review 三阶段
Stage 2 先显示后隐藏
简单阶段进度
可选生成全文或勾选句子音频
句子 / 半句切分
外部 TTS API 与自带 TTS
裸听三遍
复述与文本对比
回音跟读
可以复述标记
```

MVP 暂不包含：

- IELTS
- 发音评分
- 用户录音与录音对比
- AI 语义评分
- AI 自动推荐 Chunk
- 自动选 Cloze
- 云同步
- 用户系统
- 高级语音分析
- 字典功能
- 自动判断重音和语调
- 复杂复习算法
- 自动视频处理

---

# 20. 开发优先级

## P0：必须先完成

- 当前版本冻结
- React + TypeScript
- IndexedDB
- 旧数据迁移
- 数据备份
- Review 数据结构升级

## P1：V3 核心功能

- AI 自动改写
- 便宜模型生成问题
- Review Stage 1
- Review Stage 2
- Review Stage 3
- 阶段升级
- 可选生成全文或勾选句子音频
- 句子 / 半句切分
- 外部 TTS API 与自带 TTS
- 裸听三遍
- 复述与文本对比
- 回音跟读

## P2：重要增强

- 跟读
- 原音与录音对比
- 多 Voice
- 对话多角色音频
- 音频手动切分

## P3：以后再考虑

- 发音评分
- 用户录音与录音对比
- 语调分析
- 自动音频对齐
- ASR
- Tauri
- 云同步
- IELTS 特化
- 高级统计

---

# 21. 关键产品决策

## 决策 1：AI 只做两件事

```text
高质量模型负责改写
便宜模型负责提问题
```

其他 AI 功能暂不加入，避免软件变复杂，也避免不必要的 API 成本。

## 决策 2：Stage 2 不要求输入整个 Chunk

Stage 2 的重点是：

```text
先看到完整 Chunk
-> 输入时自动隐藏
-> 尝试在脑中回忆完整 Chunk
-> 最终仍然只填写原来的 Cloze
```

它是 Stage 1 和 Stage 3 之间的过渡。

## 决策 3：只有熟练度足够才升级

阶段不按时间自动切换，而是根据阶段完成次数推进：

```text
Stage 1
-> Stage 2
-> Stage 3
```

## 决策 4：本版不做自动评分

原因：

- Stage 3 的自然表达难以稳定自动判断
- 自动评分会增加 API 和产品复杂度
- 用户自己对照答案已经足够
- 当前重点是建立练习流程，而不是构建评分系统

## 决策 5：Listening 是独立栏目

原因：

- Review 训练表达回忆
- Listening 训练声音识别
- Shadowing 训练发音与语调模仿
- 三者共享 Chunk，但学习动作不同

## 决策 6：听音练习以用户 Chunk 为中心

不是把整篇文本的所有内容都变成重点练习。

优先练习：

```text
用户主动高亮并想学习的 Chunk
```

完整文本音频主要用于提供自然情景和整体语流。

## 决策 7：先不做 IELTS

当前还没有足够清晰、独特的 IELTS 产品设计，因此本版暂不加入 IELTS 模块。

---

# 22. 默认参数

当前建议默认值：

```text
Stage 1 完成 2 次
-> Stage 2

Stage 2 完成 3 次
-> Stage 3

Stage 3 完成 3 次
-> Mastered

查看答案不增加进度

Stage 2 输入框获得焦点时隐藏

Stage 2 允许重新查看一次
但本次不增加进度

完整文本首版使用单声音

Chunk 音频单独调用 TTS 生成

每个练习默认保留最近 3 个用户录音
```

这些数值都应作为集中配置，后续可以调整。

---

# 23. V3 完成标准

OIO V3 满足以下条件即可视为主要完成：

```text
旧数据可以安全迁移
+
项目结构可以继续维护
+
用户可以直接调用高质量模型改写
+
便宜模型可以生成第三阶段问题
+
卡牌可以经过三个渐进式 Review 阶段
+
Stage 2 可以先显示完整 Chunk，再自动隐藏
+
系统只记录阶段进度，不自动评分
+
每篇文本可以生成完整情景音频
+
用户可以针对自己的 Chunk 进行听音识别
+
用户可以播放原音并进行回音跟读
+
核心数据与音频可以备份和恢复
```

新版最终学习闭环：

```text
真实表达
-> 高质量改写
-> Source Intent
-> Chunk
-> 普通填空
-> 观察后隐藏
-> 问题驱动回忆
-> 完整情景听音
-> Chunk 声音识别
-> 跟读与语音语调模仿
```

---

# OIO 3.1：输入法模式配套工具

## 1. 功能定位

OIO 3.1 增加一个配套的快速输入工具。

它可以：

```text
作为 OIO 主应用的一部分开发
```

也可以：

```text
作为独立工具单独开发
```

它的主要目标不是替代系统输入法，而是提供一种类似“输入法中间层”的使用体验：

```text
用户准备输入或发送一段文本
-> 先在 OIO 输入框中写下原始内容
-> AI 将内容改写成自然英文
-> 用户可选择挖空需要学习的表达
-> 确认后将改写结果发送到原来的应用
-> 自动生成一张低优先级的一次性复习卡
```

这个工具适合：

- 即时聊天
- 社交媒体回复
- 邮件中的短句
- 网页表单
- 临时英文表达
- 不值得正式整理进 OIO 文本库，但仍想短暂复习的表达

---

## 2. 激活机制

输入法模式默认关闭，必须由用户主动激活。

可以支持：

- 设置页总开关
- 系统托盘开关
- 快捷键临时激活
- 针对特定应用启用
- 本次输入临时启用

基本状态：

```ts
type InputModeStatus =
  | "disabled"
  | "enabled"
  | "temporarily_paused";
```

默认行为：

```text
未激活
-> 不拦截任何输入或发送操作

已激活
-> 在发送文本前打开 OIO 输入窗口
```

必须提供明显的状态提示，避免用户忘记当前处于输入法模式。

---

## 3. 基本使用流程

```text
激活输入法模式
-> 用户准备在其他应用输入文本
-> 打开 OIO 快速输入框
-> 输入中文、英文或中英混合内容
-> 调用高质量 Rewrite Model
-> 显示自然英文改写
-> 用户确认或编辑
-> 进入可选挖空步骤
-> 发送改写文本到目标应用
-> 创建低优先级一次性卡片
```

更具体的界面流程：

```text
原始输入
-> AI 改写
-> 选择 Chunk / Cloze
-> 发送
```

---

## 4. 快速输入窗口

快速输入窗口应尽量轻量，避免打断用户正在进行的交流。

建议包含：

- 原始输入框
- 改写按钮
- 改写结果
- 重新生成
- 简单编辑
- 挖空
- 跳过挖空
- 取消
- 发送

快捷键建议：

```text
Enter：
确认当前步骤

Ctrl / Cmd + Enter：
立即发送

Esc：
取消并关闭

Tab：
在原文、改写和操作按钮之间切换
```

---

## 5. 发送拦截规则

输入法模式激活后，文本不能绕过工具直接发送。

标准流程：

```text
输入原始内容
-> 完成 AI 改写
-> 确认改写结果
-> 完成或跳过挖空
-> 才能发送
```

用户可以取消整个流程，但取消后：

```text
本次内容不会自动发送
```

需要提供一个明确的紧急绕过方式，例如：

```text
长按快捷键
或
点击“发送原文”
```

是否允许发送原文可以在设置中控制。

默认建议：

```text
允许手动选择“发送原文”
但不能无提示地绕过
```

---

## 6. AI 改写

输入法模式与 OIO 主应用共用 Rewrite Model。

调用内容通常较短，因此 Prompt 应针对即时表达优化：

- 保留原意
- 不擅自增加信息
- 输出适合直接发送的英文
- 保留原本语气
- 不输出解释
- 不输出多个版本，除非用户主动要求
- 根据目标场景调整正式程度

可选场景：

```text
Casual Chat
Work Message
Email
Social Post
Other
```

输入法模式不使用便宜模型改写。

原则仍然是：

```text
所有实际英文改写
-> 使用效果好的 Rewrite Model
```

---

## 7. 可选挖空流程

AI 改写完成后，用户可以选择要学习的 Chunk。

流程：

```text
在改写文本中高亮 Chunk
-> 选择 Chunk 内需要挖空的内容
-> 生成一次性卡片
```

如果用户不想挖空：

```text
点击 ×
-> 跳过挖空
-> 直接发送文本
```

这里的 `×` 只代表：

```text
跳过本次挖空
```

不代表取消发送或关闭整个输入窗口。

建议界面明确区分：

- `× 跳过挖空`
- `取消本次输入`
- `发送`

避免误操作。

---

## 8. 一次性卡片

输入法模式生成的卡片属于独立类型：

```ts
type EphemeralCard = {
  id: string;

  originalInput: string;
  rewrittenText: string;

  chunkText?: string;
  maskedText?: string;
  answer?: string;

  priority: "low";
  status:
    | "waiting"
    | "due"
    | "trash"
    | "deleted";

  dueAt: string;
  trashAt?: string;
  deleteAt?: string;

  createdAt: string;
};
```

卡片特征：

- 低优先级
- 不进入普通三阶段 Review
- 不影响正式卡片熟练度
- 不参与正式卡片毕业
- 生命周期很短
- 主要用于巩固刚刚使用过的表达

---

## 9. 一次性复习流程

一次性卡片复习时只显示两个按钮：

```text
Again
Easy
```

不提供：

- Good
- 普通熟练度
- 三阶段升级
- 复杂评分
- AI 评分

### Again

```text
点击 Again
-> 10 分钟后再次出现
```

规则：

```ts
dueAt = now + 10 minutes;
status = "waiting";
```

卡片仍然保持低优先级。

### Easy

```text
点击 Easy
-> 立即移入垃圾箱
-> 1 天后自动彻底删除
```

规则：

```ts
status = "trash";
trashAt = now;
deleteAt = now + 1 day;
```

垃圾箱中的卡片：

- 不再进入复习
- 可以在自动删除前恢复
- 1 天后自动清除

---

## 10. 低优先级队列

一次性卡片必须与正式 Review 队列分开。

复习顺序建议：

```text
1. 正式到期卡片
2. 重要卡片
3. 普通卡片
4. 一次性低优先级卡片
```

只有在以下情况之一满足时显示一次性卡片：

- 正式卡片已经复习完成
- 用户主动进入“一次性复习”
- 用户开启“混入低优先级卡片”
- 一次性卡片已多次延期

默认不应该让临时卡片挤占正式学习内容。

---

## 11. 没有挖空时的处理

如果用户跳过挖空，可以采用两种策略。

### 默认策略

```text
不生成卡片
只发送改写文本
```

### 可选策略

用户可以开启：

```text
未挖空时生成整句回忆卡
```

整句回忆卡可以显示原始输入，让用户回忆改写后的英文。

但考虑到本版希望保持简单，推荐默认：

```text
只有完成挖空时才生成一次性卡片
```

---

## 12. 与主应用的数据关系

如果配套工具与 OIO 一起开发：

```text
共用 IndexedDB
共用 Rewrite Model 设置
共用 API Key
共用 Chunk 选择组件
共用 Cloze 组件
```

但一次性卡片应单独存储：

```text
ephemeralCards
```

不能直接混入：

```text
reviewItems
```

如果配套工具独立开发，则需要提供：

- 本地独立数据库
- 与 OIO 主应用导入 / 同步一次性卡片的接口
- 共享设置文件
- 或通过本地协议发送数据

首版建议优先：

```text
与 OIO 主应用共用代码仓库
但作为独立模块开发
```

目录示例：

```text
src/
  features/
    input-mode/
      components/
      services/
      hooks/
      storage/
```

这样以后可以再拆成：

- 浏览器扩展
- 桌面悬浮工具
- 系统输入法辅助程序

---

## 13. 可能的实现形态

真正拦截所有系统输入通常需要较深的系统集成，因此可以分阶段实现。

### 第一阶段：快捷输入窗口

最容易实现，也最稳定。

```text
用户按全局快捷键
-> 打开快速输入窗口
-> 改写和挖空
-> 复制改写结果
-> 自动返回原应用
-> 用户粘贴或工具自动粘贴
```

### 第二阶段：浏览器扩展

适合：

- 网页聊天
- 邮箱
- 社交网站
- 网页表单

可以在输入框附近增加 OIO 按钮，发送前打开改写窗口。

### 第三阶段：桌面输入辅助工具

使用 Tauri 或原生能力：

- 系统托盘
- 全局快捷键
- 读取当前选中文本
- 写入剪贴板
- 自动粘贴
- 桌面悬浮窗口

### 第四阶段：真正的系统输入法

真正开发 Windows/macOS 输入法或输入法服务复杂度很高。

本阶段不建议直接做完整系统输入法，而应先实现：

```text
“类似输入法体验”的快捷输入中间层
```

---

## 14. 隐私与安全

输入法模式可能处理私人聊天和敏感文本，因此需要更严格的隐私设计。

必须做到：

- 只有激活后才运行
- 明确显示当前是否激活
- 不在后台记录所有键盘输入
- 只处理用户主动提交到快速输入框的文本
- 原始输入默认不长期保存
- API 请求历史默认不保存正文
- 一次性卡片自动删除
- API Key 不写入日志
- 支持一键暂停输入法模式

默认保存策略：

```text
未创建卡片：
发送后删除原始输入与改写缓存

创建一次性卡片：
只保存卡片需要的数据
Easy 后进入垃圾箱
1 天后自动删除
```

---

## 15. 激活设置

设置项建议：

```ts
type InputModeSettings = {
  enabled: boolean;

  activationMethod:
    | "global_shortcut"
    | "browser_button"
    | "manual";

  allowSendOriginal: boolean;
  autoCopyResult: boolean;
  autoPasteResult: boolean;

  createCardOnlyWhenClozeExists: boolean;

  mixEphemeralCardsIntoReview: boolean;

  againDelayMinutes: number;
  trashRetentionHours: number;
};
```

默认值：

```text
enabled = false

allowSendOriginal = true

autoCopyResult = true

autoPasteResult = false

createCardOnlyWhenClozeExists = true

mixEphemeralCardsIntoReview = false

againDelayMinutes = 10

trashRetentionHours = 24
```

---

## 16. 开发阶段

### Phase 3.1A：快速输入 MVP

开发内容：

- 输入法模式激活开关
- 快速输入窗口
- 原始输入
- 高质量 AI 改写
- 编辑改写结果
- 复制结果
- 可选挖空
- 创建一次性卡片
- 取消与跳过操作

验收：

- 未激活时不影响正常输入
- 激活后可以打开快速输入窗口
- 可以完成改写、挖空并复制结果
- 跳过挖空后可以直接输出文本
- 只有挖空后才默认生成卡片

### Phase 3.1B：一次性复习队列

开发内容：

- 独立低优先级队列
- Again
- Easy
- 10 分钟后重现
- 垃圾箱
- 24 小时自动删除
- 垃圾箱恢复

验收：

- Again 后准确延期 10 分钟
- Easy 后不再进入复习
- Easy 卡片在垃圾箱保留 24 小时
- 到期后自动彻底删除
- 临时卡片不会挤占正式 Review

### Phase 3.1C：桌面集成

开发内容：

- 全局快捷键
- 系统托盘
- 剪贴板写入
- 自动返回原应用
- 可选自动粘贴
- 激活状态提示

验收：

- 可以在其他应用中快速调用
- 输出后能回到原应用
- 用户随时可以暂停
- 不监听或保存无关输入

### Phase 3.1D：浏览器扩展，可选

开发内容：

- 网页输入框 OIO 按钮
- 发送前调用快速输入窗口
- 将结果写回输入框
- 网站白名单与黑名单

---

## 17. MVP 范围

OIO 3.1 MVP 建议包含：

```text
手动激活
+
全局快捷键或应用内入口
+
快速输入窗口
+
高质量模型改写
+
可选 Chunk / Cloze
+
跳过挖空
+
复制改写结果
+
低优先级一次性卡片
+
Again：10 分钟
+
Easy：垃圾箱
+
垃圾箱 1 天自动删除
```

MVP 暂不要求：

- 真正替代系统输入法
- 自动拦截所有发送按钮
- 自动读取所有输入框
- 手机系统输入法
- AI 评分
- 三阶段 Review
- 长期卡片调度
- 跨设备同步

---

## 18. 关键产品决策

### 决策 1：功能必须主动激活

输入法模式不会默认运行，也不会在后台记录用户的所有输入。

### 决策 2：改写后才能正常输出

激活模式下，标准流程必须先经过改写确认。

用户仍可明确选择：

```text
发送原文
```

但不能无提示绕过。

### 决策 3：挖空可以跳过

用户点击 `×` 即可跳过本次挖空，不应因为不想做卡片而阻止发送。

### 决策 4：一次性卡片独立存在

一次性卡片：

- 不加入三阶段 Review
- 不影响正式卡片进度
- 永远是低优先级
- 只使用 Again 和 Easy

### 决策 5：Easy 等于结束学习

Easy 后直接放入垃圾箱，不再安排长期复习。

保留 1 天只是为了防止误操作。

### 决策 6：先做输入中间层，不直接做系统输入法

先验证：

- 用户是否愿意每次输入前经过改写
- 挖空操作是否足够快
- 一次性卡片是否真的有价值

确认工作流有效后，再考虑更深的系统集成。

---

## 19. 3.1 完成标准

OIO 3.1 达到以下状态即可视为完成：

```text
用户可以主动激活输入法模式
+
在发送前打开快速输入框
+
使用高质量模型完成改写
+
可以选择 Chunk 和 Cloze
+
可以点击 × 跳过挖空
+
确认后将改写结果输出到目标应用
+
挖空内容会生成低优先级一次性卡片
+
一次性卡片只有 Again 和 Easy
+
Again 后 10 分钟再次出现
+
Easy 后进入垃圾箱
+
垃圾箱中的卡片 1 天后自动删除
+
未激活时不会影响正常输入
```
