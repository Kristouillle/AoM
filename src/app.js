(() => {
  const data = withProductionSupplement(window.AOM_DATA, window.AOM_PRODUCTION, window.AOM_TECHNOLOGY_SUPPLEMENT);
  const icons = window.AOM_ICONS || { units: {}, buildings: {}, technologies: {} };
  const uiIcons = window.AOM_UI_ICONS || { stats: {}, ages: {}, pantheons: {}, unitTypes: {} };
  const details = window.AOM_DETAILS || { units: {}, technologies: {} };
  const state = {
    godId: localStorage.getItem("aom:selectedGod") || "zeus",
    enemyGodId: localStorage.getItem("aom:enemyGod") || "all",
    mode: localStorage.getItem("aom:counterMode") || "core",
    buildingId: localStorage.getItem("aom:selectedBuilding") || "",
    unitId: localStorage.getItem("aom:selectedUnit") || "",
  };

  const els = {
    dataStatus: byId("data-status"),
    sidebarCurrent: byId("sidebar-current"),
    homeGodSearch: byId("home-god-search"),
    homeGodGrid: byId("home-god-grid"),
    librarySearch: byId("library-search"),
    enemyGodSelect: byId("enemy-god-select"),
    enemySearch: byId("enemy-search"),
    enemyUnits: byId("enemy-units"),
    enemyUnitPicker: byId("enemy-unit-picker"),
    modeButtons: Array.from(document.querySelectorAll(".mode-button")),
    viewPanels: Array.from(document.querySelectorAll(".view-panel")),
    navLinks: Array.from(document.querySelectorAll("[data-view-link]")),
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

  const pantheonById = new Map(data.pantheons.map((pantheon) => [pantheon.id, pantheon]));
  const godById = new Map(data.gods.map((god) => [god.id, god]));
  const unitById = new Map(data.units.map((unit) => [unit.id, unit]));
  const buildingById = new Map(data.buildings.map((building) => [building.id, building]));
  const technologyById = new Map(data.technologies.map((tech) => [tech.id, tech]));
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
    wireEvents();
    render();
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

  function wireEvents() {
    window.addEventListener("hashchange", renderActiveView);
    els.homeGodSearch.addEventListener("input", renderHome);
    els.librarySearch.addEventListener("input", renderLibrary);
    els.enemyGodSelect.addEventListener("change", () => {
      state.enemyGodId = els.enemyGodSelect.value;
      localStorage.setItem("aom:enemyGod", state.enemyGodId);
      populateEnemyDatalist();
      renderCounters();
    });
    els.enemySearch.addEventListener("input", renderCounters);

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
    renderModeButtons();
    renderActiveView();
    renderSummary();
    renderHome();
    renderGod();
    renderBuildings();
    renderUnits();
    renderCounters();
    renderLibrary();
  }

  function renderActiveView() {
    const viewId = activeViewId();
    els.viewPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === viewId);
    });
    els.navLinks.forEach((linkEl) => {
      linkEl.classList.toggle("active", linkEl.dataset.viewLink === viewId);
      linkEl.setAttribute("aria-current", linkEl.dataset.viewLink === viewId ? "page" : "false");
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
    const gods = majorGods()
      .filter((god) => {
        if (!term) return true;
        const pantheon = pantheonById.get(god.pantheon);
        return normalize([god.name, god.focus, pantheon?.name, pantheon?.focus].join(" ")).includes(term);
      });

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
      <button class="god-card ${god.id === state.godId ? "active" : ""}" type="button" data-god-id="${escapeAttribute(god.id)}">
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
    });
  }

  function renderSummary() {
    const god = selectedGod();
    const pantheon = selectedPantheon();
    const buildings = availableBuildings(god);
    const units = availableUnits(god);
    const coreUnits = availableUnits(god, "core").filter((unit) => !unit.classes.includes("economic"));

    els.dataStatus.textContent = `${data.units.length} units seeded`;
    els.selectedTitle.textContent = `${god.name} - ${pantheon.name}`;
    els.sidebarCurrent.innerHTML = `
      ${iconMarkup("gods", god, "portrait small-portrait")}
      <p class="eyebrow">Current god</p>
      <strong>${escapeHtml(god.name)}</strong>
      <span>${escapeHtml(pantheon.name)}</span>
      <a href="#home-view">Change god</a>
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
          <button class="building-button ${building.id === state.buildingId ? "active" : ""}" type="button" data-building-id="${building.id}">
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
      <article class="unit-card ${unit.id === selectedUnitId ? "active" : ""}" data-unit-id="${escapeAttribute(unit.id)}">
        <div class="entity-heading">
          ${iconMarkup("units", unit)}
          <h3>${escapeHtml(unit.name)}</h3>
        </div>
        <p>${escapeHtml(unit.note)}</p>
        <div class="meta-line">
          ${tag(unit.age, "gold")}
          ${availabilityTag(unit)}
          ${unit.classes.slice(0, 4).map((unitClass) => tag(unitClass, "blue")).join("")}
        </div>
      </article>
    `;
  }

  function renderCounters() {
    const god = selectedGod();
    const query = els.enemySearch.value.trim();
    const enemyGod = selectedEnemyGod();
    const target = resolveTarget(query, enemyGod);

    renderEnemyUnitPicker(enemyGod, query, target);

    if (!target) {
      els.counterTitle.textContent = enemyGod ? `Pick a ${enemyGod.name} unit` : "Pick an enemy unit";
      els.counterCount.textContent = "0 matches";
      els.targetSummary.innerHTML = [
        enemyGod ? tag(`Enemy: ${enemyGod.name}`, "red") : "",
        enemyGod ? tag(pantheonName(enemyGod.pantheon), "green") : "",
        tag("cavalry", "blue"),
        tag("archer", "blue"),
        tag("myth", "blue"),
        tag("siege", "blue"),
      ].join("");
      els.counterResults.innerHTML = empty("Enter a unit name or class.");
      return;
    }

    const results = availableUnits(god)
      .filter((unit) => !unit.classes.includes("economic"))
      .map((unit) => scoreCounter(unit, target))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || sortUnits(a.unit, b.unit));

    els.counterTitle.textContent = `Counter ${target.name}${enemyGod ? ` from ${enemyGod.name}` : ""}`;
    els.counterCount.textContent = `${results.length} matches`;
    els.targetSummary.innerHTML = [
      enemyGod ? tag(`Enemy: ${enemyGod.name}`, "red") : "",
      enemyGod ? tag(pantheonName(enemyGod.pantheon), "green") : "",
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
      <article class="result-item" data-unit-id="${escapeAttribute(unit.id)}">
        ${iconMarkup("units", unit)}
        <div>
          <h3>${escapeHtml(unit.name)}</h3>
          <p>${escapeHtml(unit.note)}</p>
          <p class="counter-evidence">${escapeHtml(counterReason(reasons))}</p>
          <div class="meta-line">
            ${tag(unit.building, "green")}
            ${tag(unit.age, "gold")}
            ${availabilityTag(unit)}
            ${matches.map((match) => tag(match, "blue")).join("")}
          </div>
        </div>
        <div class="score" aria-label="${escapeAttribute(confidence)} counter fit"><strong>${escapeHtml(confidence)}</strong><span>fit</span></div>
      </article>
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
    const stats = generated?.stats || {};
    const buildings = unique([
      ...fallbackBuildings,
      ...technologyBuildingNames(seeded || {}),
      ...researchBuildingsFromStats(stats["Researched at"]),
    ]);

    return {
      id: key,
      name,
      effect: generated?.effect || seeded?.effect || "Exact effect is not in the local dataset yet.",
      stats,
      god: stats.God || seeded?.availability?.god || "",
      source: generated?.source || seeded?.source || "",
      buildings,
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
      : `<span class="upgrade-tooltip-muted">Cost pending import.</span>`;
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
    const units = enemyGod ? availableUnits(enemyGod, "all") : data.units;
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

  function availableBuildings(god) {
    return data.buildings.filter((building) => hasPantheon(building, god.pantheon));
  }

  function availableUnits(god, mode = state.mode) {
    return data.units.filter((unit) => {
      if (!unit.pantheons.includes(god.pantheon) && !unit.pantheons.includes("all")) return false;
      if (unit.availability?.majorGods && !unit.availability.majorGods.includes(god.id)) return false;
      if (unit.availability?.minorGod && !minorGodAvailable(god, unit.availability.minorGod)) return false;
      if (mode === "core" && (unit.availability?.minorGod || unit.availability?.conditional)) return false;
      return true;
    });
  }

  function availableTechnologies(god, mode = state.mode) {
    return data.technologies.filter((tech) => {
      if (tech.pantheons && !tech.pantheons.includes("all") && !tech.pantheons.includes(god.pantheon)) return false;
      const techGod = tech.availability?.god;
      if (techGod && !majorOrMinorGodAvailable(god, techGod)) return false;
      if (mode === "core" && techGod && normalize(techGod) !== normalize(god.name)) return false;
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
    const buildingName = normalize(building.name);
    if ((unit.productionBuildings || [unit.building]).some((name) => normalize(name) === buildingName)) return true;
    return building.produces.some((produced) => {
      const normalizedProduced = normalize(produced);
      return normalizedProduced === unit.id || normalizedProduced === normalize(unit.name);
    });
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
