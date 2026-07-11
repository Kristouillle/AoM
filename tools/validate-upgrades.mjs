import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { loadRuntimeData, normalize } from "./runtime-data.mjs";

const data = await loadRuntimeData();
const details = await loadBrowserData("data/generated/aom-details.js", "AOM_DETAILS");
const overrides = await loadBrowserData("data/aom-technology-overrides.js", "AOM_TECHNOLOGY_OVERRIDES");
const names = Array.from(
  new Set([
    ...data.buildings.flatMap((building) => building.upgrades || []),
    ...data.technologies.map((technology) => technology.name),
  ]),
).filter(Boolean);
const missing = [];
const generic = [];
let concrete = 0;

for (const name of names) {
  const id = slug(name);
  const generated = details.technologies?.[id];
  const override = overrides[id] || {};
  const stats = { ...(generated?.stats || {}), ...(override.stats || {}) };
  if (generated?.generic) {
    generic.push(name);
    continue;
  }
  concrete += 1;
  if (!Object.keys(stats).length) missing.push(name);
}

const importErrors = Object.values(details.technologies || {}).filter((entry) => entry.importError);
if (importErrors.length) {
  throw new Error(`Technology detail imports contain failures: ${importErrors.map((entry) => entry.name).join(", ")}`);
}
if (missing.length) {
  throw new Error(`Concrete upgrades are missing stats: ${missing.join(", ")}`);
}

for (const id of ["husbandry", "ballistics", "watch-tower", "stone-wall", "fortified-wall"]) {
  if (!overrides[id]?.stats || !overrides[id]?.effect || !overrides[id]?.source) {
    throw new Error(`Curated upgrade override is incomplete: ${id}`);
  }
}

process.stdout.write(
  JSON.stringify(
    {
      ok: true,
      upgrades: names.length,
      concrete,
      genericCategories: generic.length,
      curatedOverrides: Object.keys(overrides).length,
      missingConcreteStats: 0,
    },
    null,
    2,
  ) + "\n",
);

async function loadBrowserData(file, globalName) {
  const sandbox = { window: {} };
  vm.runInNewContext(await readFile(file, "utf8"), sandbox, { filename: file });
  return sandbox.window[globalName] || {};
}

function slug(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
