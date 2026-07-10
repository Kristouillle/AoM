import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { loadRuntimeData } from "./runtime-data.mjs";

const API_URL = "https://ageofempires.fandom.com/api.php";
const UNIT_PAGE = "Unit (Age of Mythology)";
const BUILDING_PAGE = "Building (Age of Mythology)";
const GOD_PAGE = "God";
const TECHNOLOGY_PAGE = "Technology (Age of Mythology)";
const ICON_MANIFEST = "data/generated/aom-icons.js";
const ASSET_ROOT = "assets/icons";
const IMAGE_WIDTH = 96;
const GOD_IMAGE_WIDTH = 768;
const NAME_ALIASES = new Map([
  ["einheri", ["einherjar"]],
  ["walls", ["wooden wall", "stone wall", "fortified wall"]],
]);

const args = parseArgs(process.argv.slice(2));
const data = await loadRuntimeData();
const godTargets = data.gods.map((god) => ({ id: god.id, name: god.name, kind: "gods", source: god.source }));
const unitTargets = data.units.map((unit) => ({ id: unit.id, name: unit.name, kind: "units", source: unit.source }));
const buildingTargets = data.buildings.map((building) => ({
  id: building.id,
  name: building.name,
  kind: "buildings",
  source: building.source,
}));
const technologyTargets = buildTechnologyTargets(data);

if (args.help) {
  printHelp();
  process.exit(0);
}

const godImages = await fetchPageImages(GOD_PAGE, imageOptionsForKind("gods"));
const unitImages = await fetchPageImages(UNIT_PAGE);
const buildingImages = await fetchPageImages(BUILDING_PAGE);
const technologyImages = await fetchPageImages(TECHNOLOGY_PAGE);

const gods = await buildIconGroup(godTargets, godImages, "gods");
const units = await buildIconGroup(unitTargets, unitImages, "units");
const buildings = await buildIconGroup(buildingTargets, buildingImages, "buildings");
const technologies = await buildIconGroup(technologyTargets, technologyImages, "technologies");
const manifest = {
  generatedAt: new Date().toISOString(),
  source: "https://ageofempires.fandom.com",
  gods,
  units,
  buildings,
  technologies,
};

if (!args.dryRun) {
  await mkdir("data/generated", { recursive: true });
  await writeFile(ICON_MANIFEST, `window.AOM_ICONS = ${JSON.stringify(manifest, null, 2)};\n`, "utf8");
}

process.stdout.write(
  JSON.stringify(
    {
      gods: summarizeGroup(gods, godTargets.length),
      units: summarizeGroup(units, unitTargets.length),
      buildings: summarizeGroup(buildings, buildingTargets.length),
      technologies: summarizeGroup(technologies, technologyTargets.length),
      manifest: args.dryRun ? "(dry run)" : resolve(ICON_MANIFEST),
    },
    null,
    2,
  ) + "\n",
);

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
  process.stdout.write(`AoM icon importer

Usage:
  node tools/import-icons.mjs
  node tools/import-icons.mjs --dry-run

Downloads matched god portraits plus unit and building icons from the Age of Empires Series Wiki
into assets/icons/ and writes data/generated/aom-icons.js for the local app.
`);
}

function buildTechnologyTargets(data) {
  const targets = new Map();

  for (const tech of data.technologies || []) {
    addTechnologyTarget(targets, tech.name, tech.id, tech.source);
  }

  for (const building of data.buildings || []) {
    for (const upgrade of building.upgrades || []) {
      addTechnologyTarget(targets, upgrade);
    }
  }

  return Array.from(targets.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function addTechnologyTarget(targets, name, id = "", source = "") {
  if (!name) return;
  const key = id || slugify(name);
  if (targets.has(key)) return;
  targets.set(key, {
    id: key,
    name,
    kind: "technologies",
    source,
  });
}

function imageOptionsForKind(kind) {
  return kind === "gods"
    ? { includeArtwork: true, width: GOD_IMAGE_WIDTH }
    : { includeArtwork: false, width: IMAGE_WIDTH };
}

async function fetchPageImages(title, options = {}) {
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "text",
    format: "json",
    formatversion: "2",
  }).toString();

  const response = await fetchWithRetry(url, {
    headers: {
      "user-agent": "AoM Companion icon importer/0.1 (personal tool)",
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

  const html = typeof body.parse.text === "string" ? body.parse.text : body.parse.text?.["*"] || "";
  return extractImages(html, options);
}

function extractImages(html, options = {}) {
  const images = [];
  const imgPattern = /<img\b([^>]*)>/gi;
  const width = options.width || IMAGE_WIDTH;
  const includeArtwork = Boolean(options.includeArtwork);
  let match;

  while ((match = imgPattern.exec(html))) {
    const attrs = parseAttributes(match[1]);
    const rawUrl = attrs["data-src"] || attrs.src || "";
    const url = normalizeUrl(rawUrl, width);
    const alt = cleanHtml(attrs.alt || attrs.title || attrs["data-image-name"] || "");
    const filename = cleanHtml(attrs["data-image-name"] || imageNameFromUrl(url));
    const text = cleanText([alt, filename].join(" "));

    if (!url || url.startsWith("data:")) continue;
    if (includeArtwork && /\b(in-game\s+)?statues?\b/i.test(text)) continue;
    const isIconLike = /\bicon\b/i.test(text) || /\bportrait\b/i.test(text);
    const isArtworkLike = includeArtwork && (/\bartwork\b|\bretold\b|\baomrt\b|\baomr\b/i.test(text));
    if (!isIconLike && !isArtworkLike) continue;
    if (/age up|age icon|resource|button|background/i.test(text)) continue;

    images.push({
      url,
      alt,
      filename,
      text,
      normalized: normalize(text),
    });
  }

  return dedupeByUrl(images);
}

function parseAttributes(rawAttrs) {
  const attrs = {};
  const pattern = /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = pattern.exec(rawAttrs))) {
    attrs[match[1].toLowerCase()] = decodeHtml(match[3] ?? match[4] ?? "");
  }
  return attrs;
}

async function buildIconGroup(targets, images, kind) {
  const manifest = {};
  const pageImageCache = new Map();
  const fileImageCache = new Map();

  for (const target of targets) {
    let match = findBestImage(target, images);
    if (target.kind === "gods" || !match || match.score < 32) {
      const pageImages = await fetchImagesForTarget(target, pageImageCache);
      if (pageImages.length) match = findBestImage(target, [...pageImages, ...images]);
    }
    if (!match || match.score < 32) {
      const fileImages = await fetchFileImagesForTarget(target, fileImageCache);
      if (fileImages.length) match = findBestImage(target, [...images, ...fileImages]);
    }
    if (!match || match.score < 32) continue;

    const ext = extensionForUrl(match.image.url);
    const filePath = `${ASSET_ROOT}/${kind}/${target.id}${ext}`;

    if (!args.dryRun) {
      await downloadImage(match.image.url, filePath);
    }

    manifest[target.id] = {
      src: `./${filePath.replaceAll("\\", "/")}`,
      label: target.name,
      source: target.source,
      imageSource: match.image.url,
      match: match.image.alt || match.image.filename,
      score: match.score,
    };
  }

  return manifest;
}

async function fetchImagesForTarget(target, cache) {
  const titles = unique([target.name, ...(target.aliases || []), ...nameAliases(target.name)]);
  const options = imageOptionsForKind(target.kind);
  const images = [];

  for (const title of titles) {
    if (!cache.has(title)) {
      try {
        cache.set(title, await fetchPageImages(title, options));
      } catch {
        cache.set(title, []);
      }
    }
    images.push(...cache.get(title));
  }

  return images;
}

async function fetchFileImagesForTarget(target, cache) {
  const images = [];
  const names = unique([target.name, ...(target.aliases || []), ...nameAliases(target.name)]);
  const width = imageOptionsForKind(target.kind).width;
  const titles = unique(
    names.flatMap((name) => [
      `File:AoMR ${name} portrait.png`,
      `File:AoMR ${name} Portrait.png`,
      `File:AoMR ${name} icon.png`,
      `File:AoMR ${name} Icon.png`,
      `File:${name} portrait.png`,
      `File:${name} Portrait.png`,
      `File:${name} icon.png`,
      `File:${name} Icon.png`,
    ]),
  );

  for (const title of titles) {
    if (!cache.has(title)) {
      try {
        cache.set(title, await fetchImageInfo(title, width));
      } catch {
        cache.set(title, null);
      }
    }

    const image = cache.get(title);
    if (image) images.push(image);
  }

  return images;
}

async function fetchImageInfo(title, width = IMAGE_WIDTH) {
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: String(width),
    format: "json",
    formatversion: "2",
  }).toString();

  const response = await fetchWithRetry(url, {
    headers: {
      "user-agent": "AoM Companion icon importer/0.1 (personal tool)",
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Fandom API returned ${response.status} for ${title}`);
  }

  const body = await response.json();
  const page = body.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  const rawUrl = info?.thumburl || info?.url || "";
  if (!rawUrl) return null;

  const label = title.replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, "");
  return {
    url: normalizeUrl(rawUrl, width),
    alt: label,
    filename: label,
    text: label,
    normalized: normalize(label),
  };
}

function findBestImage(target, images) {
  const names = [target.name, ...(target.aliases || []), ...nameAliases(target.name)];
  let best = null;

  for (const name of names) {
    const targetNormalized = normalize(name);
    const targetTokens = tokenSet(targetNormalized);

    for (const image of images) {
      const score = scoreImage(target, targetNormalized, targetTokens, image);
      if (!best || score > best.score) best = { image, score };
    }
  }

  return best;
}

function scoreImage(target, targetNormalized, targetTokens, image) {
  let score = 0;
  const imageText = image.normalized;

  if (imageText.includes(targetNormalized)) score += 90;
  if (normalizeIconLabel(image.text).includes(targetNormalized)) score += 35;

  for (const token of targetTokens) {
    if (imageText.includes(token)) score += token.length > 4 ? 14 : 8;
  }

  if (/\bicon\b/i.test(image.text)) score += 8;
  if (/\bportrait\b/i.test(image.text)) score += 8;
  if (/\bretold\b|\baomr\b/i.test(image.text)) score += 4;
  if (target.kind === "gods") {
    if (/\bgods?\b/i.test(image.text)) score += 2;
    if (/\baomrt\b|\bretold\b/i.test(image.text) && !/\bicon\b/i.test(image.text)) score += 46;
    if (/\bicon\b/i.test(image.text) && !/\bportrait\b/i.test(image.text)) score -= 8;
  }

  const imageTokens = tokenSet(imageText);
  const extraCommonTokens = Array.from(imageTokens).filter((token) => targetTokens.has(token)).length;
  score += extraCommonTokens * 2;

  return score;
}

function normalizeIconLabel(text) {
  return normalize(text)
    .replace(/\baomr\b/g, "")
    .replace(/\baom\b/g, "")
    .replace(/\bage of mythology\b/g, "")
    .replace(/\bretold\b/g, "")
    .replace(/\bicon\b/g, "")
    .replace(/\bportrait\b/g, "")
    .replace(/\bgod\b/g, "")
    .replace(/\bunit\b/g, "")
    .replace(/\bgreek\b|\begyptian\b|\bnorse\b|\batlantean\b|\bchinese\b|\bjapanese\b|\baztec\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nameAliases(name) {
  return NAME_ALIASES.get(normalize(name)) || [];
}

function tokenSet(value) {
  return new Set(
    normalize(value)
      .split(/\s+/)
      .filter((token) => token.length > 1 && !["the", "of", "and", "age"].includes(token)),
  );
}

async function downloadImage(url, filePath) {
  const response = await fetchWithRetry(url, {
    headers: {
      "user-agent": "AoM Companion icon importer/0.1 (personal tool)",
      accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Image download returned ${response.status} for ${url}`);
  }

  await mkdir(dirname(filePath), { recursive: true });
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(filePath, bytes);
}

async function fetchWithRetry(url, options, attempts = 5) {
  let response;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    response = await fetch(url, options);
    if (response.status !== 429 && response.status < 500) return response;
    await response.body?.cancel?.();
    await delay([4000, 8000, 16000, 30000, 45000][attempt] || 45000);
  }

  return response;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extensionForUrl(url) {
  const cleanUrl = url.split("?")[0].split("/revision/")[0];
  const ext = extname(cleanUrl).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) return ext;
  return ".png";
}

function normalizeUrl(rawUrl, width = IMAGE_WIDTH) {
  if (!rawUrl) return "";
  let url = rawUrl;
  if (url.startsWith("//")) url = `https:${url}`;
  if (url.startsWith("/")) url = `https://ageofempires.fandom.com${url}`;
  return url.replace(/scale-to-width-down\/\d+/i, `scale-to-width-down/${width}`);
}

function imageNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts.at(-1) || "");
  } catch {
    return "";
  }
}

function summarizeGroup(group, total) {
  const matched = Object.keys(group).length;
  return { matched, missing: total - matched, total };
}

function dedupeByUrl(images) {
  const seen = new Set();
  return images.filter((image) => {
    if (seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
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

function cleanText(text) {
  return String(text)
    .replace(/''+/g, "")
    .replace(/\s+/g, " ")
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

function normalize(value) {
  return cleanText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-");
}
