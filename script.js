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
  const noteFields = [
    { key: "question", code: "Q", label: "Question", step: "질문 정리" },
    { key: "method", code: "M", label: "Method", step: "방법 구조화" },
    { key: "finding", code: "F", label: "Finding", step: "핵심 발견" },
    { key: "next", code: "N", label: "Next", step: "다음 연결" },
  ];

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

  function safeUrl(value) {
    if (!value) return "";

    const cleaned = value.replace(/^doi:\s*/i, "").trim();
    if (/^10\.\d{4,9}\/\S+$/i.test(cleaned)) {
      return `https://doi.org/${cleaned}`;
    }

    const candidate = /^doi\.org\//i.test(cleaned) ? `https://${cleaned}` : cleaned;
    if (!/^https?:\/\//i.test(candidate)) return "";

    try {
      const url = new URL(candidate);
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

  const source = Array.isArray(window.PAPER_LOG) ? window.PAPER_LOG : [];
  const papers = source
    .filter((paper) => paper && typeof paper === "object" && toText(paper.title))
    .map((paper, index) => {
      const rawNotes = paper.notes && typeof paper.notes === "object" ? paper.notes : {};
      const topics = Array.isArray(paper.topics)
        ? [...new Set(paper.topics.map(toText).filter((topic) => allowedTopics.has(topic)))]
        : [];
      const updated = toText(paper.updated);

      return {
        number: index + 1,
        title: toText(paper.title),
        citation: toText(paper.citation),
        url: safeUrl(toText(paper.url)),
        status: Object.hasOwn(statusLabels, paper.status) ? paper.status : "queue",
        topics,
        updated: /^\d{4}-\d{2}-\d{2}$/.test(updated) ? updated : "",
        tags: Array.isArray(paper.tags) ? paper.tags.map(toText).filter(Boolean) : [],
        notes: Object.fromEntries(
          noteFields.map(({ key }) => [key, toText(rawNotes[key])]),
        ),
        order: dateOrder(updated, index),
      };
    });

  const paperList = document.querySelector("#paper-list");
  if (!paperList) return;

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

    const title = element("h3");
    if (paper.url) {
      const link = element("a", "", paper.title);
      link.href = paper.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `원문 보기 — ${paper.title}`);
      title.append(link);
    } else {
      title.textContent = paper.title;
    }
    card.append(title);

    if (paper.citation) {
      card.append(element("p", "citation", paper.citation));
    }

    if (paper.notes.question) {
      const question = element("div", "paper-question");
      question.append(
        element("span", "", "Question"),
        element("p", "", paper.notes.question),
      );
      card.append(question);
    }

    if (paper.notes.finding) {
      const takeaway = element("p", "takeaway");
      takeaway.append(
        element("span", "", "Finding"),
        document.createTextNode(paper.notes.finding),
      );
      card.append(takeaway);
    }

    if (noteFields.some(({ key }) => paper.notes[key])) {
      const details = element("details", "note-details");
      const summary = element("summary");
      summary.append(
        element("span", "", "정리 노트 펼치기"),
        element("b", "", "＋"),
      );
      summary.querySelector("b").setAttribute("aria-hidden", "true");

      const body = element("div", "note-body");
      noteFields.forEach(({ key, label }) => {
        const section = element("section");
        section.append(
          element("h4", "", label),
          element("p", "", paper.notes[key] || "아직 작성하지 않음."),
        );
        body.append(section);
      });

      details.append(summary, body);
      details.addEventListener("toggle", () => {
        summary.querySelector("span").textContent = details.open
          ? "정리 노트 접기"
          : "정리 노트 펼치기";
      });
      card.append(details);
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

  function updateCurrentFocus() {
    const queueCard = document.querySelector("#queue");
    const queueLabel = document.querySelector("#queue-label");
    const queueProgress = document.querySelector("#queue-progress");
    const queueTitle = document.querySelector("#queue-title");
    const queueDescription = document.querySelector("#queue-description");
    if (!queueCard || !queueLabel || !queueProgress || !queueTitle || !queueDescription) return;

    queueCard.querySelector("ol")?.remove();
    const focus = papers
      .filter((paper) => paper.status === "reading")
      .sort((a, b) => b.order - a.order)[0];

    if (!focus) {
      queueCard.classList.add("queue-card--empty");
      queueLabel.textContent = "CURRENT FOCUS";
      queueProgress.textContent = "EMPTY";
      queueTitle.textContent = "읽는 중인 논문이 없습니다.";
      queueDescription.textContent = "논문의 상태를 ‘읽는 중’으로 설정하면 현재 집중 항목으로 표시됩니다.";
      return;
    }

    const completed = noteFields.filter(({ key }) => focus.notes[key]).length;
    queueCard.classList.remove("queue-card--empty");
    queueLabel.textContent = "CURRENT FOCUS";
    queueProgress.textContent = `${countText(completed)} / 04`;
    queueTitle.textContent = focus.title;
    queueDescription.textContent = focus.notes.question || focus.citation || "현재 읽고 있는 논문입니다.";

    const progressList = element("ol");
    noteFields.forEach(({ key, code, step }) => {
      const item = element("li");
      if (focus.notes[key]) item.classList.add("is-done");
      item.append(element("span", "", code), document.createTextNode(step));
      progressList.append(item);
    });
    queueCard.append(progressList);
  }

  updateArchiveSummary();
  updateCurrentFocus();

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
