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
[优先新学]
```

含义：

```text
复习全部：
按正常排序复习到期卡片

只复习重要：
只取 priority = important 的到期卡片

优先新学：
优先取新创建、复习次数少的卡片
```

## 4. 队列排序规则

### 4.1 默认排序

默认复习队列：

```text
1. important 优先
2. 到期时间更早优先
3. reviewCount 少的优先
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

### 4.3 优先新学

排序：

```text
1. reviewCount 少的优先
2. createdAt 新的优先
3. important 优先
```

这个模式适合当天新建了很多表达，只想先把新东西过一遍。

## 5. 每次复习数量控制

保持轻量。

建议：

```text
每次 session 最多 7 张
```

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

可以先不做独立页面，只在复习完成总结里显示。

后续可以加：

```text
今日复习记录页
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
- 优先新学
- 每组最多 7 张
- 复习完后显示继续复习

### 阶段四：总结和签到

- session summary
- 今日复习数
- 今日正确 / Again / Easy
- 连续复习天数

## 11. 暂不做

第一版暂不做：

- 复杂 FSRS / SM-2 算法
- 自定义每日上限
- 复杂日历热力图
- 已毕业卡片长期随机回顾
- 复杂优先级

## 12. 总结

推荐下一版复习系统：

```text
重要 / 普通 两档
连续 Easy 自动拉长间隔
掌握后毕业
每组最多 7 张
复习完给总结
还有内容时点击继续复习
首页显示今日复习和连续天数
```

这样能减少卡片堆积，同时保留继续复习的自由度。
