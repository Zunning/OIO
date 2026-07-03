# OIO 复习系统 V2 优化方案

## 1. 目标

当前复习系统已经能做到：

```text
到期卡片
-> 输入答案
-> 检查
-> Again / Good / Easy
-> 更新下次复习时间
```

下一步要解决的问题是：

- 不让卡片越堆越多
- 重要内容优先出现
- 简化优先级，不让选择变复杂
- 连续 Easy 后自动拉长间隔
- 复习完能看到今天学了什么
- 加一点签到 / 连续复习反馈，提升坚持感
- 复习量可以自己控制，默认每组 7 张
- 到期太多时，可以把高掌握但本轮没复习到的卡片一键移出复习队列

## 2. 卡片循环与毕业机制

### 2.1 不固定 3 次结束

不建议简单规定：

```text
复习 3 次后永远不再出现
```

原因：

- 如果用户前几次都选 Again，说明还没掌握
- 如果表达很重要，完全消失也不一定好
- 语言表达需要偶尔回看

### 2.2 推荐规则

使用“掌握进度 + 间隔拉长”的方式。

字段：

```ts
type Card = {
  reviewCount: number;
  masteryCount: number;
  easyStreak: number;
  isGraduated: boolean;
  graduatedAt?: string;
};
```

规则：

```text
Again：
- masteryCount 不增加
- easyStreak 清零
- 10 分钟后再出现

Good：
- masteryCount +1
- easyStreak 清零
- 明天再出现

Easy：
- masteryCount +1
- easyStreak +1
- 根据 easyStreak 拉长间隔
```

### 2.3 连续 Easy 间隔

建议：

```text
第 1 次 Easy：3 天后
连续第 2 次 Easy：7 天后
连续第 3 次 Easy：14 天后
连续第 4 次及以后：30 天后
```

这样用户连续觉得简单的卡片会自动减少出现频率。

### 2.4 毕业规则

毕业不代表永远删除，而是不进入普通日常复习。

建议：

```text
masteryCount >= 3 且 easyStreak >= 2：
-> 标记为 graduated
-> 默认不进入日常复习
```

以后可以加：

```text
复习已毕业卡片
长期回顾
随机回顾
```

第一版可以先让毕业卡片不进入普通复习队列。

## 3. 优先级机制

### 3.1 只做两个等级

不要做 High / Normal / Low 三档，太麻烦。

只做：

```text
重要
普通
```

字段：

```ts
priority: "important" | "normal";
```

默认：

```text
normal
```

### 3.2 设置位置

在生成卡片时选择：

```text
[ ] 重要
```

或者按钮：

```text
重要 / 普通
```

卡片继承 chunk 的优先级。

### 3.3 复习页按钮

复习页增加：

```text
[复习全部]
[只复习重要]
```

含义：

```text
复习全部：
按正常排序复习到期卡片

只复习重要：
只取 priority = important 的到期卡片
```

不单独做“优先新学”按钮。新学内容、重要内容、掌握度低的内容都交给默认排序机制自动处理。

## 4. 队列排序规则

### 4.1 默认排序

默认复习队列：

```text
1. important 优先
2. masteryCount 少的优先
3. reviewCount 少的优先
4. createdAt 新的优先
5. 到期时间更早优先
```

解释：

```text
重要的先来
还没掌握的先来
新学的先来
更早到期的作为兜底排序
```

### 4.2 只复习重要

筛选：

```text
priority = important
isGraduated = false
dueAt <= now
```

排序：

```text
到期时间更早优先
```

### 4.3 新学优先作为自动机制

不提供单独按钮，而是放进默认排序。

```text
如果两张卡片都到期：
reviewCount 更少的优先
createdAt 更新的优先
```

这样当天新建了很多表达时，新卡会自然靠前，不需要用户多选一个模式。

## 5. 每次复习数量控制

保持轻量。

默认：

```text
每次 session 最多 7 张
```

但这个数量应该允许用户自己设置。

### 5.1 卡组学习量设置

复习页增加：

```text
每组数量：[7]
```

可选值：

```text
5 / 7 / 10 / 15 / 20
```

默认：

```text
7
```

字段：

```ts
type ReviewSettings = {
  sessionSize: number;
};
```

第一版也可以不单独持久化设置，先存在 localStorage。

复习完后显示总结。

如果还有到期卡片，显示：

```text
[继续复习]
```

而不是一次把所有卡片压过来。

这样用户可以自己决定：

```text
今天到这里
还是再来一组
```

### 5.2 清理未复习到的高掌握卡片

如果到期卡片很多，每组只复习一部分，剩下的卡片可能越堆越多。

复习完成页可以增加一个轻量清理按钮：

```text
[移出未复习到的熟卡]
```

含义：

```text
对本轮没有进入 session、但已经掌握度较高的到期卡片，直接移出复习队列。
```

建议规则：

```text
筛选：
- dueAt <= now
- 未进入本次 session
- masteryCount >= 2
- isGraduated = false

操作：
- 标记为 graduated 或 archived
- 后续不再进入普通复习
```

按钮文案可以更明确：

```text
把未复习的熟卡移出复习
```

这里不建议物理删除卡片数据，而是从复习队列移除。

原因：

```text
以后还可以在卡片库里查到这张卡
也可以保留学习历史
如果后悔了，未来可以做“恢复复习”
```

实现上可以二选一：

```ts
isGraduated = true
```

或者更清楚地加：

```ts
isArchived = true
archivedAt = string
archiveReason = "bulk_cleanup"
```

第一版推荐直接复用：

```ts
isGraduated = true
graduatedAt = now
```

这样改动最小，效果就是不会再进入复习。

后续可配置：

```text
masteryCount >= 1 / 2 / 3
```

## 6. 复习完成总结

复习结束后显示一个 session summary。

内容：

```text
本组完成：7 张
正确：5 张
错误：2 张
重要卡片：3 张
毕业：1 张
```

再列出本组复习过的表达：

```text
1. in the mood for
   原始意图：不太想和别人寒暄
   结果：Good

2. on the fence about
   原始意图：有点犹豫
   结果：Again
```

按钮：

```text
[继续复习]
[把未复习的熟卡移出复习]
[回到首页]
```

## 7. 今日复习记录

像墨墨背单词一样，用户复习完后可以看到今天做了什么。

### 7.1 首页显示

首页增加今日概览：

```text
今日复习：12 张
正确：9 张
Again：3 张
毕业：2 张
连续复习：5 天
```

### 7.2 今日详情

增加一个“今日复习”详情区域，最初可以放在首页或签到日历弹层里。

```text
今天复习过的卡片
评分结果
是否毕业
对应原始意图
所属文本
```

字段来自 `ReviewLog`。

## 8. 签到系统

### 8.1 要不要做？

建议做一个轻量版。

不要做复杂打卡系统，只做：

```text
今天完成至少 1 张复习
-> 今日已签到
```

### 8.2 连续天数

字段可以从 ReviewLog 计算，不一定单独存。

也可以缓存：

```ts
type StudyStats = {
  lastStudyDate: string;
  streakDays: number;
};
```

第一版更简单：

```text
根据 ReviewLog 里的日期计算连续天数
```

### 8.3 UI

首页显示：

```text
今日已复习 12 张
连续 5 天
```

复习完成后显示：

```text
今日签到完成
连续 5 天
```

### 8.4 日历视图

增加一个轻量日历界面。

显示：

```text
本月日历
有复习记录的日期显示一个签到图标
今天完成复习后当天显示已签到
```

示例：

```text
2026 / 07

1  2✅  3✅  4
5  6   7✅  8
```

点击某一天：

```text
显示当天复习内容
```

内容包括：

```text
复习张数
Again / Good / Easy 数量
毕业数量
复习过的表达列表
对应原始意图
```

### 8.5 签到规则

```text
当天至少完成 1 张卡片复习
-> 当天算签到
```

签到不需要单独按钮，由复习行为自动触发。

## 9. 数据结构调整

### 9.1 Card

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
  priority: "important" | "normal";
  masteryCount: number;
  easyStreak: number;
  isGraduated: boolean;
  graduatedAt?: string;
  reviewCount: number;
  dueAt: string;
  lastReviewedAt?: string;
  createdAt: string;
};
```

### 9.2 ReviewLog

```ts
type ReviewLog = {
  id: string;
  cardId: string;
  rating: "again" | "good" | "easy";
  wasCorrect: boolean;
  reviewedAt: string;
};
```

可以后续再加：

```ts
sessionId?: string;
```

### 9.3 ReviewSettings

```ts
type ReviewSettings = {
  sessionSize: number;
};
```

默认：

```ts
{
  sessionSize: 7
}
```

## 10. MVP 实现顺序

### 阶段一：卡片字段

- 新增 priority
- 新增 masteryCount
- 新增 easyStreak
- 新增 isGraduated
- 兼容旧卡片默认值

### 阶段二：复习调度

- dueCards 排除 isGraduated
- Easy 连续两次后拉长间隔
- Good / Easy 增加 masteryCount
- Again 清空 easyStreak
- 达到毕业条件后标记 graduated

### 阶段三：复习入口

- 复习全部
- 只复习重要
- 默认排序自动优先 important / mastery 少 / reviewCount 少 / 新创建
- 每组数量可设置，默认 7 张
- 复习完后显示继续复习
- 复习完后支持把未复习的熟卡移出复习队列

### 阶段四：总结和签到

- session summary
- 今日复习数
- 今日正确 / Again / Easy
- 连续复习天数
- 签到日历
- 点击日期查看当天复习内容

### 阶段五：图片与导出扩展（后续）

这个功能先放进规划，不进入复习系统 V2 的核心实现。

目标是让 OIO 不只保存文本表达，也能保存当时的视觉语境，并且把卡片整理成可复用的图片/文本素材。

#### 5.1 文本图片附件

在一个文本条目里支持上传 1 张或多张图片，例如：

```text
原始输入 / 改写文本 / 中文翻译
+ 图片附件
```

用途：

- 记录某个场景、截图、聊天上下文或学习材料页面
- 让同一个文本的表达有更明确的视觉语境
- 之后复习时可以选择显示图片，帮助回忆当时为什么学这个表达

建议字段：

```ts
type TextImage = {
  id: string;
  textId: string;
  name: string;
  dataUrl: string;
  createdAt: string;
};
```

第一版可以先用 `localStorage` 保存 `dataUrl`，但要注意图片会让数据变大。后续如果图片多，可以改成 IndexedDB。

#### 5.2 批量导出卡片

增加一个导出功能，可以选择一些卡片，批量导出成：

```text
小标题图 + 文本
```

可能的导出形式：

```text
1. PNG 图片
2. Markdown
3. HTML
4. 纯文本
```

第一版推荐先做：

```text
选择卡片 -> 生成可复制的 Markdown / HTML
```

后续再做：

```text
选择卡片 -> 批量生成 PNG
```

导出内容可以包括：

- 卡片所属文本标题
- chunk / cloze 表达
- 原始意图备注
- 中文翻译
- 小标题
- 可选图片附件

#### 5.3 导出使用场景

这个功能主要服务于：

- 做笔记
- 发到其他工具里整理
- 生成复盘材料
- 做社媒/博客/学习记录截图
- 把某一批表达拿出去做二次加工

#### 5.4 暂时不进入核心复习逻辑

图片和导出不应该影响：

- 卡片调度
- mastery
- Easy / Good / Again
- 签到统计

它们更像内容管理和输出层能力，等复习系统稳定后再做会更清晰。

### 阶段六：音频与听音练习扩展（后续）

这个功能也先放进规划，不进入复习系统 V2 的核心实现。

目标是让 OIO 之后不只练“看见表达能不能想起来”，也能练“听到自然英文能不能反应出来”。

#### 6.1 文本音频附件

在一个文本条目里支持添加音频，例如：

```text
原始输入 / 改写文本 / 中文翻译
+ 音频附件
```

音频来源可以有几种：

- 用户自己上传音频
- 从别的地方下载后导入
- 后续接 TTS，把英文改写自动生成朗读音频
- 后续录自己的跟读音频

建议字段：

```ts
type TextAudio = {
  id: string;
  textId: string;
  name: string;
  dataUrl: string;
  duration?: number;
  createdAt: string;
};
```

第一版如果要做，建议先从“上传音频并在文本详情里播放”开始。和图片一样，音频会让数据变大，后续更适合放到 IndexedDB。

#### 6.2 卡片听音练习

之后可以给卡片增加一种复习模式：

```text
播放音频 -> 用户输入听到的表达 / 挖空答案 -> 检查拼写 -> Again / Good / Easy
```

可以支持两种难度：

```text
1. 听完整 chunk，填挖空部分
2. 听完整句子，输入目标表达
```

第一版更推荐做第 1 种，因为它和当前 cloze 机制最接近，改动小。

#### 6.3 听音复习的显示方式

复习时可以显示：

- 播放按钮
- 语境标题
- 被挖空的句子
- 可滚动上下文
- 输入框

检查答案后再显示：

- 正确答案
- 完整 chunk 高亮
- 原始意图
- 中文翻译

注意：听音练习时不要一开始就显示完整英文答案，否则会直接泄露。

#### 6.4 后续可扩展方向

后续可以继续加：

- 慢速 / 正常速度切换
- A-B 循环播放
- 跟读录音
- 对比自己的录音和原音
- 自动生成听写模式
- 按文本批量播放，像一个小型听力材料库

#### 6.5 暂时不进入核心复习逻辑

音频和听音练习暂时不影响：

- 三次毕业机制
- 到期卡片计算
- mastery
- 签到统计

等文字复习稳定后，再把听音作为一种新的 review mode 接进去会更好。

## 11. 暂不做

第一版暂不做：

- 复杂 FSRS / SM-2 算法
- 自定义每日上限
- 复杂日历热力图
- 已毕业卡片长期随机回顾
- 复杂优先级
- 复杂自定义调度算法
- 图片上传与图片复习
- 批量导出卡片为图片 / Markdown / HTML
- 音频上传与听音复习
- TTS 自动生成音频
- 跟读录音和发音对比

## 12. 总结

推荐下一版复习系统：

```text
重要 / 普通 两档
连续 Easy 自动拉长间隔
掌握后毕业
每组数量可设置，默认 7 张
默认自动优先重要、未掌握、新学内容
复习完给总结
还有内容时点击继续复习
可一键把未复习到的熟卡移出复习队列
首页显示今日复习和连续天数
签到日历可查看每天复习内容
```

这样能减少卡片堆积，同时保留继续复习的自由度。
