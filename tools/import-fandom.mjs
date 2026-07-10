import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const API_URL = "https://ageofempires.fandom.com/api.php";
const WIKI_ROOT = "https://ageofempires.fandom.com/wiki/";

const DEFAULT_PAGES = [
  { key: "pantheons", title: "Pantheon" },
  { key: "units", title: "Unit (Age of Mythology)" },
  { key: "buildings", title: "Building (Age of Mythology)" },
  { key: "gods", title: "God" },
  { key: "godPowers", title: "God power" },
  { key: "technologies", title: "Technology (Age of Mythology)" },
];

const PANTHEON_NAMES = new Map([
  ["greeks", "greeks"],
  ["egyptians", "egyptians"],
  ["norse", "norse"],
  ["atlanteans", "atlanteans"],
  ["chinese", "chinese"],
  ["japanese", "japanese"],
  ["aztecs", "aztecs"],
]);

const MAJOR_GOD_NAMES = new Set([
  "Zeus",
  "Poseidon",
  "Hades",
  "Demeter",
  "Ra",
  "Isis",
  "Set",
  "Thor",
  "Odin",
  "Loki",
  "Freyr",
  "Kronos",
  "Oranos",
  "Gaia",
  "Fuxi",
  "Nüwa",
  "Shennong",
  "Amaterasu",
  "Tsukuyomi",
  "Susanoo",
  "Huitzilopochtli",
  "Tezcatlipoca",
  "Quetzalcoatl",
]);

const args = parseArgs(process.argv.slice(2));
const outputPath = resolve(args.out || "data/generated/aom-library.generated.json");

if (args.help) {
  printHelp();
  process.exit(0);
}

const pages = selectPages(args.pages);
const generatedAt = new Date().toISOString();
const results = [];

for (const page of pages) {
  process.stdout.write(`Fetching ${page.title}...\n`);
  const parsed = await fetchParsedPage(page.title);
  results.push(normalizePage(page, parsed));
}

const payload = {
  generatedAt,
  source: {
    name: "Age of Empires Series Wiki",
    api: API_URL,
    license: "Fandom community content is generally CC-BY-SA unless noted on a page.",
  },
  pages: results,
};

if (args.dryRun) {
  process.stdout.write(JSON.stringify(summarize(payload), null, 2) + "\n");
} else {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  process.stdout.write(`Wrote ${outputPath}\n`);
}

function parseArgs(argv) {
  return argv.reduce(
    (parsed, arg) => {
      if (arg === "--dry-run") parsed.dryRun = true;
      else if (arg === "--help" || arg === "-h") parsed.help = true;
      else if (arg.startsWith("--out=")) parsed.out = arg.slice("--out=".length);
      else if (arg.startsWith("--pages=")) parsed.pages = arg.slice("--pages=".length);
      else throw new Error(`Unknown argument: ${arg}`);
      return parsed;
    },
    { dryRun: false, help: false, out: "", pages: "" },
  );
}

function printHelp() {
  process.stdout.write(`AoM Fandom importer

Usage:
  node tools/import-fandom.mjs
  node tools/import-fandom.mjs --dry-run
  node tools/import-fandom.mjs --pages=units,gods --out=data/generated/partial.json

This importer keeps structured facts: page titles, links, sections, and inferred
unit/building relationships. It intentionally does not copy article prose.
`);
}

function selectPages(pageArg) {
  if (!pageArg) return DEFAULT_PAGES;
  const wanted = new Set(pageArg.split(",").map((item) => item.trim()).filter(Boolean));
  const selected = DEFAULT_PAGES.filter((page) => wanted.has(page.key));
  if (!selected.length) {
    throw new Error(`No matching pages for --pages=${pageArg}`);
  }
  return selected;
}

async function fetchParsedPage(title) {
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "wikitext|links|sections|text",
    format: "json",
    formatversion: "2",
  }).toString();

  const response = await fetch(url, {
    headers: {
      "user-agent": "AoM Companion local importer/0.1 (personal tool)",
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Fandom API returned ${response.status} for ${title}`);
  }

  const body = await response.json();
  if (body.error) {
    throw new Error(`${body.error.code}: ${body.error.info}`);
  }
  return body.parse;
}

function normalizePage(page, parsed) {
  const wikitext = typeof parsed.wikitext === "string" ? parsed.wikitext : parsed.wikitext?.["*"] || "";
  const html = typeof parsed.text === "string" ? parsed.text : parsed.text?.["*"] || "";
  const sections = (parsed.sections || []).map((section) => ({
    level: Number(section.level || 0),
    index: section.index,
    anchor: section.anchor,
    line: cleanText(section.line || ""),
  }));

  const links = (parsed.links || [])
    .filter((link) => link.ns === 0)
    .map((link) => ({
      title: link.title,
      url: WIKI_ROOT + encodeURIComponent(link.title).replace(/%20/g, "_"),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return {
    key: page.key,
    title: parsed.title || page.title,
    url: WIKI_ROOT + encodeURIComponent(page.title).replace(/%20/g, "_"),
    sections,
    links: uniqueByTitle(links),
    extracted: extractStructuredFacts(page.key, wikitext, html),
  };
}

function extractStructuredFacts(key, wikitext, html) {
  if (!wikitext && !html) return {};
  if (key === "units") return extractUnits(wikitext, html);
  if (key === "buildings") return extractBulletedLinks(wikitext, html, "buildings");
  if (key === "gods") return extractGodLinks(wikitext);
  if (key === "technologies") return extractBulletedLinks(wikitext, html, "technologies");
  if (key === "godPowers") return extractBulletedLinks(wikitext, html, "godPowers");
  return extractBulletedLinks(wikitext, html, key);
}

function extractUnits(wikitext, html) {
  const rows = [];
  let pantheon = "";
  let building = "";

  for (const rawLine of wikitext.split(/\r?\n/)) {
    const section = parseSection(rawLine);
    if (section) {
      const normalized = normalize(section.title);
      if (section.level === 2) {
        pantheon = inferPantheon(normalized);
        building = "";
      } else if (section.level === 3 && pantheon) {
        building = section.title;
      }
      continue;
    }

    if (!pantheon || !building || !rawLine.trim().startsWith("*")) continue;
    const links = extractWikiLinks(rawLine);
    const firstEntity = links.find((link) => !isNonEntityLink(link.title));
    if (!firstEntity) continue;

    rows.push({
      name: firstEntity.label,
      title: firstEntity.title,
      pantheon,
      building,
      related: links
        .slice(1)
        .filter((link) => !isNonEntityLink(link.title))
        .map((link) => link.label),
    });
  }

  const wikitextRows = dedupeRows(rows);
  return { unitProduction: wikitextRows.length > 20 ? wikitextRows : extractUnitsFromHtml(html) };
}

function extractGodLinks(wikitext) {
  const links = extractWikiLinks(wikitext)
    .filter((link) => !isNonEntityLink(link.title))
    .filter((link) => !["Age of Mythology", "Pantheon", "God power"].includes(link.label));
  return { links: dedupeRows(links.map((link) => ({ name: link.label, title: link.title }))) };
}

function extractBulletedLinks(wikitext, html, key) {
  const rows = [];
  let sectionTitle = "";

  for (const rawLine of wikitext.split(/\r?\n/)) {
    const section = parseSection(rawLine);
    if (section) {
      sectionTitle = section.title;
      continue;
    }

    if (!rawLine.trim().startsWith("*")) continue;
    for (const link of extractWikiLinks(rawLine)) {
      if (isNonEntityLink(link.title)) continue;
      rows.push({ name: link.label, title: link.title, section: sectionTitle });
    }
  }

  const wikitextRows = dedupeRows(rows);
  return { [key]: wikitextRows.length > 10 ? wikitextRows : extractListLinksFromHtml(html) };
}

function extractUnitsFromHtml(html) {
  const rows = [];
  let pantheon = "";
  let building = "";

  for (const token of htmlTokens(html)) {
    if (token.type === "heading") {
      const normalized = normalize(token.text);
      if (token.level === 2) {
        pantheon = inferPantheon(normalized);
        building = "";
      } else if (token.level === 3 && pantheon) {
        building = token.text;
      }
      continue;
    }

    if (!pantheon || !building || token.type !== "listItem") continue;
    const links = extractHtmlLinks(token.html).filter((link) => !isNonEntityLink(link.title));
    const firstEntity = links.find((link) => !looksLikeIcon(link.label));
    if (!firstEntity) continue;
    if (MAJOR_GOD_NAMES.has(firstEntity.label) && links.length > 1) continue;

    rows.push({
      name: firstEntity.label,
      title: firstEntity.title,
      pantheon,
      building,
      related: links
        .slice(1)
        .filter((link) => !looksLikeIcon(link.label))
        .map((link) => link.label),
    });
  }

  return dedupeRows(rows);
}

function extractListLinksFromHtml(html) {
  const rows = [];
  let sectionTitle = "";

  for (const token of htmlTokens(html)) {
    if (token.type === "heading") {
      sectionTitle = token.text;
      continue;
    }

    if (token.type !== "listItem") continue;
    for (const link of extractHtmlLinks(token.html)) {
      if (isNonEntityLink(link.title) || looksLikeIcon(link.label)) continue;
      rows.push({ name: link.label, title: link.title, section: sectionTitle });
    }
  }

  return dedupeRows(rows);
}

function parseSection(line) {
  const match = line.match(/^(=+)\s*(.*?)\s*\1\s*$/);
  if (!match) return null;
  return { level: match[1].length, title: cleanText(match[2]) };
}

function extractWikiLinks(text) {
  const links = [];
  const pattern = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g;
  let match;
  while ((match = pattern.exec(text))) {
    const title = cleanText(match[1]);
    const label = cleanText(match[2] || match[1]);
    links.push({ title, label });
  }
  return links;
}

function htmlTokens(html) {
  const tokens = [];
  const pattern = /<h([23])\b[^>]*>[\s\S]*?<\/h\1>|<li\b[^>]*>[\s\S]*?<\/li>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const chunk = match[0];
    if (chunk.startsWith("<h")) {
      const level = Number(match[1]);
      const text = cleanHtml(chunk).replace(/\s*\[edit\]\s*$/i, "");
      tokens.push({ type: "heading", level, text });
    } else {
      tokens.push({ type: "listItem", html: chunk });
    }
  }

  return tokens;
}

function extractHtmlLinks(html) {
  const links = [];
  const pattern = /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const href = decodeHtml(match[1]);
    if (!href.includes("/wiki/")) continue;

    const titleMatch = match[0].match(/\btitle="([^"]*)"/i);
    const title = cleanText(decodeHtml(titleMatch?.[1] || href.split("/wiki/")[1] || ""));
    const label = cleanHtml(match[2]) || title;
    if (!title || href.includes("/wiki/File:")) continue;

    links.push({ title, label });
  }

  return links;
}

function inferPantheon(normalizedSectionTitle) {
  for (const [name, id] of PANTHEON_NAMES.entries()) {
    if (normalizedSectionTitle.includes(name)) return id;
  }
  return "";
}

function isNonEntityLink(title) {
  return /^(file|image|category|template|help|special):/i.test(title);
}

function looksLikeIcon(label) {
  return /\b(icon|portrait|artwork|image)\b/i.test(label);
}

function dedupeRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueByTitle(links) {
  const seen = new Set();
  return links.filter((link) => {
    if (seen.has(link.title)) return false;
    seen.add(link.title);
    return true;
  });
}

function cleanText(text) {
  return String(text)
    .replace(/''+/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*\[\s*\]\s*$/g, "")
    .trim();
}

function cleanHtml(html) {
  return cleanText(
    decodeHtml(
      String(html)
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " "),
    ),
  );
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

function normalize(text) {
  return cleanText(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function summarize(payload) {
  return {
    generatedAt: payload.generatedAt,
    pages: payload.pages.map((page) => ({
      key: page.key,
      title: page.title,
      sections: page.sections.length,
      links: page.links.length,
      extractedKeys: Object.keys(page.extracted),
    })),
  };
}
