import { mkdir, readFile, writeFile } from "node:fs/promises";
import { loadRuntimeData } from "./runtime-data.mjs";
import vm from "node:vm";

const API_URL = "https://ageofempires.fandom.com/api.php";
const WIKI_ROOT = "https://ageofempires.fandom.com/wiki/";
const OUT = "data/generated/aom-details.js";
const TECHNOLOGY_OVERRIDES = "data/aom-technology-overrides.js";
const CONCURRENCY = 6;

const SKIP_TECH_NAMES = new Set([
  "warships",
  "major-god unique units",
  "heroes or myth units",
  "core economy units",
]);

const GENERIC_TECH_EFFECTS = new Map([
  ["Line upgrades", "Upgrades the unit line to stronger tiers; exact bonuses depend on the unit and age tier."],
  ["Naval line upgrades", "Upgrades naval units through their combat tiers; exact bonuses vary by ship line."],
  ["Myth technologies", "Unlocks or improves myth-unit and god-specific bonuses at the Temple."],
  ["Fortified defenses", "Improves defensive structures; exact effect depends on the researched technology."],
  ["Migdol line upgrades", "Improves Migdol Stronghold units through their combat tiers."],
  ["Infantry line upgrades", "Upgrades infantry to stronger tiers; normally improves hit points, damage, and line of sight."],
  ["Cavalry line upgrades", "Upgrades cavalry to stronger tiers; normally improves hit points, damage, and line of sight."],
  ["Fortified line upgrades", "Upgrades Hill Fort units and fortress-stage units through stronger combat tiers."],
  ["Palace line upgrades", "Upgrades Palace units to stronger tiers; exact bonuses depend on the unit line."],
  ["Counter line upgrades", "Upgrades counter units to stronger tiers; exact bonuses depend on the unit line."],
  ["Economic upgrades", "Improves worker resource gathering and economy efficiency."],
  ["Food and resource upgrades", "Improves worker resource gathering and carry capacity."],
  ["Mechanical line upgrades", "Upgrades Chinese machine and ranged units to stronger tiers."],
  ["Hero technologies", "Improves or unlocks hero-related units and bonuses."],
  ["Shrine technologies", "Improves Japanese shrine or favor mechanics."],
  ["Dojo line upgrades", "Upgrades Dojo units to stronger tiers; exact bonuses depend on the unit line."],
  ["Castle line upgrades", "Upgrades Castle units to stronger tiers; exact bonuses depend on the unit line."],
  ["Watch Tower", "Upgrades Sentry Towers into Watch Towers so they can garrison units and fire on enemies."],
  ["Guard Tower", "Upgrades Watch Towers into Guard Towers, increasing tower hit points and pierce attack."],
  ["Ballista Tower", "Egyptian tower upgrade from Guard Tower; deals substantially more damage than a Guard Tower."],
  ["Stone Wall", "Upgrades Wooden Walls into Stone Walls, the Classical wall upgrade available to all pantheons."],
  ["Fortified Wall", "Upgrades Stone Walls into Fortified Walls, adding 600 hit points in the Heroic Age."],
  ["Heavy Infantry", "Infantry +15% HP, +15% attack, +1 LoS. Throwing Axemen +1 range."],
  ["Heavy Cavalry", "Cavalry +15% HP, +15% attack, +1 LoS."],
  ["Crenellations", "All buildings +0.25x damage multiplier vs. cavalry. Towers +2 range and can track moving targets."],
]);

const args = parseArgs(process.argv.slice(2));

const AOM_PAGE_OVERRIDES = new Map([
  ["Watch Tower", "Watch Tower (Age of Mythology)"],
  ["Guard Tower", "Guard Tower (Age of Mythology)"],
  ["Ballista Tower", "Ballista Tower (Age of Mythology)"],
  ["Stone Wall", "Stone Wall (Age of Mythology)"],
  ["Fortified Wall", "Fortified Wall (Age of Mythology)"],
  ["Heavy Infantry", "Heavy Infantry (Age of Mythology)"],
  ["Heavy Cavalry", "Heavy Cavalry (Age of Mythology)"],
  ["Crenellations", "Crenellations (Age of Mythology)"],
]);

const KNOWN_GOD_NAMES = [
  "Ame-no-Uzume",
  "Inari Ōkami",
  "Minakatatomi",
  "Raijin",
  "Fūjin",
  "Hachiman",
  "Watatsumi",
  "Ōkuninushi",
  "Takemikazuchi",
  "Tsukuyomi",
  "Susanoo",
];

const EFFECT_OVERRIDES = new Map([
  ["tenshu", "Towers +40% attack, +5 LoS. Castles +20% attack, +5 LoS."],
  ["sacred-custodians", "Miko +50% heal rate; gains Sacred Hands ability to collect Relics."],
  ["sakura-gardens", "Shrines spawn Cherry Trees within aura radius."],
]);

if (args.help) {
  printHelp();
  process.exit(0);
}

const data = await loadRuntimeData();
const generated = await loadGeneratedLibrary();
const previousDetails = await loadExistingDetails();
const technologyOverrides = await loadTechnologyOverrides();
const titleByUnitName = buildTitleMap(generated);
const units = data.units.filter((unit) => !isSyntheticUnit(unit));
const techTargets = buildTechnologyTargets(data);

const [unitEntries, technologyEntries] = await Promise.all([
  runPool(units, (unit) => importUnit(unit, titleByUnitName, previousDetails.units?.[unit.id])),
  runPool(techTargets, (target) => importTechnology(target, previousDetails.technologies?.[target.id])),
]);

const details = {
  generatedAt: new Date().toISOString(),
  source: "https://ageofempires.fandom.com",
  units: Object.fromEntries(unitEntries.filter(Boolean).map((entry) => [entry.id, entry])),
  technologies: Object.fromEntries(technologyEntries.filter(Boolean).map((entry) => [entry.id, entry])),
};
const unitImportFailures = Object.values(details.units).filter((entry) => entry.importError);
const technologyImportFailures = Object.values(details.technologies).filter((entry) => entry.importError);
const unitRefreshWarnings = Object.values(details.units).filter((entry) => entry.refreshWarning);
const technologyRefreshWarnings = Object.values(details.technologies).filter((entry) => entry.refreshWarning);

if (!args.dryRun) {
  await mkdir("data/generated", { recursive: true });
  await writeFile(OUT, `window.AOM_DETAILS = ${JSON.stringify(details, null, 2)};\n`, "utf8");
}

process.stdout.write(
  JSON.stringify(
    {
      units: {
        imported: Object.values(details.units).filter((entry) => !entry.importError).length,
        failed: unitImportFailures.length,
        preserved: unitRefreshWarnings.length,
        requested: units.length,
      },
      technologies: {
        imported: Object.values(details.technologies).filter((entry) => !entry.importError).length,
        failed: technologyImportFailures.length,
        preserved: technologyRefreshWarnings.length,
        requested: techTargets.length,
      },
      out: args.dryRun ? "(dry run)" : OUT,
    },
    null,
    2,
  ) + "\n",
);

if (unitImportFailures.length || technologyImportFailures.length) {
  process.exitCode = 1;
}

function parseArgs(argv) {
  return argv.reduce(
    (parsed, arg) => {
      if (arg === "--dry-run") parsed.dryRun = true;
      else if (arg === "--help" || arg === "-h") parsed.help = true;
      else throw new Error(`Unknown argument: ${arg}`);
      return parsed;
    },
    { dryRun: false, help: false },
  );
}

function printHelp() {
  process.stdout.write(`AoM details importer

Usage:
  node tools/import-details.mjs
  node tools/import-details.mjs --dry-run

Fetches unit and technology pages, extracts compact stats/effects, and writes
data/generated/aom-details.js for the local app.
`);
}

async function loadGeneratedLibrary() {
  try {
    return JSON.parse(await readFile("data/generated/aom-library.generated.json", "utf8"));
  } catch {
    return null;
  }
}

async function loadExistingDetails() {
  return loadBrowserDataFile(OUT, "AOM_DETAILS", { units: {}, technologies: {} });
}

async function loadTechnologyOverrides() {
  return loadBrowserDataFile(TECHNOLOGY_OVERRIDES, "AOM_TECHNOLOGY_OVERRIDES", {});
}

async function loadBrowserDataFile(file, globalName, fallback) {
  try {
    const sandbox = { window: {} };
    vm.runInNewContext(await readFile(file, "utf8"), sandbox, { filename: file });
    return sandbox.window[globalName] || fallback;
  } catch {
    return fallback;
  }
}

function buildTitleMap(generated) {
  const map = new Map();
  const rows = generated?.pages?.find((page) => page.key === "units")?.extracted?.unitProduction || [];
  for (const row of rows) {
    if (!map.has(normalize(row.name))) map.set(normalize(row.name), row.title);
  }
  return map;
}

function buildTechnologyTargets(data) {
  const targets = new Map();

  for (const tech of data.technologies) {
    targets.set(slug(tech.name), {
      id: tech.id,
      name: tech.name,
      fallbackEffect: tech.effect,
      source: tech.source,
    });
  }

  for (const building of data.buildings) {
    for (const upgrade of building.upgrades || []) {
      const normalized = normalize(upgrade);
      if (!upgrade || SKIP_TECH_NAMES.has(normalized)) continue;
      const id = slug(upgrade);
      if (!targets.has(id)) {
        const genericEffect = GENERIC_TECH_EFFECTS.get(upgrade);
        targets.set(id, {
          id,
          name: upgrade,
          fallbackEffect: genericEffect || "",
          source: genericEffect ? "" : WIKI_ROOT + encodeURIComponent(aomPageTitle(upgrade)).replace(/%20/g, "_"),
          generic: Boolean(genericEffect),
        });
      }
    }
  }

  for (const [name, effect] of GENERIC_TECH_EFFECTS.entries()) {
    const id = slug(name);
    if (!targets.has(id)) {
      targets.set(id, {
        id,
        name,
        fallbackEffect: effect,
        source: "",
        generic: true,
      });
    }
  }

  return Array.from(targets.values());
}

async function importUnit(unit, titleByUnitName, previousEntry = null) {
  const title = titleByUnitName.get(normalize(unit.name)) || titleFromSource(unit.source) || unit.name;

  try {
    const page = await fetchParsedPage(title);
    const lines = htmlToLines(page.html);
    const values = extractHeadingValues(lines);
    const stats = pickValues(values, [
      "Population",
      "Hit points",
      "Speed",
      "Line of Sight",
      "Hack armor",
      "Pierce armor",
      "Crush armor",
      "Training time",
      "Food",
      "Wood",
      "Gold",
      "Favor",
      "Unit type",
      "Pantheon",
      "Age",
      "Trained at",
    ]);
    const attacks = pickValues(values, [
      "Hack attack",
      "Pierce attack",
      "Crush attack",
      "Divine attack",
      "Reload time",
      "Attack range",
      "Multipliers",
    ]);
    cleanValueMap(stats);
    cleanValueMap(attacks);

    return {
      id: unit.id,
      name: unit.name,
      title: page.title,
      source: WIKI_ROOT + encodeURIComponent(page.title).replace(/%20/g, "_"),
      description: firstQuote(page.text) || unit.note,
      stats,
      attacks,
      strengths: extractAfterLabel(lines, "Strong vs."),
      weaknesses: extractAfterLabel(lines, "Weak vs."),
      upgrades: extractUnitUpgradeRows(lines),
    };
  } catch (error) {
    if (previousEntry && !previousEntry.importError) {
      return { ...previousEntry, refreshWarning: error?.message || "Refresh failed; retained previous data." };
    }
    return {
      id: unit.id,
      name: unit.name,
      title,
      source: unit.source,
      description: unit.note,
      stats: {},
      attacks: {},
      strengths: "",
      weaknesses: "",
      upgrades: [],
      importError: true,
      error: error?.message,
    };
  }
}

async function importTechnology(target, previousEntry = null) {
  const override = technologyOverrides[target.id] || {};
  if (target.generic) {
    return {
      id: target.id,
      name: target.name,
      source: override.source || "",
      effect: override.effect || target.fallbackEffect,
      stats: { ...(override.stats || {}) },
      generic: true,
    };
  }

  const titles = technologyTitles(target);
  let lastError;

  for (const title of titles) {
    try {
    const page = await fetchParsedPage(title);
    const lines = htmlToLines(page.html);
    const values = extractHeadingValues(lines);
    const effect = EFFECT_OVERRIDES.get(target.id) || cleanEffectText(sectionText(lines, "Effect", 4) || sectionText(lines, "Effects", 6)) || target.fallbackEffect;

    const importedStats = pickValues(values, ["Pantheon", "God", "Age", "Researched at", "Required for", "Food", "Wood", "Gold", "Favor", "Research time", "Upgrade cost", "Upgrade time"]);
    return {
      id: target.id,
      name: target.name,
      title: page.title,
      source: override.source || WIKI_ROOT + encodeURIComponent(page.title).replace(/%20/g, "_"),
      effect: override.effect || effect,
      stats: { ...importedStats, ...(override.stats || {}) },
    };
    } catch (error) {
      lastError = error;
    }
  }

  if (previousEntry && !previousEntry.importError) {
    return { ...previousEntry, ...override, stats: { ...(previousEntry.stats || {}), ...(override.stats || {}) }, refreshWarning: lastError?.message || "Refresh failed; retained previous data." };
  }
  if (Object.keys(override.stats || {}).length) {
    return {
      id: target.id,
      name: target.name,
      source: override.source || target.source,
      effect: override.effect || target.fallbackEffect,
      stats: { ...override.stats },
      refreshWarning: lastError?.message || "Refresh failed; used curated data.",
    };
  }
  return {
    id: target.id,
    name: target.name,
    source: target.source,
    effect: target.fallbackEffect || "Effect unavailable from the current source page.",
    stats: {},
    importError: true,
    error: lastError?.message,
  };
}

async function fetchParsedPage(title) {
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    action: "parse",
    page: title,
    redirects: "1",
    prop: "text",
    format: "json",
    formatversion: "2",
  }).toString();

  const response = await fetch(url, {
    headers: {
      "user-agent": "AoM Companion details importer/0.1 (personal tool)",
      accept: "application/json",
    },
  });

  if (!response.ok) throw new Error(`Fandom API returned ${response.status} for ${title}`);

  const body = await response.json();
  if (body.error) throw new Error(`${body.error.code}: ${body.error.info}`);

  const html = typeof body.parse.text === "string" ? body.parse.text : body.parse.text?.["*"] || "";
  return {
    title: body.parse.title || title,
    html,
    text: cleanHtml(html),
  };
}

function htmlToLines(html) {
  const marked = String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_, inner) => `\n## ${cleanHtml(inner)}\n`)
    .replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, (_, inner) => `\n### ${cleanHtml(inner)}\n`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div|td|tr|th|dd|dt)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeHtml(marked)
    .split(/\r?\n/)
    .map((line) => normalizeLine(line))
    .filter((line) => line && !isNoiseLine(line));
}

function extractHeadingValues(lines) {
  const values = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.startsWith("### ")) continue;

    const label = cleanLabel(line.slice(4));
    const captured = [];

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const next = lines[cursor];
      if (next.startsWith("## ") || next.startsWith("### ")) break;
      if (captured.length >= 4) break;
      captured.push(next);
    }

    const value = cleanValue(captured.join(" "));
    if (value && !values[label]) values[label] = value;
  }

  return values;
}

function pickValues(values, names) {
  const picked = {};
  for (const name of names) {
    if (values[name]) picked[name] = values[name];
  }
  return picked;
}

function sectionText(lines, sectionName, maxLines) {
  const start = lines.findIndex((line) => line === `## ${sectionName}` || line === `## ${sectionName} [ ]`);
  if (start < 0) return "";

  const captured = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith("## ")) break;
    if (line.startsWith("### ")) continue;
    if (/^["“”]/.test(line) || line === "Retold" || line === "Original") continue;
    captured.push(line);
    if (captured.length >= maxLines) break;
  }

  return cleanValue(captured.join(" "));
}

function extractUnitUpgradeRows(lines) {
  const start = lines.findIndex((line) => line === "### Upgrades" || line === "### Upgrades [ ]");
  if (start < 0) return [];

  const rows = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith("## ") || line.startsWith("### ")) break;
    if (!/\+\d|%\s|seconds/i.test(line)) continue;
    if (/^(Age|Upgrade|Upgrades to|Cost|Effect)$/i.test(line)) continue;
    if (/^Age Upgrade Upgrades to Cost Effect$/i.test(line)) continue;
    rows.push(line);
    if (rows.length >= 8) break;
  }

  return rows;
}

function extractAfterLabel(lines, label) {
  const index = lines.findIndex((line) => line === label || line.startsWith(`${label} `));
  if (index < 0) return "";
  const sameLine = lines[index].slice(label.length).trim();
  if (sameLine) return cleanValue(sameLine);

  const captured = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (line.startsWith("## ") || line.startsWith("### ") || line.endsWith("vs.")) break;
    captured.push(line);
    if (captured.length >= 2) break;
  }
  return cleanValue(captured.join(" "));
}

function firstQuote(text) {
  const match = String(text).match(/[“"]\s*([^”"]{8,180})\s*[”"]/);
  return match ? cleanValue(match[1]) : "";
}

function cleanValueMap(values) {
  const numericLabels = new Set([
    "Population",
    "Hit points",
    "Speed",
    "Line of Sight",
    "Hack armor",
    "Pierce armor",
    "Crush armor",
    "Training time",
    "Food",
    "Wood",
    "Gold",
    "Favor",
    "Hack attack",
    "Pierce attack",
    "Crush attack",
    "Divine attack",
    "Reload time",
    "Attack range",
  ]);

  for (const [label, value] of Object.entries(values)) {
    let cleaned = cleanValue(value).split("“")[0].split('"')[0].trim();
    if (numericLabels.has(label)) {
      const match = cleaned.match(/^[-+]?\d+(?:\.\d+)?%?(?:\s*seconds?)?/i);
      if (match) cleaned = match[0].trim();
    }
    values[label] = cleaned;
  }
}

function cleanEffectText(value) {
  const cleaned = cleanValue(value)
    .split("“")[0]
    .split('"')[0]
    .replace(/\s+—In-game.*$/i, "")
    .trim();

  return stripTrailingDescription(cleaned);
}

function stripTrailingDescription(value) {
  let text = value;
  const patterns = [
    { re: /\s+Upgrades [^.]+(?:\.|$)/i, needsSignal: true },
    { re: /\s+[A-Z][A-Za-z' -]+ improved to [^.]+(?:\.|$)/, needsSignal: true },
    { re: /\s+Increases Tower range\b.*$/, needsSignal: true },
    { re: /\s+[A-Z][A-Za-z' -]{1,80} is (?:a|an)\b.*$/, needsSignal: true },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.re);
    if (match && match.index > 0 && (!pattern.needsSignal || /[+%:-]/.test(text.slice(0, match.index)))) {
      text = text.slice(0, match.index);
    }
  }

  for (const name of KNOWN_GOD_NAMES) {
    const actionMatch = text.match(new RegExp(`\\s+${escapeRegExp(name)}\\s+(?:upgrades|causes|allows|improves|increases)\\b.*$`, "u"));
    if (actionMatch && actionMatch.index > 0) {
      text = text.slice(0, actionMatch.index);
    }

    const match = text.match(new RegExp(`\\s+${escapeRegExp(name)}$`, "u"));
    if (match && match.index > 0 && /[+%:-]|damage|generate|respawn|upgrade/i.test(text.slice(0, match.index))) {
      text = text.slice(0, match.index);
    }
  }

  return text.trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function runPool(items, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await worker(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, run));
  return results;
}

function isSyntheticUnit(unit) {
  return /heroes|promotion/i.test(unit.name);
}

function titleFromSource(source) {
  if (!source) return "";
  const title = source.split("/wiki/")[1] || source;
  return decodeURIComponent(title).replace(/_/g, " ");
}

function aomPageTitle(name) {
  return AOM_PAGE_OVERRIDES.get(name) || name;
}

function technologyTitles(target) {
  return unique([
    AOM_PAGE_OVERRIDES.get(target.name),
    titleFromSource(target.source),
    `${target.name} (Age of Mythology)`,
    target.name,
  ].filter(Boolean));
}

function unique(values) {
  return Array.from(new Set(values));
}

function cleanLabel(value) {
  return cleanValue(value)
    .replace(/\s*\[\s*\]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanValue(value) {
  return String(value)
    .replace(/\[\s*\]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\+\s+/g, "+")
    .replace(/\s+([:,.%×])/g, "$1")
    .trim();
}

function normalizeLine(line) {
  return cleanValue(line.replace(/&nbsp;/g, " "));
}

function cleanHtml(html) {
  return cleanValue(
    decodeHtml(
      String(html)
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<sup[\s\S]*?<\/sup>/gi, "")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function isNoiseLine(line) {
  return [
    "Sign In to Save Save",
    "Edit",
    "Edit source",
    "History",
    "Purge",
    "Contents",
    "English",
    "Advertisement",
  ].includes(line);
}

function decodeHtml(value) {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function normalize(value) {
  return cleanValue(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slug(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
