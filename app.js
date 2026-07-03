const STORAGE_KEY = "oio.v1";

const initialState = {
  texts: [],
  sourceIntents: [],
  chunks: [],
  cards: [],
  reviews: [],
  route: "home",
  selectedTextId: null,
  selectedChunkId: null,
  reviewQueue: [],
  reviewIndex: 0,
  reviewSettings: {
    sessionSize: 7,
  },
  reviewMode: "all",
  activeSessionCardIds: [],
  sessionResults: [],
  reviewSummary: null,
  showAnswer: false,
  reviewInput: "",
  reviewChecked: false,
  reviewCorrect: false,
  showSourceText: false,
  promptMode: "everyday",
  promptStyle: "dialogue",
  promptVariant: "british",
  promptLevel: "B2",
  promptIeltsSkill: "none",
  promptIeltsBand: "none",
  promptEmoji: "allow",
  promptDraft: "",
  promptCopied: "",
  exportTextIds: [],
  exportOptions: {
    format: "markdown",
    title: true,
    date: true,
    original: false,
    rewritten: true,
    translation: true,
  },
  exportMessage: "",
  exportPreview: "",
  modal: null,
  search: "",
  searchMode: "all",
};

let state = loadState();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...initialState };

  try {
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return { ...initialState };
  }
}

function persist() {
  const { route, selectedTextId, selectedChunkId, reviewQueue, reviewIndex, reviewMode, activeSessionCardIds, sessionResults, reviewSummary, showAnswer, reviewInput, reviewChecked, reviewCorrect, showSourceText, promptMode, promptStyle, promptVariant, promptLevel, promptIeltsSkill, promptIeltsBand, promptEmoji, promptDraft, promptCopied, exportTextIds, exportMessage, exportPreview, modal, search, ...data } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function setState(patch) {
  state = { ...state, ...patch };
  persist();
  render();
}

function setSearch(value, cursorPosition) {
  state = { ...state, search: value };
  render();
  const input = document.querySelector("#searchInput");
  if (!input) return;
  input.focus();
  const cursor = Number.isFinite(cursorPosition) ? cursorPosition : value.length;
  input.setSelectionRange(cursor, cursor);
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function formatDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatPlainDate(value) {
  if (!value) return "";
  return value.replaceAll("-", "/");
}

function dateKey(iso = nowIso()) {
  return new Date(iso).toISOString().slice(0, 10);
}

function splitTags(value) {
  return String(value || "")
    .split(/[，,\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const PROMPT_TEMPLATES = {
  dialogue: {
    label: "Dialogue",
    text: `You're my friendly English expression coach helping me express myself naturally.

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

Do not include any extra explanations outside the :::OIO block.`,
  },
  writing: {
    label: "Writing",
    text: `You're my thoughtful English writing coach.

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

Do not include any extra explanations outside the :::OIO block.`,
  },
  work: {
    label: "Work",
    text: `You're my English communication coach for work situations.

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

Do not include any extra explanations outside the :::OIO block.`,
  },
  casual: {
    label: "Casual",
    text: `You're my funny, warm English expression coach.

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

Do not include any extra explanations outside the :::OIO block.`,
  },
  story: {
    label: "Story",
    text: `You're my English storytelling coach.

No matter what language I use, rewrite my message into natural English as a short story or vivid personal narrative based on the intended meaning, not the original wording. Preserve my emotional tone, details, and point of view. Do not summarize.

Also provide a conversational Chinese translation of the original message.

Output must follow this exact format:

:::OIO
title: Generate a short Chinese title, no more than 12 characters.
tags: Generate 2-4 short tags in English, separated by commas.
style: story

original:
Paste my original message here exactly.

rewrite:
Write one natural English paragraph here. No line breaks.

translation:
Write one conversational Chinese paragraph here. No line breaks.
:::

Do not include any extra explanations outside the :::OIO block.`,
  },
};

const CEFR_LEVELS = {
  A1: { vocab: "约 500-1,000 词", note: "非常基础，适合简单日常句子。" },
  A2: { vocab: "约 1,000-2,000 词", note: "基础日常交流，句子短而直接。" },
  B1: { vocab: "约 2,000-3,500 词", note: "能处理常见生活和工作话题。" },
  B2: { vocab: "约 4,000-6,000 词", note: "自然清楚，适合多数真实表达。" },
  C1: { vocab: "约 8,000-10,000 词", note: "更灵活、更地道，允许较丰富表达。" },
  C2: { vocab: "10,000+ 词", note: "接近高阶母语表达，但避免故意炫技。" },
};

const IELTS_BANDS = {
  "5.5": { vocab: "约 3,000-4,000 词", cefr: "B1-B2", note: "表达清楚优先，避免复杂词堆叠。" },
  "6.0": { vocab: "约 4,000-5,000 词", cefr: "B2", note: "自然、准确，适当加入常用地道表达。" },
  "6.5": { vocab: "约 5,000-6,500 词", cefr: "B2", note: "更流畅，词汇选择更具体。" },
  "7.0": { vocab: "约 6,000-8,000 词", cefr: "B2-C1", note: "自然灵活，允许更细腻的表达。" },
  "7.5": { vocab: "约 8,000-9,000 词", cefr: "C1", note: "表达成熟，有较强的语域控制。" },
  "8.0": { vocab: "约 9,000-10,000+ 词", cefr: "C1-C2", note: "高级、自然，但仍保持像真人会说的话。" },
};

const IELTS_SKILLS = {
  none: "不指定",
  speaking: "Speaking",
  writing: "Writing",
  listening: "Listening",
  reading: "Reading",
};

function promptSettingsFromState(overrides = {}) {
  const mode = overrides.mode || state.promptMode || "everyday";
  const ieltsSkill = overrides.ieltsSkill || state.promptIeltsSkill || "speaking";
  const ieltsBand = overrides.ieltsBand || state.promptIeltsBand || "6.5";
  return {
    mode,
    style: overrides.style || state.promptStyle || "dialogue",
    variant: overrides.variant || state.promptVariant || "british",
    level: overrides.level || state.promptLevel || "B2",
    ieltsSkill: mode === "ielts" && ieltsSkill === "none" ? "speaking" : ieltsSkill,
    ieltsBand: mode === "ielts" && ieltsBand === "none" ? "6.5" : ieltsBand,
    emoji: overrides.emoji || state.promptEmoji || "allow",
  };
}

function promptSummary(settings) {
  const cefr = CEFR_LEVELS[settings.level] || CEFR_LEVELS.B2;
  const ielts = IELTS_BANDS[settings.ieltsBand];
  const variant = settings.variant === "american" ? "American English" : "British English";
  const emoji = settings.emoji === "allow" ? "Emoji: allowed when natural" : "Emoji: off";
  const parts = [`${variant}`, emoji];
  if (settings.mode === "ielts") parts.push(`IELTS ${IELTS_SKILLS[settings.ieltsSkill]} ${settings.ieltsBand}: ${ielts.vocab}, ${ielts.cefr}`);
  else parts.push(`CEFR ${settings.level}: ${cefr.vocab}`);
  return parts.join(" · ");
}

function promptConstraints(settings) {
  const cefr = CEFR_LEVELS[settings.level] || CEFR_LEVELS.B2;
  const ielts = IELTS_BANDS[settings.ieltsBand];
  const variant = settings.variant === "american" ? "Use American English spelling, vocabulary, and phrasing." : "Use British English spelling, vocabulary, and phrasing.";
  const difficulty =
    settings.mode === "ielts"
      ? `Tune the rewrite for IELTS ${IELTS_SKILLS[settings.ieltsSkill]} Band ${settings.ieltsBand}. Approximate CEFR reference: ${ielts.cefr}. Estimated vocabulary range: ${ielts.vocab}. ${ielts.note}`
      : `Keep the rewrite around CEFR ${settings.level}. Estimated vocabulary range: ${cefr.vocab}. ${cefr.note}`;
  const mode =
    settings.mode === "ielts"
      ? "Mode: IELTS training. Prioritise natural exam-appropriate language for the selected IELTS skill. Do not also apply a separate CEFR difficulty target."
      : "Mode: everyday expression. Prioritise natural personal expression. Do not force IELTS exam style.";
  const emoji = settings.emoji === "allow" ? "Emoji are allowed only when they feel natural and match the emotional tone. Do not overuse them." : "Do not use emoji in the rewrite.";

  return `Language settings:
- ${variant}
- ${mode}
- ${difficulty}
- ${emoji}
- Avoid rare or showy vocabulary unless it is genuinely natural for the intended meaning.
- Do not generate tags in the output. Leave the tags field blank.`;
}

function templateStyleFor(settings, requestedStyle) {
  if (settings.mode !== "ielts") return requestedStyle;
  return ["writing", "reading"].includes(settings.ieltsSkill) ? "writing" : "dialogue";
}

function promptFor(style, original = "", settingsOverride = {}) {
  const settings = promptSettingsFromState({ ...settingsOverride, style });
  const templateStyle = templateStyleFor(settings, style);
  const template = PROMPT_TEMPLATES[templateStyle] || PROMPT_TEMPLATES.dialogue;
  const text = template.text
    .replace("tags: Generate 2-4 short tags in English, separated by commas.", "tags:")
    .replace("Do not include any extra explanations outside the :::OIO block.", `${promptConstraints(settings)}\n\nDo not include any extra explanations outside the :::OIO block.`);
  if (!original.trim()) return text;
  return `${text}\n\nMy original message:\n${original.trim()}`;
}

function parseOioBlock(value) {
  const match = String(value || "").match(/:::OIO\s*([\s\S]*?)\s*:::/i);
  if (!match) return null;
  const body = match[1].trim();
  const title = (body.match(/^title:\s*(.*)$/im)?.[1] || "").trim();
  const tags = (body.match(/^tags:\s*(.*)$/im)?.[1] || "").trim();
  const style = (body.match(/^style:\s*(.*)$/im)?.[1] || "dialogue").trim();
  const readBlock = (name) => {
    const blockMatch = body.match(new RegExp(`^${name}:\\s*\\n([\\s\\S]*?)(?=\\n\\w+:\\s*\\n|$)`, "im"));
    return (blockMatch?.[1] || "").trim();
  };

  return {
    title,
    tags: splitTags(tags),
    style,
    original: readBlock("original"),
    rewrite: readBlock("rewrite"),
    translation: readBlock("translation"),
  };
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  return ok;
}

function sentenceFor(text, selected) {
  const cleaned = text.replace(/\s+/g, " ");
  const index = cleaned.indexOf(selected);
  if (index < 0) return selected;

  const before = cleaned.slice(0, index);
  const after = cleaned.slice(index + selected.length);
  const start = Math.max(before.lastIndexOf("."), before.lastIndexOf("!"), before.lastIndexOf("?"), before.lastIndexOf("。"));
  const tailStops = [after.indexOf("."), after.indexOf("!"), after.indexOf("?"), after.indexOf("。")].filter((n) => n >= 0);
  const endOffset = tailStops.length ? Math.min(...tailStops) + 1 : after.length;
  return `${cleaned.slice(start + 1, index)}${selected}${after.slice(0, endOffset)}`.trim();
}

function clozeFrom(sentence, answer) {
  const blanks = answer
    .trim()
    .split(/\s+/)
    .map(() => "___")
    .join(" ");
  return sentence.replace(answer, blanks);
}

function clozeFromSelection(sentence, chunkText, selectedIndexes) {
  const tokens = chunkText.match(/\S+/g) || [];
  const selectedSet = new Set(selectedIndexes);
  const maskedChunk = tokens.map((token, index) => (selectedSet.has(index) ? "___" : token)).join(" ");
  return {
    maskedChunk,
    clozeText: sentence.includes(chunkText) ? sentence.replace(chunkText, maskedChunk) : clozeFrom(sentence, selectedIndexes.map((index) => tokens[index]).join(" ")),
  };
}

function blanksFor(answer) {
  return answer
    .trim()
    .split(/\s+/)
    .map(() => "___")
    .join(" ");
}

function maskAnswer(value, answer) {
  if (!answer) return value;
  return value.split(answer).join(blanksFor(answer));
}

function maskedChunkFor(card, chunk) {
  if (card.maskedChunk) return card.maskedChunk;
  return maskAnswer(chunk?.selectedText || "", card.answer);
}

function highlightBlanks(value) {
  return escapeHtml(value).replace(/(?:___(?:\s+|$))+/, (match) => `<mark>${match.trimEnd()}</mark>${match.endsWith(" ") ? " " : ""}`);
}

function highlightMaskedChunk(value, chunkText, answer, savedMaskedChunk = "") {
  const maskedChunk = savedMaskedChunk || maskAnswer(chunkText || "", answer);
  if (!maskedChunk || !value.includes(maskedChunk)) return highlightBlanks(value);
  return escapeHtml(value).replace(escapeHtml(maskedChunk), `<mark>${escapeHtml(maskedChunk)}</mark>`);
}

function renderSafeContext(fullText, card) {
  const chunk = state.chunks.find((item) => item.id === card.chunkId);
  const maskedChunk = maskedChunkFor(card, chunk);
  const maskedText = chunk?.selectedText ? fullText.split(chunk.selectedText).join(maskedChunk) : maskAnswer(fullText, card.answer);
  const maskedSentence = chunk?.selectedText ? card.sentence.replace(chunk.selectedText, maskedChunk) : maskAnswer(card.sentence, card.answer);
  const highlightedSentence = `<span class="current-context">${highlightMaskedChunk(maskedSentence, chunk?.selectedText, card.answer, maskedChunk)}</span>`;
  const escapedText = escapeHtml(maskedText);
  const escapedSentence = escapeHtml(maskedSentence);
  return escapedText.replace(escapedSentence, highlightedSentence);
}

function renderSourceTextForReview(text, sourceIntent) {
  if (!text?.originalText) return "";
  let html = escapeHtml(text.originalText);
  if (sourceIntent?.selectedText) {
    const escaped = escapeHtml(sourceIntent.selectedText);
    html = html.replace(escaped, `<mark>${escaped}</mark>`);
  }
  return html;
}

function normalizeAnswer(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function isWordChar(char) {
  return /[A-Za-z0-9']/.test(char || "");
}

function expandSelectionToWord(fullText, selected) {
  const trimmed = selected.trim();
  const index = fullText.indexOf(trimmed);
  if (index < 0) return trimmed;

  let start = index;
  let end = index + trimmed.length;
  while (start > 0 && isWordChar(fullText[start - 1])) start -= 1;
  while (end < fullText.length && isWordChar(fullText[end])) end += 1;
  return fullText.slice(start, end).trim();
}

function dueCards() {
  const now = Date.now();
  return sortReviewCards(state.cards.filter((card) => !isGraduatedCard(card) && new Date(card.dueAt).getTime() <= now));
}

function cardsForText(textId) {
  return state.cards.filter((card) => card.textId === textId);
}

function successfulReviewCount(card) {
  if (Number.isFinite(card.masteryCount)) return card.masteryCount;
  return state.reviews.filter((review) => review.cardId === card.id && review.rating !== "again").length;
}

function cardPriority(card) {
  return card.priority === "important" ? "important" : "normal";
}

function isGraduatedCard(card) {
  return Boolean(card.isGraduated) || successfulReviewCount(card) >= 3;
}

function cardCreatedTime(card) {
  return new Date(card.createdAt || 0).getTime() || 0;
}

function sortReviewCards(cards) {
  return cards.slice().sort((a, b) => {
    if (cardPriority(a) !== cardPriority(b)) return cardPriority(a) === "important" ? -1 : 1;
    const masteryDiff = successfulReviewCount(a) - successfulReviewCount(b);
    if (masteryDiff) return masteryDiff;
    const reviewDiff = (a.reviewCount || 0) - (b.reviewCount || 0);
    if (reviewDiff) return reviewDiff;
    const createdDiff = cardCreatedTime(b) - cardCreatedTime(a);
    if (createdDiff) return createdDiff;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

function cardsForReviewMode(mode = "all") {
  const due = dueCards();
  if (mode === "important") return due.filter((card) => cardPriority(card) === "important");
  if (mode && mode !== "all") return due.filter((card) => card.textId === mode);
  return due;
}

function reviewSettings() {
  return {
    sessionSize: Number(state.reviewSettings?.sessionSize) || 7,
  };
}

function reviewsForDate(day) {
  return state.reviews.filter((review) => dateKey(review.reviewedAt) === day);
}

function todayReviews() {
  return reviewsForDate(todayDate());
}

function streakDays() {
  const days = new Set(state.reviews.map((review) => dateKey(review.reviewedAt)));
  let streak = 0;
  const cursor = new Date(todayDate());
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function cardLabel(card) {
  const chunk = state.chunks.find((item) => item.id === card.chunkId);
  return chunk?.selectedText || card.answer || card.clozeText || "Untitled card";
}

function filteredTexts() {
  return state.texts
    .filter((item) => {
      const q = state.search.trim().toLowerCase();
      if (!q) return true;
      const tags = (item.tags || []).join(" ");
      const searchable = {
        all: [item.title, item.rewrittenText, item.originalText, item.translation, item.note, tags],
        tags: [tags],
        text: [item.rewrittenText, item.originalText, item.translation, item.note],
        title: [item.title],
      };
      return (searchable[state.searchMode] || searchable.all).join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function exportOptions() {
  return {
    format: state.exportOptions?.format || "markdown",
    title: state.exportOptions?.title !== false,
    date: state.exportOptions?.date !== false,
    original: Boolean(state.exportOptions?.original),
    rewritten: state.exportOptions?.rewritten !== false,
    translation: state.exportOptions?.translation !== false,
  };
}

function selectedExportTexts() {
  const selected = new Set(state.exportTextIds || []);
  return state.texts
    .filter((text) => selected.has(text.id))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function formatExportText(text, options) {
  const fields = [];
  if (options.format === "markdown") {
    if (options.title) fields.push(`## ${text.title || "Untitled"}`);
    if (options.date) fields.push(`**Date:** ${formatPlainDate(text.sourceDate) || "-"}`);
    if (options.original) fields.push(`**Original**\n\n${text.originalText || "-"}`);
    if (options.rewritten) fields.push(`**Rewrite**\n\n${text.rewrittenText || "-"}`);
    if (options.translation) fields.push(`**Translation**\n\n${text.translation || "-"}`);
    return fields.join("\n\n");
  }

  if (options.title) fields.push(text.title || "Untitled");
  if (options.date) fields.push(`Date: ${formatPlainDate(text.sourceDate) || "-"}`);
  if (options.original) fields.push(`Original:\n${text.originalText || "-"}`);
  if (options.rewritten) fields.push(`Rewrite:\n${text.rewrittenText || "-"}`);
  if (options.translation) fields.push(`Translation:\n${text.translation || "-"}`);
  return fields.join("\n\n");
}

function buildTextExport(texts, options = exportOptions()) {
  return texts.map((text) => formatExportText(text, options)).join(options.format === "markdown" ? "\n\n---\n\n" : "\n\n==========\n\n");
}

function reviewGroupsForDate(day) {
  const groups = new Map();
  reviewsForDate(day).forEach((review) => {
    const card = state.cards.find((item) => item.id === review.cardId);
    const textId = card?.textId || "unknown";
    if (!groups.has(textId)) {
      const text = state.texts.find((item) => item.id === textId);
      groups.set(textId, {
        textId,
        title: text?.title || "已删除文本",
        reviews: [],
      });
    }
    groups.get(textId).reviews.push({ review, card });
  });
  return [...groups.values()].sort((a, b) => b.reviews.length - a.reviews.length || a.title.localeCompare(b.title));
}

function ratingCounts(reviews) {
  return {
    again: reviews.filter((review) => review.rating === "again").length,
    good: reviews.filter((review) => review.rating === "good").length,
    easy: reviews.filter((review) => review.rating === "easy").length,
  };
}

function chunksForText(textId) {
  return state.chunks.filter((chunk) => chunk.textId === textId);
}

function sourceIntentsForText(textId) {
  return state.sourceIntents.filter((intent) => intent.textId === textId);
}

function sourceIntentFor(id) {
  return state.sourceIntents.find((intent) => intent.id === id);
}

function routeTo(route, extra = {}) {
  setState({ route, showAnswer: false, reviewInput: "", reviewChecked: false, reviewCorrect: false, ...extra });
}

function appShell(content) {
  const nav = [
    ["home", "□", "文本"],
    ["prompts", "✎", "Prompts"],
    ["chunks", "◇", "Chunks"],
    ["cards", "◧", "卡片"],
    ["review", "▷", "复习"],
  ];

  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <h1>OIO</h1>
          <p>把自己的表达变成可复习的英文能力。</p>
        </div>
        <nav class="nav">
          ${nav
            .map(
              ([route, icon, label]) => `
                <button class="${state.route === route ? "active" : ""}" data-route="${route}">
                  <span>${icon}</span><span>${label}</span>
                </button>
              `,
            )
            .join("")}
        </nav>
      </aside>
      <main class="main">${content}</main>
      ${state.modal ? renderModal() : ""}
    </div>
  `;
}

function renderHome() {
  const todaysReviews = todayReviews();
  const againCount = todaysReviews.filter((review) => review.rating === "again").length;
  const easyCount = todaysReviews.filter((review) => review.rating === "easy").length;
  const texts = filteredTexts();

  return `
    <div class="topbar">
      <div>
        <h2>文本库</h2>
        <div class="subtle">${state.texts.length} 篇文本，${state.chunks.length} 个 chunk，${state.cards.length} 张卡片</div>
      </div>
      <button data-open-modal="text">＋ 新建文本</button>
    </div>

    <div class="grid three">
      <div class="panel stat"><span class="subtle">今日到期</span><strong>${dueCards().length}</strong></div>
      <div class="panel stat"><span class="subtle">已收集 chunk</span><strong>${state.chunks.length}</strong></div>
      <div class="panel stat"><span class="subtle">连续复习</span><strong>${streakDays()} 天</strong></div>
    </div>

    <div class="grid two" style="margin-top: 16px;">
      <section class="panel">
        <div class="section-head">
          <div>
            <h3>今日复习</h3>
            <p class="subtle">${todaysReviews.length ? `已复习 ${todaysReviews.length} 张 · Again ${againCount} · Easy ${easyCount}` : "今天还没有复习记录。"}</p>
          </div>
        </div>
        ${renderTodayReviewList(todaysReviews)}
      </section>
      <section class="panel">
        <h3>签到日历</h3>
        ${renderStudyCalendar()}
      </section>
    </div>

    <div class="panel search-panel" style="margin-top: 16px;">
      <label>
        搜索
        <input id="searchInput" value="${escapeHtml(state.search)}" placeholder="输入关键词" />
      </label>
      <label>
        搜索范围
        <select id="searchMode">
          <option value="all" ${state.searchMode === "all" ? "selected" : ""}>全部</option>
          <option value="tags" ${state.searchMode === "tags" ? "selected" : ""}>标签</option>
          <option value="text" ${state.searchMode === "text" ? "selected" : ""}>文本</option>
          <option value="title" ${state.searchMode === "title" ? "selected" : ""}>标题</option>
        </select>
      </label>
    </div>

    ${renderTextExportPanel(texts)}

    <div class="grid" style="margin-top: 16px;">
      ${
        texts.length
          ? texts.map(renderTextItem).join("")
          : `<div class="empty">还没有文本。先粘贴一段 AI 改写后的英文，OIO 就有第一块地基了。</div>`
      }
    </div>
  `;
}

function renderTextExportPanel(texts) {
  const selectedCount = selectedExportTexts().length;
  const options = exportOptions();
  return `
    <section class="panel export-panel">
      <div class="section-head">
        <div>
          <h3>批量导出</h3>
          <p class="subtle">选择文本后复制成 Markdown 或纯文本，后面可以接按组导出图片。</p>
        </div>
        <div class="toolbar">
          <button type="button" class="secondary" data-select-visible-texts ${texts.length ? "" : "disabled"}>选择当前筛选</button>
          <button type="button" class="ghost" data-clear-export-selection ${selectedCount ? "" : "disabled"}>清空选择</button>
        </div>
      </div>
      <div class="export-options">
        <label>格式
          <select id="exportFormat">
            <option value="markdown" ${options.format === "markdown" ? "selected" : ""}>Markdown</option>
            <option value="plain" ${options.format === "plain" ? "selected" : ""}>纯文本</option>
          </select>
        </label>
        ${[
          ["title", "标题"],
          ["date", "日期"],
          ["original", "原文"],
          ["rewritten", "改写"],
          ["translation", "翻译"],
        ]
          .map(
            ([key, label]) => `
              <label class="checkbox-line">
                <input type="checkbox" data-export-option="${key}" ${options[key] ? "checked" : ""} />
                <span>${label}</span>
              </label>
            `,
          )
          .join("")}
      </div>
      <div class="toolbar" style="margin-top: 12px;">
        <button type="button" data-copy-text-export ${selectedCount ? "" : "disabled"}>复制导出内容</button>
        <span class="subtle">已选择 ${selectedCount} 篇</span>
        ${state.exportMessage ? `<span class="subtle">${escapeHtml(state.exportMessage)}</span>` : ""}
      </div>
      ${state.exportPreview ? `<textarea class="export-preview" readonly>${escapeHtml(state.exportPreview)}</textarea>` : ""}
    </section>
  `;
}

function renderTodayReviewList(reviews) {
  if (!reviews.length) return `<div class="empty compact-empty">完成 1 张复习后，今天就会自动签到。</div>`;
  const groups = reviewGroupsForDate(todayDate());
  return `
    <div class="mini-list">
      ${groups
        .map((group) => {
          const counts = ratingCounts(group.reviews.map((item) => item.review));
          return `<button type="button" class="mini-row" data-calendar-group="${todayDate()}|${group.textId}">
            <span>${escapeHtml(group.title)}</span>
            <strong>${group.reviews.length} 张${counts.again ? ` · Again ${counts.again}` : ""}</strong>
          </button>`;
        })
        .join("")}
    </div>
  `;
}

function renderStudyCalendar() {
  const today = new Date(todayDate());
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leading = first.getUTCDay();
  const reviewDays = new Set(state.reviews.map((review) => dateKey(review.reviewedAt)));
  const cells = [];
  for (let i = 0; i < leading; i += 1) cells.push(`<span class="calendar-cell empty-cell"></span>`);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const checked = reviewDays.has(key);
    cells.push(`
      <button type="button" class="calendar-cell ${checked ? "checked" : ""}" data-calendar-day="${key}">
        <span>${day}</span>
        ${checked ? "<strong>✓</strong>" : ""}
      </button>
    `);
  }
  return `
    <div class="calendar-title">${year} / ${String(month + 1).padStart(2, "0")}</div>
    <div class="calendar-grid">${cells.join("")}</div>
  `;
}

function renderPrompts() {
  const settings = promptSettingsFromState();
  const style = settings.style;
  const promptText = promptFor(style, state.promptDraft || "", settings);
  const isIelts = settings.mode === "ielts";

  return `
    <div class="topbar">
      <div>
        <h2>Prompts</h2>
        <div class="subtle">手动复制到 ChatGPT，再把 OIO 格式结果粘回来解析。</div>
      </div>
      <div class="toolbar">
        <button data-copy-prompt="plain">复制提示词</button>
        <button class="secondary" data-open-chatgpt>打开 ChatGPT</button>
      </div>
    </div>

    <div class="grid two">
      <section class="panel">
        <h3>${isIelts ? "IELTS 技能" : "风格"}</h3>
        <div class="segmented">
          ${
            isIelts
              ? Object.entries(IELTS_SKILLS)
                  .filter(([key]) => key !== "none")
                  .map(
                    ([key, label]) => `
                      <button class="${settings.ieltsSkill === key ? "active" : ""}" data-prompt-ielts-skill="${key}">${label}</button>
                    `,
                  )
                  .join("")
              : Object.entries(PROMPT_TEMPLATES)
                  .map(
                    ([key, item]) => `
                      <button class="${style === key ? "active" : ""}" data-prompt-style="${key}">${item.label}</button>
                    `,
                  )
                  .join("")
          }
        </div>
        <div class="grid two" style="margin-top: 14px;">
          <label>模式
            <select id="promptMode">
              <option value="everyday" ${settings.mode === "everyday" ? "selected" : ""}>Everyday Expression</option>
              <option value="ielts" ${settings.mode === "ielts" ? "selected" : ""}>IELTS Training</option>
            </select>
          </label>
          <label>英语变体
            <select id="promptVariant">
              <option value="british" ${settings.variant === "british" ? "selected" : ""}>British English</option>
              <option value="american" ${settings.variant === "american" ? "selected" : ""}>American English</option>
            </select>
          </label>
          ${
            settings.mode === "ielts"
              ? `<label>IELTS 分数
                  <select id="promptIeltsBand">
                    ${Object.keys(IELTS_BANDS).map((band) => `<option value="${band}" ${settings.ieltsBand === band ? "selected" : ""}>${band}</option>`).join("")}
                  </select>
                </label>`
              : `<label>CEFR 难度
                  <select id="promptLevel">
                    ${Object.keys(CEFR_LEVELS).map((level) => `<option value="${level}" ${settings.level === level ? "selected" : ""}>${level}</option>`).join("")}
                  </select>
                </label>`
          }
          <label>Emoji
            <select id="promptEmoji">
              <option value="allow" ${settings.emoji === "allow" ? "selected" : ""}>允许自然使用</option>
              <option value="off" ${settings.emoji === "off" ? "selected" : ""}>不要 emoji</option>
            </select>
          </label>
        </div>
        <div class="level-note">
          ${escapeHtml(promptSummary(settings))}
        </div>
        <label style="margin-top: 14px;">
          原始输入，可选
          <textarea id="promptDraft" placeholder="把你想表达的话放这里，然后复制提示词 + 原始输入">${escapeHtml(state.promptDraft || "")}</textarea>
        </label>
        <div class="toolbar" style="margin-top: 12px;">
          <button data-copy-prompt="withInput">复制提示词 + 原始输入</button>
          <button class="secondary" data-open-modal="text">新建文本</button>
        </div>
        ${state.promptCopied ? `<p class="subtle">${escapeHtml(state.promptCopied)}</p>` : ""}
      </section>

      <section class="panel">
        <h3>提示词预览</h3>
        <textarea class="prompt-preview" readonly>${escapeHtml(promptText)}</textarea>
      </section>
    </div>
  `;
}

function renderTextItem(item) {
  const chunkCount = chunksForText(item.id).length;
  const cardCount = cardsForText(item.id).length;
  const selected = (state.exportTextIds || []).includes(item.id);
  return `
    <article class="item">
      <div class="row">
        <div class="selectable-title">
          <label class="text-select" title="选择用于批量导出">
            <input type="checkbox" data-export-text="${item.id}" ${selected ? "checked" : ""} />
          </label>
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="subtle">${formatPlainDate(item.sourceDate)}${item.sourceDate ? " · " : ""}${escapeHtml(item.rewrittenText.slice(0, 180))}${item.rewrittenText.length > 180 ? "..." : ""}</p>
            <div class="chips">
              <span class="chip">${item.textType || "dialogue"}</span>
              <span class="chip">${chunkCount} chunks</span>
              <span class="chip">${cardCount} cards</span>
              ${(item.tags || []).map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}
            </div>
          </div>
        </div>
        <div class="toolbar">
          <button class="secondary" data-view-text="${item.id}">打开</button>
          <button class="ghost" data-edit-text="${item.id}">编辑</button>
          <button class="ghost danger" data-delete-text="${item.id}">删除</button>
        </div>
      </div>
    </article>
  `;
}

function renderTextDetail() {
  const text = state.texts.find((item) => item.id === state.selectedTextId);
  if (!text) return renderHome();

  const chunks = chunksForText(text.id);
  const cards = cardsForText(text.id);

  return `
    <div class="topbar">
      <div>
        <h2>${escapeHtml(text.title)}</h2>
        <div class="subtle">${formatPlainDate(text.sourceDate)}${text.sourceDate ? " · " : ""}${chunks.length} 个 chunk，${cards.length} 张卡片。选中文本后按 Enter 直接挖空。</div>
      </div>
      <div class="toolbar">
        <button class="secondary" data-route="home">返回</button>
        ${text.originalText ? `<button class="secondary" data-open-source-intents="${text.id}">原始意图</button>` : ""}
        <button data-create-chunk="${text.id}">挖空选中内容</button>
      </div>
    </div>

    <div class="split">
      <section>
        <div id="reader" class="reader">${renderHighlightedText(text)}</div>
        ${
          text.translation
            ? `<div class="muted-box" style="margin-top: 14px;">
                <p class="subtle">中文翻译</p>
                <p>${escapeHtml(text.translation)}</p>
              </div>`
            : ""
        }
      </section>
      <aside class="grid">
        ${
          text.originalText
            ? `<div class="panel">
                <h3>原始意图</h3>
                <div class="grid">
                  ${
                    sourceIntentsForText(text.id).length
                      ? sourceIntentsForText(text.id).map((intent) => `<div class="muted-box"><p><strong>${escapeHtml(intent.note)}</strong></p><p class="subtle">${escapeHtml(intent.selectedText)}</p></div>`).join("")
                      : `<div class="empty">还没有标出原始意图。</div>`
                  }
                </div>
              </div>`
            : ""
        }
        <div class="panel">
          <h3>Chunk</h3>
          <div class="grid">
            ${
              chunks.length
                ? chunks.map(renderChunkMini).join("")
                : `<div class="empty">选中左侧文本，保存第一个 chunk。</div>`
            }
          </div>
        </div>
        <div class="panel">
          <h3>卡片</h3>
          <div class="grid">
            ${
              cards.length
                ? cards.map(renderCardMini).join("")
                : `<div class="empty">从 chunk 里选择单词挖空，生成卡片。</div>`
            }
          </div>
        </div>
      </aside>
    </div>
  `;
}

function renderHighlightedText(text) {
  let html = escapeHtml(text.rewrittenText);
  chunksForText(text.id)
    .slice()
    .sort((a, b) => b.selectedText.length - a.selectedText.length)
    .forEach((chunk) => {
      const escapedChunk = escapeHtml(chunk.selectedText);
      html = html.replace(escapedChunk, `<mark title="${escapeHtml(chunk.explanation || "chunk")}">${escapedChunk}</mark>`);
    });
  return html;
}

function renderHighlightedSourceText(text) {
  let html = escapeHtml(text.originalText || "");
  sourceIntentsForText(text.id)
    .slice()
    .sort((a, b) => b.selectedText.length - a.selectedText.length)
    .forEach((intent) => {
      const escapedIntent = escapeHtml(intent.selectedText);
      html = html.replace(escapedIntent, `<mark title="${escapeHtml(intent.note)}">${escapedIntent}</mark>`);
    });
  return html;
}

function renderChunkMini(chunk) {
  const sourceIntent = sourceIntentFor(chunk.sourceIntentId);
  return `
    <div class="muted-box">
      <p><strong>${escapeHtml(chunk.selectedText)}</strong></p>
      <p class="subtle">${escapeHtml(chunk.explanation || "未添加解释")}</p>
      ${sourceIntent ? `<p class="subtle">原始意图：${escapeHtml(sourceIntent.note)}</p>` : ""}
      <div class="toolbar" style="margin-top: 10px;">
        <button class="small" data-open-cloze="${chunk.id}">挖空</button>
      </div>
    </div>
  `;
}

function renderCardMini(card) {
  return `
    <div class="muted-box">
      <p>${escapeHtml(card.clozeText)}</p>
      <p class="subtle">答案：${escapeHtml(card.answer)}</p>
    </div>
  `;
}

function renderChunks() {
  const chunks = state.chunks.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return `
    <div class="topbar">
      <div>
        <h2>Chunk 表达库</h2>
        <div class="subtle">先收集完整词块，再决定具体挖哪些词。</div>
      </div>
    </div>
    <div class="grid two">
      ${
        chunks.length
          ? chunks.map(renderChunkItem).join("")
          : `<div class="empty">还没有 chunk。打开文本后选中表达即可保存。</div>`
      }
    </div>
  `;
}

function renderChunkItem(chunk) {
  const text = state.texts.find((item) => item.id === chunk.textId);
  const sourceIntent = sourceIntentFor(chunk.sourceIntentId);
  return `
    <article class="item">
      <h3>${escapeHtml(chunk.selectedText)}</h3>
      <p>${escapeHtml(chunk.sentence)}</p>
      <p class="subtle">${escapeHtml(chunk.explanation || "未添加解释")}</p>
      ${sourceIntent ? `<p class="subtle">原始意图：${escapeHtml(sourceIntent.note)}</p>` : ""}
      <div class="chips">
        <span class="chip">${escapeHtml(text?.title || "未知文本")}</span>
        ${chunk.tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="toolbar" style="margin-top: 12px;">
        <button data-open-cloze="${chunk.id}">挖空</button>
        <button class="secondary" data-view-text="${chunk.textId}">回到语境</button>
        <button class="ghost danger" data-delete-chunk="${chunk.id}">删除</button>
      </div>
    </article>
  `;
}

function renderCards() {
  const cards = state.cards.slice().sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  return `
    <div class="topbar">
      <div>
        <h2>卡片库</h2>
        <div class="subtle">一张卡片只测试一个明确表达点。</div>
      </div>
      <button data-start-review="all">开始复习</button>
    </div>
    <div class="grid">
      ${
        cards.length
          ? cards.map(renderCardItem).join("")
          : `<div class="empty">还没有卡片。从 chunk 内选择单词挖空即可生成。</div>`
      }
    </div>
  `;
}

function renderCardItem(card) {
  const text = state.texts.find((item) => item.id === card.textId);
  const sourceIntent = sourceIntentFor(card.sourceIntentId);
  const masteryCount = successfulReviewCount(card);
  const reviewStatus = isGraduatedCard(card) ? "已毕业" : `掌握 ${masteryCount}/3`;
  return `
    <article class="item">
      <p class="cloze">${escapeHtml(card.clozeText)}</p>
      <p class="answer">${escapeHtml(card.answer)}</p>
      ${sourceIntent ? `<p class="subtle">原始意图：${escapeHtml(sourceIntent.note)}</p>` : ""}
      <p class="subtle">来源：${escapeHtml(text?.title || "未知文本")} · ${cardPriority(card) === "important" ? "重要 · " : ""}${reviewStatus} · 下次：${formatDate(card.dueAt)} · 复习 ${card.reviewCount || 0} 次</p>
      <div class="toolbar" style="margin-top: 12px;">
        <button class="secondary" data-view-text="${card.textId}">回到语境</button>
        <button class="ghost danger" data-delete-card="${card.id}">删除</button>
      </div>
    </article>
  `;
}

function renderReview() {
  if (state.reviewQueue.length) return renderReviewSession();
  if (state.reviewSummary) return renderReviewSummary();

  const due = dueCards();
  const importantDue = due.filter((card) => cardPriority(card) === "important");
  const settings = reviewSettings();
  const grouped = state.texts
    .map((text) => ({ text, cards: due.filter((card) => card.textId === text.id) }))
    .filter((group) => group.cards.length);

  return `
    <div class="topbar">
      <div>
        <h2>复习</h2>
        <div class="subtle">自动优先重要、未掌握和新学内容。每张卡片三次成功后毕业。</div>
      </div>
    </div>
    <section class="panel review-controls">
      <div class="toolbar">
        <button data-start-review="all">复习全部</button>
        <button class="secondary" data-start-review="important" ${importantDue.length ? "" : "disabled"}>只复习重要</button>
      </div>
      <label class="inline-select">每组数量
        <select id="reviewSessionSize">
          ${[5, 7, 10, 15, 20].map((size) => `<option value="${size}" ${settings.sessionSize === size ? "selected" : ""}>${size}</option>`).join("")}
        </select>
      </label>
      <p class="subtle">全部到期 ${due.length} 张，重要 ${importantDue.length} 张。</p>
    </section>
    <div class="grid">
      ${
        grouped.length
          ? grouped.map(renderReviewPack).join("")
          : `<div class="empty">今天没有到期卡片。你可以继续收集新 chunk。</div>`
      }
    </div>
  `;
}

function renderReviewPack(group) {
  const importantCount = group.cards.filter((card) => cardPriority(card) === "important").length;
  return `
    <article class="item">
      <div class="row">
        <div>
          <h3>${escapeHtml(group.text.title)}</h3>
          <p class="subtle">${group.cards.length} 张到期卡片${importantCount ? `，${importantCount} 张重要` : ""}。</p>
        </div>
        <button data-start-review="${group.text.id}">复习这一组</button>
      </div>
    </article>
  `;
}

function renderReviewSummary() {
  const summary = state.reviewSummary;
  const remaining = cardsForReviewMode(summary.mode).length;
  return `
    <div class="topbar">
      <div>
        <h2>本组完成</h2>
        <div class="subtle">今天已自动签到。还想练的话可以继续下一组。</div>
      </div>
    </div>
    <section class="panel">
      <div class="grid three">
        <div class="stat flat"><span class="subtle">完成</span><strong>${summary.total}</strong></div>
        <div class="stat flat"><span class="subtle">正确</span><strong>${summary.correct}</strong></div>
        <div class="stat flat"><span class="subtle">毕业</span><strong>${summary.graduated}</strong></div>
      </div>
      <div class="toolbar" style="margin-top: 14px;">
        <button data-continue-review ${remaining ? "" : "disabled"}>继续复习</button>
        <button class="secondary" data-cleanup-familiar ${remaining ? "" : "disabled"}>把未复习的熟卡移出复习</button>
        <button class="ghost" data-clear-review-summary>回到复习首页</button>
      </div>
      <p class="subtle" style="margin-top: 10px;">还有 ${remaining} 张到期卡片。熟卡清理会把本组没复习到、但已经掌握 2 次以上的到期卡片标记为毕业。${summary.cleaned ? `本次已移出 ${summary.cleaned} 张。` : ""}</p>
    </section>
    <section class="panel" style="margin-top: 16px;">
      <h3>这组复习了什么</h3>
      <div class="mini-list">
        ${summary.results
          .map((result) => {
            const card = state.cards.find((item) => item.id === result.cardId) || result.card;
            const sourceIntent = sourceIntentFor(card?.sourceIntentId);
            return `<div class="mini-row static">
              <span>${escapeHtml(card ? cardLabel(card) : "已删除卡片")}${sourceIntent ? ` · ${escapeHtml(sourceIntent.note)}` : ""}</span>
              <strong>${escapeHtml(result.rating)}${result.graduated ? " · 毕业" : ""}</strong>
            </div>`;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderReviewSession() {
  const card = state.reviewQueue[state.reviewIndex];
  const text = state.texts.find((item) => item.id === card.textId);
  const chunk = state.chunks.find((item) => item.id === card.chunkId);
  const sourceIntent = sourceIntentFor(card.sourceIntentId || chunk?.sourceIntentId);
  const progress = `${state.reviewIndex + 1} / ${state.reviewQueue.length}`;

  return `
    <div class="topbar">
      <div>
        <h2>语境复习</h2>
        <div class="subtle">${escapeHtml(text?.title || "")} · ${progress}</div>
      </div>
      <button class="secondary" data-stop-review>退出</button>
    </div>
    <div class="review-layout">
      <section class="panel review-card">
        <p class="subtle">当前句</p>
        ${
          sourceIntent
            ? `<div class="source-intent-pill">
                <span>原始意图</span>
                <strong>${escapeHtml(sourceIntent.note)}</strong>
              </div>`
            : ""
        }
        <p class="cloze">${highlightMaskedChunk(card.clozeText, chunk?.selectedText, card.answer, maskedChunkFor(card, chunk))}</p>
        <form id="reviewAnswerForm" class="grid">
          <label>
            输入答案
            <input id="reviewInput" name="reviewInput" autocomplete="off" value="${escapeHtml(state.reviewInput)}" placeholder="直接输入挖空表达" ${state.reviewChecked ? "disabled" : ""} />
          </label>
          ${state.reviewChecked ? "" : `<button type="submit">检查</button>`}
        </form>
        ${
          state.reviewChecked
            ? `<div class="${state.reviewCorrect ? "result-ok" : "result-bad"}">
                ${state.reviewCorrect ? "Correct" : "Not quite"}
              </div>
              <p class="subtle">你的答案：${escapeHtml(state.reviewInput || "未输入")}</p>
              <p class="answer">正确答案：${escapeHtml(card.answer)}</p>
              <p class="subtle">${escapeHtml(card.focusNote || card.hint || "")}</p>
              <div class="toolbar">
                <button class="secondary" data-rate="again">Again</button>
                <button data-rate="good">Good</button>
                <button data-rate="easy">Easy</button>
              </div>`
            : ""
        }
      </section>
      <section class="muted-box review-context-box">
        <p class="subtle">上下文</p>
        <div class="review-context">${renderSafeContext(text?.rewrittenText || card.sentence, card)}</div>
      </section>
      ${
        text?.originalText
          ? `<section class="muted-box review-context-box">
              <div class="section-head">
                <p class="subtle">原始输入</p>
                <button class="small secondary" data-toggle-source-text>${state.showSourceText ? "隐藏" : "显示"}</button>
              </div>
              ${
                state.showSourceText
                  ? `<div class="review-context source-review">${renderSourceTextForReview(text, sourceIntent)}</div>`
                  : sourceIntent
                    ? `<p class="subtle">已绑定：${escapeHtml(sourceIntent.note)}</p>`
                    : `<p class="subtle">这张卡片还没有绑定原始意图。</p>`
              }
            </section>`
          : ""
      }
    </div>
  `;
}

function renderModal() {
  if (state.modal.type === "text") return renderTextModal();
  if (state.modal.type === "sourceIntent") return renderSourceIntentModal();
  if (state.modal.type === "cloze") return renderClozeModal();
  if (state.modal.type === "dailyReview") return renderDailyReviewModal();
  return "";
}

function renderDailyReviewModal() {
  const reviews = reviewsForDate(state.modal.day);
  const groups = reviewGroupsForDate(state.modal.day);
  const selectedGroup = state.modal.textId ? groups.find((group) => group.textId === state.modal.textId) : null;
  const counts = ratingCounts(reviews);
  return `
    <div class="modal">
      <div class="modal-box">
        <div class="section-head">
          <div>
            <h3>${selectedGroup ? escapeHtml(selectedGroup.title) : `${formatPlainDate(state.modal.day)} 复习记录`}</h3>
            <p class="subtle">${reviews.length ? `${groups.length} 组 · ${reviews.length} 张 · Again ${counts.again} · Good ${counts.good} · Easy ${counts.easy}` : "这一天还没有复习记录。"}</p>
          </div>
          <div class="toolbar">
            ${selectedGroup ? `<button type="button" class="secondary" data-calendar-day="${state.modal.day}">返回组列表</button>` : ""}
            <button type="button" class="secondary" data-close-modal>关闭</button>
          </div>
        </div>
        <div class="mini-list" style="margin-top: 14px;">
          ${
            reviews.length
              ? selectedGroup
                ? renderDailyGroupChunks(selectedGroup)
                : renderDailyGroupList(state.modal.day, groups)
              : `<div class="empty compact-empty">当天没有内容。</div>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderDailyGroupList(day, groups) {
  return groups
    .map((group) => {
      const counts = ratingCounts(group.reviews.map((item) => item.review));
      return `<button type="button" class="mini-row" data-calendar-group="${day}|${group.textId}">
        <span>${escapeHtml(group.title)}</span>
        <strong>${group.reviews.length} 张${counts.again ? ` · Again ${counts.again}` : ""}</strong>
      </button>`;
    })
    .join("");
}

function renderDailyGroupChunks(group) {
  return group.reviews
    .slice()
    .reverse()
    .map(({ review, card }) => {
      const sourceIntent = card ? sourceIntentFor(card.sourceIntentId) : null;
      return `<div class="mini-row static">
        <span>${escapeHtml(card ? cardLabel(card) : "已删除卡片")}${sourceIntent ? ` · ${escapeHtml(sourceIntent.note)}` : ""}</span>
        <strong>${escapeHtml(review.rating)}</strong>
      </div>`;
    })
    .join("");
}

function renderTextModal() {
  const item = state.modal.id ? state.texts.find((text) => text.id === state.modal.id) : null;
  const modalPromptStyle = state.modal.promptStyle || item?.textType || state.promptStyle || "dialogue";
  const modalSettings = promptSettingsFromState({
    mode: state.modal.promptMode,
    style: modalPromptStyle,
    variant: state.modal.promptVariant,
    level: state.modal.promptLevel,
    ieltsSkill: state.modal.promptIeltsSkill,
    ieltsBand: state.modal.promptIeltsBand,
    emoji: state.modal.promptEmoji,
  });
  const modalOriginal = state.modal.originalText ?? item?.originalText ?? "";
  const modalTitle = state.modal.title ?? item?.title ?? "";
  const modalTextType = state.modal.textType ?? item?.textType ?? modalPromptStyle ?? "dialogue";
  const modalRewrittenText = state.modal.rewrittenText ?? item?.rewrittenText ?? "";
  const modalTranslation = state.modal.translation ?? item?.translation ?? "";
  const modalNote = state.modal.note ?? item?.note ?? "";
  const modalTags = state.modal.tags ?? item?.tags?.join(", ") ?? "";
  return `
    <div class="modal">
      <form class="modal-box" id="textForm">
        <h3>${item ? "编辑文本" : "新建文本"}</h3>
        <div class="grid">
          <div class="muted-box">
            <div class="section-head">
              <div>
                <strong>手动 AI 工作流</strong>
                <p class="subtle">复制提示词到 ChatGPT，再把 :::OIO 结果粘回来自动解析。</p>
              </div>
              <button type="button" class="secondary small" data-open-chatgpt>打开 ChatGPT</button>
            </div>
            <div class="grid two" style="margin-top: 12px;">
              <label>模式
                <select id="modalPromptMode">
                  <option value="everyday" ${modalSettings.mode === "everyday" ? "selected" : ""}>Everyday Expression</option>
                  <option value="ielts" ${modalSettings.mode === "ielts" ? "selected" : ""}>IELTS Training</option>
                </select>
              </label>
              ${
                modalSettings.mode === "ielts"
                  ? `<label>IELTS 技能
                      <select id="modalPromptIeltsSkill">
                        ${Object.entries(IELTS_SKILLS)
                          .filter(([key]) => key !== "none")
                          .map(([key, label]) => `<option value="${key}" ${modalSettings.ieltsSkill === key ? "selected" : ""}>${label}</option>`)
                          .join("")}
                      </select>
                    </label>`
                  : `<label>提示词风格
                      <select id="modalPromptStyle">
                        ${Object.entries(PROMPT_TEMPLATES)
                          .map(([key, prompt]) => `<option value="${key}" ${modalPromptStyle === key ? "selected" : ""}>${prompt.label}</option>`)
                          .join("")}
                      </select>
                    </label>`
              }
              <label>英语变体
                <select id="modalPromptVariant">
                  <option value="british" ${modalSettings.variant === "british" ? "selected" : ""}>British English</option>
                  <option value="american" ${modalSettings.variant === "american" ? "selected" : ""}>American English</option>
                </select>
              </label>
              ${
                modalSettings.mode === "ielts"
                  ? `<label>IELTS 分数
                      <select id="modalPromptIeltsBand">
                        ${Object.keys(IELTS_BANDS).map((band) => `<option value="${band}" ${modalSettings.ieltsBand === band ? "selected" : ""}>${band}</option>`).join("")}
                      </select>
                    </label>`
                  : `<label>CEFR 难度
                      <select id="modalPromptLevel">
                        ${Object.keys(CEFR_LEVELS).map((level) => `<option value="${level}" ${modalSettings.level === level ? "selected" : ""}>${level}</option>`).join("")}
                      </select>
                    </label>`
              }
              <label>Emoji
                <select id="modalPromptEmoji">
                  <option value="allow" ${modalSettings.emoji === "allow" ? "selected" : ""}>允许自然使用</option>
                  <option value="off" ${modalSettings.emoji === "off" ? "selected" : ""}>不要 emoji</option>
                </select>
              </label>
              <label>AI 输出
                <textarea id="aiOutputPaste" placeholder="把 ChatGPT 输出的 :::OIO ... ::: 粘贴到这里"></textarea>
              </label>
            </div>
            <div class="level-note">${escapeHtml(promptSummary(modalSettings))}</div>
            <div class="toolbar" style="margin-top: 12px;">
              <button type="button" data-copy-modal-prompt>复制提示词 + 原始输入</button>
              <button type="button" class="secondary" data-parse-ai-output>自动解析</button>
            </div>
            ${state.modal.parseMessage ? `<p class="subtle">${escapeHtml(state.modal.parseMessage)}</p>` : ""}
          </div>
          <label>标题<input name="title" required value="${escapeHtml(modalTitle)}" /></label>
          <label>文本类型
            <select name="textType">
              ${["story", "expression_set", "dialogue", "writing", "work", "casual", "other"]
                .map((type) => `<option value="${type}" ${modalTextType === type ? "selected" : ""}>${type}</option>`)
                .join("")}
            </select>
          </label>
          <label>日期<input type="date" name="sourceDate" value="${escapeHtml(item?.sourceDate || todayDate())}" /></label>
          <label>原始输入，可选<textarea name="originalText">${escapeHtml(modalOriginal)}</textarea></label>
          <label>英文改写，必填<textarea name="rewrittenText" required>${escapeHtml(modalRewrittenText)}</textarea></label>
          <label>中文翻译<textarea name="translation">${escapeHtml(modalTranslation)}</textarea></label>
          <label>备注<textarea name="note">${escapeHtml(modalNote)}</textarea></label>
          <label>标签<input name="tags" value="${escapeHtml(modalTags)}" placeholder="daily, speaking" /></label>
          <div class="toolbar">
            <button type="submit">保存</button>
            <button type="button" class="secondary" data-close-modal>取消</button>
          </div>
        </div>
      </form>
    </div>
  `;
}

function renderSourceIntentModal() {
  const text = state.texts.find((item) => item.id === state.modal.textId);
  if (!text) return "";
  const intents = sourceIntentsForText(text.id);

  return `
    <div class="modal">
      <div class="modal-box source-modal">
        <div class="section-head">
          <div>
            <h3>先标出你想说但说不出来的地方</h3>
            <p class="subtle">不用标很多，只标那些接下来想看看英文怎么自然表达的地方。</p>
          </div>
        </div>
        <div id="sourceReader" class="reader source-reader">${renderHighlightedSourceText(text)}</div>
        <div class="toolbar" style="margin-top: 12px;">
          <button type="button" data-save-source-intent="${text.id}">保存选中意图</button>
          <button type="button" class="secondary" data-finish-source-intents="${text.id}">完成，进入英文文本</button>
          <button type="button" class="ghost" data-finish-source-intents="${text.id}">跳过</button>
        </div>
        <div class="grid" style="margin-top: 16px;">
          ${
            intents.length
              ? intents.map(renderSourceIntentItem).join("")
              : `<div class="empty">选中原始输入里的一个意思，保存为原始意图。</div>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderSourceIntentItem(intent) {
  return `
    <div class="muted-box">
      <p><strong>${escapeHtml(intent.selectedText)}</strong></p>
      <label>
        备注
        <input value="${escapeHtml(intent.note)}" data-source-note="${intent.id}" />
      </label>
    </div>
  `;
}

function renderClozeModal() {
  const chunk = state.chunks.find((item) => item.id === state.modal.chunkId);
  if (!chunk) return "";

  const intents = sourceIntentsForText(chunk.textId);
  const defaultIntentId = chunk.sourceIntentId || (intents.length === 1 ? intents[0].id : "");
  const tokens = chunk.selectedText.match(/\S+/g) || [];
  const selectedIndexes = state.modal.selectedIndexes || [];
  const answer = selectedIndexes.map((index) => tokens[index]).join(" ");
  const clozeData = selectedIndexes.length ? clozeFromSelection(chunk.sentence, chunk.selectedText, selectedIndexes) : { maskedChunk: chunk.selectedText, clozeText: chunk.sentence };

  return `
    <div class="modal">
      <form class="modal-box" id="clozeForm">
        <h3>在 Chunk 内挖空</h3>
        <div class="grid">
          <div class="muted-box">
            <p><strong>${escapeHtml(chunk.selectedText)}</strong></p>
            <p class="subtle">chunk 已高亮保存。点击要挖空的词，建议一次只测一个表达点。</p>
          </div>
          <div class="token-list">
            ${tokens
              .map(
                (token, index) => `
                  <button type="button" class="token ${selectedIndexes.includes(index) ? "selected" : ""}" data-token-index="${index}">
                    ${escapeHtml(token)}
                  </button>
                `,
              )
              .join("")}
          </div>
          <label>答案<input name="answer" required value="${escapeHtml(answer)}" /></label>
          <input type="hidden" name="maskedChunk" value="${escapeHtml(clozeData.maskedChunk)}" />
          <label>挖空句<textarea name="clozeText" required>${escapeHtml(clozeData.clozeText)}</textarea></label>
          ${
            intents.length
              ? `<label>绑定原始意图
                  <select name="sourceIntentId">
                    <option value="">不绑定</option>
                    ${intents
                      .map((intent) => `<option value="${intent.id}" ${defaultIntentId === intent.id ? "selected" : ""}>${escapeHtml(intent.note)}</option>`)
                      .join("")}
                  </select>
                </label>`
              : ""
          }
          <label>提示 / 备注<input name="focusNote" placeholder="比如：in the mood for = 有心情做某事" /></label>
          <label class="checkbox-line">
            <input type="checkbox" name="priority" value="important" />
            <span>重要，复习时优先出现</span>
          </label>
          <div class="toolbar">
            <button type="submit">保存卡片</button>
            <button type="button" class="secondary" data-close-modal>取消</button>
          </div>
        </div>
      </form>
    </div>
  `;
}

function render() {
  let content = "";
  if (state.route === "home") content = renderHome();
  if (state.route === "prompts") content = renderPrompts();
  if (state.route === "text") content = renderTextDetail();
  if (state.route === "chunks") content = renderChunks();
  if (state.route === "cards") content = renderCards();
  if (state.route === "review") content = renderReview();
  document.querySelector("#app").innerHTML = appShell(content);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-route], [data-open-modal], [data-close-modal], [data-view-text], [data-edit-text], [data-delete-text], [data-create-chunk], [data-open-cloze], [data-token-index], [data-delete-chunk], [data-delete-card], [data-start-review], [data-continue-review], [data-cleanup-familiar], [data-clear-review-summary], [data-calendar-day], [data-calendar-group], [data-select-visible-texts], [data-clear-export-selection], [data-copy-text-export], [data-rate], [data-stop-review], [data-save-source-intent], [data-finish-source-intents], [data-toggle-source-text], [data-open-source-intents], [data-prompt-style], [data-prompt-ielts-skill], [data-copy-prompt], [data-open-chatgpt], [data-copy-modal-prompt], [data-parse-ai-output]");
  if (!target) return;

  if (target.dataset.route) routeTo(target.dataset.route);

  if (target.dataset.promptStyle) setState({ promptStyle: target.dataset.promptStyle, promptCopied: "" });

  if (target.dataset.promptIeltsSkill) setState({ promptIeltsSkill: target.dataset.promptIeltsSkill, promptCopied: "" });

  if (target.dataset.copyPrompt) copyPrompt(target.dataset.copyPrompt);

  if (target.dataset.openChatgpt !== undefined) window.open("https://chatgpt.com/", "_blank");

  if (target.dataset.openModal === "text") setState({ modal: { type: "text" } });

  if (target.dataset.openSourceIntents) setState({ modal: { type: "sourceIntent", textId: target.dataset.openSourceIntents } });

  if (target.dataset.closeModal !== undefined) setState({ modal: null });

  if (target.dataset.viewText) routeTo("text", { selectedTextId: target.dataset.viewText });

  if (target.dataset.editText) setState({ modal: { type: "text", id: target.dataset.editText } });

  if (target.dataset.deleteText) deleteText(target.dataset.deleteText);

  if (target.dataset.createChunk) openChunkModal(target.dataset.createChunk);

  if (target.dataset.openCloze) setState({ modal: { type: "cloze", chunkId: target.dataset.openCloze, selectedIndexes: [] } });

  if (target.dataset.tokenIndex !== undefined) toggleToken(Number(target.dataset.tokenIndex));

  if (target.dataset.deleteChunk) deleteChunk(target.dataset.deleteChunk);

  if (target.dataset.deleteCard) deleteCard(target.dataset.deleteCard);

  if (target.dataset.startReview) startReview(target.dataset.startReview);

  if (target.dataset.continueReview !== undefined) startReview(state.reviewSummary?.mode || "all");

  if (target.dataset.cleanupFamiliar !== undefined) cleanupUnreviewedFamiliarCards();

  if (target.dataset.clearReviewSummary !== undefined) setState({ reviewSummary: null });

  if (target.dataset.calendarDay) setState({ modal: { type: "dailyReview", day: target.dataset.calendarDay } });

  if (target.dataset.calendarGroup) {
    const [day, textId] = target.dataset.calendarGroup.split("|");
    setState({ modal: { type: "dailyReview", day, textId } });
  }

  if (target.dataset.selectVisibleTexts !== undefined) {
    setState({ exportTextIds: filteredTexts().map((text) => text.id), exportMessage: "", exportPreview: "" });
  }

  if (target.dataset.clearExportSelection !== undefined) {
    setState({ exportTextIds: [], exportMessage: "", exportPreview: "" });
  }

  if (target.dataset.copyTextExport !== undefined) copyTextExport();

  if (target.dataset.rate) rateCard(target.dataset.rate);

  if (target.dataset.stopReview !== undefined) setState({ reviewQueue: [], reviewIndex: 0, showAnswer: false, reviewInput: "", reviewChecked: false, reviewCorrect: false });

  if (target.dataset.saveSourceIntent) saveSourceIntentFromSelection(target.dataset.saveSourceIntent);

  if (target.dataset.finishSourceIntents) setState({ modal: null, route: "text", selectedTextId: target.dataset.finishSourceIntents });

  if (target.dataset.toggleSourceText !== undefined) setState({ showSourceText: !state.showSourceText });

  if (target.dataset.copyModalPrompt !== undefined) copyModalPrompt();

  if (target.dataset.parseAiOutput !== undefined) parseAiOutputIntoTextForm();
});

function handleLiveInput(event) {
  if (event.target.id === "searchInput") setSearch(event.target.value, event.target.selectionStart);
  if (event.target.id === "searchMode") setState({ searchMode: event.target.value });
  if (event.target.id === "promptDraft") {
    state = { ...state, promptDraft: event.target.value, promptCopied: "" };
  }
  if (event.target.id === "promptMode") {
    setState({ promptMode: event.target.value, promptCopied: "" });
  }
  if (event.target.id === "promptVariant") {
    setState({ promptVariant: event.target.value, promptCopied: "" });
  }
  if (event.target.id === "promptLevel") {
    setState({ promptLevel: event.target.value, promptCopied: "" });
  }
  if (event.target.id === "promptIeltsSkill") {
    setState({ promptIeltsSkill: event.target.value, promptCopied: "" });
  }
  if (event.target.id === "promptIeltsBand") {
    setState({ promptIeltsBand: event.target.value, promptCopied: "" });
  }
  if (event.target.id === "promptEmoji") {
    setState({ promptEmoji: event.target.value, promptCopied: "" });
  }
  if (event.target.id === "reviewSessionSize") {
    setState({ reviewSettings: { ...reviewSettings(), sessionSize: Number(event.target.value) || 7 } });
  }
  if (event.target.id === "exportFormat") {
    setState({ exportOptions: { ...exportOptions(), format: event.target.value }, exportMessage: "", exportPreview: "" });
  }
  if (event.target.dataset.exportOption) {
    setState({ exportOptions: { ...exportOptions(), [event.target.dataset.exportOption]: event.target.checked }, exportMessage: "", exportPreview: "" });
  }
  if (event.target.dataset.exportText) {
    const id = event.target.dataset.exportText;
    const selected = new Set(state.exportTextIds || []);
    if (event.target.checked) selected.add(id);
    else selected.delete(id);
    setState({ exportTextIds: [...selected], exportMessage: "", exportPreview: "" });
  }
  if (["modalPromptStyle", "modalPromptMode", "modalPromptVariant", "modalPromptLevel", "modalPromptIeltsSkill", "modalPromptIeltsBand", "modalPromptEmoji"].includes(event.target.id)) {
    const keyMap = {
      modalPromptStyle: "promptStyle",
      modalPromptMode: "promptMode",
      modalPromptVariant: "promptVariant",
      modalPromptLevel: "promptLevel",
      modalPromptIeltsSkill: "promptIeltsSkill",
      modalPromptIeltsBand: "promptIeltsBand",
      modalPromptEmoji: "promptEmoji",
    };
    setState({ modal: { ...state.modal, [keyMap[event.target.id]]: event.target.value, parseMessage: "" } });
  }
  if (event.target.id === "reviewInput") {
    state = { ...state, reviewInput: event.target.value };
  }
  if (event.target.dataset.sourceNote) {
    const id = event.target.dataset.sourceNote;
    state = {
      ...state,
      sourceIntents: state.sourceIntents.map((intent) => (intent.id === id ? { ...intent, note: event.target.value || intent.selectedText } : intent)),
    };
    persist();
  }
}

document.addEventListener("input", handleLiveInput);
document.addEventListener("change", handleLiveInput);

document.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (event.target.id === "textForm") await saveText(new FormData(event.target));
  if (event.target.id === "clozeForm") saveCard(new FormData(event.target));
  if (event.target.id === "reviewAnswerForm") checkReviewAnswer(new FormData(event.target));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && state.modal?.type === "sourceIntent") {
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    if (["input", "textarea", "select", "button"].includes(activeTag)) return;
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) return;
    event.preventDefault();
    saveSourceIntentFromSelection(state.modal.textId);
    return;
  }

  if (event.key !== "Enter" || state.route !== "text" || state.modal) return;
  const activeTag = document.activeElement?.tagName?.toLowerCase();
  if (["input", "textarea", "select", "button"].includes(activeTag)) return;
  const selection = window.getSelection();
  if (!selection || !selection.toString().trim()) return;
  event.preventDefault();
  createChunkFromSelection(state.selectedTextId);
});

async function copyPrompt(mode) {
  const settings = promptSettingsFromState();
  const text = mode === "withInput" ? promptFor(settings.style, state.promptDraft || "", settings) : promptFor(settings.style, "", settings);
  try {
    await copyText(text);
    setState({ promptCopied: "已复制。去 ChatGPT 粘贴就行。" });
  } catch {
    setState({ promptCopied: "复制失败，可以手动选中右侧提示词复制。" });
  }
}

async function copyTextExport() {
  const texts = selectedExportTexts();
  if (!texts.length) {
    setState({ exportMessage: "先选择要导出的文本。", exportPreview: "" });
    return;
  }
  const output = buildTextExport(texts);
  if (!output.trim()) {
    setState({ exportMessage: "至少选择一个导出字段。", exportPreview: "" });
    return;
  }
  try {
    await copyText(output);
    setState({ exportMessage: `已复制 ${texts.length} 篇文本。`, exportPreview: output });
  } catch {
    setState({ exportMessage: "复制失败，可以手动复制下方预览。", exportPreview: output });
  }
}

async function copyModalPrompt() {
  const form = document.querySelector("#textForm");
  const settings = promptSettingsFromState({
    mode: document.querySelector("#modalPromptMode")?.value || state.modal?.promptMode,
    style: document.querySelector("#modalPromptStyle")?.value || state.modal?.promptStyle || "dialogue",
    variant: document.querySelector("#modalPromptVariant")?.value || state.modal?.promptVariant,
    level: document.querySelector("#modalPromptLevel")?.value || state.modal?.promptLevel,
    ieltsSkill: document.querySelector("#modalPromptIeltsSkill")?.value || state.modal?.promptIeltsSkill,
    ieltsBand: document.querySelector("#modalPromptIeltsBand")?.value || state.modal?.promptIeltsBand,
    emoji: document.querySelector("#modalPromptEmoji")?.value || state.modal?.promptEmoji,
  });
  const original = form?.elements.originalText.value || "";
  try {
    await copyText(promptFor(settings.style, original, settings));
    setState({ modal: { ...state.modal, promptMode: settings.mode, promptStyle: settings.style, promptVariant: settings.variant, promptLevel: settings.level, promptIeltsSkill: settings.ieltsSkill, promptIeltsBand: settings.ieltsBand, promptEmoji: settings.emoji, originalText: original, parseMessage: "已复制提示词。去 ChatGPT 粘贴即可。" } });
  } catch {
    setState({ modal: { ...state.modal, promptMode: settings.mode, promptStyle: settings.style, promptVariant: settings.variant, promptLevel: settings.level, promptIeltsSkill: settings.ieltsSkill, promptIeltsBand: settings.ieltsBand, promptEmoji: settings.emoji, originalText: original, parseMessage: "复制失败，可以到 Prompts 页面手动复制。" } });
  }
}

function parseAiOutputIntoTextForm() {
  const raw = document.querySelector("#aiOutputPaste")?.value || "";
  const parsed = parseOioBlock(raw);
  if (!parsed) {
    setState({ modal: { ...state.modal, parseMessage: "没有识别到 :::OIO 格式。请检查 AI 输出。" } });
    return;
  }
  const currentForm = document.querySelector("#textForm");
  const textType = parsed.style && currentForm?.elements.textType.querySelector(`option[value="${parsed.style}"]`) ? parsed.style : state.modal.textType || state.modal.promptStyle || "dialogue";
  setState({
    modal: {
      ...state.modal,
      title: parsed.title || currentForm?.elements.title.value || state.modal.title || "",
      originalText: parsed.original || currentForm?.elements.originalText.value || state.modal.originalText || "",
      rewrittenText: parsed.rewrite || currentForm?.elements.rewrittenText.value || state.modal.rewrittenText || "",
      translation: parsed.translation || currentForm?.elements.translation.value || state.modal.translation || "",
      note: parsed.translation || currentForm?.elements.note.value || state.modal.note || "",
      textType,
      promptStyle: parsed.style || state.modal.promptStyle || "dialogue",
      parseMessage: "已解析并填入表单，检查一下再保存。",
    },
  });
}

async function saveText(form) {
  const id = state.modal.id || uid("text");
  const existing = state.texts.find((item) => item.id === id);
  const item = {
    id,
    title: form.get("title").trim(),
    originalText: form.get("originalText").trim(),
    rewrittenText: form.get("rewrittenText").trim(),
    translation: form.get("translation").trim(),
    note: form.get("note").trim(),
    tags: splitTags(form.get("tags")),
    textType: form.get("textType") || "dialogue",
    sourceDate: form.get("sourceDate") || todayDate(),
    createdAt: existing?.createdAt || nowIso(),
    updatedAt: nowIso(),
  };

  if (item.rewrittenText) {
    try {
      await copyText(item.rewrittenText);
    } catch {
      // Saving should still work even when the browser blocks clipboard access.
    }
  }

  setState({
    texts: existing ? state.texts.map((text) => (text.id === id ? item : text)) : [...state.texts, item],
    modal: !existing && item.originalText ? { type: "sourceIntent", textId: id } : null,
    route: "text",
    selectedTextId: id,
  });
}

function saveSourceIntentFromSelection(textId) {
  const text = state.texts.find((item) => item.id === textId);
  if (!text) return;
  const selection = window.getSelection();
  const rawSelected = selection ? selection.toString().trim() : "";
  if (!rawSelected) {
    alert("请先在原始输入中选中一个想表达但不会说的地方。");
    return;
  }
  const selected = expandSelectionToWord(text.originalText || "", rawSelected);
  if (!selected) {
    alert("请先在原始输入中选中一个想表达但不会说的地方。");
    return;
  }

  const exists = state.sourceIntents.some((intent) => intent.textId === textId && intent.selectedText === selected);
  if (exists) {
    selection?.removeAllRanges();
    return;
  }

  const intent = {
    id: uid("intent"),
    textId,
    selectedText: selected,
    note: selected,
    createdAt: nowIso(),
  };

  selection?.removeAllRanges();
  setState({ sourceIntents: [...state.sourceIntents, intent] });
}

function openChunkModal(textId) {
  createChunkFromSelection(textId);
}

function createChunkFromSelection(textId) {
  const text = state.texts.find((item) => item.id === textId);
  if (!text) return;
  const selection = window.getSelection();
  const rawSelected = selection ? selection.toString().trim() : "";
  if (!rawSelected) {
    alert("请先在文本中选中一个词块。");
    return;
  }
  const selected = expandSelectionToWord(text.rewrittenText, rawSelected);
  if (!selected) {
    alert("请先在文本中选中一个词块。");
    return;
  }
  const existing = state.chunks.find((item) => item.textId === textId && item.selectedText === selected);
  if (existing) {
    setState({ modal: { type: "cloze", chunkId: existing.id, selectedIndexes: [] } });
    return;
  }

  const chunk = {
    id: uid("chunk"),
    textId: text.id,
    selectedText: selected,
    sentence: sentenceFor(text.rewrittenText, selected),
    explanation: "",
    usageNote: "",
    personalNote: "",
    tags: [],
    createdAt: nowIso(),
  };
  selection?.removeAllRanges();
  setState({
    chunks: [...state.chunks, chunk],
    modal: { type: "cloze", chunkId: chunk.id, selectedIndexes: [] },
  });
}

function toggleToken(index) {
  if (!state.modal || state.modal.type !== "cloze") return;
  const selected = state.modal.selectedIndexes || [];
  const next = selected.includes(index) ? selected.filter((item) => item !== index) : [...selected, index].sort((a, b) => a - b);
  setState({ modal: { ...state.modal, selectedIndexes: next } });
}

function saveCard(form) {
  const chunk = state.chunks.find((item) => item.id === state.modal.chunkId);
  const sourceIntentId = form.get("sourceIntentId") || chunk.sourceIntentId || "";
  const card = {
    id: uid("card"),
    textId: chunk.textId,
    chunkId: chunk.id,
    sourceIntentId,
    sentence: chunk.sentence,
    clozeText: form.get("clozeText").trim(),
    maskedChunk: form.get("maskedChunk") || "",
    answer: form.get("answer").trim(),
    hint: "",
    focusNote: form.get("focusNote").trim(),
    priority: form.get("priority") === "important" ? "important" : "normal",
    reviewCount: 0,
    masteryCount: 0,
    easyStreak: 0,
    isGraduated: false,
    graduatedAt: "",
    dueAt: nowIso(),
    lastReviewedAt: "",
    createdAt: nowIso(),
  };
  setState({
    chunks: state.chunks.map((item) => (item.id === chunk.id ? { ...item, sourceIntentId } : item)),
    cards: [...state.cards, card],
    modal: null,
  });
}

function deleteText(id) {
  if (!confirm("删除这篇文本？相关 chunk 和卡片也会删除。")) return;
  setState({
    texts: state.texts.filter((item) => item.id !== id),
    sourceIntents: state.sourceIntents.filter((item) => item.textId !== id),
    chunks: state.chunks.filter((item) => item.textId !== id),
    cards: state.cards.filter((item) => item.textId !== id),
    route: "home",
  });
}

function deleteChunk(id) {
  if (!confirm("删除这个 chunk？相关卡片也会删除。")) return;
  setState({
    chunks: state.chunks.filter((item) => item.id !== id),
    cards: state.cards.filter((item) => item.chunkId !== id),
  });
}

function deleteCard(id) {
  if (!confirm("删除这张卡片？")) return;
  setState({ cards: state.cards.filter((item) => item.id !== id) });
}

function startReview(textId) {
  const settings = reviewSettings();
  const queue = cardsForReviewMode(textId).slice(0, settings.sessionSize);
  if (!queue.length) {
    alert("当前没有到期卡片。");
    return;
  }
  setState({
    route: "review",
    reviewQueue: queue,
    reviewMode: textId,
    activeSessionCardIds: queue.map((card) => card.id),
    sessionResults: [],
    reviewSummary: null,
    reviewIndex: 0,
    showAnswer: false,
    reviewInput: "",
    reviewChecked: false,
    reviewCorrect: false,
  });
}

function checkReviewAnswer(form) {
  const card = state.reviewQueue[state.reviewIndex];
  if (!card) return;
  const userAnswer = form.get("reviewInput");
  const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(card.answer);
  setState({
    reviewInput: userAnswer,
    reviewChecked: true,
    reviewCorrect: isCorrect,
    showAnswer: true,
  });
}

function rateCard(rating) {
  const card = state.reviewQueue[state.reviewIndex];
  const minutes = reviewIntervalMinutes(card, rating);
  const dueAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  let updatedCard = null;
  const updatedCards = state.cards.map((item) => {
    if (item.id !== card.id) return item;
    updatedCard = updateReviewedCard(item, rating, dueAt);
    return updatedCard;
  });
  const result = {
    cardId: card.id,
    card,
    rating,
    wasCorrect: state.reviewCorrect,
    graduated: Boolean(updatedCard?.isGraduated) && !card.isGraduated,
  };
  const sessionResults = [...state.sessionResults, result];
  const reviews = [
    ...state.reviews,
    {
      id: uid("review"),
      cardId: card.id,
      rating,
      wasCorrect: state.reviewCorrect,
      reviewedAt: nowIso(),
    },
  ];

  const isDone = state.reviewIndex >= state.reviewQueue.length - 1;
  const reviewSummary = isDone ? buildReviewSummary(sessionResults, state.reviewMode) : null;
  setState({
    cards: updatedCards,
    reviews,
    sessionResults,
    reviewSummary,
    reviewQueue: isDone ? [] : state.reviewQueue,
    reviewIndex: isDone ? 0 : state.reviewIndex + 1,
    showAnswer: false,
    reviewInput: "",
    reviewChecked: false,
    reviewCorrect: false,
  });
}

function reviewIntervalMinutes(card, rating) {
  if (rating === "again") return 10;
  if (rating === "good") return 24 * 60;
  const nextEasyStreak = (card.easyStreak || 0) + 1;
  const days = nextEasyStreak === 1 ? 3 : nextEasyStreak === 2 ? 7 : nextEasyStreak === 3 ? 14 : 30;
  return days * 24 * 60;
}

function updateReviewedCard(card, rating, dueAt) {
  const masteryCount = successfulReviewCount(card) + (rating === "again" ? 0 : 1);
  const isGraduated = masteryCount >= 3;
  return {
    ...card,
    dueAt,
    lastReviewedAt: nowIso(),
    reviewCount: (card.reviewCount || 0) + 1,
    masteryCount,
    easyStreak: rating === "easy" ? (card.easyStreak || 0) + 1 : 0,
    isGraduated,
    graduatedAt: isGraduated && !card.graduatedAt ? nowIso() : card.graduatedAt || "",
  };
}

function buildReviewSummary(results, mode) {
  return {
    mode,
    results,
    total: results.length,
    correct: results.filter((result) => result.wasCorrect).length,
    graduated: results.filter((result) => result.graduated).length,
  };
}

function cleanupUnreviewedFamiliarCards() {
  const reviewed = new Set(state.reviewSummary?.results.map((result) => result.cardId) || state.activeSessionCardIds);
  const candidates = cardsForReviewMode(state.reviewSummary?.mode || state.reviewMode).filter((card) => !reviewed.has(card.id) && successfulReviewCount(card) >= 2);
  if (!candidates.length) {
    alert("没有符合条件的未复习熟卡。");
    return;
  }
  const now = nowIso();
  setState({
    cards: state.cards.map((card) => (candidates.some((item) => item.id === card.id) ? { ...card, isGraduated: true, graduatedAt: card.graduatedAt || now } : card)),
    reviewSummary: state.reviewSummary ? { ...state.reviewSummary, cleaned: candidates.length } : state.reviewSummary,
  });
}

render();
