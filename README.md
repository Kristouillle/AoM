# AoM Companion

A local Age of Mythology companion for looking up gods, buildings, units, upgrades, and practical counters.

## Open The App

Double-click `index.html`.

The first version is a browser-based local app so it opens without installing Electron or running a server. The data model is already structured so an Electron wrapper can be added later without changing the core UI.

## What Works Now

- Select a major god and view its pantheon, focus notes, buildings, and roster.
- Press `K`, `/`, or `Ctrl/Cmd+K` to jump to any page, major god, unit, building, or upgrade.
- Click a building to see produced units and known upgrades.
- Search the selected god's local library.
- Search an enemy unit or class, such as `cavalry`, `archer`, `myth`, `Toxotes`, or `Hippeus`, and get counter options from the selected god.
- Switch between `Core` and `All options`. Core hides minor-god myth units and conditional units.
- Local unit and building icon tiles for most seeded units and buildings.
- Unit stat panels from building unit chips, roster cards, and counter results.
- Upgrade rows with imported effect text where the wiki exposes it.

## Data Strategy

The app stores normalized facts: names, pantheons, ages, production buildings, unit tags, counter tags, and source links. It does not copy wiki article prose into the app.

Seed data lives in `data/aom-data.js`. Generated crawl output should go in `data/generated/`.

Generated production supplements live in `data/generated/aom-production.js`. This file is built from the wiki library snapshot and fills broad production coverage such as Dock units and the Aztec roster. It is not treated as authoritative for exact building availability or upgrade placement; those belong in curated seed data and validation checks.

Icon files live in `assets/icons/`. The generated icon manifest is `data/generated/aom-icons.js`.

Imported unit stats, attacks, unit upgrade chains, and technology effects live in `data/generated/aom-details.js`.

Curated corrections for technology pages whose wiki layouts do not expose structured cost fields live in `data/aom-technology-overrides.js`. These corrections are merged over generated details at runtime. The details importer also retains the previous successful record when a refresh is rate-limited or a source page is temporarily unavailable.

Matchup knowledge lives in `data/aom-strategy.js`. It contains pantheon openings, enemy-pantheon scouting rules, god-specific adjustments, and threat-class responses. `src/strategy-engine.js` combines those rules with the selected gods, age, target unit, current counter ranking, and available upgrades.

## Application Structure

The app remains a single offline shell so switching between Matchup, Units, Buildings, and Build Orders preserves the selected god and filters. Internally, shared responsibilities are split into focused files:

- `src/app-config.js` defines page labels, descriptions, and contextual filters.
- `src/runtime-indexes.js` converts name-based source relationships into stable ID indexes once at startup.
- `src/strategy-engine.js` produces explainable matchup plans from the strategy rules.
- `src/app.js` renders views, coordinates state, and manages local build orders.

Suggested matchup plans can be converted directly into editable local build-order drafts, including the recommendation rationale.

## Import Wiki Structure

Requires internet access:

```powershell
node tools/import-fandom.mjs
```

Useful variants:

```powershell
node tools/import-fandom.mjs --dry-run
node tools/import-fandom.mjs --pages=units,gods --out=data/generated/partial.json
```

The importer fetches page structure from the Fandom MediaWiki API and writes titles, sections, links, and inferred production relationships. It intentionally avoids saving full article text.

After refreshing the wiki library, rebuild the runtime production supplement:

```powershell
npm run build:production
```

## Import Icons

Requires internet access:

```powershell
node tools/import-icons.mjs
```

Useful check:

```powershell
node tools/import-icons.mjs --dry-run
```

The icon importer matches the current seed units and buildings against wiki image metadata, downloads local thumbnails into `assets/icons/`, and writes `data/generated/aom-icons.js`.

## Import Unit And Upgrade Details

Requires internet access:

```powershell
node tools/import-details.mjs
```

Useful check:

```powershell
node tools/import-details.mjs --dry-run
```

The details importer fetches individual unit and technology pages, extracts table data, attack values, unit upgrade chains, and short technology effect text, then writes `data/generated/aom-details.js`.

## Sources

Primary source pages are listed in `docs/SOURCES.md`.
