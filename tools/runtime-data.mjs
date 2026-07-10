import { readFile } from "node:fs/promises";
import vm from "node:vm";

export async function loadSeedData() {
  return loadWindowFile("data/aom-data.js", "AOM_DATA");
}

export async function loadProductionSupplement() {
  try {
    return await loadWindowFile("data/generated/aom-production.js", "AOM_PRODUCTION");
  } catch {
    return null;
  }
}

export async function loadTechnologySupplement() {
  try {
    return await loadWindowFile("data/generated/aom-technology-supplement.js", "AOM_TECHNOLOGY_SUPPLEMENT");
  } catch {
    return null;
  }
}

export async function loadRuntimeData() {
  const [seedData, productionSupplement, technologySupplement] = await Promise.all([
    loadSeedData(),
    loadProductionSupplement(),
    loadTechnologySupplement(),
  ]);
  return withProductionSupplement(seedData, productionSupplement, technologySupplement);
}

export function withProductionSupplement(baseData, supplement = {}, technologySupplement = {}) {
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

  return runtimeData;
}

export function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

async function loadWindowFile(path, key) {
  const source = await readFile(path, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: path });
  return context.window[key];
}
