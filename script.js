const moduleCacheKey = Date.now();
let loadedPapers = [];
let paperLoadFailures = [];

try {
  const { loadPapers } = await import(`./papers/index.js?v=${moduleCacheKey}`);
  const loadResult = await loadPapers(moduleCacheKey);
  loadedPapers = loadResult.papers;
  paperLoadFailures = loadResult.failures;
} catch (error) {
  console.error("논문 파일 목록을 불러오지 못했습니다.", error);
  paperLoadFailures = ["./papers/index.js"];
}

(() => {
  const allowedTopics = new Set([
    "holographic",
    "metasurfaces",
    "inverse-design",
    "ai-em",
  ]);
  const statusLabels = {
    done: "정리 완료",
    reading: "읽는 중",
    queue: "대기",
  };

  const toText = (value) => String(value ?? "").trim();
  const countText = (value) => String(value).padStart(2, "0");

  function dateOrder(value, fallback) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
    const timestamp = Date.parse(`${value}T00:00:00Z`);
    return Number.isNaN(timestamp) ? fallback : timestamp;
  }

  function shortDate(value) {
    const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(value);
    return match ? `${match[1]}.${match[2]}` : "—";
  }

  function safeUrl(value, { allowRelative = false } = {}) {
    if (!value) return "";

    const cleaned = value.replace(/^doi:\s*/i, "").trim();
    if (/^10\.\d{4,9}\/\S+$/i.test(cleaned)) {
      return `https://doi.org/${cleaned}`;
    }

    const candidate = /^doi\.org\//i.test(cleaned) ? `https://${cleaned}` : cleaned;

    try {
      const hasWebProtocol = /^https?:\/\//i.test(candidate);
      if (!hasWebProtocol && !allowRelative) return "";
      if (!hasWebProtocol && /^[a-z][a-z\d+.-]*:/i.test(candidate)) return "";

      const url = new URL(candidate, window.location.href);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function element(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const source = Array.isArray(loadedPapers) ? loadedPapers : [];
  const papers = source
    .filter((paper) => paper && typeof paper === "object" && toText(paper.title))
    .map((paper, index) => {
      const topics = Array.isArray(paper.topics)
        ? [...new Set(paper.topics.map(toText).filter((topic) => allowedTopics.has(topic)))]
        : [];
      const updated = toText(paper.updated);

      return {
        number: index + 1,
        title: toText(paper.title),
        citation: toText(paper.citation),
        url: safeUrl(toText(paper.url)),
        noteUrl: safeUrl(toText(paper.noteUrl), { allowRelative: true }),
        status: Object.hasOwn(statusLabels, paper.status) ? paper.status : "queue",
        topics,
        updated: /^\d{4}-\d{2}-\d{2}$/.test(updated) ? updated : "",
        tags: Array.isArray(paper.tags) ? paper.tags.map(toText).filter(Boolean) : [],
        summary: toText(paper.summary),
        order: dateOrder(updated, index),
      };
    });

  const paperList = document.querySelector("#paper-list");
  if (!paperList) return;

  const loadWarning = document.querySelector("#paper-load-warning");
  if (loadWarning && paperLoadFailures.length > 0) {
    loadWarning.textContent = `불러오지 못한 논문 파일 ${paperLoadFailures.length}개: ${paperLoadFailures.join(", ")}`;
    loadWarning.hidden = false;
  }

  function createPaperCard(paper) {
    const card = element("article", "paper-card");
    card.dataset.title = paper.title;
    card.dataset.topics = paper.topics.join(" ");
    card.dataset.status = paper.status;
    card.dataset.order = String(paper.order);

    const meta = element("header", "paper-meta");
    meta.append(
      element("span", "paper-number", `PAPER ${String(paper.number).padStart(3, "0")}`),
      element("span", `status status--${paper.status}`, statusLabels[paper.status]),
    );
    card.append(meta);

    card.append(element("h3", "", paper.title));

    if (paper.citation) {
      card.append(element("p", "citation", paper.citation));
    }

    if (paper.summary) {
      card.append(element("p", "paper-summary", paper.summary));
    }

    if (paper.noteUrl || paper.url) {
      const actions = element("div", "paper-actions");

      if (paper.noteUrl) {
        const noteLink = element("a", "", "노트 보기 ↗");
        noteLink.href = paper.noteUrl;
        noteLink.setAttribute("aria-label", `내 노트 보기 — ${paper.title}`);
        actions.append(noteLink);
      }

      if (paper.url && paper.url !== paper.noteUrl) {
        const sourceLink = element("a", "", "원문 보기 ↗");
        sourceLink.href = paper.url;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
        sourceLink.setAttribute("aria-label", `원문 보기 — ${paper.title}`);
        actions.append(sourceLink);
      }

      card.append(actions);
    }

    const footer = element("footer", "paper-footer");
    const tagList = element("div", "tag-list");
    tagList.setAttribute("aria-label", "태그");
    const tags = paper.tags.length ? paper.tags : paper.topics;
    tags.forEach((tag) => {
      tagList.append(element("span", "", `#${tag.replace(/^#/, "")}`));
    });

    const updated = element(
      "time",
      "",
      paper.updated ? `UPDATED ${shortDate(paper.updated)}` : "UPDATED —",
    );
    if (paper.updated) updated.dateTime = paper.updated;
    footer.append(tagList, updated);
    card.append(footer);

    return card;
  }

  const cardFragment = document.createDocumentFragment();
  papers.forEach((paper) => cardFragment.append(createPaperCard(paper)));
  paperList.replaceChildren(cardFragment);

  function updateArchiveSummary() {
    const activeTopics = new Set(papers.flatMap((paper) => paper.topics));
    const readingCount = papers.filter((paper) => paper.status === "reading").length;
    const latest = papers.slice().sort((a, b) => b.order - a.order)[0];

    const values = {
      "#stat-notes": countText(papers.length),
      "#stat-topics": countText(activeTopics.size),
      "#stat-reading": countText(readingCount),
      "#stat-updated": latest?.updated ? shortDate(latest.updated) : "—",
      "#library-code": `LIBRARY / ${countText(papers.length)}`,
    };
    Object.entries(values).forEach(([selector, value]) => {
      const node = document.querySelector(selector);
      if (node) node.textContent = value;
    });

    const archiveNotice = document.querySelector("#archive-notice");
    if (archiveNotice) archiveNotice.hidden = papers.length > 0;

    document.querySelectorAll("[data-topic-count]").forEach((node) => {
      const total = papers.filter((paper) => paper.topics.includes(node.dataset.topicCount)).length;
      node.textContent = `${countText(total)} ${total === 1 ? "NOTE" : "NOTES"}`;
    });
  }

  updateArchiveSummary();

  const controls = document.querySelector("#paper-controls");
  const searchInput = document.querySelector("#paper-search");
  const clearSearchButton = document.querySelector("#clear-search");
  const sortSelect = document.querySelector("#paper-sort");
  const cards = Array.from(paperList.querySelectorAll(".paper-card"));
  const topicButtons = controls ? Array.from(controls.querySelectorAll("[data-topic]")) : [];
  const statusButtons = controls ? Array.from(controls.querySelectorAll("[data-status]")) : [];
  const topicJumpButtons = Array.from(document.querySelectorAll("[data-topic-jump]"));
  const resultBar = document.querySelector("#result-bar");
  const resultCount = document.querySelector("#result-count");
  const emptyState = document.querySelector("#empty-state");
  const emptyCode = document.querySelector("#empty-code");
  const emptyTitle = document.querySelector("#empty-title");
  const emptyDescription = document.querySelector("#empty-description");
  const resetButton = document.querySelector("#reset-filters");

  if (
    !controls ||
    !searchInput ||
    !clearSearchButton ||
    !sortSelect ||
    !resultBar ||
    !resultCount ||
    !emptyState ||
    !emptyCode ||
    !emptyTitle ||
    !emptyDescription ||
    !resetButton ||
    topicButtons.length === 0 ||
    statusButtons.length === 0
  ) {
    return;
  }

  const state = {
    query: "",
    topic: "all",
    status: "all",
    sort: "recent",
  };

  const normalize = (value) => value.toLocaleLowerCase("ko-KR").trim();
  const searchableText = new Map(
    cards.map((card) => [
      card,
      normalize([
        card.dataset.title || "",
        card.dataset.topics || "",
        card.textContent || "",
      ].join(" ")),
    ]),
  );

  function setPressed(buttons, activeValue, dataKey) {
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset[dataKey] === activeValue));
    });
  }

  function compareCards(a, b) {
    if (state.sort === "oldest") {
      return Number(a.dataset.order) - Number(b.dataset.order);
    }

    if (state.sort === "title") {
      return (a.dataset.title || "").localeCompare(b.dataset.title || "", "en", {
        sensitivity: "base",
      });
    }

    return Number(b.dataset.order) - Number(a.dataset.order);
  }

  function render() {
    const query = normalize(state.query);
    const visibleCards = cards.filter((card) => {
      const topics = (card.dataset.topics || "").split(" ");
      const matchesQuery = query === "" || searchableText.get(card).includes(query);
      const matchesTopic = state.topic === "all" || topics.includes(state.topic);
      const matchesStatus = state.status === "all" || card.dataset.status === state.status;
      return matchesQuery && matchesTopic && matchesStatus;
    });

    const sortedCards = cards.slice().sort(compareCards);
    sortedCards.forEach((card) => paperList.append(card));

    cards.forEach((card) => {
      card.classList.remove("paper-card--wide");
      card.hidden = !visibleCards.includes(card);
    });

    const sortedVisibleCards = sortedCards.filter((card) => visibleCards.includes(card));
    if (sortedVisibleCards.length % 2 === 1) {
      sortedVisibleCards[sortedVisibleCards.length - 1].classList.add("paper-card--wide");
    }

    const visibleCount = visibleCards.length;
    const libraryIsEmpty = cards.length === 0;
    resultBar.hidden = libraryIsEmpty;
    controls.classList.toggle("is-disabled", libraryIsEmpty);
    controls.querySelectorAll("input, button, select").forEach((control) => {
      control.disabled = libraryIsEmpty;
    });
    topicJumpButtons.forEach((button) => {
      button.disabled = libraryIsEmpty;
    });

    if (libraryIsEmpty) {
      resultCount.textContent = "등록된 논문 노트가 없습니다.";
      emptyCode.textContent = "LIBRARY / EMPTY";
      emptyTitle.textContent = "아직 등록된 논문이 없습니다.";
      emptyDescription.textContent = "첫 논문을 정리하면 이곳에 카드로 표시됩니다.";
      emptyState.hidden = false;
      resetButton.hidden = true;
    } else {
      resultCount.textContent = `논문 노트 ${visibleCount} / ${cards.length}개 표시 중`;
      emptyCode.textContent = "NO MATCH / 000";
      emptyTitle.textContent = "맞는 노트가 없습니다.";
      emptyDescription.textContent = "검색어를 줄이거나 필터를 초기화해 보세요.";
      emptyState.hidden = visibleCount !== 0;
      resetButton.hidden = visibleCount !== 0;
    }

    clearSearchButton.hidden = state.query.length === 0;
  }

  function resetFilters({ focusSearch = false } = {}) {
    state.query = "";
    state.topic = "all";
    state.status = "all";
    state.sort = "recent";
    searchInput.value = "";
    sortSelect.value = "recent";
    setPressed(topicButtons, "all", "topic");
    setPressed(statusButtons, "all", "status");
    render();

    if (focusSearch) searchInput.focus();
  }

  controls.addEventListener("submit", (event) => event.preventDefault());

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    render();
  });

  clearSearchButton.addEventListener("click", () => {
    state.query = "";
    searchInput.value = "";
    render();
    searchInput.focus();
  });

  topicButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.topic = button.dataset.topic;
      setPressed(topicButtons, state.topic, "topic");
      render();
    });
  });

  statusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.status;
      setPressed(statusButtons, state.status, "status");
      render();
    });
  });

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    render();
  });

  topicJumpButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.topic = button.dataset.topicJump;
      state.query = "";
      state.status = "all";
      searchInput.value = "";
      setPressed(topicButtons, state.topic, "topic");
      setPressed(statusButtons, "all", "status");
      render();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.querySelector("#library").scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });

  resetButton.addEventListener("click", () => resetFilters({ focusSearch: true }));
  render();
})();
