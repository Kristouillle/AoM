import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const MANIFEST_PATH = "data/generated/aom-ui-icons.js";
const ASSET_ROOT = "assets/icons/ui";

const ICONS = {
  stats: {
    food: icon("Food", "FoodAOM.png", "https://static.wikia.nocookie.net/ageofempires/images/6/6a/FoodAOM.png/revision/latest/scale-to-width-down/16?cb=20240908083037"),
    wood: icon("Wood", "WoodAOM.png", "https://static.wikia.nocookie.net/ageofempires/images/e/e4/WoodAOM.png/revision/latest/scale-to-width-down/16?cb=20240908083106"),
    gold: icon("Gold", "GoldAOM.png", "https://static.wikia.nocookie.net/ageofempires/images/8/86/GoldAOM.png/revision/latest/scale-to-width-down/16?cb=20240908083042"),
    favor: icon("Favor", "FavorAOM.png", "https://static.wikia.nocookie.net/ageofempires/images/4/4f/FavorAOM.png/revision/latest/scale-to-width-down/16?cb=20240908083033"),
    population: icon("Population", "AoMR Population provision icon.png", "https://static.wikia.nocookie.net/ageofempires/images/7/79/AoMR_Population_provision_icon.png/revision/latest/scale-to-width-down/16?cb=20240908073629"),
    "hit-points": icon("Hit points", "AoMR Hit Points icon.png", "https://static.wikia.nocookie.net/ageofempires/images/6/6e/AoMR_Hit_Points_icon.png/revision/latest/scale-to-width-down/16?cb=20240908071940"),
    speed: icon("Speed", "AoMR Speed icon.png", "https://static.wikia.nocookie.net/ageofempires/images/5/51/AoMR_Speed_icon.png/revision/latest/scale-to-width-down/16?cb=20240908074512"),
    "training-time": icon("Training time", "AoMR Time icon.png", "https://static.wikia.nocookie.net/ageofempires/images/1/1a/AoMR_Time_icon.png/revision/latest/scale-to-width-down/16?cb=20240908081902"),
    "research-time": icon("Research time", "AoMR Time icon.png", "https://static.wikia.nocookie.net/ageofempires/images/1/1a/AoMR_Time_icon.png/revision/latest/scale-to-width-down/16?cb=20240908081902"),
    "hack-armor": icon("Hack armor", "HackArmor.png", "https://static.wikia.nocookie.net/ageofempires/images/f/fd/HackArmor.png/revision/latest/scale-to-width-down/16?cb=20240908083046"),
    "pierce-armor": icon("Pierce armor", "PierceArmor.png", "https://static.wikia.nocookie.net/ageofempires/images/6/6b/PierceArmor.png/revision/latest/scale-to-width-down/16?cb=20240908083054"),
    "crush-armor": icon("Crush armor", "CrushArmor.png", "https://static.wikia.nocookie.net/ageofempires/images/a/aa/CrushArmor.png/revision/latest/scale-to-width-down/16?cb=20240908083025"),
    "hack-attack": icon("Hack attack", "HackDamage.png", "https://static.wikia.nocookie.net/ageofempires/images/a/ab/HackDamage.png/revision/latest/scale-to-width-down/16?cb=20240908083051"),
    "pierce-attack": icon("Pierce attack", "PierceDamage.png", "https://static.wikia.nocookie.net/ageofempires/images/0/0a/PierceDamage.png/revision/latest/scale-to-width-down/16?cb=20240908083058"),
    "crush-attack": icon("Crush attack", "CrushDamage.png", "https://static.wikia.nocookie.net/ageofempires/images/b/b7/CrushDamage.png/revision/latest/scale-to-width-down/16?cb=20240908083029"),
    "divine-attack": icon("Divine attack", "AoMR Divine Damage icon.png", "https://static.wikia.nocookie.net/ageofempires/images/b/b8/AoMR_Divine_Damage_icon.png/revision/latest/scale-to-width-down/16?cb=20240908070857"),
    "reload-time": icon("Reload time", "AoMR Rate of Fire icon.png", "https://static.wikia.nocookie.net/ageofempires/images/e/e6/AoMR_Rate_of_Fire_icon.png/revision/latest/scale-to-width-down/16?cb=20240908073653"),
    "attack-range": icon("Attack range", "RangeIcon.png", "https://static.wikia.nocookie.net/ageofempires/images/1/1f/RangeIcon.png/revision/latest/scale-to-width-down/16?cb=20240908083102"),
  },
  ages: {
    "archaic-age": icon("Archaic Age", "AoMR Archaic Age icon.png", "https://static.wikia.nocookie.net/ageofempires/images/7/7d/AoMR_Archaic_Age_icon.png/revision/latest/scale-to-width-down/22?cb=20240908065553"),
    "classical-age": icon("Classical Age", "AoMR Classical Age icon.png", "https://static.wikia.nocookie.net/ageofempires/images/a/a9/AoMR_Classical_Age_icon.png/revision/latest/scale-to-width-down/22?cb=20240908070449"),
    "heroic-age": icon("Heroic Age", "AoMR Heroic Age icon.png", "https://static.wikia.nocookie.net/ageofempires/images/0/05/AoMR_Heroic_Age_icon.png/revision/latest/scale-to-width-down/22?cb=20240908071544"),
    "mythic-age": icon("Mythic Age", "AoMR Mythic Age icon.png", "https://static.wikia.nocookie.net/ageofempires/images/9/96/AoMR_Mythic_Age_icon.png/revision/latest/scale-to-width-down/22?cb=20240908072153"),
    "wonder-age": icon("Wonder Age", "AoMR Wonder Age icon.png", "https://static.wikia.nocookie.net/ageofempires/images/a/aa/AoMR_Wonder_Age_icon.png/revision/latest/scale-to-width-down/22?cb=20240908082938"),
  },
  pantheons: {
    greeks: icon("Greeks", "AoMR Greeks icon.png", "https://static.wikia.nocookie.net/ageofempires/images/8/82/AoMR_Greeks_icon.png/revision/latest/scale-to-width-down/22?cb=20240917154948"),
    egyptians: icon("Egyptians", "AoMR Egyptians icon.png", "https://static.wikia.nocookie.net/ageofempires/images/9/9d/AoMR_Egyptians_icon.png/revision/latest/scale-to-width-down/22?cb=20240917154946"),
    norse: icon("Norse", "AoMR Norse icon.png", "https://static.wikia.nocookie.net/ageofempires/images/4/49/AoMR_Norse_icon.png/revision/latest/scale-to-width-down/22?cb=20240917154947"),
    atlanteans: icon("Atlanteans", "AoMR Atlanteans icon.png", "https://static.wikia.nocookie.net/ageofempires/images/b/bf/AoMR_Atlanteans_icon.png/revision/latest/scale-to-width-down/22?cb=20240917154949"),
    chinese: icon("Chinese", "AoMR Chinese icon.png", "https://static.wikia.nocookie.net/ageofempires/images/b/bc/AoMR_Chinese_icon.png/revision/latest/scale-to-width-down/22?cb=20250227224940"),
    japanese: icon("Japanese", "AoMR Japanese icon.png", "https://static.wikia.nocookie.net/ageofempires/images/1/12/AoMR_Japanese_icon.png/revision/latest/scale-to-width-down/22?cb=20250930182849"),
    aztecs: icon("Aztecs", "AoMR Aztecs icon.png", "https://static.wikia.nocookie.net/ageofempires/images/1/18/AoMR_Aztecs_icon.png/revision/latest/scale-to-width-down/22?cb=20260421192857"),
  },
  unitTypes: {
    archer: icon("Archer", "AoMR type archer icon.png", "https://static.wikia.nocookie.net/ageofempires/images/5/5e/AoMR_type_archer_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082744"),
    building: icon("Building", "AoMR type building icon.png", "https://static.wikia.nocookie.net/ageofempires/images/5/5c/AoMR_type_building_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082750"),
    cavalry: icon("Cavalry", "AoMR type cavalry icon.png", "https://static.wikia.nocookie.net/ageofempires/images/f/fa/AoMR_type_cavalry_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082753"),
    "flying-unit": icon("Flying unit", "AoMR type flying unit icon.png", "https://static.wikia.nocookie.net/ageofempires/images/6/65/AoMR_type_flying_unit_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082801"),
    hero: icon("Hero", "AoMR type hero icon.png", "https://static.wikia.nocookie.net/ageofempires/images/7/7c/AoMR_type_hero_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082804"),
    "human-soldier": icon("Human soldier", "AoMR type human soldier icon.png", "https://static.wikia.nocookie.net/ageofempires/images/b/bb/AoMR_type_human_soldier_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082807"),
    infantry: icon("Infantry", "AoMR type infantry icon.png", "https://static.wikia.nocookie.net/ageofempires/images/d/d0/AoMR_type_infantry_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082810"),
    "myth-unit": icon("Myth unit", "AoMR type myth unit icon.png", "https://static.wikia.nocookie.net/ageofempires/images/9/9d/AoMR_type_myth_unit_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082814"),
    ship: icon("Ship", "AoMR type ship icon.png", "https://static.wikia.nocookie.net/ageofempires/images/a/a8/AoMR_type_ship_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082818"),
    "siege-ship": icon("Siege ship", "AoMR type siege ship icon.png", "https://static.wikia.nocookie.net/ageofempires/images/1/19/AoMR_type_siege_ship_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082822"),
    "siege-weapon": icon("Siege weapon", "AoMR type siege weapon icon.png", "https://static.wikia.nocookie.net/ageofempires/images/0/0d/AoMR_type_siege_weapon_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082826"),
    titan: icon("Titan", "AoMR type titan icon.png", "https://static.wikia.nocookie.net/ageofempires/images/d/da/AoMR_type_titan_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082829"),
    tower: icon("Tower", "AoMR type tower icon.png", "https://static.wikia.nocookie.net/ageofempires/images/8/8b/AoMR_type_tower_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082832"),
    villager: icon("Villager", "AoMR type villager icon.png", "https://static.wikia.nocookie.net/ageofempires/images/1/1d/AoMR_type_villager_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082835"),
    wall: icon("Wall", "AoMR type wall icon.png", "https://static.wikia.nocookie.net/ageofempires/images/8/86/AoMR_type_wall_icon.png/revision/latest/scale-to-width-down/16?cb=20240908082839"),
  },
};

const args = parseArgs(process.argv.slice(2));
const manifest = buildManifest(ICONS);

if (!args.dryRun) {
  await Promise.all(flattenIcons(manifest).map((entry) => downloadImage(entry.imageSource, entry.src.replace(/^\.\//, ""))));
  await mkdir(dirname(MANIFEST_PATH), { recursive: true });
  await writeFile(MANIFEST_PATH, `window.AOM_UI_ICONS = ${JSON.stringify(manifest, null, 2)};\n`, "utf8");
}

process.stdout.write(
  JSON.stringify(
    {
      icons: flattenIcons(manifest).length,
      manifest: args.dryRun ? "(dry run)" : resolve(MANIFEST_PATH),
    },
    null,
    2,
  ) + "\n",
);

function icon(label, sourceName, imageSource) {
  return { label, sourceName, imageSource };
}

function buildManifest(groups) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "https://ageofempires.fandom.com",
  };

  for (const [groupName, entries] of Object.entries(groups)) {
    manifest[groupName] = {};
    for (const [key, entry] of Object.entries(entries)) {
      const filename = `${key}.png`;
      manifest[groupName][key] = {
        src: `./${ASSET_ROOT}/${groupName}/${filename}`,
        label: entry.label,
        source: `https://ageofempires.fandom.com/wiki/File:${encodeURIComponent(entry.sourceName).replaceAll("%20", "_")}`,
        imageSource: entry.imageSource,
      };
    }
  }

  return manifest;
}

function flattenIcons(manifest) {
  return ["stats", "ages", "pantheons", "unitTypes"].flatMap((group) => Object.values(manifest[group] || {}));
}

async function downloadImage(url, filePath) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "AoM Companion UI icon importer/0.1",
      accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
    },
  });

  if (!response.ok) throw new Error(`Image download returned ${response.status} for ${url}`);

  await mkdir(dirname(filePath), { recursive: true });
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(filePath, bytes);
}

function parseArgs(argv) {
  return argv.reduce(
    (parsed, arg) => {
      if (arg === "--dry-run") parsed.dryRun = true;
      else throw new Error(`Unknown argument: ${arg}`);
      return parsed;
    },
    { dryRun: false },
  );
}
