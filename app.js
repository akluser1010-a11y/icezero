const state = {
  plan: [],
  chapters: [],
  generatedWords: 0,
  totalChapters: 0,
};

const els = {
  premise: document.getElementById("premise"),
  genre: document.getElementById("genre"),
  targetWords: document.getElementById("targetWords"),
  chapterWords: document.getElementById("chapterWords"),
  batchSize: document.getElementById("batchSize"),
  planBtn: document.getElementById("planBtn"),
  generateBtn: document.getElementById("generateBtn"),
  exportBtn: document.getElementById("exportBtn"),
  statsPanel: document.getElementById("statsPanel"),
  totalChapters: document.getElementById("totalChapters"),
  generatedChapters: document.getElementById("generatedChapters"),
  generatedWords: document.getElementById("generatedWords"),
  progressText: document.getElementById("progressText"),
  progressBar: document.getElementById("progressBar"),
  outlinePanel: document.getElementById("outlinePanel"),
  chaptersPanel: document.getElementById("chaptersPanel"),
  outline: document.getElementById("outline"),
  chapters: document.getElementById("chapters"),
  chapterTemplate: document.getElementById("chapterTemplate"),
};

function createPlan() {
  const premise = els.premise.value.trim();
  const genre = els.genre.value;
  const targetWords = Number(els.targetWords.value);
  const chapterWords = Number(els.chapterWords.value);

  if (!premise) {
    alert("请先输入背景情节。\n只需一段核心设定即可。");
    return;
  }

  const totalChapters = Math.max(1, Math.ceil(targetWords / chapterWords));
  const volumeCount = Math.max(4, Math.ceil(totalChapters / 30));
  const chaptersPerVolume = Math.ceil(totalChapters / volumeCount);

  state.plan = Array.from({ length: volumeCount }, (_, i) => {
    const start = i * chaptersPerVolume + 1;
    const end = Math.min(totalChapters, (i + 1) * chaptersPerVolume);
    return {
      volume: i + 1,
      chapterRange: `${start}-${end}`,
      summary: `第${i + 1}卷以「${extractKeyword(premise)}」为主轴，采用${genre}叙事推进，逐步抬升冲突并埋下长期伏笔。`,
    };
  });

  state.totalChapters = totalChapters;
  state.chapters = [];
  state.generatedWords = 0;

  renderPlan();
  updateStats();

  els.generateBtn.disabled = false;
  els.exportBtn.disabled = false;
}

function extractKeyword(text) {
  const words = text.replace(/[，。！？,.!?]/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "命运转折";
  words.sort((a, b) => b.length - a.length);
  return words[0].slice(0, 10);
}

function generateBatchChapters() {
  const chapterWords = Number(els.chapterWords.value);
  const batchSize = Number(els.batchSize.value);
  const premise = els.premise.value.trim();

  const remaining = state.totalChapters - state.chapters.length;
  const count = Math.min(batchSize, remaining);

  if (count <= 0) {
    alert("全部章节已生成，可直接导出 Markdown。");
    return;
  }

  for (let i = 0; i < count; i += 1) {
    const chapterNumber = state.chapters.length + 1;
    const arcPoint = Math.ceil((chapterNumber / state.totalChapters) * 100);
    const content = composeChapter(premise, chapterNumber, chapterWords, arcPoint);

    state.chapters.push({
      title: `第${chapterNumber}章：${suggestTitle(chapterNumber)}`,
      words: chapterWords,
      arcPoint,
      content,
    });
  }

  state.generatedWords = state.chapters.reduce((sum, ch) => sum + ch.words, 0);
  renderChapters();
  updateStats();
}

function composeChapter(premise, chapterNumber, chapterWords, arcPoint) {
  return [
    `【背景承接】${premise}`,
    `【章节目标】在第${chapterNumber}章，将主角推向新的抉择点，整体主线推进至${arcPoint}%阶段。`,
    "【场景草稿】夜色压低在城墙与旷野之间，角色关系在一次冲突后发生偏移，短期危机被解决，但长期代价开始显形。",
    `【字数建议】本章目标约 ${chapterWords} 字，可按“开场冲突 20% + 对话博弈 45% + 结尾反转 35%”扩写。`,
  ].join("\n\n");
}

function suggestTitle(chapterNumber) {
  const tags = ["风雪边关", "暗线浮现", "旧敌归来", "命运契约", "深渊回响", "破局之火"];
  return tags[(chapterNumber - 1) % tags.length];
}

function renderPlan() {
  els.outline.innerHTML = "";
  state.plan.forEach((volume) => {
    const block = document.createElement("div");
    block.className = "volume";
    block.innerHTML = `<h3>第${volume.volume}卷（章节 ${volume.chapterRange}）</h3><p>${volume.summary}</p>`;
    els.outline.appendChild(block);
  });

  els.statsPanel.hidden = false;
  els.outlinePanel.hidden = false;
}

function renderChapters() {
  els.chapters.innerHTML = "";
  state.chapters.forEach((chapter) => {
    const node = els.chapterTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector("h3").textContent = chapter.title;
    node.querySelector(".meta").textContent = `估算字数：${chapter.words} ｜ 主线推进：${chapter.arcPoint}%`;
    node.querySelector(".content").textContent = chapter.content;
    els.chapters.appendChild(node);
  });

  els.chaptersPanel.hidden = false;
}

function updateStats() {
  const generatedCount = state.chapters.length;
  const progress = state.totalChapters === 0 ? 0 : Math.round((generatedCount / state.totalChapters) * 100);

  els.totalChapters.textContent = String(state.totalChapters);
  els.generatedChapters.textContent = String(generatedCount);
  els.generatedWords.textContent = String(state.generatedWords);
  els.progressText.textContent = `${progress}%`;
  els.progressBar.style.width = `${progress}%`;
}

function exportMarkdown() {
  if (state.chapters.length === 0) {
    alert("请先生成至少一章内容再导出。");
    return;
  }

  const lines = [
    "# 长篇小说草稿导出",
    "",
    `- 目标总章数：${state.totalChapters}`,
    `- 已生成章节：${state.chapters.length}`,
    `- 估算总字数：${state.generatedWords}`,
    "",
    "## 卷级大纲",
    ...state.plan.map((v) => `- 第${v.volume}卷（${v.chapterRange}）：${v.summary}`),
    "",
    "## 章节草稿",
  ];

  state.chapters.forEach((chapter) => {
    lines.push(`\n### ${chapter.title}`);
    lines.push(`- 估算字数：${chapter.words}`);
    lines.push(`- 主线推进：${chapter.arcPoint}%`);
    lines.push("");
    lines.push(chapter.content);
  });

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "long-novel-draft.md";
  a.click();
  URL.revokeObjectURL(url);
}

els.planBtn.addEventListener("click", createPlan);
els.generateBtn.addEventListener("click", generateBatchChapters);
els.exportBtn.addEventListener("click", exportMarkdown);
