(() => {
  const data = withProductionSupplement(window.AOM_DATA, window.AOM_PRODUCTION, window.AOM_TECHNOLOGY_SUPPLEMENT);
  const icons = window.AOM_ICONS || { units: {}, buildings: {}, technologies: {} };
  const uiIcons = window.AOM_UI_ICONS || { stats: {}, ages: {}, pantheons: {}, unitTypes: {} };
  const details = window.AOM_DETAILS || { units: {}, technologies: {} };
  const technologyOverrides = window.AOM_TECHNOLOGY_OVERRIDES || {};
  const appConfig = window.AOM_APP_CONFIG || { views: {} };
  const runtimeIndexes = window.AOM_RUNTIME_INDEXES.create(data);
  const strategyEngine = window.AOM_STRATEGY_ENGINE;
  const buildOrderDbName = "aom-companion-build-orders";
  const buildOrderStoreName = "buildOrders";
  const buildOrderSharePrefix = "AOMBO1.";
  const buildOrderLibraryPrefix = "AOMBOLIB1.";
  const state = {
    godId: localStorage.getItem("aom:selectedGod") || "zeus",
    enemyGodId: localStorage.getItem("aom:enemyGod") || "all",
    mode: localStorage.getItem("aom:counterMode") || "core",
    age: localStorage.getItem("aom:currentAge") || "all",
    buildingId: localStorage.getItem("aom:selectedBuilding") || "",
    unitId: localStorage.getItem("aom:selectedUnit") || "",
    buildOrderId: localStorage.getItem("aom:selectedBuildOrder") || "",
    matchupBuildOrderId: localStorage.getItem("aom:matchupBuildOrder") || "__suggested",
    buildOrders: [],
    buildOrdersLoaded: false,
    buildOrderStorageMode: "indexedDB",
    buildOrderStatus: "Loading build orders...",
  };
  let buildOrderDb = null;
  let activeSuggestedPlan = null;
  let activeSuggestedPlanContext = null;

  const els = {
    dataStatus: byId("data-status"),
    sidebarCurrent: byId("sidebar-current"),
    homeGodSearch: byId("home-god-search"),
    homeGodGrid: byId("home-god-grid"),
    librarySearch: byId("library-search"),
    buildOrderCount: byId("build-order-count"),
    buildOrderList: byId("build-order-list"),
    buildOrderForm: byId("build-order-form"),
    buildOrderNew: byId("build-order-new"),
    buildOrderExportAll: byId("build-order-export-all"),
    buildOrderExport: byId("build-order-export"),
    buildOrderImport: byId("build-order-import"),
    buildOrderImportAll: byId("build-order-import-all"),
    buildOrderDelete: byId("build-order-delete"),
    buildOrderTitle: byId("build-order-title"),
    buildOrderAuthor: byId("build-order-author"),
    buildOrderGod: byId("build-order-god"),
    buildOrderEnemy: byId("build-order-enemy"),
    buildOrderAge: byId("build-order-age"),
    buildOrderPatch: byId("build-order-patch"),
    buildOrderTags: byId("build-order-tags"),
    buildOrderGoals: byId("build-order-goals"),
    buildOrderSteps: byId("build-order-steps"),
    buildOrderNotes: byId("build-order-notes"),
    buildOrderShareCode: byId("build-order-share-code"),
    buildOrderBackupCode: byId("build-order-backup-code"),
    buildOrderStatus: byId("build-order-status"),
    enemyGodSelect: byId("enemy-god-select"),
    enemySearch: byId("enemy-search"),
    enemyUnits: byId("enemy-units"),
    enemyUnitPicker: byId("enemy-unit-picker"),
    matchupBrief: byId("matchup-brief"),
    modeButtons: Array.from(document.querySelectorAll(".mode-button")),
    ageButtons: Array.from(document.querySelectorAll(".age-button")),
    viewPanels: Array.from(document.querySelectorAll(".view-panel")),
    navLinks: Array.from(document.querySelectorAll("[data-view-link]")),
    viewContextLabel: byId("view-context-label"),
    viewContextDescription: byId("view-context-description"),
    homeGodResultCount: byId("home-god-result-count"),
    selectedTitle: byId("selected-title"),
    statsStrip: byId("stats-strip"),
    counterTitle: byId("counter-title"),
    counterCount: byId("counter-count"),
    targetSummary: byId("target-summary"),
    counterResults: byId("counter-results"),
    godName: byId("god-name"),
    godPortrait: byId("god-portrait"),
    pantheonName: byId("pantheon-name"),
    godFacts: byId("god-facts"),
    buildingCount: byId("building-count"),
    buildingList: byId("building-list"),
    buildingDetail: byId("building-detail"),
    unitCount: byId("unit-count"),
    unitGroups: byId("unit-groups"),
    unitSideDetail: byId("unit-side-detail"),
    libraryCount: byId("library-count"),
    libraryResults: byId("library-results"),
  };

  const { pantheonById, godById, unitById, buildingById, technologyById } = runtimeIndexes;
  const ageOrder = new Map(data.ages.map((age, index) => [age, index]));
  const profileById = new Map(data.counterProfiles.map((profile) => [profile.id, profile]));
  const profileAliases = new Map([
    ["cav", "cavalry"],
    ["horse", "cavalry"],
    ["horses", "cavalry"],
    ["raider", "cavalry"],
    ["raid", "cavalry"],
    ["inf", "infantry"],
    ["foot", "infantry"],
    ["archers", "archer"],
    ["ranged", "archer"],
    ["bow", "archer"],
    ["bows", "archer"],
    ["myth unit", "myth"],
    ["myth units", "myth"],
    ["mu", "myth"],
    ["heroes", "hero"],
    ["siege unit", "siege"],
    ["siege units", "siege"],
    ["walls", "building"],
    ["tower", "building"],
    ["towers", "building"],
    ["naval", "ship"],
    ["ships", "ship"],
    ["boats", "ship"],
  ]);
  const resourceTypes = [
    { key: "food", label: "Food", pattern: /^food$/ },
    { key: "wood", label: "Wood", pattern: /^wood$/ },
    { key: "gold", label: "Gold", pattern: /^gold$/ },
    { key: "favor", label: "Favor", pattern: /^(favor|favour)$/ },
    { key: "population", label: "Population", pattern: /^(population|pop)$/ },
  ];
  const statIconKeys = new Map([
    ["food", "food"],
    ["wood", "wood"],
    ["gold", "gold"],
    ["favor", "favor"],
    ["favour", "favor"],
    ["population", "population"],
    ["pop", "population"],
    ["hit points", "hit-points"],
    ["hitpoints", "hit-points"],
    ["hp", "hit-points"],
    ["speed", "speed"],
    ["training time", "training-time"],
    ["research time", "research-time"],
    ["hack armor", "hack-armor"],
    ["pierce armor", "pierce-armor"],
    ["crush armor", "crush-armor"],
    ["hack attack", "hack-attack"],
    ["pierce attack", "pierce-attack"],
    ["crush attack", "crush-attack"],
    ["divine attack", "divine-attack"],
    ["reload time", "reload-time"],
    ["attack range", "attack-range"],
  ]);
  const unitTypeIconAliases = [
    ["human-soldier", ["human soldier", "human"]],
    ["siege-weapon", ["siege weapon", "siege"]],
    ["myth-unit", ["myth unit", "myth"]],
    ["flying-unit", ["flying unit", "flying"]],
    ["ship", ["naval unit", "naval", "ship"]],
    ["archer", ["archer"]],
    ["building", ["building"]],
    ["cavalry", ["cavalry"]],
    ["hero", ["hero"]],
    ["infantry", ["infantry"]],
    ["siege-ship", ["siege ship"]],
    ["titan", ["titan"]],
    ["tower", ["tower"]],
    ["villager", ["villager"]],
    ["wall", ["wall"]],
  ];

  init();

  function init() {
    populateEnemyGodSelect();
    populateEnemyDatalist();
    populateBuildOrderSelects();
    wireEvents();
    render();
    loadBuildOrders();
  }

  function withProductionSupplement(baseData, supplement = {}, technologySupplement = {}) {
    const runtimeData = {
      ...baseData,
      buildings: baseData.buildings.map((building) => ({
        ...building,
        produces: [...(building.produces || [])],
        upgrades: [...(building.upgrades || [])],
      })),
      units: baseData.units.map((unit) => ({
        ...unit,
        pantheons: [...unit.pantheons],
        classes: [...unit.classes],
        counters: [...unit.counters],
        productionBuildings: unique([unit.building, ...(unit.productionBuildings || [])]),
      })),
      technologies: (baseData.technologies || []).map((tech) => ({
        ...tech,
        pantheons: [...(tech.pantheons || ["all"])],
        availability: { ...(tech.availability || {}) },
      })),
    };

    const buildingIds = new Set(runtimeData.buildings.map((building) => building.id));
    for (const building of supplement?.buildings || []) {
      if (buildingIds.has(building.id)) continue;
      buildingIds.add(building.id);
      runtimeData.buildings.push({
        ...building,
        produces: [...(building.produces || [])],
        upgrades: [...(building.upgrades || [])],
      });
    }

    const unitById = new Map(runtimeData.units.map((unit) => [unit.id, unit]));
    for (const unit of supplement?.units || []) {
      const existing = unitById.get(unit.id);
      if (existing) {
        existing.pantheons = unique([...existing.pantheons, ...(unit.pantheons || [])]);
        existing.classes = unique([...existing.classes, ...(unit.classes || [])]);
        existing.counters = unique([...existing.counters, ...(unit.counters || [])]);
        existing.productionBuildings = unique([
          ...(existing.productionBuildings || []),
          existing.building,
          unit.building,
          ...(unit.productionBuildings || []),
        ]);
        if (!existing.availability && unit.availability) existing.availability = unit.availability;
        if (!existing.source && unit.source) existing.source = unit.source;
        continue;
      }

      const generatedUnit = {
        ...unit,
        pantheons: [...(unit.pantheons || [])],
        classes: [...(unit.classes || [])],
        counters: [...(unit.counters || [])],
        productionBuildings: unique([unit.building, ...(unit.productionBuildings || [])]),
      };
      unitById.set(generatedUnit.id, generatedUnit);
      runtimeData.units.push(generatedUnit);
    }

    const technologyById = new Map(runtimeData.technologies.map((tech) => [tech.id, tech]));
    for (const tech of [...(supplement?.technologies || []), ...(technologySupplement?.technologies || [])]) {
      const existing = technologyById.get(tech.id);
      if (existing) {
        existing.pantheons = unique([...(existing.pantheons || []), ...(tech.pantheons || [])]);
        existing.availability = { ...(existing.availability || {}), ...(tech.availability || {}) };
        if (!existing.source && tech.source) existing.source = tech.source;
        if (!existing.effect && tech.effect) existing.effect = tech.effect;
        continue;
      }

      const generatedTech = {
        ...tech,
        pantheons: [...(tech.pantheons || ["all"])],
        availability: { ...(tech.availability || {}) },
      };
      technologyById.set(generatedTech.id, generatedTech);
      runtimeData.technologies.push(generatedTech);
    }

    for (const building of runtimeData.buildings) {
      const producedNames = runtimeData.units
        .filter((unit) => hasPantheon(unit, building.pantheons[0] || "all") || building.pantheons.includes("all"))
        .filter((unit) => (unit.productionBuildings || [unit.building]).some((name) => normalize(name) === normalize(building.name)))
        .map((unit) => unit.name);
      building.produces = unique([...(building.produces || []), ...producedNames]);
    }

    return runtimeData;
  }

  function populateEnemyGodSelect() {
    els.enemyGodSelect.textContent = "";

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All enemy gods";
    els.enemyGodSelect.append(allOption);

    data.pantheons.forEach((pantheon) => {
      const gods = majorGods().filter((god) => god.pantheon === pantheon.id);
      if (!gods.length) return;

      const group = document.createElement("optgroup");
      group.label = pantheon.name;
      gods.forEach((god) => {
        const option = document.createElement("option");
        option.value = god.id;
        option.textContent = god.name;
        group.append(option);
      });
      els.enemyGodSelect.append(group);
    });

    if (state.enemyGodId !== "all" && !godById.has(state.enemyGodId)) state.enemyGodId = "all";
    els.enemyGodSelect.value = state.enemyGodId;
  }

  function populateEnemyDatalist() {
    els.enemyUnits.textContent = "";
    const labels = unique([
      ...data.counterProfiles.map((profile) => profile.name),
      ...enemyLookupUnits().map((unit) => unit.name),
    ]).sort((a, b) => a.localeCompare(b));

    labels.forEach((label) => {
      const option = document.createElement("option");
      option.value = label;
      els.enemyUnits.append(option);
    });
  }

  function populateBuildOrderSelects() {
    els.buildOrderGod.textContent = "";
    majorGods().forEach((god) => {
      const option = document.createElement("option");
      option.value = god.id;
      option.textContent = god.name;
      els.buildOrderGod.append(option);
    });

    els.buildOrderEnemy.textContent = "";
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "Any enemy";
    els.buildOrderEnemy.append(allOption);
    majorGods().forEach((god) => {
      const option = document.createElement("option");
      option.value = god.id;
      option.textContent = god.name;
      els.buildOrderEnemy.append(option);
    });
  }

  function wireEvents() {
    window.addEventListener("hashchange", renderActiveView);
    els.homeGodSearch.addEventListener("input", renderHome);
    els.librarySearch.addEventListener("input", renderLibrary);
    els.buildOrderNew.addEventListener("click", () => {
      state.buildOrderId = "";
      localStorage.removeItem("aom:selectedBuildOrder");
      state.buildOrderStatus = "Drafting a new build order.";
      renderBuildOrders(defaultBuildOrderDraft());
    });
    els.buildOrderExportAll.addEventListener("click", exportBuildOrderLibrary);
    els.buildOrderExport.addEventListener("click", exportCurrentBuildOrder);
    els.buildOrderImport.addEventListener("click", importBuildOrderCode);
    els.buildOrderImportAll.addEventListener("click", importBuildOrderLibraryCode);
    els.buildOrderDelete.addEventListener("click", deleteSelectedBuildOrder);
    els.buildOrderForm.addEventListener("submit", saveBuildOrderFromForm);
    els.buildOrderForm.addEventListener("click", handleBuildOrderFormClick);
    els.buildOrderList.addEventListener("click", handleBuildOrderListClick);
    els.enemyGodSelect.addEventListener("change", () => {
      state.enemyGodId = els.enemyGodSelect.value;
      localStorage.setItem("aom:enemyGod", state.enemyGodId);
      populateEnemyDatalist();
      renderCounters();
    });
    els.enemySearch.addEventListener("input", renderCounters);
    els.matchupBrief.addEventListener("change", handleMatchupBuildOrderChange);
    els.matchupBrief.addEventListener("click", handleMatchupBuildOrderClick);

    els.ageButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.age = button.dataset.age;
        localStorage.setItem("aom:currentAge", state.age);
        populateEnemyDatalist();
        renderAgeButtons();
        renderSummary();
        renderBuildings();
        renderUnits();
        renderCounters();
        renderLibrary();
      });
    });

    els.modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.mode = button.dataset.mode;
        localStorage.setItem("aom:counterMode", state.mode);
        renderModeButtons();
        renderCounters();
        renderUnits();
        renderBuildings();
        renderSummary();
      });
    });
  }

  function render() {
    renderAgeButtons();
    renderModeButtons();
    renderActiveView();
    renderSummary();
    renderHome();
    renderGod();
    renderBuildings();
    renderUnits();
    renderCounters();
    renderLibrary();
    renderBuildOrders();
  }

  function renderActiveView() {
    const viewId = activeViewId();
    const viewContext = appConfig.views[viewId] || appConfig.views["home-view"] || {
      label: "AoM Companion",
      description: "Browse the local strategy library.",
      usesRosterFilters: false,
    };

    document.body.dataset.activeView = viewId;
    document.body.classList.toggle("has-roster-filters", Boolean(viewContext.usesRosterFilters));
    els.viewContextLabel.textContent = viewContext.label;
    els.viewContextDescription.textContent = viewContext.description;
    document.title = `${viewContext.label} · ${selectedGod().name} | AoM Companion`;
    els.viewPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === viewId);
    });
    els.navLinks.forEach((linkEl) => {
      const isActive = linkEl.dataset.viewLink === viewId;
      linkEl.classList.toggle("active", isActive);
      if (isActive) linkEl.setAttribute("aria-current", "page");
      else linkEl.removeAttribute("aria-current");
    });
  }

  function activeViewId() {
    const hashId = window.location.hash.replace(/^#/, "");
    const validIds = new Set(els.viewPanels.map((panel) => panel.id));
    return validIds.has(hashId) ? hashId : "home-view";
  }

  function navigateTo(viewId) {
    if (window.location.hash === `#${viewId}`) {
      renderActiveView();
      return;
    }
    window.location.hash = viewId;
  }

  function renderHome() {
    const term = normalize(els.homeGodSearch.value.trim());
    const allMajorGods = majorGods();
    const gods = allMajorGods
      .filter((god) => {
        if (!term) return true;
        const pantheon = pantheonById.get(god.pantheon);
        return normalize([god.name, god.focus, pantheon?.name, pantheon?.focus].join(" ")).includes(term);
      });

    els.homeGodResultCount.textContent = term
      ? `${gods.length} of ${allMajorGods.length} major gods`
      : `${gods.length} major gods`;

    els.homeGodGrid.innerHTML = data.pantheons
      .map((pantheon) => {
        const pantheonGods = gods.filter((god) => god.pantheon === pantheon.id);
        if (!pantheonGods.length) return "";
        return `
          <section class="god-picker-group">
            <div>
              <p class="eyebrow">${escapeHtml(pantheon.name)}</p>
              <h3>${escapeHtml(pantheon.focus)}</h3>
            </div>
            <div class="god-card-grid">
              ${pantheonGods.map((god) => godCard(god, pantheon)).join("")}
            </div>
          </section>
        `;
      })
      .join("") || empty("No gods match that search.");

    Array.from(els.homeGodGrid.querySelectorAll("[data-god-id]")).forEach((button) => {
      button.addEventListener("click", () => selectGod(button.dataset.godId));
    });
  }

  function godCard(god, pantheon) {
    return `
      <button class="god-card ${god.id === state.godId ? "active" : ""}" type="button" data-god-id="${escapeAttribute(god.id)}" aria-pressed="${god.id === state.godId ? "true" : "false"}">
        <span class="god-card-media" aria-hidden="true">
          ${iconMarkup("gods", god, "god-card-portrait")}
        </span>
        <span class="god-card-copy">
          <span class="god-card-pantheon">${escapeHtml(pantheon.name)}</span>
          <strong>${escapeHtml(god.name)}</strong>
          <small>${escapeHtml(god.focus)}</small>
        </span>
      </button>
    `;
  }

  function selectGod(godId) {
    if (!godById.has(godId)) return;
    state.godId = godId;
    state.buildingId = "";
    state.unitId = "";
    localStorage.setItem("aom:selectedGod", state.godId);
    localStorage.removeItem("aom:selectedBuilding");
    localStorage.removeItem("aom:selectedUnit");
    render();
    navigateTo("god-view");
  }

  function selectedGod() {
    return godById.get(state.godId) || godById.get("zeus");
  }

  function selectedEnemyGod() {
    return state.enemyGodId === "all" ? null : godById.get(state.enemyGodId) || null;
  }

  function selectedPantheon() {
    return pantheonById.get(selectedGod().pantheon);
  }

  function majorGods() {
    return data.gods.filter((god) => god.tier === "major");
  }

  function renderModeButtons() {
    els.modeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === state.mode);
      button.setAttribute("aria-pressed", button.dataset.mode === state.mode ? "true" : "false");
    });
  }

  function renderAgeButtons() {
    if (state.age !== "all" && !ageOrder.has(state.age)) state.age = "all";
    els.ageButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.age === state.age);
      button.setAttribute("aria-pressed", button.dataset.age === state.age ? "true" : "false");
    });
  }

  function renderSummary() {
    const god = selectedGod();
    const pantheon = selectedPantheon();
    const buildings = availableBuildings(god);
    const units = availableUnits(god);
    const coreUnits = availableUnits(god, "core").filter((unit) => !unit.classes.includes("economic"));

    els.dataStatus.textContent = `${data.units.length} units seeded`;
    els.selectedTitle.textContent = `${god.name} — ${pantheon.name}`;
    els.sidebarCurrent.innerHTML = `
      ${iconMarkup("gods", god, "portrait small-portrait")}
      <div class="sidebar-current-copy">
        <p class="eyebrow">Current god</p>
        <strong>${escapeHtml(god.name)}</strong>
        <span>${escapeHtml(pantheon.name)}</span>
        <a href="#home-view">Change god</a>
      </div>
    `;
    els.statsStrip.innerHTML = [
      stat(buildings.length, "Buildings"),
      stat(units.length, state.mode === "core" ? "Core units" : "Unit options"),
      stat(coreUnits.length, "Counter pool"),
    ].join("");
  }

  function stat(value, label) {
    return `<div class="stat"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`;
  }

  function renderGod() {
    const god = selectedGod();
    const pantheon = selectedPantheon();
    const minorGods = data.gods
      .filter((candidate) => candidate.pantheon === pantheon.id && candidate.tier === "minor")
      .filter((candidate) => !god.minorGods?.length || god.minorGods.some((name) => normalize(name) === normalize(candidate.name)))
      .sort(sortByAge);

    els.godName.textContent = god.name;
    els.godPortrait.innerHTML = iconMarkup("gods", god, "portrait");
    els.pantheonName.textContent = pantheon.name;
    els.godFacts.innerHTML = [
      fact("Focus", god.focus),
      fact("Pantheon", pantheon.focus),
      fact("Favor", pantheon.favor),
      fact(
        god.minorGods?.length ? "Available minor gods" : "Pantheon minor gods",
        minorGods.map((minorGod) => `${minorGod.name} (${minorGod.age})`).join(", ") || "Pending import.",
      ),
      fact("Source", link(god.source, god.name)),
    ].join("");
  }

  function fact(label, value) {
    return `<div class="fact"><strong>${statLabelMarkup(label)}</strong><p>${value}</p></div>`;
  }

  function renderBuildings() {
    const god = selectedGod();
    const buildings = availableBuildings(god).sort(sortBuildings);
    els.buildingCount.textContent = `${buildings.length} buildings`;

    if (!buildings.length) {
      els.buildingList.innerHTML = empty("No buildings for this god yet.");
      els.buildingDetail.innerHTML = "";
      return;
    }

    if (!state.buildingId || !buildings.some((building) => building.id === state.buildingId)) {
      const firstProduction = buildings.find((building) => building.produces.length) || buildings[0];
      state.buildingId = firstProduction.id;
    }
    localStorage.setItem("aom:selectedBuilding", state.buildingId);

    els.buildingList.innerHTML = buildings
      .map(
        (building) => `
          <button class="building-button ${building.id === state.buildingId ? "active" : ""}" type="button" data-building-id="${building.id}" aria-pressed="${building.id === state.buildingId ? "true" : "false"}">
            ${iconMarkup("buildings", building)}
            <span class="building-button-copy">
              <strong>${escapeHtml(building.name)}</strong>
              <span>${escapeHtml(building.age)} / ${escapeHtml(building.type)}</span>
            </span>
          </button>
        `,
      )
      .join("");

    Array.from(els.buildingList.querySelectorAll("[data-building-id]")).forEach((button) => {
      button.addEventListener("click", () => {
        state.buildingId = button.dataset.buildingId;
        state.unitId = "";
        localStorage.setItem("aom:selectedBuilding", state.buildingId);
        localStorage.removeItem("aom:selectedUnit");
        renderBuildings();
      });
    });

    renderBuildingDetail();
  }

  function renderBuildingDetail() {
    const building = buildingById.get(state.buildingId);
    const god = selectedGod();
    const units = availableUnits(god, "all").filter((unit) => isProducedAt(unit, building));
    const upgrades = upgradesForBuilding(building, god);
    const notes = buildingNotes(building, god);
    const selectedUnit = selectedBuildingUnit(units);

    els.buildingDetail.innerHTML = [
      `<div class="detail-block">
        <div class="entity-heading">
          ${iconMarkup("buildings", building, "large")}
          <div>
            <h3>${escapeHtml(building.name)}</h3>
            <p>${escapeHtml(building.age)} ${escapeHtml(building.type)} building</p>
          </div>
        </div>
        <div class="meta-line">
          ${tag(building.age, "gold")}
          ${tag(building.type, "blue")}
          ${building.pantheons.map((pantheon) => tag(pantheon === "all" ? "All" : pantheonName(pantheon), "green")).join("")}
        </div>
      </div>`,
      notes.length ? detailList("God / Pantheon Notes", notes.map((note) => `<span class="note-pill">${escapeHtml(note)}</span>`)) : "",
      detailList("Produces", units.map((unit) => unitChip(unit)), "No trainable units listed for this building and god yet."),
      selectedUnit ? unitDetail(selectedUnit) : "",
      upgradeList(upgrades),
      `<div class="detail-block"><h3>Source</h3><p>${link(building.source, building.name)}</p></div>`,
    ].join("");

    Array.from(els.buildingDetail.querySelectorAll("[data-unit-id]")).forEach((button) => {
      button.addEventListener("click", () => selectUnit(button.dataset.unitId));
    });
  }

  function selectedBuildingUnit(units) {
    if (!units.length) return null;
    if (!state.unitId || !units.some((unit) => unit.id === state.unitId)) {
      state.unitId = units[0].id;
      localStorage.setItem("aom:selectedUnit", state.unitId);
    }
    return units.find((unit) => unit.id === state.unitId) || units[0];
  }

  function detailList(label, items, emptyText = "No entries listed.") {
    return `<div class="detail-block"><h3>${escapeHtml(label)}</h3><div class="inline-list">${items.length ? items.join("") : `<span class="muted">${escapeHtml(emptyText)}</span>`}</div></div>`;
  }

  function unitChip(unit) {
    return `<button class="icon-chip ${unit.id === state.unitId ? "active" : ""} ${unit.availability?.minorGod ? "red" : "green"}" type="button" data-unit-id="${escapeAttribute(unit.id)}">${iconMarkup("units", unit, "tiny")}${escapeHtml(unit.name)}</button>`;
  }

  function renderUnits() {
    const god = selectedGod();
    const units = availableUnits(god)
      .filter((unit) => !unit.classes.includes("economic"))
      .sort(sortUnits);
    const selectedUnit = selectedRosterUnit(units);
    const groups = groupBy(units, (unit) => unit.building || "Other");

    els.unitCount.textContent = `${units.length} units`;
    els.unitGroups.innerHTML = units.length
      ? Array.from(groups.entries())
          .map(([building, groupUnits]) => {
            const cards = groupUnits.map((unit) => unitCard(unit, selectedUnit?.id)).join("");
            return `<div class="unit-group"><h3>${escapeHtml(building)}</h3><div class="unit-grid">${cards}</div></div>`;
          })
          .join("")
      : empty("No units for this god and filter yet.");
    els.unitSideDetail.innerHTML = selectedUnit ? unitDetail(selectedUnit) : empty("Select a unit to see stats.");

    Array.from(els.unitGroups.querySelectorAll("[data-unit-id]")).forEach((card) => {
      card.addEventListener("click", () => selectUnit(card.dataset.unitId));
    });
  }

  function selectedRosterUnit(units) {
    if (!units.length) return null;
    return units.find((unit) => unit.id === state.unitId) || units[0];
  }

  function unitCard(unit, selectedUnitId = state.unitId) {
    return `
      <button class="unit-card ${unit.id === selectedUnitId ? "active" : ""}" type="button" data-unit-id="${escapeAttribute(unit.id)}" aria-pressed="${unit.id === selectedUnitId ? "true" : "false"}">
        <span class="entity-heading">
          ${iconMarkup("units", unit)}
          <strong class="card-title">${escapeHtml(unit.name)}</strong>
        </span>
        <span class="card-description">${escapeHtml(unit.note)}</span>
        <span class="meta-line">
          ${tag(unit.age, "gold")}
          ${availabilityTag(unit)}
          ${unit.classes.slice(0, 4).map((unitClass) => tag(unitClass, "blue")).join("")}
        </span>
      </button>
    `;
  }

  function renderCounters() {
    const god = selectedGod();
    const query = els.enemySearch.value.trim();
    const enemyGod = selectedEnemyGod();
    const target = resolveTarget(query, enemyGod);
    const results = target ? counterResultsForTarget(god, target) : [];

    renderEnemyUnitPicker(enemyGod, query, target);
    renderMatchupBrief(god, enemyGod, target, results);

    if (!target) {
      els.counterTitle.textContent = enemyGod ? `Pick a ${enemyGod.name} unit` : "Pick an enemy unit";
      els.counterCount.textContent = "0 matches";
      els.targetSummary.innerHTML = [
        enemyGod ? tag(`Enemy: ${enemyGod.name}`, "red") : "",
        enemyGod ? tag(pantheonName(enemyGod.pantheon), "green") : "",
        tag(currentAgeLabel(), "gold"),
        tag("cavalry", "blue"),
        tag("archer", "blue"),
        tag("myth", "blue"),
        tag("siege", "blue"),
      ].join("");
      els.counterResults.innerHTML = empty("Enter a unit name or class.");
      return;
    }

    els.counterTitle.textContent = `Counter ${target.name}${enemyGod ? ` from ${enemyGod.name}` : ""}`;
    els.counterCount.textContent = `${results.length} matches`;
    els.targetSummary.innerHTML = [
      enemyGod ? tag(`Enemy: ${enemyGod.name}`, "red") : "",
      enemyGod ? tag(pantheonName(enemyGod.pantheon), "green") : "",
      tag(currentAgeLabel(), "gold"),
      ...target.tags.map((item) => tag(item, "blue")),
      target.unit ? tag(target.unit.age, "gold") : "",
      target.unit ? tag(target.unit.building, "green") : "",
    ].join("");

    els.counterResults.innerHTML = results.length
      ? results.map(counterResult).join("")
      : empty("No seeded counters found for this god yet.");

    Array.from(els.counterResults.querySelectorAll("[data-unit-id]")).forEach((row) => {
      row.addEventListener("click", () => selectUnit(row.dataset.unitId, true));
    });
  }

  function counterResultsForTarget(god, target) {
    return availableUnits(god)
      .filter((unit) => !unit.classes.includes("economic"))
      .map((unit) => scoreCounter(unit, target))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || sortUnits(a.unit, b.unit));
  }

  function renderMatchupBrief(god, enemyGod, target, exactResults) {
    const threats = enemyThreatProfile(enemyGod);
    const planTarget = target || inferredTargetFromThreats(threats);
    const planResults = target ? exactResults : planTarget ? counterResultsForTarget(god, planTarget) : [];
    const topCounters = planResults.slice(0, 3);
    const suggestedPlan = createSuggestedMatchupPlan(god, enemyGod, target, planTarget, topCounters, threats);
    activeSuggestedPlan = suggestedPlan;
    activeSuggestedPlanContext = { god, enemyGod, target, planTarget };
    const watchItems = matchupWatchItems(enemyGod, target, threats);
    const matchingOrders = matchingBuildOrdersForMatchup(god, enemyGod);
    const selectedOrder = selectedMatchupBuildOrder(matchingOrders);
    const enemyLabel = enemyGod ? enemyGod.name : "Any enemy";
    const enemyPantheon = enemyGod ? pantheonName(enemyGod.pantheon) : "Scout first";
    const planLabel = target ? `Target: ${target.name}` : planTarget ? `Likely threat: ${planTarget.name}` : "No matchup selected";

    els.matchupBrief.innerHTML = `
      <section class="matchup-head">
        <div class="matchup-versus">
          ${matchupGodPill(god, pantheonName(god.pantheon))}
          <span class="versus-token">vs</span>
          ${enemyGod ? matchupGodPill(enemyGod, enemyPantheon) : matchupEmptyPill(enemyLabel, enemyPantheon)}
        </div>
        <div class="meta-line">
          ${tag(currentAgeLabel(), "gold")}
          ${tag(state.mode === "core" ? "Core options" : "All options", "green")}
          ${tag(planLabel, target ? "red" : "blue")}
          ${tag(selectedOrder ? "Saved build override" : "Suggested build order", selectedOrder ? "green" : "blue")}
        </div>
      </section>
      <div class="matchup-plan-grid">
        <section class="matchup-card matchup-card-wide">
          <div class="matchup-card-heading">
            <h3>Build order</h3>
            <span>${escapeHtml(selectedOrder ? "saved override" : suggestedPlan.specificity)}</span>
          </div>
          ${matchupBuildOrderSourceControl(matchingOrders, selectedOrder)}
          ${selectedOrder ? savedMatchupBuildOrderMarkup(selectedOrder) : suggestedMatchupBuildOrderMarkup(suggestedPlan)}
        </section>
        <section class="matchup-card">
          <div class="matchup-card-heading">
            <h3>Counter core</h3>
            <span>${topCounters.length ? `${topCounters.length} picks` : "pending"}</span>
          </div>
          <div class="matchup-counter-list">
            ${topCounters.length ? topCounters.map(matchupCounterButton).join("") : `<p class="muted">Select an enemy god or unit to generate counter picks for this age.</p>`}
          </div>
        </section>
        <section class="matchup-card">
          <div class="matchup-card-heading">
            <h3>Watch list</h3>
            <span>${watchItems.length} checks</span>
          </div>
          <div class="watch-list">
            ${watchItems.map((item) => tag(item, "blue")).join("")}
          </div>
        </section>
      </div>
    `;

    Array.from(els.matchupBrief.querySelectorAll("[data-unit-id]")).forEach((button) => {
      button.addEventListener("click", () => selectUnit(button.dataset.unitId, true));
    });
  }

  function handleMatchupBuildOrderChange(event) {
    const select = event.target.closest("[data-matchup-build-select]");
    if (!select) return;
    state.matchupBuildOrderId = select.value || "__suggested";
    localStorage.setItem("aom:matchupBuildOrder", state.matchupBuildOrderId);
    renderCounters();
  }

  function handleMatchupBuildOrderClick(event) {
    const createButton = event.target.closest("[data-matchup-build-create]");
    if (createButton && activeSuggestedPlan && activeSuggestedPlanContext) {
      state.buildOrderId = "";
      localStorage.removeItem("aom:selectedBuildOrder");
      state.buildOrderStatus = "Drafted from the current matchup suggestion. Review the timings, then save it locally.";
      renderBuildOrders(suggestedPlanBuildOrderDraft(activeSuggestedPlan, activeSuggestedPlanContext));
      navigateTo("build-order-view");
      return;
    }

    const editButton = event.target.closest("[data-matchup-build-edit]");
    if (!editButton) return;
    const order = state.buildOrders.find((candidate) => candidate.id === editButton.dataset.matchupBuildEdit);
    if (!order) return;
    state.buildOrderId = order.id;
    localStorage.setItem("aom:selectedBuildOrder", state.buildOrderId);
    state.buildOrderStatus = "Editing build order from Matchup.";
    renderBuildOrders();
    navigateTo("build-order-view");
  }

  function matchingBuildOrdersForMatchup(god, enemyGod) {
    return state.buildOrders
      .filter((order) => order.godId === god.id)
      .filter((order) => order.enemyGodId === "all" || !enemyGod || order.enemyGodId === enemyGod.id)
      .sort((a, b) => buildOrderMatchScore(b, enemyGod) - buildOrderMatchScore(a, enemyGod) || sortBuildOrders(a, b));
  }

  function buildOrderMatchScore(order, enemyGod) {
    let score = 0;
    if (enemyGod && order.enemyGodId === enemyGod.id) score += 20;
    if (order.enemyGodId === "all") score += 5;
    if (order.age === state.age) score += 8;
    if (order.age === "all") score += 3;
    return score;
  }

  function selectedMatchupBuildOrder(matchingOrders) {
    if (state.matchupBuildOrderId === "__suggested") return null;
    const order = matchingOrders.find((candidate) => candidate.id === state.matchupBuildOrderId);
    if (order) return order;
    state.matchupBuildOrderId = "__suggested";
    localStorage.setItem("aom:matchupBuildOrder", state.matchupBuildOrderId);
    return null;
  }

  function matchupBuildOrderSourceControl(matchingOrders, selectedOrder) {
    const options = [
      `<option value="__suggested"${selectedOrder ? "" : " selected"}>Suggested plan</option>`,
      ...matchingOrders.map((order) => {
        const enemyLabel = order.enemyGodId === "all" ? "Any enemy" : godById.get(order.enemyGodId)?.name || "Unknown enemy";
        const selected = selectedOrder?.id === order.id ? " selected" : "";
        return `<option value="${escapeAttribute(order.id)}"${selected}>${escapeHtml(order.title)} (${escapeHtml(enemyLabel)})</option>`;
      }),
    ].join("");

    return `
      <div class="matchup-build-source">
        <label>
          <span>Build order source</span>
          <select data-matchup-build-select>${options}</select>
        </label>
        ${
          selectedOrder
            ? `<button class="secondary-button" type="button" data-matchup-build-edit="${escapeAttribute(selectedOrder.id)}">Edit build</button>`
            : `<button class="secondary-button" type="button" data-matchup-build-create>Create build</button>`
        }
      </div>
    `;
  }

  function suggestedPlanBuildOrderDraft(plan, context) {
    const matchupLabel = context.enemyGod?.name || context.target?.name || context.planTarget?.name || "Any enemy";
    const targetTags = context.target?.tags || context.planTarget?.tags || [];
    return {
      ...defaultBuildOrderDraft(),
      title: `${context.god.name} vs ${matchupLabel}`,
      godId: context.god.id,
      enemyGodId: context.enemyGod?.id || "all",
      age: state.age,
      tags: unique(["suggested", "matchup", ...targetTags.slice(0, 4)]),
      goals: [{ time: state.age === "all" ? "Flexible" : state.age, text: plan.summary }],
      steps: plan.steps.map((step) => ({
        time: step.phase,
        action: step.action,
        notes: step.reason,
      })),
      notes: `Generated from strategy rules v${plan.version}. ${plan.matchedRules.map((rule) => `${rule.label}: ${rule.reason}`).join(" ")}`,
    };
  }

  function suggestedMatchupBuildOrderMarkup(plan) {
    return `
      <div class="suggested-plan-summary">
        <strong>${escapeHtml(plan.title)}</strong>
        <p>${escapeHtml(plan.summary)}</p>
        <div class="suggested-plan-priorities" aria-label="Resource priority">
          <span>Resource priority</span>
          ${plan.priorities.map((resource, index) => tag(`${index + 1}. ${resource}`, index === 0 ? "gold" : "blue")).join("")}
        </div>
      </div>
      <ol class="strategy-step-list">
        ${plan.steps.map(strategyStepMarkup).join("")}
      </ol>
      <details class="strategy-rationale">
        <summary>Why this plan</summary>
        <div>
          ${plan.matchedRules.map((rule) => `<p><strong>${escapeHtml(rule.label)}</strong><span>${escapeHtml(rule.reason)}</span></p>`).join("")}
        </div>
      </details>
    `;
  }

  function strategyStepMarkup(step) {
    return `
      <li>
        <span class="strategy-phase">${escapeHtml(step.phase)}</span>
        <span class="strategy-step-copy">
          <strong>${escapeHtml(step.action)}</strong>
          <span>${escapeHtml(step.reason)}</span>
        </span>
      </li>
    `;
  }

  function savedMatchupBuildOrderMarkup(order) {
    const author = order.author ? `By ${order.author}` : "";
    const meta = unique([order.age === "all" ? "Flexible age" : order.age, order.patch, author]);
    return `
      <div class="matchup-saved-build">
        <div class="matchup-saved-build-title">
          <strong>${escapeHtml(order.title)}</strong>
          <span>${meta.map((item) => tag(item, "blue")).join("")}</span>
        </div>
        ${order.tags.length ? `<div class="meta-line">${order.tags.map((item) => tag(item, "green")).join("")}</div>` : ""}
        ${order.goals.length ? `
          <div class="matchup-build-subsection">
            <h4>Goals</h4>
            <ul class="matchup-build-goal-list">
              ${order.goals.map((goal) => `<li><strong>${escapeHtml(goal.time || "Any time")}</strong><span>${escapeHtml(goal.text)}</span></li>`).join("")}
            </ul>
          </div>
        ` : ""}
        <div class="matchup-build-subsection">
          <h4>Steps</h4>
          ${
            order.steps.length
              ? `<ol class="matchup-build-step-list saved">${order.steps.map(savedMatchupBuildStep).join("")}</ol>`
              : `<p class="muted">No steps are saved in this build order yet.</p>`
          }
        </div>
        ${order.notes ? `<div class="matchup-build-notes"><h4>Notes</h4><p>${escapeHtml(order.notes)}</p></div>` : ""}
      </div>
    `;
  }

  function savedMatchupBuildStep(step) {
    return `
      <li>
        <div class="matchup-build-step-heading">
          <strong>${escapeHtml(step.time || "Any time")}</strong>
          <span>${escapeHtml(step.action || "Untitled step")}</span>
        </div>
        ${step.notes ? `<p>${escapeHtml(step.notes)}</p>` : ""}
      </li>
    `;
  }

  function matchupGodPill(god, subtitle) {
    return `
      <span class="matchup-god-pill">
        ${iconMarkup("gods", god, "tiny")}
        <span>
          <strong>${escapeHtml(god.name)}</strong>
          <small>${escapeHtml(subtitle)}</small>
        </span>
      </span>
    `;
  }

  function matchupEmptyPill(title, subtitle) {
    return `
      <span class="matchup-god-pill muted-pill">
        <span class="entity-icon tiny missing"><span class="icon-fallback">?</span></span>
        <span>
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(subtitle)}</small>
        </span>
      </span>
    `;
  }

  function matchupCounterButton(result) {
    const unit = result.unit;
    return `
      <button class="matchup-counter-button" type="button" data-unit-id="${escapeAttribute(unit.id)}">
        ${iconMarkup("units", unit, "tiny")}
        <span>
          <strong>${escapeHtml(unit.name)}</strong>
          <small>${escapeHtml(result.confidence)} fit / ${escapeHtml(unit.age)} / ${escapeHtml(unit.building)}</small>
        </span>
      </button>
    `;
  }

  function enemyThreatProfile(enemyGod) {
    if (!enemyGod) return [];
    const units = enemyLookupUnits(enemyGod);
    const profiles = data.counterProfiles.filter((profile) => !["building", "hero"].includes(profile.id));

    return profiles
      .map((profile) => {
        const matchingUnits = units.filter((unit) => profile.tags.some((tagName) => unit.classes.includes(tagName)));
        return {
          id: profile.id,
          name: profile.name,
          tags: profile.tags,
          count: matchingUnits.length,
        };
      })
      .filter((profile) => profile.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 4);
  }

  function inferredTargetFromThreats(threats) {
    const threat = threats[0];
    if (!threat) return null;
    const profile = profileById.get(threat.id);
    return {
      name: profile?.name || threat.name,
      tags: profile?.tags || threat.tags,
      unit: null,
      inferred: true,
    };
  }

  function matchupWatchItems(enemyGod, target, threats) {
    if (target) {
      return unique([
        ...target.tags.slice(0, 4),
        target.unit?.building,
        target.unit?.age,
      ]).slice(0, 6);
    }

    if (threats.length) {
      return threats.map((threat) => `${threat.name}: ${threat.count}`);
    }

    return enemyGod
      ? ["first production building", "Temple timing", "second military building"]
      : ["enemy god", "first unit line", "current age"];
  }

  function createSuggestedMatchupPlan(god, enemyGod, target, planTarget, counterResults, threats) {
    const counterUnits = counterResults.map((result) => result.unit);
    const primaryCounter = counterUnits[0];
    const buildings = availableBuildings(god);
    const targetTags = new Set((target || planTarget)?.tags || []);
    const namedBuilding = (name) => buildings.find((building) => normalize(building.name) === normalize(name))?.name;
    const fallbackBuilding = targetTags.has("ship")
      ? namedBuilding("Dock") || "Dock"
      : targetTags.has("myth")
        ? namedBuilding("Temple") || "hero access"
        : buildings.find((building) => building.type === "production" && building.produces.length)?.name || "your first military building";
    const upgradeGroup = primaryCounter
      ? availableUpgradeGroupsForUnit(primaryCounter, god).find((candidate) => candidate.upgrades.length)
      : null;
    const upgrades = upgradeGroup?.upgrades.slice(0, 2).map((upgrade) => upgrade.name) || [];
    const upgradeAction = primaryCounter
      ? upgrades.length
        ? `After ${primaryCounter.name} count is stable, check ${upgradeGroup.building.name} for ${formatList(upgrades)}.`
        : `Keep resources in ${primaryCounter.name} count first; no current-age upgrade is mapped for it yet.`
      : "Delay military upgrades until the enemy line is confirmed; spend first on economy and the counter building.";

    return strategyEngine.createPlan({
      age: state.age,
      playerGod: { id: god.id, name: god.name, pantheon: god.pantheon },
      enemyGod: enemyGod ? { id: enemyGod.id, name: enemyGod.name, pantheon: enemyGod.pantheon, focus: enemyGod.focus } : null,
      target,
      inferredTarget: target ? null : planTarget,
      counters: counterUnits.map((unit) => ({ id: unit.id, name: unit.name, age: unit.age, building: unit.building })),
      threats,
      fallbackBuilding,
      upgradeAction,
      upgradeReason: primaryCounter
        ? "Upgrade only after the counter line has enough bodies to function in the current fight."
        : "Early upgrades are risky before the target composition is known.",
      targetIsLaterAge: Boolean(target?.unit && state.age !== "all" && ageOrder.get(target.unit.age) > ageOrder.get(state.age)),
    });
  }

  function renderEnemyUnitPicker(enemyGod, query, target) {
    const term = normalize(query);
    const units = enemyLookupUnits(enemyGod)
      .filter((unit) => !unit.classes.includes("economic"))
      .filter((unit) => {
        if (!term || target?.unit?.id === unit.id) return true;
        return normalize([unit.name, unit.building, unit.age, unit.classes.join(" ")].join(" ")).includes(term);
      })
      .sort(sortUnits);
    const visibleUnits = enemyGod || term ? units.slice(0, 60) : [];
    const heading = enemyGod
      ? `${enemyGod.name} enemy roster`
      : term
        ? "Matching enemy units"
        : "Choose an enemy god to browse that roster.";

    els.enemyUnitPicker.innerHTML = `
      <div class="enemy-picker-heading">
        <strong>${escapeHtml(heading)}</strong>
        ${visibleUnits.length ? `<span>${visibleUnits.length}${units.length > visibleUnits.length ? ` of ${units.length}` : ""}</span>` : ""}
      </div>
      ${
        visibleUnits.length
          ? `<div class="enemy-picker-list">${visibleUnits.map(enemyUnitButton).join("")}</div>`
          : `<div class="muted enemy-picker-empty">${escapeHtml(enemyGod ? "No enemy units match that search." : "The selector above filters the unit list and autocomplete.")}</div>`
      }
    `;

    Array.from(els.enemyUnitPicker.querySelectorAll("[data-enemy-unit-id]")).forEach((button) => {
      button.addEventListener("click", () => {
        const unit = unitById.get(button.dataset.enemyUnitId);
        if (!unit) return;
        els.enemySearch.value = unit.name;
        renderCounters();
      });
    });
  }

  function enemyUnitButton(unit) {
    return `
      <button class="enemy-unit-button" type="button" data-enemy-unit-id="${escapeAttribute(unit.id)}">
        ${iconMarkup("units", unit, "tiny")}
        <span>
          <strong>${escapeHtml(unit.name)}</strong>
          <small>${escapeHtml(unit.age)} / ${escapeHtml(unit.building)}</small>
        </span>
      </button>
    `;
  }

  function counterResult(result) {
    const { unit, confidence, matches, reasons } = result;
    return `
      <button class="result-item" type="button" data-unit-id="${escapeAttribute(unit.id)}" aria-label="View ${escapeAttribute(unit.name)} in Buildings">
        ${iconMarkup("units", unit)}
        <span class="result-copy">
          <strong class="card-title">${escapeHtml(unit.name)}</strong>
          <span class="card-description">${escapeHtml(unit.note)}</span>
          <span class="card-description counter-evidence">${escapeHtml(counterReason(reasons))}</span>
          <span class="meta-line">
            ${tag(unit.building, "green")}
            ${tag(unit.age, "gold")}
            ${availabilityTag(unit)}
            ${matches.map((match) => tag(match, "blue")).join("")}
          </span>
        </span>
        <span class="score" aria-label="${escapeAttribute(confidence)} counter fit"><strong>${escapeHtml(confidence)}</strong><span>fit</span></span>
      </button>
    `;
  }

  function counterReason(reasons) {
    return reasons.length ? `Rule evidence: ${reasons.join("; ")}.` : "Rule evidence: general matchup.";
  }

  function selectUnit(unitId, jumpToBuilding = false) {
    const unit = unitById.get(unitId);
    if (!unit) return;

    const god = selectedGod();
    const building = availableBuildings(god).find((candidate) => isProducedAt(unit, candidate));
    state.unitId = unit.id;
    localStorage.setItem("aom:selectedUnit", state.unitId);

    if (building) {
      state.buildingId = building.id;
      localStorage.setItem("aom:selectedBuilding", state.buildingId);
    }

    renderBuildings();
    renderUnits();
    renderCounters();

    if (jumpToBuilding) {
      navigateTo("building-view");
    }
  }

  function upgradesForBuilding(building, god) {
    const buildingName = normalize(building.name);
    const technologies = availableTechnologies(god, "all").filter((tech) =>
      technologyBuildingNames(tech).some((name) => normalize(name) === buildingName),
    );
    const baseUpgrades = (building.upgrades || []).filter((name) => !(name === "Myth technologies" && technologies.length));
    const items = [
      ...baseUpgrades.map((name) => ({ name, buildings: [building.name] })),
      ...technologies.map((tech) => ({ name: tech.name, seed: tech, buildings: technologyBuildingNames(tech) })),
    ];
    const seen = new Set();

    return items
      .filter((item) => item.name)
      .map((item) => ({ ...item, key: slugify(item.name) }))
      .filter((item) => {
        if (seen.has(item.key)) return false;
        seen.add(item.key);
        return true;
      })
      .map((item) => resolveUpgrade(item.name, item.seed, item.buildings));
  }

  function resolveUpgrade(name, seed = null, fallbackBuildings = []) {
    const key = slugify(name);
    const seeded = seed || technologyById.get(key) || data.technologies.find((tech) => slugify(tech.name) === key);
    const generated = details.technologies?.[key];
    const override = technologyOverrides[key] || {};
    const stats = { ...(generated?.stats || {}), ...(override.stats || {}) };
    const buildings = unique([
      ...fallbackBuildings,
      ...technologyBuildingNames(seeded || {}),
      ...researchBuildingsFromStats(stats["Researched at"]),
    ]);

    return {
      id: key,
      name,
      effect: override.effect || generated?.effect || seeded?.effect || "Exact effect is not in the local dataset yet.",
      stats,
      god: stats.God || seeded?.availability?.god || "",
      source: override.source || generated?.source || seeded?.source || "",
      buildings,
      generic: Boolean(generated?.generic),
    };
  }

  function technologyBuildingNames(tech) {
    return String(tech.building || "")
      .split(/\s*\/\s*/)
      .map((name) => name.trim())
      .filter(Boolean);
  }

  function researchBuildingsFromStats(value) {
    const normalizedValue = normalize(value);
    if (!normalizedValue) return [];

    return unique(
      data.buildings
        .filter((building) => {
          const normalizedName = normalize(building.name);
          return normalizedName && normalizedValue.includes(normalizedName);
        })
        .map((building) => building.name),
    );
  }

  function buildingNotes(building, god) {
    return (building.notes || [])
      .filter((note) => {
        const pantheonMatch = !note.pantheons || note.pantheons.includes(god.pantheon) || note.pantheons.includes("all");
        const godMatch = !note.gods || note.gods.includes(god.id);
        return pantheonMatch && godMatch;
      })
      .map((note) => note.text);
  }

  function upgradeList(upgrades) {
    if (!upgrades.length) {
      return `<div class="detail-block"><h3>Upgrades</h3>${empty("No upgrades listed for this building yet.")}</div>`;
    }

    return `
      <div class="detail-block">
        <h3>Upgrades</h3>
        <div class="upgrade-list">
          ${upgrades.map(upgradeIcon).join("")}
        </div>
      </div>
    `;
  }

  function upgradeIcon(upgrade) {
    const content = `${iconMarkup("technologies", upgrade, "upgrade")}${upgradeTooltip(upgrade)}`;
    const attributes = `class="upgrade-icon-button" aria-label="${escapeAttribute(upgrade.name)}"`;

    if (upgrade.source) {
      return `<a ${attributes} href="${escapeAttribute(upgrade.source)}" target="_blank" rel="noreferrer">${content}</a>`;
    }

    return `<span ${attributes} tabindex="0">${content}</span>`;
  }

  function upgradeTooltip(upgrade) {
    return `
      <span class="upgrade-tooltip" role="tooltip">
        <strong>${escapeHtml(upgrade.name)}</strong>
        ${upgradeCostMarkup(upgrade)}
        <span class="upgrade-tooltip-effect">${escapeHtml(upgrade.effect)}</span>
      </span>
    `;
  }

  function upgradeCostMarkup(upgrade) {
    const stats = upgrade.stats || {};
    const costs = ["Age", "Food", "Wood", "Gold", "Favor", "Research time", "Upgrade cost", "Upgrade time"]
      .filter((key) => stats[key] && String(stats[key]) !== "0")
      .map((key) => `
        <span class="upgrade-tooltip-stat">
          <span>${statLabelMarkup(key)}</span>
          <strong>${statValueMarkup(key, stats[key])}</strong>
        </span>
      `)
      .join("");

    return costs
      ? `<span class="upgrade-tooltip-costs">${costs}</span>`
      : upgrade.generic
        ? `<span class="upgrade-tooltip-muted">Costs vary across the technologies in this category.</span>`
        : `<span class="upgrade-tooltip-muted">No resource cost is listed for this upgrade.</span>`;
  }

  function unitDetail(unit) {
    const god = selectedGod();
    const detail = details.units?.[unit.id];
    const description = detail?.description || unit.note;
    const hasStats = detail && Object.keys(detail.stats || {}).length;
    const hasAttacks = detail && Object.keys(detail.attacks || {}).length;
    const upgradeGroups = availableUpgradeGroupsForUnit(unit, god);

    return `
      <div class="detail-block unit-detail">
        <div class="panel-heading compact">
          <div class="entity-heading">
            ${iconMarkup("units", unit, "large")}
            <div>
              <p class="eyebrow">Selected Unit</p>
              <h3>${escapeHtml(unit.name)}</h3>
            </div>
          </div>
          ${detail?.source ? link(detail.source, "Source") : ""}
        </div>
        <p class="unit-description">${escapeHtml(description)}</p>
        <div class="unit-detail-grid">
          ${hasStats ? statGrid("Stats", detail.stats) : statGrid("Stats", fallbackStats(unit))}
          ${hasAttacks ? statGrid("Attack", detail.attacks) : statGrid("Attack", {})}
        </div>
        ${detail?.strengths || detail?.weaknesses ? matchupBlock(detail) : ""}
        ${unitUpgradeBlock(upgradeGroups)}
      </div>
    `;
  }

  function statGrid(title, stats) {
    const rows = Object.entries(stats || {}).filter(([, value]) => value);
    if (!rows.length) {
      return `<div class="stat-table"><h4>${escapeHtml(title)}</h4><p class="muted">No exact values in the local data for this entry.</p></div>`;
    }

    return `
      <div class="stat-table">
        <h4>${escapeHtml(title)}</h4>
        ${rows
          .map(
            ([label, value]) => `
              <div class="stat-row">
                <span class="stat-label">${statLabelMarkup(label)}</span>
                <strong>${statValueMarkup(label, value)}</strong>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function fallbackStats(unit) {
    return {
      Age: unit.age,
      "Trained at": unit.building,
      Classes: unit.classes.join(", "),
    };
  }

  function matchupBlock(detail) {
    return `
      <div class="matchup-grid">
        ${detail.strengths ? `<div><h4>Strong vs.</h4><p>${escapeHtml(detail.strengths)}</p></div>` : ""}
        ${detail.weaknesses ? `<div><h4>Weak vs.</h4><p>${escapeHtml(detail.weaknesses)}</p></div>` : ""}
      </div>
    `;
  }

  function availableUpgradeGroupsForUnit(unit, god) {
    const available = availableBuildings(god);
    const productionBuildings = available.filter((building) => isProducedAt(unit, building));
    const productionBuildingIds = new Set(productionBuildings.map((building) => building.id));
    const groups = new Map();

    for (const building of productionBuildings) {
      for (const upgrade of upgradesForBuilding(building, god)) {
        if (upgradeAppliesToUnit(unit, upgrade, building, true)) {
          addUnitUpgradeGroup(groups, building, upgrade);
        }
      }
    }

    for (const building of available) {
      if (productionBuildingIds.has(building.id)) continue;
      for (const upgrade of upgradesForBuilding(building, god)) {
        if (upgradeAppliesToUnit(unit, upgrade, building, false)) {
          addUnitUpgradeGroup(groups, building, upgrade);
        }
      }
    }

    return Array.from(groups.values())
      .map((group) => ({
        building: group.building,
        upgrades: group.upgrades,
      }))
      .sort((a, b) => sortBuildings(a.building, b.building));
  }

  function addUnitUpgradeGroup(groups, building, upgrade) {
    if (!groups.has(building.id)) {
      groups.set(building.id, { building, upgrades: [], upgradeIds: new Set() });
    }

    const group = groups.get(building.id);
    if (group.upgradeIds.has(upgrade.id)) return;
    group.upgradeIds.add(upgrade.id);
    group.upgrades.push(upgrade);
  }

  function upgradeAppliesToUnit(unit, upgrade, building, isProductionBuilding = false) {
    const effectText = normalize([upgrade.name, upgrade.effect].join(" "));
    const detailText = normalize([
      upgrade.name,
      upgrade.effect,
      ...Object.entries(upgrade.stats || {})
        .filter(([key]) => normalize(key) !== "researched at")
        .map(([, value]) => value),
    ].join(" "));
    const classes = new Set(unit.classes || []);
    const unitName = normalize(unit.name);

    if (includesPhrase(detailText, unitName) || includesPhrase(detailText, normalize(unit.id))) return true;
    if (isProductionBuilding && productionLineUpgradeAppliesToUnit(upgrade, building, detailText)) return true;
    if (building.name === "Armory") return armoryUpgradeAppliesToUnit(unit, effectText, classes);
    if (detailText.includes("human soldier") && classes.has("human") && !classes.has("economic")) return true;
    if (detailText.includes("hero") && classes.has("hero")) return true;
    if (detailText.includes("myth unit") && classes.has("myth")) return true;
    if ((detailText.includes("ship") || detailText.includes("naval unit")) && classes.has("ship")) return true;
    if (detailText.includes("infantry") && classes.has("infantry")) return true;
    if (detailText.includes("cavalry") && classes.has("cavalry")) return true;
    if ((detailText.includes("archer") || detailText.includes("ranged soldier")) && (classes.has("archer") || classes.has("ranged"))) return true;
    if (detailText.includes("siege") && classes.has("siege")) return true;
    if ((detailText.includes("worker") || detailText.includes("villager")) && (classes.has("worker") || classes.has("economic"))) return true;
    return false;
  }

  function productionLineUpgradeAppliesToUnit(upgrade, building, detailText) {
    const buildingName = normalize(building.name);
    if (!buildingName) return false;

    return (
      detailText.includes(`${buildingName} unit`) ||
      detailText.includes(`${buildingName} soldier`) ||
      normalize(upgrade.name).includes(`${buildingName} soldier`)
    );
  }

  function armoryUpgradeAppliesToUnit(unit, text, classes) {
    const humanCombatant = classes.has("human") && !classes.has("economic");
    if (humanCombatant && (text.includes("human soldier") || text.includes("weapons") || text.includes("armor") || text.includes("shield"))) return true;
    if (classes.has("hero") && text.includes("hero")) return true;
    if (classes.has("ship") && text.includes("ship")) return true;
    if ((classes.has("ranged") || classes.has("archer") || classes.has("ship")) && text.includes("accuracy")) return true;
    if ((classes.has("ship") || classes.has("siege")) && text.includes("burning pitch")) return true;
    return false;
  }

  function unitUpgradeBlock(groups) {
    if (!groups.length) return "";

    return `
      <div class="unit-upgrades">
        <h4>Available upgrades</h4>
        ${groups
          .map(
            (group) => `
              <div class="unit-upgrade-group">
                <div class="unit-upgrade-building">
                  ${iconMarkup("buildings", group.building, "tiny")}
                  <strong>${escapeHtml(group.building.name)}</strong>
                </div>
                <div class="upgrade-list compact">
                  ${group.upgrades.map(upgradeIcon).join("")}
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
  }

  function resolveTarget(query, enemyGod = selectedEnemyGod()) {
    if (!query) return null;
    const normalized = normalize(query);
    const alias = profileAliases.get(normalized);
    const profile =
      profileById.get(normalized) ||
      (alias ? profileById.get(alias) : null) ||
      data.counterProfiles.find((candidate) => normalize(candidate.name) === normalized);

    if (profile) {
      return { name: profile.name, tags: profile.tags, unit: null };
    }

    const enemyUnits = enemyLookupUnits(enemyGod);
    const unit =
      enemyUnits.find((candidate) => candidate.id === normalized || normalize(candidate.name) === normalized) ||
      enemyUnits.find((candidate) => normalize(candidate.name).includes(normalized));

    if (unit) {
      return {
        name: unit.name,
        tags: unique([...unit.classes, unit.id]),
        unit,
      };
    }

    const inferred = data.counterProfiles.find((candidate) => normalized.includes(candidate.id));
    return inferred ? { name: inferred.name, tags: inferred.tags, unit: null } : null;
  }

  function enemyLookupUnits(enemyGod = selectedEnemyGod()) {
    const units = enemyGod
      ? availableUnits(enemyGod, "all")
      : data.units.filter((unit) => availableInCurrentAge(unit));
    return units.filter((unit) => !unit.classes.includes("economic"));
  }

  function scoreCounter(unit, target) {
    const targetTags = new Set(target.tags);
    const matches = [];
    const reasons = [];
    let score = 0;

    unit.counters
      .filter((counter) => targetTags.has(counter))
      .forEach((counter) => {
        score += addCounterRule(matches, reasons, counter, `direct counter tag: ${counter}`);
      });

    if (targetTags.has("myth") && unit.classes.includes("hero")) score += addCounterRule(matches, reasons, "hero anti-myth", "hero class vs myth target", 26);
    if (targetTags.has("building") && unit.classes.includes("siege")) score += addCounterRule(matches, reasons, "siege", "siege class vs building target", 24);
    if (targetTags.has("wall") && unit.classes.includes("siege")) score += addCounterRule(matches, reasons, "siege", "siege class vs wall target", 24);
    if (targetTags.has("tower") && unit.classes.includes("siege")) score += addCounterRule(matches, reasons, "siege", "siege class vs tower target", 24);
    if (targetTags.has("archer") && unit.classes.includes("cavalry")) score += addCounterRule(matches, reasons, "cavalry mobility", "cavalry mobility vs archer target", 12);
    if (targetTags.has("siege") && unit.classes.includes("cavalry")) score += addCounterRule(matches, reasons, "cavalry pick", "cavalry mobility vs siege target", 12);

    const uniqueMatches = unique(matches);
    if (!score) return { unit, score: 0, matches: [] };

    if (unit.availability?.majorGods) score += 8;
    if (!unit.availability?.minorGod && !unit.availability?.conditional) {
      score += 6;
      reasons.push("core roster unit");
    }
    if (unit.classes.includes("hero") && targetTags.has("myth")) score += 12;
    if (unit.classes.includes("siege") && (targetTags.has("building") || targetTags.has("wall"))) score += 10;
    if (unit.age === "Classical") {
      score += 4;
      reasons.push("available in Classical Age");
    }
    if (unit.age === "Heroic") {
      score += 2;
      reasons.push("available in Heroic Age");
    }

    return { unit, score, confidence: counterConfidence(score), matches: uniqueMatches, reasons: unique(reasons) };
  }

  function addCounterRule(matches, reasons, match, reason, points = 30) {
    matches.push(match);
    reasons.push(reason);
    return points;
  }

  function counterConfidence(score) {
    if (score >= 56) return "Strong";
    if (score >= 36) return "Good";
    return "Situational";
  }

  function renderLibrary() {
    const god = selectedGod();
    const term = normalize(els.librarySearch.value.trim());
    const entries = buildLibraryEntries(god).filter((entry) => {
      if (!term) return true;
      return normalize([entry.name, entry.type, entry.summary, entry.tags.join(" ")].join(" ")).includes(term);
    });

    els.libraryCount.textContent = `${entries.length} entries`;
    els.libraryResults.innerHTML = entries.slice(0, 120).map(libraryRow).join("") || empty("No matching entries.");
  }

  function buildLibraryEntries(god) {
    const pantheon = selectedPantheon();
    return [
      ...data.gods
        .filter((candidate) => candidate.pantheon === pantheon.id)
        .map((candidate) => ({
          id: candidate.id,
          iconKind: "",
          type: candidate.tier === "major" ? "Major god" : "Minor god",
          name: candidate.name,
          summary: candidate.focus,
          tags: [candidate.age, candidate.tier],
          source: candidate.source,
        })),
      ...availableBuildings(god).map((building) => ({
        id: building.id,
        iconKind: "buildings",
        type: "Building",
        name: building.name,
        summary: `${building.age} ${building.type}`,
        tags: [building.age, building.type, ...building.produces, ...building.upgrades],
        source: building.source,
      })),
      ...availableUnits(god, "all").map((unit) => ({
        id: unit.id,
        iconKind: "units",
        type: "Unit",
        name: unit.name,
        summary: unit.note,
        tags: [unit.age, unit.building, ...unit.classes, ...unit.counters],
        source: unit.source,
      })),
      ...availableTechnologies(god, "all").map((tech) => ({
        id: tech.id,
        iconKind: "",
        type: "Technology",
        name: tech.name,
        summary: tech.effect,
        tags: [tech.age, tech.building, tech.category, tech.availability?.god],
        source: tech.source,
      })),
    ].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  }

  function libraryRow(entry) {
    return `
      <article class="entity-row">
        ${iconMarkup(entry.iconKind, entry)}
        <div>
          <div class="meta-line">${tag(entry.type, "red")}${entry.tags.slice(0, 5).map((item) => tag(item, "blue")).join("")}</div>
          <h3>${escapeHtml(entry.name)}</h3>
          <p>${escapeHtml(entry.summary)}</p>
          <a href="${escapeAttribute(entry.source)}" target="_blank" rel="noreferrer">Source</a>
        </div>
      </article>
    `;
  }

  async function loadBuildOrders() {
    try {
      buildOrderDb = await openBuildOrderDb();
      state.buildOrders = (await getAllBuildOrdersFromDb()).map((order) =>
        normalizeBuildOrder(order, { preserveId: true, preserveTimestamps: true }),
      );
      state.buildOrderStorageMode = "IndexedDB";
      state.buildOrderStatus = "Build orders are saved locally in this browser.";
    } catch (error) {
      buildOrderDb = null;
      state.buildOrderStorageMode = "localStorage";
      state.buildOrders = readLocalBuildOrders().map((order) => normalizeBuildOrder(order, { preserveId: true, preserveTimestamps: true }));
      state.buildOrderStatus = "IndexedDB was unavailable, so this browser is using localStorage fallback.";
    }

    state.buildOrdersLoaded = true;
    state.buildOrders.sort(sortBuildOrders);
    if (state.buildOrderId && !state.buildOrders.some((order) => order.id === state.buildOrderId)) {
      state.buildOrderId = "";
      localStorage.removeItem("aom:selectedBuildOrder");
    }
    if (!state.buildOrderId && state.buildOrders.length) {
      state.buildOrderId = state.buildOrders[0].id;
      localStorage.setItem("aom:selectedBuildOrder", state.buildOrderId);
    }
    renderBuildOrders();
    renderCounters();
  }

  function openBuildOrderDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB is not available."));
        return;
      }

      const request = window.indexedDB.open(buildOrderDbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(buildOrderStoreName)) {
          const store = db.createObjectStore(buildOrderStoreName, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
          store.createIndex("godId", "godId");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open build order database."));
    });
  }

  function getAllBuildOrdersFromDb() {
    return new Promise((resolve, reject) => {
      const request = buildOrderStore("readonly").getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error("Could not load build orders."));
    });
  }

  function putBuildOrderInDb(order) {
    return new Promise((resolve, reject) => {
      const request = buildOrderStore("readwrite").put(order);
      request.onsuccess = () => resolve(order);
      request.onerror = () => reject(request.error || new Error("Could not save build order."));
    });
  }

  function deleteBuildOrderFromDb(id) {
    return new Promise((resolve, reject) => {
      const request = buildOrderStore("readwrite").delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error("Could not delete build order."));
    });
  }

  function buildOrderStore(mode) {
    return buildOrderDb.transaction(buildOrderStoreName, mode).objectStore(buildOrderStoreName);
  }

  function readLocalBuildOrders() {
    try {
      const parsed = JSON.parse(localStorage.getItem("aom:buildOrders") || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeLocalBuildOrders() {
    localStorage.setItem("aom:buildOrders", JSON.stringify(state.buildOrders));
  }

  async function persistBuildOrder(order) {
    if (state.buildOrderStorageMode === "IndexedDB" && buildOrderDb) {
      await putBuildOrderInDb(order);
    } else {
      writeLocalBuildOrders();
    }
  }

  async function removePersistedBuildOrder(id) {
    if (state.buildOrderStorageMode === "IndexedDB" && buildOrderDb) {
      await deleteBuildOrderFromDb(id);
    } else {
      writeLocalBuildOrders();
    }
  }

  function renderBuildOrders(draft = null) {
    const order = draft || selectedBuildOrder() || defaultBuildOrderDraft();
    els.buildOrderCount.textContent = state.buildOrdersLoaded ? `${state.buildOrders.length} saved` : "Loading";
    els.buildOrderList.innerHTML = state.buildOrdersLoaded
      ? state.buildOrders.map(buildOrderListItem).join("") || empty("No saved build orders yet.")
      : empty("Loading saved build orders.");
    renderBuildOrderForm(order);
    els.buildOrderStatus.textContent = state.buildOrderStatus;
  }

  function buildOrderListItem(order) {
    const god = godById.get(order.godId);
    const enemy = order.enemyGodId === "all" ? "Any enemy" : godById.get(order.enemyGodId)?.name || "Unknown enemy";
    const isActive = order.id === state.buildOrderId;
    return `
      <button class="build-order-list-item ${isActive ? "active" : ""}" type="button" data-build-order-id="${escapeAttribute(order.id)}">
        <span class="build-order-list-title">${escapeHtml(order.title)}</span>
        <span>${escapeHtml(god?.name || "Unknown god")} vs ${escapeHtml(enemy)}</span>
        <span>${escapeHtml(order.goals.length)} goals / ${escapeHtml(order.steps.length)} steps</span>
        <span class="meta-line">${order.tags.slice(0, 3).map((item) => tag(item, "blue")).join("")}</span>
      </button>
    `;
  }

  function renderBuildOrderForm(order) {
    const tags = Array.isArray(order.tags) ? order.tags : normalizeBuildOrderTags(order.tags);
    const goals = Array.isArray(order.goals) ? order.goals : [];
    const steps = Array.isArray(order.steps) ? order.steps : [];
    els.buildOrderTitle.value = order.title || "";
    els.buildOrderAuthor.value = order.author || "";
    els.buildOrderGod.value = godById.has(order.godId) ? order.godId : state.godId;
    els.buildOrderEnemy.value = order.enemyGodId === "all" || godById.has(order.enemyGodId) ? order.enemyGodId : "all";
    els.buildOrderAge.value = order.age === "all" || ageOrder.has(order.age) ? order.age : "all";
    els.buildOrderPatch.value = order.patch || "";
    els.buildOrderTags.value = tags.join(", ");
    els.buildOrderNotes.value = order.notes || "";
    els.buildOrderGoals.innerHTML = goals.map(buildOrderGoalRow).join("") || buildOrderGoalRow({ time: "", text: "" }, 0);
    els.buildOrderSteps.innerHTML = steps.map(buildOrderStepRow).join("") || buildOrderStepRow({ time: "", action: "", notes: "" }, 0);
    els.buildOrderDelete.disabled = !state.buildOrderId || !selectedBuildOrder();
  }

  function buildOrderGoalRow(goal, index) {
    return `
      <div class="build-order-row" data-goal-index="${index}">
        <label>
          <span>Time</span>
          <input type="text" data-build-field="goal-time" value="${escapeAttribute(goal.time || "")}" placeholder="04:30">
        </label>
        <label>
          <span>Goal</span>
          <input type="text" data-build-field="goal-text" value="${escapeAttribute(goal.text || "")}" placeholder="Start researching Classical Age">
        </label>
        <button class="icon-action-button danger" type="button" data-build-action="remove-goal" data-index="${index}" aria-label="Remove goal">x</button>
      </div>
    `;
  }

  function buildOrderStepRow(step, index) {
    return `
      <div class="build-order-row build-order-step-row" data-step-index="${index}">
        <label>
          <span>Time</span>
          <input type="text" data-build-field="step-time" value="${escapeAttribute(step.time || "")}" placeholder="00:00">
        </label>
        <label>
          <span>Action</span>
          <input type="text" data-build-field="step-action" value="${escapeAttribute(step.action || "")}" placeholder="Queue workers">
        </label>
        <label class="step-notes-field">
          <span>Notes</span>
          <textarea data-build-field="step-notes" rows="2" placeholder="Scouting or matchup note">${escapeHtml(step.notes || "")}</textarea>
        </label>
        <button class="icon-action-button danger" type="button" data-build-action="remove-step" data-index="${index}" aria-label="Remove step">x</button>
      </div>
    `;
  }

  function handleBuildOrderListClick(event) {
    const button = event.target.closest("[data-build-order-id]");
    if (!button) return;
    state.buildOrderId = button.dataset.buildOrderId;
    localStorage.setItem("aom:selectedBuildOrder", state.buildOrderId);
    state.buildOrderStatus = "Loaded saved build order.";
    renderBuildOrders();
  }

  function handleBuildOrderFormClick(event) {
    const button = event.target.closest("[data-build-action]");
    if (!button) return;
    const draft = buildOrderDraftFromForm();
    const index = Number(button.dataset.index);

    if (button.dataset.buildAction === "add-goal") {
      draft.goals.push({ time: "", text: "" });
    }
    if (button.dataset.buildAction === "remove-goal") {
      draft.goals.splice(index, 1);
    }
    if (button.dataset.buildAction === "add-step") {
      draft.steps.push({ time: "", action: "", notes: "" });
    }
    if (button.dataset.buildAction === "remove-step") {
      draft.steps.splice(index, 1);
    }

    renderBuildOrderForm(draft);
  }

  async function saveBuildOrderFromForm(event) {
    event.preventDefault();
    const existing = selectedBuildOrder();
    const order = normalizeBuildOrder(buildOrderDraftFromForm(), { existing, preserveId: Boolean(existing) });
    upsertBuildOrderState(order);

    try {
      await persistBuildOrder(order);
      state.buildOrderId = order.id;
      localStorage.setItem("aom:selectedBuildOrder", state.buildOrderId);
      state.buildOrderStatus = `Saved "${order.title}" locally using ${state.buildOrderStorageMode}.`;
    } catch (error) {
      state.buildOrderStatus = `Save failed: ${error.message || error}`;
    }

    renderBuildOrders();
    renderCounters();
  }

  async function deleteSelectedBuildOrder() {
    const order = selectedBuildOrder();
    if (!order) {
      state.buildOrderStatus = "No saved build order is selected.";
      renderBuildOrders(buildOrderDraftFromForm());
      return;
    }

    state.buildOrders = state.buildOrders.filter((item) => item.id !== order.id);
    try {
      await removePersistedBuildOrder(order.id);
      state.buildOrderId = state.buildOrders[0]?.id || "";
      if (state.buildOrderId) {
        localStorage.setItem("aom:selectedBuildOrder", state.buildOrderId);
      } else {
        localStorage.removeItem("aom:selectedBuildOrder");
      }
      state.buildOrderStatus = `Deleted "${order.title}".`;
    } catch (error) {
      state.buildOrderStatus = `Delete failed: ${error.message || error}`;
    }

    renderBuildOrders();
    renderCounters();
  }

  function exportCurrentBuildOrder() {
    const draft = normalizeBuildOrder(buildOrderDraftFromForm(), { existing: selectedBuildOrder(), preserveId: false });
    const code = encodeBuildOrderCode(buildOrderSharePrefix, {
      type: "buildOrder",
      version: 1,
      order: exportableBuildOrder(draft),
    });
    els.buildOrderShareCode.value = code;
    state.buildOrderStatus = "Export code created for the current editor contents.";
    renderBuildOrders(draft);
    els.buildOrderShareCode.value = code;
  }

  function exportBuildOrderLibrary() {
    const code = encodeBuildOrderCode(buildOrderLibraryPrefix, {
      type: "buildOrderLibrary",
      version: 1,
      exportedAt: new Date().toISOString(),
      orders: state.buildOrders.map(exportableBuildOrder),
    });
    els.buildOrderBackupCode.value = code;
    state.buildOrderStatus = `Backup code created for ${state.buildOrders.length} build orders.`;
    renderBuildOrders(buildOrderDraftFromForm());
    els.buildOrderBackupCode.value = code;
  }

  async function importBuildOrderCode() {
    try {
      const decoded = decodeBuildOrderCode(els.buildOrderShareCode.value);
      const orders = decoded.type === "library" ? decoded.payload.orders || [] : [decoded.payload.order];
      const imported = [];
      for (const rawOrder of orders) {
        const order = normalizeBuildOrder(rawOrder, { forceNewId: true });
        upsertBuildOrderState(order);
        await persistBuildOrder(order);
        imported.push(order);
      }
      state.buildOrderId = imported[0]?.id || state.buildOrderId;
      if (state.buildOrderId) localStorage.setItem("aom:selectedBuildOrder", state.buildOrderId);
      state.buildOrderStatus = `Imported ${imported.length} build order${imported.length === 1 ? "" : "s"}.`;
    } catch (error) {
      state.buildOrderStatus = `Import failed: ${error.message || error}`;
    }
    renderBuildOrders();
    renderCounters();
  }

  async function importBuildOrderLibraryCode() {
    try {
      const decoded = decodeBuildOrderCode(els.buildOrderBackupCode.value);
      if (decoded.type !== "library") throw new Error("That is not a library backup code.");
      const imported = [];
      for (const rawOrder of decoded.payload.orders || []) {
        const order = normalizeBuildOrder(rawOrder, { forceNewId: true });
        upsertBuildOrderState(order);
        await persistBuildOrder(order);
        imported.push(order);
      }
      state.buildOrderId = imported[0]?.id || state.buildOrderId;
      if (state.buildOrderId) localStorage.setItem("aom:selectedBuildOrder", state.buildOrderId);
      state.buildOrderStatus = `Imported ${imported.length} build order${imported.length === 1 ? "" : "s"} from backup.`;
    } catch (error) {
      state.buildOrderStatus = `Backup import failed: ${error.message || error}`;
    }
    renderBuildOrders();
    renderCounters();
  }

  function buildOrderDraftFromForm() {
    return {
      id: selectedBuildOrder()?.id || "",
      title: els.buildOrderTitle.value,
      author: els.buildOrderAuthor.value,
      godId: els.buildOrderGod.value,
      enemyGodId: els.buildOrderEnemy.value,
      age: els.buildOrderAge.value,
      patch: els.buildOrderPatch.value,
      tags: normalizeBuildOrderTags(els.buildOrderTags.value),
      goals: Array.from(els.buildOrderGoals.querySelectorAll("[data-goal-index]")).map((row) => ({
        time: row.querySelector('[data-build-field="goal-time"]')?.value || "",
        text: row.querySelector('[data-build-field="goal-text"]')?.value || "",
      })),
      steps: Array.from(els.buildOrderSteps.querySelectorAll("[data-step-index]")).map((row) => ({
        time: row.querySelector('[data-build-field="step-time"]')?.value || "",
        action: row.querySelector('[data-build-field="step-action"]')?.value || "",
        notes: row.querySelector('[data-build-field="step-notes"]')?.value || "",
      })),
      notes: els.buildOrderNotes.value,
    };
  }

  function defaultBuildOrderDraft() {
    return {
      id: "",
      version: 1,
      title: "",
      author: "",
      godId: state.godId,
      enemyGodId: state.enemyGodId,
      age: state.age,
      patch: "",
      tags: [],
      goals: [{ time: "04:30", text: "Start researching Classical Age" }],
      steps: [
        { time: "00:00", action: "Queue workers", notes: "Keep production constant." },
        { time: "02:30", action: "Scout enemy production", notes: "Adjust the first military building to the scouted unit line." },
      ],
      notes: "",
    };
  }

  function normalizeBuildOrder(rawOrder = {}, options = {}) {
    const now = new Date().toISOString();
    const existing = options.existing || null;
    const id = options.forceNewId
      ? newBuildOrderId()
      : options.preserveId && (rawOrder.id || existing?.id)
        ? String(rawOrder.id || existing.id)
        : newBuildOrderId();
    const godId = godById.has(rawOrder.godId) ? rawOrder.godId : state.godId;
    const enemyGodId = rawOrder.enemyGodId === "all" || godById.has(rawOrder.enemyGodId) ? rawOrder.enemyGodId : "all";
    const age = rawOrder.age === "all" || ageOrder.has(rawOrder.age) ? rawOrder.age : "all";

    return {
      id,
      version: 1,
      title: cleanText(rawOrder.title, 90) || "Untitled build order",
      author: cleanText(rawOrder.author, 60),
      godId,
      enemyGodId,
      age,
      patch: cleanText(rawOrder.patch, 60),
      tags: normalizeBuildOrderTags(rawOrder.tags),
      goals: normalizeBuildOrderGoals(rawOrder.goals),
      steps: normalizeBuildOrderSteps(rawOrder.steps),
      notes: cleanText(rawOrder.notes, 1200),
      createdAt: existing?.createdAt || cleanText(rawOrder.createdAt, 40) || now,
      updatedAt: options.preserveTimestamps ? cleanText(rawOrder.updatedAt, 40) || now : now,
    };
  }

  function normalizeBuildOrderTags(value) {
    const source = Array.isArray(value) ? value : String(value || "").split(",");
    return unique(source.map((item) => cleanText(item, 32)).filter(Boolean)).slice(0, 10);
  }

  function normalizeBuildOrderGoals(goals) {
    const rows = Array.isArray(goals) ? goals : [];
    return rows
      .map((goal) => ({
        time: cleanText(goal?.time, 12),
        text: cleanText(goal?.text, 180),
      }))
      .filter((goal) => goal.time || goal.text)
      .slice(0, 30);
  }

  function normalizeBuildOrderSteps(steps) {
    const rows = Array.isArray(steps) ? steps : [];
    return rows
      .map((step) => ({
        time: cleanText(step?.time, 12),
        action: cleanText(step?.action, 220),
        notes: cleanText(step?.notes, 500),
      }))
      .filter((step) => step.time || step.action || step.notes)
      .slice(0, 80);
  }

  function exportableBuildOrder(order) {
    return {
      version: 1,
      title: order.title,
      author: order.author,
      godId: order.godId,
      enemyGodId: order.enemyGodId,
      age: order.age,
      patch: order.patch,
      tags: order.tags,
      goals: order.goals,
      steps: order.steps,
      notes: order.notes,
    };
  }

  function selectedBuildOrder() {
    return state.buildOrders.find((order) => order.id === state.buildOrderId) || null;
  }

  function upsertBuildOrderState(order) {
    const existingIndex = state.buildOrders.findIndex((item) => item.id === order.id);
    if (existingIndex >= 0) {
      state.buildOrders[existingIndex] = order;
    } else {
      state.buildOrders.unshift(order);
    }
    state.buildOrders.sort(sortBuildOrders);
    if (state.buildOrderStorageMode === "localStorage") writeLocalBuildOrders();
  }

  function sortBuildOrders(a, b) {
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")) || a.title.localeCompare(b.title);
  }

  function encodeBuildOrderCode(prefix, payload) {
    return `${prefix}${base64UrlEncode(JSON.stringify(payload))}`;
  }

  function decodeBuildOrderCode(code) {
    const value = String(code || "").trim();
    const type = value.startsWith(buildOrderLibraryPrefix)
      ? "library"
      : value.startsWith(buildOrderSharePrefix)
        ? "order"
        : "";
    if (!type) throw new Error("Code must start with AOMBO1. or AOMBOLIB1.");
    const prefix = type === "library" ? buildOrderLibraryPrefix : buildOrderSharePrefix;
    const payload = JSON.parse(base64UrlDecode(value.slice(prefix.length)));
    if (type === "order" && payload?.type !== "buildOrder") throw new Error("Share code payload is not a build order.");
    if (type === "library" && payload?.type !== "buildOrderLibrary") throw new Error("Backup code payload is not a build order library.");
    return { type, payload };
  }

  function base64UrlEncode(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlDecode(value) {
    const base64 = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function newBuildOrderId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `bo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function cleanText(value, maxLength) {
    return String(value || "").trim().slice(0, maxLength);
  }

  function currentAgeLabel() {
    return state.age === "all" ? "All ages" : `${state.age} Age`;
  }

  function availableInCurrentAge(entity, ageLimit = state.age) {
    if (ageLimit === "all") return true;
    const limitIndex = ageOrder.get(ageLimit);
    const entityIndex = ageOrder.get(entity.age);
    if (limitIndex === undefined || entityIndex === undefined) return true;
    return entityIndex <= limitIndex;
  }

  function availableBuildings(god, ageLimit = state.age) {
    return runtimeIndexes.buildingsForPantheon(god.pantheon).filter((building) => availableInCurrentAge(building, ageLimit));
  }

  function availableUnits(god, mode = state.mode, ageLimit = state.age) {
    return runtimeIndexes.unitsForPantheon(god.pantheon).filter((unit) => {
      if (unit.availability?.majorGods && !unit.availability.majorGods.includes(god.id)) return false;
      if (unit.availability?.minorGod && !minorGodAvailable(god, unit.availability.minorGod)) return false;
      if (mode === "core" && (unit.availability?.minorGod || unit.availability?.conditional)) return false;
      if (!availableInCurrentAge(unit, ageLimit)) return false;
      return true;
    });
  }

  function availableTechnologies(god, mode = state.mode, ageLimit = state.age) {
    return runtimeIndexes.technologiesForPantheon(god.pantheon).filter((tech) => {
      const techGod = tech.availability?.god;
      if (techGod && !majorOrMinorGodAvailable(god, techGod)) return false;
      if (mode === "core" && techGod && normalize(techGod) !== normalize(god.name)) return false;
      if (!availableInCurrentAge(tech, ageLimit)) return false;
      return true;
    });
  }

  function majorOrMinorGodAvailable(god, godName) {
    return normalize(god.name) === normalize(godName) || minorGodAvailable(god, godName);
  }

  function minorGodAvailable(god, minorGodName) {
    if (!god.minorGods?.length) return true;
    return god.minorGods.some((name) => normalize(name) === normalize(minorGodName));
  }

  function hasPantheon(entity, pantheonId) {
    return entity.pantheons.includes("all") || entity.pantheons.includes(pantheonId);
  }

  function isProducedAt(unit, building) {
    return runtimeIndexes.unitIdsForBuilding(building.id).has(unit.id);
  }

  function availabilityTag(unit) {
    if (unit.availability?.majorGods) return tag("major unique", "red");
    if (unit.availability?.minorGod) return tag(`minor: ${unit.availability.minorGod}`, "red");
    if (unit.availability?.conditional) return tag("conditional", "red");
    return tag("core", "green");
  }

  function tag(value, color = "") {
    if (!value) return "";
    return tagMarkup(escapeHtml(String(value)), color);
  }

  function tagMarkup(content, color = "", title = "") {
    const className = ["tag", color].filter(Boolean).join(" ");
    const titleAttribute = title ? ` title="${escapeAttribute(title)}"` : "";
    return `<span class="${className}"${titleAttribute}>${content}</span>`;
  }

  function statTag(label, value) {
    const iconKey = statIconKey(label);
    if (resourceInfo(label) && iconKey) {
      return tagMarkup(
        `${uiIconMarkup("stats", iconKey)}<span>${escapeHtml(value)}</span><span class="sr-only">${escapeHtml(label)}</span>`,
        `resource-tag ${iconKey}`,
        `${label}: ${value}`,
      );
    }

    const color = label === "Age" ? "gold" : "blue";
    return tagMarkup(`${statLabelMarkup(label)}: ${statValueMarkup(label, value)}`, color);
  }

  function statLabelMarkup(label) {
    const iconKey = statIconKey(label);
    const icon = iconKey ? uiIconMarkup("stats", iconKey) : "";
    if (!icon) return escapeHtml(label);
    return `<span class="resource-label">${icon}<span class="resource-label-text">${escapeHtml(label)}</span></span>`;
  }

  function statValueMarkup(label, value) {
    const normalizedLabel = normalize(label);
    if (normalizedLabel === "age") return iconValueMarkup("ages", ageIconKey(value), value);
    if (normalizedLabel === "pantheon") return iconValueMarkup("pantheons", pantheonIconKey(value), value);
    if (normalizedLabel === "god") return entityIconValueMarkup("gods", value);
    if (["trained at", "researched at"].includes(normalizedLabel)) return entityIconValueMarkup("buildings", value);
    if (normalizedLabel === "unit type") return unitTypeValueMarkup(value);
    return resourceTextMarkup(value);
  }

  function resourceTextMarkup(value) {
    const text = String(value);
    return text
      .split(/\b(Food|Wood|Gold|Favor|Favour|Population|Pop)\b/gi)
      .map((part) => {
        const info = resourceInfo(part);
        if (!info) return escapeHtml(part);
        return `${uiIconMarkup("stats", info.key)}<span class="sr-only">${escapeHtml(info.label)}</span>`;
      })
      .join("");
  }

  function statIconKey(label) {
    return statIconKeys.get(normalize(label)) || "";
  }

  function resourceInfo(label) {
    const normalized = normalize(label);
    return resourceTypes.find((resource) => resource.pattern.test(normalized)) || null;
  }

  function iconValueMarkup(group, key, value) {
    const icon = key ? uiIconMarkup(group, key) : "";
    return `${icon}${escapeHtml(value)}`;
  }

  function entityIconValueMarkup(kind, value) {
    const icon = inlineEntityIconMarkup(kind, value);
    return `${icon}${escapeHtml(value)}`;
  }

  function unitTypeValueMarkup(value) {
    const normalizedValue = normalize(value);
    const matchedKeys = unitTypeIconAliases
      .filter(([, aliases]) => aliases.some((alias) => normalizedValue.includes(normalize(alias))))
      .map(([key]) => key);
    const iconMarkup = unique(matchedKeys).map((key) => uiIconMarkup("unitTypes", key)).join("");
    return `${iconMarkup}${escapeHtml(value)}`;
  }

  function ageIconKey(value) {
    const normalizedValue = normalize(value);
    const age = data.ages.find((candidate) => {
      const normalizedAge = normalize(candidate);
      return normalizedValue === normalizedAge || normalizedValue === normalize(`${candidate} Age`);
    });
    return age ? `${slugify(age)}-age` : slugify(value);
  }

  function pantheonIconKey(value) {
    const normalizedValue = normalize(value);
    const pantheon = data.pantheons.find((candidate) => normalize(candidate.name) === normalizedValue || normalize(candidate.id) === normalizedValue);
    return pantheon?.id || slugify(value);
  }

  function uiIconMarkup(group, key) {
    const icon = uiIcons[group]?.[key];
    if (!icon?.src) return "";
    return `<span class="resource-icon" title="${escapeAttribute(icon.label || key)}"><img src="${escapeAttribute(icon.src)}" alt="" loading="lazy"></span>`;
  }

  function inlineEntityIconMarkup(kind, value) {
    const entity = entityByName(kind, value);
    const icon = findIcon(kind, entity);
    if (!icon?.src) return "";
    return `<span class="resource-icon" title="${escapeAttribute(entity.name)}"><img src="${escapeAttribute(icon.src)}" alt="" loading="lazy"></span>`;
  }

  function entityByName(kind, value) {
    const normalizedValue = normalize(value);
    const source =
      kind === "gods" ? data.gods :
      kind === "buildings" ? data.buildings :
      kind === "units" ? data.units :
      [];
    return source.find((entity) => normalize(entity.name) === normalizedValue || entity.id === slugify(value)) || { id: slugify(value), name: value };
  }

  function iconMarkup(kind, entity, size = "") {
    const label = entity?.name || "";
    const icon = findIcon(kind, entity);
    const initial = label.trim().slice(0, 1).toUpperCase() || "?";
    const className = ["entity-icon", size, icon?.src ? "" : "missing"].filter(Boolean).join(" ");
    const loading = size.includes("god-card-portrait") ? "eager" : "lazy";
    const image = icon?.src
      ? `<img src="${escapeAttribute(icon.src)}" alt="" loading="${loading}" onerror="this.parentElement.classList.add('missing')">`
      : "";

    return `<span class="${className}" title="${escapeAttribute(label)}">${image}<span class="icon-fallback">${escapeHtml(initial)}</span></span>`;
  }

  function findIcon(kind, entity) {
    if (!kind || !entity) return null;
    const group = icons[kind] || {};
    return group[entity.id] || group[slugify(entity.name)] || group[normalize(entity.name)] || null;
  }

  function link(url, text) {
    return `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a>`;
  }

  function empty(message) {
    return `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  function pantheonName(pantheonId) {
    return pantheonById.get(pantheonId)?.name || pantheonId;
  }

  function includesText(value, query) {
    return normalize(value).includes(normalize(query));
  }

  function includesPhrase(text, phrase) {
    const normalizedText = normalize(text);
    const normalizedPhrase = normalize(phrase);
    if (!normalizedPhrase) return false;
    return ` ${normalizedText} `.includes(` ${normalizedPhrase} `);
  }

  function sortByAge(a, b) {
    return (ageOrder.get(a.age) ?? 99) - (ageOrder.get(b.age) ?? 99) || a.name.localeCompare(b.name);
  }

  function sortBuildings(a, b) {
    return (ageOrder.get(a.age) ?? 99) - (ageOrder.get(b.age) ?? 99) || a.name.localeCompare(b.name);
  }

  function sortUnits(a, b) {
    return (ageOrder.get(a.age) ?? 99) - (ageOrder.get(b.age) ?? 99) || a.building.localeCompare(b.building) || a.name.localeCompare(b.name);
  }

  function groupBy(items, keyFn) {
    const map = new Map();
    items.forEach((item) => {
      const key = keyFn(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }

  function formatList(items) {
    const values = unique(items);
    if (values.length <= 1) return values[0] || "";
    if (values.length === 2) return `${values[0]} and ${values[1]}`;
    return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
  }

  function unique(items) {
    return Array.from(new Set(items.filter(Boolean)));
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function slugify(value) {
    return normalize(value).replace(/\s+/g, "-");
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
  }
})();
