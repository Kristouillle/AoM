import { loadRuntimeData, normalize } from "./runtime-data.mjs";
import { readFile } from "node:fs/promises";

const data = await loadRuntimeData();

const failures = [];
const iconManifestText = await readFile(new URL("../data/generated/aom-icons.js", import.meta.url), "utf8");

if (/\uFFFD|\u00C3|\u00C5[\u0080-\u00BF\u0152\u0153\u0160\u0161\u0178]|\u00E2[\u0080-\u00BF]/u.test(iconManifestText)) {
  failures.push("Icon manifest contains text that appears to be incorrectly encoded.");
}

assertProduced("tsukuyomi", "House", []);
assertProduced("tsukuyomi", "Dock", ["Wasen", "Ramming Wasen", "Junkozosen", "Honengyo", "Umibōzu"]);
assertProduced("huitzilopochtli", "War Hut", ["Tlamanih Spearman", "Tequihua Archer"]);
assertProduced("huitzilopochtli", "Noble's Hut", ["Coyote Warrior", "Eagle Warrior", "Ocelotl Warrior"]);
assertProduced("huitzilopochtli", "Great Temple", ["Otontin Smasher", "Jaguar Rider", "Shorn One", "Quinametzin"]);
assertBuilding("tsukuyomi", "Watermill");
assertBuilding("tsukuyomi", "Mining Camp");
assertUpgrades("tsukuyomi", "House", []);
assertUpgrades("tsukuyomi", "Watermill", ["Survival Equipment", "Husbandry", "Plow", "Irrigation", "Flood Control", "Hand Axe", "Bow Saw", "Carpenters"]);
assertUpgrades("tsukuyomi", "Mining Camp", ["Pickaxe", "Shaft Mine", "Quarry"]);
assertUpgrades("tsukuyomi", "Stable", ["Medium Stable Soldiers", "Heavy Stable Soldiers", "Champion Stable Soldiers"]);

const aztecBuildings = availableBuildings(god("huitzilopochtli")).map((building) => building.name);
for (const building of ["War Hut", "Noble's Hut", "Great Temple"]) {
  if (!aztecBuildings.includes(building)) failures.push(`Aztecs are missing building: ${building}`);
}

if (failures.length) {
  process.stderr.write(failures.map((failure) => `- ${failure}`).join("\n") + "\n");
  process.exit(1);
}

process.stdout.write(
  JSON.stringify(
    {
      ok: true,
      units: data.units.length,
      buildings: data.buildings.length,
      aztecBuildings: aztecBuildings.length,
    },
    null,
    2,
  ) + "\n",
);

function assertProduced(godId, buildingName, expectedNames) {
  const selectedGod = god(godId);
  const building = findBuilding(selectedGod, buildingName);
  if (!building) {
    failures.push(`${selectedGod.name} is missing building: ${buildingName}`);
    return;
  }

  const produced = availableUnits(selectedGod, "all")
    .filter((unit) => isProducedAt(unit, building))
    .map((unit) => unit.name)
    .sort((a, b) => a.localeCompare(b));

  if (!expectedNames.length && produced.length) {
    failures.push(`${selectedGod.name} ${buildingName} should produce no units, found: ${produced.join(", ")}`);
    return;
  }

  for (const name of expectedNames) {
    if (!produced.includes(name)) failures.push(`${selectedGod.name} ${buildingName} is missing unit: ${name}`);
  }
}

function assertBuilding(godId, buildingName) {
  const selectedGod = god(godId);
  if (!findBuilding(selectedGod, buildingName)) failures.push(`${selectedGod.name} is missing building: ${buildingName}`);
}

function assertUpgrades(godId, buildingName, expectedNames) {
  const selectedGod = god(godId);
  const building = findBuilding(selectedGod, buildingName);
  if (!building) {
    failures.push(`${selectedGod.name} is missing building: ${buildingName}`);
    return;
  }

  const upgrades = upgradesForBuilding(building, selectedGod).map((upgrade) => upgrade.name).sort((a, b) => a.localeCompare(b));
  if (!expectedNames.length && upgrades.length) {
    failures.push(`${selectedGod.name} ${buildingName} should have no upgrades, found: ${upgrades.join(", ")}`);
    return;
  }

  for (const name of expectedNames) {
    if (!upgrades.includes(name)) failures.push(`${selectedGod.name} ${buildingName} is missing upgrade: ${name}`);
  }
}

function findBuilding(selectedGod, buildingName) {
  return availableBuildings(selectedGod).find((candidate) => normalize(candidate.name) === normalize(buildingName));
}

function god(id) {
  const selected = data.gods.find((candidate) => candidate.id === id);
  if (!selected) throw new Error(`Unknown god: ${id}`);
  return selected;
}

function availableBuildings(selectedGod) {
  return data.buildings.filter((building) => hasPantheon(building, selectedGod.pantheon));
}

function availableUnits(selectedGod, mode = "core") {
  return data.units.filter((unit) => {
    if (!unit.pantheons.includes(selectedGod.pantheon) && !unit.pantheons.includes("all")) return false;
    if (unit.availability?.majorGods && !unit.availability.majorGods.includes(selectedGod.id)) return false;
    if (unit.availability?.minorGod && !minorGodAvailable(selectedGod, unit.availability.minorGod)) return false;
    if (mode === "core" && (unit.availability?.minorGod || unit.availability?.conditional)) return false;
    return true;
  });
}

function minorGodAvailable(selectedGod, minorGodName) {
  if (!selectedGod.minorGods?.length) return true;
  return selectedGod.minorGods.some((name) => normalize(name) === normalize(minorGodName));
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

function upgradesForBuilding(building, selectedGod) {
  const buildingName = normalize(building.name);
  const technologies = availableTechnologies(selectedGod, "all").filter((tech) =>
    technologyBuildingNames(tech).some((name) => normalize(name) === buildingName),
  );
  const baseUpgrades = (building.upgrades || []).filter((name) => !(name === "Myth technologies" && technologies.length));
  const names = [...baseUpgrades, ...technologies.map((tech) => tech.name)];
  const seen = new Set();

  return names
    .filter(Boolean)
    .map((name) => ({ name, key: normalize(name) }))
    .filter((item) => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });
}

function availableTechnologies(selectedGod, mode = "core") {
  return data.technologies.filter((tech) => {
    if (tech.pantheons && !tech.pantheons.includes("all") && !tech.pantheons.includes(selectedGod.pantheon)) return false;
    const techGod = tech.availability?.god;
    if (techGod && !majorOrMinorGodAvailable(selectedGod, techGod)) return false;
    if (mode === "core" && techGod && normalize(techGod) !== normalize(selectedGod.name)) return false;
    return true;
  });
}

function majorOrMinorGodAvailable(selectedGod, godName) {
  return normalize(selectedGod.name) === normalize(godName) || minorGodAvailable(selectedGod, godName);
}

function technologyBuildingNames(tech) {
  return String(tech.building || "")
    .split(/\s*\/\s*/)
    .map((name) => name.trim())
    .filter(Boolean);
}
