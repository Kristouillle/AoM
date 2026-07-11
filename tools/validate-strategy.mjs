import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { loadRuntimeData } from "./runtime-data.mjs";

const browser = vm.createContext({ window: {} });
for (const file of ["../data/aom-strategy.js", "../src/runtime-indexes.js", "../src/strategy-engine.js"]) {
  const source = await readFile(new URL(file, import.meta.url), "utf8");
  vm.runInContext(source, browser, { filename: file });
}

const { createPlan } = browser.window.AOM_STRATEGY_ENGINE;
const strategy = browser.window.AOM_STRATEGY;

const cavalryPlan = createPlan(
  {
    age: "Classical",
    playerGod: { id: "zeus", name: "Zeus", pantheon: "greeks" },
    enemyGod: { id: "poseidon", name: "Poseidon", pantheon: "greeks" },
    target: { name: "Hippeus", tags: ["cavalry", "human"], unit: { name: "Hippeus", age: "Classical" } },
    inferredTarget: null,
    counters: [{ id: "hoplite", name: "Hoplite", age: "Classical", building: "Military Academy" }],
    threats: [{ name: "Cavalry", count: 4 }],
    fallbackBuilding: "Military Academy",
    upgradeAction: "Research Medium Infantry after establishing unit count.",
    targetIsLaterAge: false,
  },
  strategy,
);

assert.equal(cavalryPlan.specificity, "Exact-unit plan");
assert.ok(cavalryPlan.summary.includes("Hoplite"));
assert.ok(cavalryPlan.matchedRules.some((rule) => rule.label === "Cavalry response"));
assert.ok(cavalryPlan.steps.some((step) => step.action.includes("Military Academy")));

const mythPlan = createPlan(
  {
    age: "Heroic",
    playerGod: { id: "tsukuyomi", name: "Tsukuyomi", pantheon: "japanese" },
    enemyGod: { id: "loki", name: "Loki", pantheon: "norse" },
    target: { name: "Myth unit", tags: ["myth"], unit: null },
    counters: [{ id: "samurai", name: "Samurai", age: "Heroic", building: "Dojo" }],
    threats: [],
    fallbackBuilding: "Dojo",
    targetIsLaterAge: false,
  },
  strategy,
);

assert.ok(mythPlan.steps.some((step) => step.phase === "God bonus"));
assert.ok(mythPlan.matchedRules.some((rule) => rule.label === "Myth-unit response"));
assert.deepEqual(Array.from(mythPlan.priorities).slice(0, 2), ["food", "favor"]);

const generalPlan = createPlan(
  {
    age: "all",
    playerGod: { id: "ra", name: "Ra", pantheon: "egyptians" },
    enemyGod: null,
    target: null,
    inferredTarget: null,
    counters: [],
    threats: [],
    fallbackBuilding: "Barracks",
    targetIsLaterAge: false,
  },
  strategy,
);

assert.equal(generalPlan.specificity, "Scouting baseline");
assert.ok(generalPlan.summary.includes("Select an enemy god or unit"));

const fixture = {
  pantheons: [{ id: "test" }],
  gods: [{ id: "test-god" }],
  buildings: [{ id: "barracks", name: "Barracks", pantheons: ["test"], produces: ["Spearman"] }],
  units: [{ id: "spearman", name: "Spearman", pantheons: ["test"], building: "Barracks", productionBuildings: ["Barracks"] }],
  technologies: [{ id: "bronze", name: "Bronze", pantheons: ["all"] }],
};
const indexes = browser.window.AOM_RUNTIME_INDEXES.create(fixture);

assert.equal(indexes.unitsForPantheon("test")[0].id, "spearman");
assert.equal(indexes.buildingsForPantheon("test")[0].id, "barracks");
assert.ok(indexes.unitIdsForBuilding("barracks").has("spearman"));
assert.equal(indexes.technologiesForPantheon("test")[0].id, "bronze");

const runtimeData = await loadRuntimeData();
const runtimeIndexes = browser.window.AOM_RUNTIME_INDEXES.create(runtimeData);
const productionLinks = runtimeData.buildings.reduce(
  (total, building) => total + runtimeIndexes.unitIdsForBuilding(building.id).size,
  0,
);

assert.equal(runtimeIndexes.unitById.size, runtimeData.units.length);
assert.equal(runtimeIndexes.buildingById.size, runtimeData.buildings.length);
assert.equal(runtimeIndexes.technologyById.size, runtimeData.technologies.length);
assert.ok(productionLinks >= runtimeData.units.length, "Runtime production index should cover the unit roster.");

process.stdout.write(
  JSON.stringify(
    {
      ok: true,
      strategyVersion: strategy.version,
      threatRules: strategy.threatRules.length,
      testedPlans: 3,
      runtimeIndexes: true,
      productionLinks,
    },
    null,
    2,
  ) + "\n",
);
