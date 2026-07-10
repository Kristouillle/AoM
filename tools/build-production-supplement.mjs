import { mkdir, readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const WIKI_ROOT = "https://ageofempires.fandom.com/wiki/";
const OUT = "data/generated/aom-production.js";

const EXTRA_BUILDINGS = new Map([
  [
    "War Hut",
    {
      age: "Classical",
      type: "production",
      upgrades: ["Medium War Hut Soldiers", "Heavy War Hut Soldiers", "Champion War Hut Soldiers"],
      sourceTitle: "War Hut (Age of Mythology)",
    },
  ],
  [
    "Noble's Hut",
    {
      age: "Classical",
      type: "production",
      upgrades: ["Medium Noble's Hut Soldiers", "Heavy Noble's Hut Soldiers", "Champion Noble's Hut Soldiers"],
      sourceTitle: "Noble's Hut",
    },
  ],
  [
    "Great Temple",
    {
      age: "Heroic",
      type: "production",
      upgrades: ["Heavy Great Temple Soldiers", "Champion Great Temple Soldiers"],
      sourceTitle: "Great Temple",
    },
  ],
]);

const data = await loadSeedData();
const generated = JSON.parse(await readFile("data/generated/aom-library.generated.json", "utf8"));
const rows = generated.pages.find((page) => page.key === "units")?.extracted?.unitProduction || [];
const unitRows = rows.filter(includeProductionRow);
const supplement = buildSupplement(unitRows);

await mkdir("data/generated", { recursive: true });
await writeFile(OUT, `window.AOM_PRODUCTION = ${JSON.stringify(supplement, null, 2)};\n`, "utf8");

process.stdout.write(
  JSON.stringify(
    {
      out: OUT,
      sourceGeneratedAt: generated.generatedAt,
      buildings: supplement.buildings.length,
      units: supplement.units.length,
      rows: unitRows.length,
    },
    null,
    2,
  ) + "\n",
);

async function loadSeedData() {
  const source = await readFile("data/aom-data.js", "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "data/aom-data.js" });
  return context.window.AOM_DATA;
}

function includeProductionRow(row) {
  if (!row || row.building === "Elsewhere") return false;
  return row.building === "Dock" || row.pantheon === "aztecs";
}

function buildSupplement(rows) {
  const minorGodByName = new Map(
    data.gods
      .filter((god) => god.tier === "minor")
      .map((god) => [normalize(god.name), god]),
  );
  const unitByKey = new Map();
  const buildingByName = new Map();

  for (const row of rows) {
    const building = generatedBuilding(row);
    if (building) {
      if (!buildingByName.has(normalize(building.name))) buildingByName.set(normalize(building.name), building);
      buildingByName.get(normalize(building.name)).produces.push(row.name);
    }

    const unit = generatedUnit(row, minorGodByName);
    const key = normalize(unit.name);
    if (!unitByKey.has(key)) {
      unitByKey.set(key, unit);
      continue;
    }

    const existing = unitByKey.get(key);
    existing.pantheons = unique([...existing.pantheons, ...unit.pantheons]);
    existing.productionBuildings = unique([...existing.productionBuildings, ...unit.productionBuildings]);
    existing.classes = unique([...existing.classes, ...unit.classes]);
    existing.counters = unique([...existing.counters, ...unit.counters]);
    if (!existing.availability && unit.availability) existing.availability = unit.availability;
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceGeneratedAt: generated.generatedAt,
    source: generated.source,
    buildings: Array.from(buildingByName.values()).map((building) => ({
      ...building,
      produces: unique(building.produces).sort((a, b) => a.localeCompare(b)),
    })),
    units: Array.from(unitByKey.values()).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function generatedBuilding(row) {
  const existing = data.buildings.find((building) => normalize(building.name) === normalize(row.building));
  if (existing) return null;

  const extra = EXTRA_BUILDINGS.get(row.building);
  if (!extra) return null;

  return {
    id: slug(row.building),
    name: row.building,
    pantheons: [row.pantheon],
    age: extra.age,
    type: extra.type,
    produces: [],
    upgrades: extra.upgrades,
    source: WIKI_ROOT + encodeURIComponent(extra.sourceTitle).replace(/%20/g, "_"),
    generated: true,
  };
}

function generatedUnit(row, minorGodByName) {
  const relatedGod = (row.related || [])
    .map((name) => minorGodByName.get(normalize(name)))
    .find(Boolean);
  const classes = inferClasses(row);
  const availability = inferAvailability(row, relatedGod);

  return {
    id: slug(row.name),
    name: row.name,
    pantheons: [row.pantheon],
    building: row.building,
    productionBuildings: [row.building],
    age: inferAge(row, relatedGod, classes),
    classes,
    counters: inferCounters(row, classes),
    note: inferNote(row, classes, relatedGod),
    source: WIKI_ROOT + encodeURIComponent(row.title || row.name).replace(/%20/g, "_"),
    availability,
    generated: true,
  };
}

function inferAvailability(row, relatedGod) {
  if (relatedGod) return { minorGod: relatedGod.name };
  const condition = (row.related || []).find((name) => normalize(name) !== normalize(row.name));
  if (condition) return { conditional: condition };
  return undefined;
}

function inferAge(row, relatedGod, classes) {
  if (relatedGod) return relatedGod.age;

  const name = normalize(row.name);
  if (row.building === "Town Center") return "Archaic";
  if (row.building === "Market") return "Heroic";
  if (row.building === "War Hut" || row.building === "Noble's Hut") return "Classical";
  if (row.building === "Great Temple") return "Heroic";
  if (row.building === "Temple") return classes.includes("hero") ? "Archaic" : "Classical";
  if (row.building === "Dock") {
    if (name.includes("fishing") || name.includes("transport")) return "Archaic";
    if (name.includes("siege") || name.includes("juggernaut") || name.includes("dragon ship")) return "Heroic";
    return "Classical";
  }

  return "Classical";
}

function inferClasses(row) {
  const name = normalize(row.name);
  const classes = [];

  if (row.building === "Dock") classes.push("ship", "naval");
  if (row.building === "Temple") classes.push("myth");
  if (name.includes("fishing") || name.includes("settler") || name.includes("caravan")) classes.push("human", "economic");
  if (name.includes("transport")) classes.push("transport");
  if (name.includes("priest") || name.includes("incarnate") || name.includes("spy")) classes.push("hero", "human", "support");
  if (name.includes("archer") || name.includes("arrow") || name.includes("atlatl") || name.includes("tequihua")) classes.push("archer", "ranged");
  if (name.includes("canoe") || name.includes("bireme") || name.includes("trireme") || name.includes("junk") || name.includes("wasen")) classes.push("ranged");
  if (name.includes("spearman") || name.includes("tlamanih")) classes.push("infantry", "spearman", "melee");
  if (name.includes("warrior") || name.includes("smasher") || name.includes("shorn") || name.includes("otontin")) classes.push("infantry", "melee");
  if (name.includes("coyote") || name.includes("rider")) classes.push("cavalry", "melee");
  if (name.includes("siege") || name.includes("juggernaut") || name.includes("smasher") || name.includes("louchuan")) classes.push("siege");
  if (row.pantheon === "aztecs" && row.building === "Great Temple") classes.push("human");
  if (!classes.includes("human") && !classes.includes("myth") && row.building !== "Dock") classes.push("human");
  if (row.building === "Dock" && isNavalMythName(name)) classes.push("myth");

  return unique(classes);
}

function inferCounters(row, classes) {
  const counters = [];
  if (classes.includes("spearman")) counters.push("cavalry", "raider");
  if (classes.includes("archer")) counters.push("infantry", "slow-melee");
  if (classes.includes("siege")) counters.push("building", "wall", "tower");
  if (classes.includes("hero")) counters.push("myth");
  if (classes.includes("ship")) counters.push("ship", "naval");
  if (normalize(row.name).includes("fire ship")) counters.push("ship");
  return unique(counters);
}

function inferNote(row, classes, relatedGod) {
  if (row.building === "Dock") return `${row.pantheon} naval unit trained at the Dock.`;
  if (relatedGod) return `${relatedGod.name} myth unit trained at the ${row.building}.`;
  if (classes.includes("hero")) return `${row.pantheon} hero or support unit trained at the ${row.building}.`;
  return `${row.pantheon} unit trained at the ${row.building}.`;
}

function isNavalMythName(name) {
  return [
    "scylla",
    "carcinos",
    "hippocampus",
    "leviathan",
    "war turtle",
    "kraken",
    "jormun elver",
    "servant",
    "nereid",
    "man o war",
    "chiwen",
    "xuanwu",
    "honengyo",
    "umibozu",
    "axolotl",
  ].some((needle) => name.includes(needle));
}

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value) {
  return normalize(value).replace(/\s+/g, "-");
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}
