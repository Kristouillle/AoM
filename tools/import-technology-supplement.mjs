import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { loadProductionSupplement, loadSeedData, normalize, withProductionSupplement } from "./runtime-data.mjs";

const API_URL = "https://ageofempires.fandom.com/api.php";
const WIKI_ROOT = "https://ageofempires.fandom.com/wiki/";
const OUT = "data/generated/aom-technology-supplement.js";
const DEFAULT_CATEGORIES = [
  "Greek myth technologies",
  "Egyptian myth technologies",
  "Norse myth technologies",
  "Atlantean myth technologies",
  "Chinese myth technologies",
  "Japanese myth technologies",
  "Aztec myth technologies",
];
const PANTHEON_IDS = new Map([
  ["greek", "greeks"],
  ["greeks", "greeks"],
  ["egyptian", "egyptians"],
  ["egyptians", "egyptians"],
  ["norse", "norse"],
  ["atlantean", "atlanteans"],
  ["atlanteans", "atlanteans"],
  ["chinese", "chinese"],
  ["japanese", "japanese"],
  ["aztec", "aztecs"],
  ["aztecs", "aztecs"],
]);

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const categories = args.categories.length ? args.categories : DEFAULT_CATEGORIES;
const seedData = withProductionSupplement(await loadSeedData(), await loadProductionSupplement());
const knownTechnologyNames = knownTechnologies(seedData);
const categoryMembers = await fetchCategoryMembers(categories);
const imported = await runPool(categoryMembers, importTechnologyCandidate);
const candidates = imported.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
const technologies = candidates.filter((tech) => !knownTechnologyNames.has(normalize(tech.name)));
const payload = {
  generatedAt: new Date().toISOString(),
  source: {
    name: "Age of Empires Series Wiki",
    api: API_URL,
    categories,
  },
  audit: {
    categoryMembers: categoryMembers.length,
    importedCandidates: candidates.length,
    alreadyKnown: candidates.length - technologies.length,
    missingAdded: technologies.length,
    missingNames: technologies.map((tech) => tech.name),
  },
  technologies,
};

if (args.dryRun) {
  process.stdout.write(JSON.stringify(payload.audit, null, 2) + "\n");
} else {
  await mkdir(dirname(args.out), { recursive: true });
  await writeFile(args.out, `window.AOM_TECHNOLOGY_SUPPLEMENT = ${JSON.stringify(payload, null, 2)};\n`, "utf8");
  process.stdout.write(
    JSON.stringify(
      {
        out: resolve(args.out),
        ...payload.audit,
      },
      null,
      2,
    ) + "\n",
  );
}

function parseArgs(argv) {
  return argv.reduce(
    (parsed, arg) => {
      if (arg === "--dry-run") parsed.dryRun = true;
      else if (arg === "--help" || arg === "-h") parsed.help = true;
      else if (arg.startsWith("--out=")) parsed.out = arg.slice("--out=".length);
      else if (arg.startsWith("--categories=")) {
        parsed.categories = arg
          .slice("--categories=".length)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      } else {
        throw new Error(`Unknown argument: ${arg}`);
      }
      return parsed;
    },
    { categories: [], dryRun: false, help: false, out: OUT },
  );
}

function printHelp() {
  process.stdout.write(`AoM technology supplement importer

Usage:
  node tools/import-technology-supplement.mjs
  node tools/import-technology-supplement.mjs --dry-run
  node tools/import-technology-supplement.mjs --categories="Japanese myth technologies"

Queries Fandom technology categories, imports page metadata for candidates that
are missing from the local seed data, and writes data/generated/aom-technology-supplement.js.
`);
}

function knownTechnologies(data) {
  const names = new Set();
  for (const tech of data.technologies || []) names.add(normalize(tech.name));
  for (const building of data.buildings || []) {
    for (const upgrade of building.upgrades || []) names.add(normalize(upgrade));
  }
  return names;
}

async function fetchCategoryMembers(categories) {
  const seen = new Map();

  for (const category of categories) {
    let cmcontinue = "";
    do {
      const url = new URL(API_URL);
      url.search = new URLSearchParams({
        action: "query",
        list: "categorymembers",
        cmtitle: `Category:${category}`,
        cmnamespace: "0",
        cmlimit: "500",
        format: "json",
        formatversion: "2",
        ...(cmcontinue ? { cmcontinue } : {}),
      }).toString();

      const body = await fetchJson(url);
      const members = body.query?.categorymembers || [];
      for (const member of members) {
        if (!member.title) continue;
        if (!seen.has(member.title)) seen.set(member.title, { title: member.title, categories: [] });
        seen.get(member.title).categories.push(category);
      }
      cmcontinue = body.continue?.cmcontinue || "";
    } while (cmcontinue);
  }

  return Array.from(seen.values()).sort((a, b) => a.title.localeCompare(b.title));
}

async function importTechnologyCandidate(candidate) {
  try {
    const page = await fetchParsedPage(candidate.title);
    const lines = htmlToLines(page.html);
    const values = extractHeadingValues(lines);
    const pantheon = pantheonId(values.Pantheon);
    const age = ageName(values.Age);
    const building = researchBuilding(values["Researched at"]);
    const god = cleanValue(values.God || "");
    const effect = cleanEffectText(sectionText(lines, "Effect", 5) || sectionText(lines, "Effects", 5));

    if (!pantheon || !age || !building || !effect) return null;

    return {
      id: slug(page.title),
      name: page.title,
      age,
      building,
      category: "myth",
      effect,
      pantheons: [pantheon],
      availability: god ? { god } : {},
      source: WIKI_ROOT + encodeURIComponent(page.title).replace(/%20/g, "_"),
      generated: true,
      sourceCategories: candidate.categories,
    };
  } catch {
    return null;
  }
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

  const body = await fetchJson(url);
  if (body.error) throw new Error(`${body.error.code}: ${body.error.info}`);
  return {
    title: body.parse?.title || title,
    html: typeof body.parse?.text === "string" ? body.parse.text : body.parse?.text?.["*"] || "",
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "AoM Companion technology importer/0.1 (personal tool)",
      accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`Fandom API returned ${response.status} for ${url}`);
  return response.json();
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
    .map((line) => cleanValue(line))
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

function sectionText(lines, sectionName, maxLines) {
  const start = lines.findIndex((line) => line === `## ${sectionName}` || line === `## ${sectionName} [ ]`);
  if (start < 0) return "";

  const captured = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith("## ")) break;
    if (line.startsWith("### ")) continue;
    if (/^["]/.test(line) || line === "Retold" || line === "Original") continue;
    captured.push(line);
    if (captured.length >= maxLines) break;
  }

  return cleanValue(captured.join(" "));
}

function pantheonId(value) {
  const normalizedValue = normalize(value);
  for (const [label, id] of PANTHEON_IDS.entries()) {
    if (normalizedValue.includes(label)) return id;
  }
  return "";
}

function ageName(value) {
  const match = cleanValue(value).match(/\b(Archaic|Classical|Heroic|Mythic|Wonder)\b/i);
  if (!match) return "";
  return match[1].slice(0, 1).toUpperCase() + match[1].slice(1).toLowerCase();
}

function researchBuilding(value) {
  const cleaned = cleanValue(value);
  const known = ["Temple", "Shrine", "Sentry Tower", "Castle"];
  const matches = known.filter((name) => normalize(cleaned).includes(normalize(name)));
  return matches.length ? matches.join(" / ") : cleaned;
}

function cleanLabel(value) {
  return cleanValue(value).replace(/\s*\[\s*\]\s*$/g, "");
}

function cleanEffectText(value) {
  return cleanValue(value)
    .split(/[“"]/)[0]
    .replace(/\s+(--|—)In-game.*$/i, "")
    .trim();
}

function isNoiseLine(line) {
  return /^(edit|sign in|advertisement|save|history|purge)$/i.test(line);
}

function cleanHtml(html) {
  return cleanValue(
    decodeHtml(
      String(html)
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " "),
    ),
  );
}

function cleanValue(value) {
  return String(value)
    .replace(/''+/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*\[\s*\]\s*$/g, "")
    .trim();
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

function slug(value) {
  return normalize(value).replace(/\s+/g, "-");
}

async function runPool(items, worker, concurrency = 6) {
  const results = [];
  let cursor = 0;

  async function next() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
  return results;
}
