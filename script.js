(() => {
  const controls = document.querySelector("#paper-controls");
  const searchInput = document.querySelector("#paper-search");
  const clearSearchButton = document.querySelector("#clear-search");
  const sortSelect = document.querySelector("#paper-sort");
  const paperList = document.querySelector("#paper-list");
  const cards = Array.from(document.querySelectorAll(".paper-card"));
  const topicButtons = controls ? Array.from(controls.querySelectorAll("[data-topic]")) : [];
  const statusButtons = controls ? Array.from(controls.querySelectorAll("[data-status]")) : [];
  const topicJumpButtons = Array.from(document.querySelectorAll("[data-topic-jump]"));
  const resultCount = document.querySelector("#result-count");
  const emptyState = document.querySelector("#empty-state");
  const resetButton = document.querySelector("#reset-filters");

  if (
    !controls ||
    !searchInput ||
    !clearSearchButton ||
    !sortSelect ||
    !paperList ||
    !resultCount ||
    !emptyState ||
    !resetButton ||
    cards.length === 0
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

    cards
      .slice()
      .sort(compareCards)
      .forEach((card) => paperList.append(card));

    cards.forEach((card) => {
      card.hidden = !visibleCards.includes(card);
    });

    const visibleCount = visibleCards.length;
    resultCount.textContent = `샘플 노트 ${visibleCount} / ${cards.length}개 표시 중`;
    emptyState.hidden = visibleCount !== 0;
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

    if (focusSearch) {
      searchInput.focus();
    }
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

  document.querySelectorAll(".note-details").forEach((details) => {
    const label = details.querySelector("summary span");
    if (!label) return;

    details.addEventListener("toggle", () => {
      label.textContent = details.open ? "정리 노트 접기" : "정리 노트 펼치기";
    });
  });

  render();
})();
