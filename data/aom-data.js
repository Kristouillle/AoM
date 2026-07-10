const WIKI = "https://ageofempires.fandom.com/wiki/";

window.AOM_DATA = {
  metadata: {
    name: "AoM Companion seed library",
    version: "0.1.0",
    game: "Age of Mythology: Retold",
    status: "Curated seed data plus importer-ready schema",
    licenseNote:
      "Facts are normalized from wiki pages and short notes are original. Keep source links on imported records.",
  },
  sources: [
    { key: "pantheons", label: "Pantheon", url: WIKI + "Pantheon" },
    { key: "gods", label: "God", url: WIKI + "God" },
    { key: "units", label: "Unit", url: WIKI + "Unit_(Age_of_Mythology)" },
    { key: "buildings", label: "Building", url: WIKI + "Building_(Age_of_Mythology)" },
    { key: "godPowers", label: "God power", url: WIKI + "God_power" },
    { key: "technologies", label: "Technology", url: WIKI + "Technology_(Age_of_Mythology)" },
  ],
  ages: ["Archaic", "Classical", "Heroic", "Mythic", "Wonder"],
  pantheons: [
    {
      id: "greeks",
      name: "Greeks",
      focus: "Expensive, reliable human soldiers and named heroes.",
      favor: "Villagers worship at the Temple.",
      source: WIKI + "Greeks_(Age_of_Mythology)",
    },
    {
      id: "egyptians",
      name: "Egyptians",
      focus: "Cheap counter infantry, strong Migdol units, Pharaoh empowerment.",
      favor: "Monuments generate favor.",
      source: WIKI + "Egyptians_(Age_of_Mythology)",
    },
    {
      id: "norse",
      name: "Norse",
      focus: "Mobile infantry builders, aggressive favor generation, strong infantry pressure.",
      favor: "Human soldiers gain favor through combat.",
      source: WIKI + "Norse_(Age_of_Mythology)",
    },
    {
      id: "atlanteans",
      name: "Atlanteans",
      focus: "Costly citizens, flexible hero promotion, compact military roster.",
      favor: "Oracles generate favor through line of sight.",
      source: WIKI + "Atlanteans",
    },
    {
      id: "chinese",
      name: "Chinese",
      focus: "Immortal Pillars roster with Favored Land, mechanical units, and heroes.",
      favor: "Favored Land influences favor generation.",
      source: WIKI + "Chinese_(Age_of_Mythology)",
    },
    {
      id: "japanese",
      name: "Japanese",
      focus: "Aggressive human army, Bushido tempo, strong specialist tech choices.",
      favor: "Shrines and pantheon mechanics support favor flow.",
      source: WIKI + "Japanese_(Age_of_Mythology)",
    },
    {
      id: "aztecs",
      name: "Aztecs",
      focus: "New Obsidian Mirror pantheon; seed roster pending import.",
      favor: "Pending detailed import.",
      source: WIKI + "Aztecs_(Age_of_Mythology)",
    },
  ],
  gods: [
    ...major("greeks", ["Zeus", "Poseidon", "Hades", "Demeter"], {
      Zeus: "Infantry and mythic tempo.",
      Poseidon: "Cavalry, mobility, and economy harassment.",
      Hades: "Archers, defenses, and shades.",
      Demeter: "Food control, Amazon Archer access, and plant pressure.",
    }),
    ...minor("greeks", "Classical", ["Athena", "Hermes", "Ares", "Pan"]),
    ...minor("greeks", "Heroic", ["Apollo", "Dionysus", "Aphrodite", "Hestia"]),
    ...minor("greeks", "Mythic", ["Hera", "Hephaestus", "Artemis", "Persephone"]),

    ...major("egyptians", ["Ra", "Isis", "Set"], {
      Ra: "Economy scaling and empowered buildings.",
      Isis: "Technology value and stronger protection against god powers.",
      Set: "Animal pressure and flexible map control.",
    }),
    ...minor("egyptians", "Classical", ["Bast", "Ptah", "Anubis"]),
    ...minor("egyptians", "Heroic", ["Sobek", "Hathor", "Sekhmet", "Nephthys"]),
    ...minor("egyptians", "Mythic", ["Osiris", "Horus", "Thoth"]),

    ...major("norse", ["Thor", "Odin", "Loki", "Freyr"], {
      Thor: "Dwarves, armory strength, and durable fights.",
      Odin: "Ravens, hunting, and sustained army value.",
      Loki: "Hersir and myth-unit snowballing.",
      Freyr: "Defensive economy and new Norse choices.",
    }),
    ...minor("norse", "Classical", ["Freyja", "Forseti", "Heimdall", "Ullr"]),
    ...minor("norse", "Heroic", ["Skadi", "Bragi", "Njord", "Aegir"]),
    ...minor("norse", "Mythic", ["Baldr", "Tyr", "Hel", "Vidar"]),

    ...major("atlanteans", ["Kronos", "Oranos", "Gaia"], {
      Kronos: "Time-shift pressure and disruption.",
      Oranos: "Mobility and map reach.",
      Gaia: "Economy, safer territory, and regeneration.",
    }),
    ...minor("atlanteans", "Classical", ["Prometheus", "Leto", "Oceanus"]),
    ...minor("atlanteans", "Heroic", ["Hyperion", "Rheia", "Theia"]),
    ...minor("atlanteans", "Mythic", ["Helios", "Atlas", "Hekate"]),

    ...major("chinese", ["Fuxi", "Nüwa", "Shennong"], {
      Fuxi: "Heroes and military tempo.",
      Nüwa: "Creation tools and Kuafu hero access.",
      Shennong: "Economy, sustain, and myth-unit generation.",
    }),
    ...minor("chinese", "Classical", ["Xuannü", "Chiyou", "Houtu"]),
    ...minor("chinese", "Heroic", ["Goumang", "Nüba", "Rushou"]),
    ...minor("chinese", "Mythic", ["Gonggong", "Huangdi", "Zhurong"]),

    ...major("japanese", ["Amaterasu", "Tsukuyomi", "Susanoo"], {
      Amaterasu: "Economy and Samurai-oriented scaling.",
      Tsukuyomi: {
        focus: "Technology, Shinobi, cavalry, and Bushido tempo.",
        minorGods: ["Ame-no-Uzume", "Inari Ōkami", "Hachiman", "Fūjin", "Watatsumi", "Ōkuninushi"],
      },
      Susanoo: "Storm-themed aggression and combat pressure.",
    }),
    ...minor("japanese", "Classical", ["Ame-no-Uzume", "Minakatatomi", "Inari Ōkami"]),
    ...minor("japanese", "Heroic", ["Hachiman", "Raijin", "Fūjin"]),
    ...minor("japanese", "Mythic", ["Ōkuninushi", "Takemikazuchi", "Watatsumi"]),

    ...major("aztecs", ["Huitzilopochtli", "Tezcatlipoca", "Quetzalcoatl"], {
      Huitzilopochtli: "Seed details pending import.",
      Tezcatlipoca: "Seed details pending import.",
      Quetzalcoatl: "Seed details pending import.",
    }),
    ...minor("aztecs", "Classical", ["Patecatl", "Malinalxochitl", "Huehuecóyotl"]),
    ...minor("aztecs", "Heroic", ["Coatlicue", "Coyolxauhqui", "Itzpapalotl"]),
    ...minor("aztecs", "Mythic", ["Tlaloc", "Mictlantecuhtli", "Xolotl"]),
  ],
  buildings: [
    b("town-center", "Town Center", "all", "Archaic", "economy", ["Villagers and core economy units"], []),
    b("house", "House", "all", "Archaic", "population", [], []),
    b("dock", "Dock", "all", "Archaic", "naval", ["Fishing Ship", "Transport Ship", "warships"], ["Naval line upgrades"]),
    b("temple", "Temple", "all", "Archaic", "myth", ["Heroes or myth units"], ["Myth technologies"], {
      notes: [
        { pantheons: ["japanese"], text: "Japanese Temples can be built by Commoners and Mikos." },
        { pantheons: ["japanese"], text: "Japanese Temples unlock Sacred Custodians at the Shrine." },
        { gods: ["tsukuyomi"], text: "Tsukuyomi: a free Kitsune appears at the oldest standing Temple with each Age-up except Wonder Age." },
        { gods: ["tsukuyomi"], text: "Tsukuyomi: researching technologies grants Bushido XP based on their resource cost." },
      ],
    }),
    b("armory", "Armory", "all", "Classical", "technology", [], ["Copper Weapons", "Copper Armor", "Copper Shields", "Ballistics"]),
    b("market", "Market", "all", "Heroic", "economy", ["Caravan"], ["Tax Collectors", "Ambassadors", "Coinage"]),
    b("farm", "Farm", "all", "Archaic", "economy", [], ["Plow", "Irrigation", "Flood Control"]),
    b("sentry-tower", "Sentry Tower", "all", "Classical", "defense", [], ["Watch Tower", "Guard Tower", "Ballista Tower"]),
    b("walls", "Walls", "all", "Archaic", "defense", [], ["Stone Wall", "Fortified Wall"]),
    b("wonder", "Wonder", "all", "Mythic", "victory", [], []),
    b("titan-gate", "Titan Gate", "all", "Mythic", "myth", ["Titan"], []),

    b("granary", "Granary", ["greeks", "egyptians"], "Archaic", "economy", [], ["Husbandry", "Plow"]),
    b("storehouse", "Storehouse", ["greeks"], "Archaic", "economy", [], ["Hand Axe", "Pickaxe"]),
    b("military-academy", "Military Academy", ["greeks"], "Classical", "production", ["Hoplite", "Hypaspist"], ["Medium Infantry", "Heavy Infantry", "Champion Infantry"]),
    b("archery-range", "Archery Range", ["greeks"], "Classical", "production", ["Toxotes", "Peltast"], ["Medium Archers", "Heavy Archers", "Champion Archers"]),
    b("stable", "Stable", ["greeks"], "Classical", "production", ["Hippeus", "Prodromos"], ["Medium Cavalry", "Heavy Cavalry", "Champion Cavalry"]),
    b("fortress", "Fortress", ["greeks"], "Heroic", "production", ["Petrobolos", "Helepolis", "major-god unique units"], ["Fortified defenses"]),

    b("lumber-camp", "Lumber Camp", ["egyptians"], "Archaic", "economy", [], ["Hand Axe", "Bow Saw", "Carpenters"]),
    b("mining-camp", "Mining Camp", ["egyptians", "japanese"], "Archaic", "economy", [], ["Pickaxe", "Shaft Mine", "Quarry"], {
      source: WIKI + "Mining_Camp_(Age_of_Mythology)",
    }),
    b("monument", "Monument", ["egyptians"], "Archaic", "favor", [], []),
    b("obelisk", "Obelisk", ["egyptians"], "Archaic", "vision", [], ["Crenellations"]),
    b("barracks", "Barracks", ["egyptians"], "Classical", "production", ["Spearman", "Axeman", "Slinger"], ["Medium Infantry", "Heavy Infantry", "Champion Infantry"]),
    b("migdol-stronghold", "Migdol Stronghold", ["egyptians"], "Heroic", "production", ["Chariot Archer", "Camel Rider", "War Elephant"], ["Migdol line upgrades"]),
    b("siege-works", "Siege Works", ["egyptians"], "Heroic", "production", ["Siege Tower", "Catapult"], ["Engineers"]),

    b("longhouse", "Longhouse", ["norse"], "Classical", "production", ["Berserk", "Hirdman", "Throwing Axeman"], ["Infantry line upgrades"]),
    b("great-hall", "Great Hall", ["norse"], "Classical", "production", ["Hersir", "Godi", "Raiding Cavalry", "Jarl"], ["Cavalry line upgrades"]),
    b("hill-fort", "Hill Fort", ["norse"], "Heroic", "production", ["Huskarl", "Portable Ram", "Ballista"], ["Fortified line upgrades"]),

    b("economic-guild", "Economic Guild", ["atlanteans"], "Archaic", "economy", [], ["Economic upgrades"]),
    b("military-barracks", "Military Barracks", ["atlanteans"], "Classical", "production", ["Murmillo", "Contarius", "Arcus"], ["Line upgrades"]),
    b("counter-barracks", "Counter Barracks", ["atlanteans"], "Classical", "production", ["Katapeltes", "Turma", "Cheiroballista"], ["Counter line upgrades"]),
    b("palace", "Palace", ["atlanteans"], "Heroic", "production", ["Destroyer", "Fire Siphon", "Fanatic"], ["Palace line upgrades"]),
    b("sky-passage", "Sky Passage", ["atlanteans"], "Heroic", "mobility", [], []),

    b("silo", "Silo", ["chinese"], "Archaic", "economy", [], ["Food and resource upgrades"]),
    b("military-camp", "Military Camp", ["chinese"], "Classical", "production", ["Dao Swordsman", "Ge Halberdier", "Wuzu Javelineer"], ["Infantry line upgrades"]),
    b("machine-workshop", "Machine Workshop", ["chinese"], "Classical", "production", ["Fire Archer", "Chu Ko Nu", "Siege Crossbow", "Axe Cart"], ["Mechanical line upgrades"]),
    b("imperial-academy", "Imperial Academy", ["chinese"], "Classical", "production", ["Pioneer", "Sage", "major-god heroes"], ["Hero technologies"]),
    b("baolei", "Baolei", ["chinese"], "Heroic", "production", ["White Horse Cavalry", "Tiger Cavalry"], ["Cavalry line upgrades"]),

    b("shrine", "Shrine", ["japanese"], "Archaic", "favor", [], ["Shrine technologies"]),
    b("watermill", "Watermill", ["japanese"], "Archaic", "economy", [], ["Survival Equipment", "Husbandry", "Plow", "Irrigation", "Flood Control", "Hand Axe", "Bow Saw", "Carpenters"]),
    b("guardhouse", "Guardhouse", ["japanese"], "Classical", "production", ["Yari Spearman", "Yumi Archer", "Bushi"], [
      "Levy Guardhouse Soldiers",
      "Conscript Guardhouse Soldiers",
      "Medium Guardhouse Soldiers",
      "Heavy Guardhouse Soldiers",
      "Champion Guardhouse Soldiers",
    ]),
    b("japanese-stable", "Stable", ["japanese"], "Classical", "production", ["Naginata Rider", "Yumi Horse Archer", "Daimyo"], [
      "Levy Stable Soldiers",
      "Conscript Stable Soldiers",
      "Medium Stable Soldiers",
      "Heavy Stable Soldiers",
      "Champion Stable Soldiers",
    ]),
    b("dojo", "Dojo", ["japanese"], "Heroic", "production", ["Samurai", "Shinobi", "Onna-musha"], [
      "Levy Dojo Soldiers",
      "Conscript Dojo Soldiers",
      "Medium Dojo Soldiers",
      "Heavy Dojo Soldiers",
      "Champion Dojo Soldiers",
      "Elite Dojo Soldiers",
    ]),
    b("castle", "Castle", ["japanese"], "Heroic", "production", ["Oyumi", "Onmyōji"], [
      "Levy Castle Soldiers",
      "Conscript Castle Soldiers",
      "Medium Castle Soldiers",
      "Heavy Castle Soldiers",
      "Champion Castle Soldiers",
    ]),
  ],
  units: [
    u("villager", "Villager", ["greeks"], "Town Center", "Archaic", ["human", "economic", "worker"], [], "Core economy unit."),
    u("laborer", "Laborer", ["egyptians"], "Town Center", "Archaic", ["human", "economic", "worker"], [], "Egyptian worker."),
    u("gatherer", "Gatherer", ["norse"], "Town Center", "Archaic", ["human", "economic", "worker"], [], "Norse worker."),
    u("dwarf", "Dwarf", ["norse"], "Town Center", "Archaic", ["human", "economic", "worker"], [], "Gold-focused Norse worker."),
    u("citizen", "Citizen", ["atlanteans"], "Town Center", "Archaic", ["human", "economic", "worker"], [], "Atlantean worker."),
    u("peasant", "Peasant", ["chinese"], "Town Center", "Archaic", ["human", "economic", "worker"], [], "Chinese worker."),
    u("commoner", "Commoner", ["japanese"], "Town Center", "Archaic", ["human", "economic", "worker"], [], "Japanese worker."),

    u("greek-heroes-zeus", "Zeus Heroes", ["greeks"], "Town Center", "Archaic", ["hero", "human", "melee"], ["myth"], "Jason, Heracles, Odysseus, and Bellerophon.", { majorGods: ["zeus"] }),
    u("greek-heroes-poseidon", "Poseidon Heroes", ["greeks"], "Town Center", "Archaic", ["hero", "human", "melee"], ["myth"], "Theseus, Atalanta, Hippolyta, and Polyphemus.", { majorGods: ["poseidon"] }),
    u("greek-heroes-hades", "Hades Heroes", ["greeks"], "Town Center", "Archaic", ["hero", "human", "melee"], ["myth"], "Ajax, Achilles, Chiron, and Perseus.", { majorGods: ["hades"] }),
    u("greek-heroes-demeter", "Demeter Heroes", ["greeks"], "Town Center", "Archaic", ["hero", "human", "melee"], ["myth"], "Orpheus, Iolaus, Icarus, and King Midas.", { majorGods: ["demeter"] }),
    u("priest", "Priest", ["egyptians"], "Temple", "Archaic", ["hero", "human", "ranged", "support"], ["myth"], "Ranged Egyptian anti-myth support."),
    u("pharaoh", "Pharaoh", ["egyptians"], "Town Center", "Archaic", ["hero", "human", "support"], ["myth"], "Empowers buildings and fights myth units."),
    u("hersir", "Hersir", ["norse"], "Temple", "Classical", ["hero", "human", "infantry"], ["myth"], "Norse hero infantry."),
    u("godi", "Godi", ["norse"], "Great Hall", "Classical", ["hero", "human", "ranged"], ["myth"], "Ranged Norse hero."),
    u("atlantean-hero-promotion", "Atlantean Hero Promotion", ["atlanteans"], "Any human unit", "Archaic", ["hero", "human"], ["myth"], "Citizens and human soldiers can be converted into heroes."),
    u("pioneer", "Pioneer", ["chinese"], "Temple", "Archaic", ["hero", "human", "support"], ["myth"], "Chinese scout and anti-myth support."),
    u("sage", "Sage", ["chinese"], "Imperial Academy", "Classical", ["hero", "human", "support"], ["myth"], "Chinese hero support."),
    u("miko", "Miko", ["japanese"], "Town Center", "Archaic", ["hero", "human", "support"], ["myth"], "Japanese support unit with anti-myth value."),
    u("onmyoji", "Onmyōji", ["japanese"], "Castle", "Heroic", ["hero", "human", "ranged"], ["myth"], "Japanese ranged hero."),

    u("hoplite", "Hoplite", ["greeks"], "Military Academy", "Classical", ["human", "infantry", "spearman", "melee"], ["cavalry", "raider"], "Durable spear infantry."),
    u("hypaspist", "Hypaspist", ["greeks"], "Military Academy", "Classical", ["human", "infantry", "anti-infantry", "melee"], ["infantry", "spearman"], "Greek infantry killer."),
    u("toxotes", "Toxotes", ["greeks"], "Archery Range", "Classical", ["human", "archer", "ranged"], ["infantry", "spearman", "slow-melee"], "Main Greek archer."),
    u("peltast", "Peltast", ["greeks"], "Archery Range", "Classical", ["human", "skirmisher", "ranged", "anti-archer"], ["archer", "ranged"], "Greek anti-archer ranged unit."),
    u("hippeus", "Hippeus", ["greeks"], "Stable", "Classical", ["human", "cavalry", "melee", "raider"], ["archer", "siege", "worker"], "Greek cavalry for raids and ranged picks."),
    u("prodromos", "Prodromos", ["greeks"], "Stable", "Heroic", ["human", "cavalry", "anti-cavalry"], ["cavalry", "raider"], "Greek anti-cavalry horseman."),
    u("petrobolos", "Petrobolos", ["greeks"], "Fortress", "Heroic", ["siege", "ranged"], ["building", "wall", "tower"], "Greek siege weapon."),
    u("helepolis", "Helepolis", ["greeks"], "Fortress", "Mythic", ["siege", "ranged"], ["building", "mass"], "Heavy Greek siege."),
    u("myrmidon", "Myrmidon", ["greeks"], "Fortress", "Heroic", ["human", "infantry", "unique"], ["human", "infantry", "cavalry", "archer"], "Zeus unique human counter unit.", { majorGods: ["zeus"] }),
    u("hetairos", "Hetairos", ["greeks"], "Fortress", "Heroic", ["human", "cavalry", "unique"], ["archer", "siege", "worker"], "Poseidon unique heavy cavalry.", { majorGods: ["poseidon"] }),
    u("gastraphetoros", "Gastraphetoros", ["greeks"], "Fortress", "Heroic", ["human", "archer", "siege", "unique"], ["building", "infantry"], "Hades unique archer-siege hybrid.", { majorGods: ["hades"] }),
    u("amazon-archer", "Amazon Archer", ["greeks"], "Fortress", "Heroic", ["human", "archer", "unique"], ["infantry", "slow-melee"], "Demeter unique archer.", { majorGods: ["demeter"] }),

    u("spearman", "Spearman", ["egyptians"], "Barracks", "Classical", ["human", "infantry", "spearman"], ["cavalry", "raider"], "Cheap Egyptian anti-cavalry infantry."),
    u("axeman", "Axeman", ["egyptians"], "Barracks", "Classical", ["human", "infantry", "anti-infantry"], ["infantry", "spearman"], "Egyptian infantry counter."),
    u("slinger", "Slinger", ["egyptians"], "Barracks", "Classical", ["human", "ranged", "anti-archer"], ["archer", "ranged"], "Egyptian archer counter."),
    u("chariot-archer", "Chariot Archer", ["egyptians"], "Migdol Stronghold", "Heroic", ["human", "cavalry", "archer", "ranged"], ["infantry", "slow-melee"], "Mobile ranged Migdol unit."),
    u("camel-rider", "Camel Rider", ["egyptians"], "Migdol Stronghold", "Heroic", ["human", "cavalry", "anti-cavalry"], ["cavalry", "raider"], "Egyptian anti-cavalry cavalry."),
    u("war-elephant", "War Elephant", ["egyptians"], "Migdol Stronghold", "Heroic", ["human", "cavalry", "heavy"], ["building", "infantry", "mass"], "Slow, population-heavy power unit."),
    u("siege-tower", "Siege Tower", ["egyptians"], "Siege Works", "Heroic", ["siege"], ["building", "wall", "tower"], "Egyptian siege unit."),
    u("catapult", "Catapult", ["egyptians"], "Siege Works", "Mythic", ["siege", "ranged"], ["building", "wall", "mass"], "Longer-ranged Egyptian siege."),

    u("berserk", "Berserk", ["norse"], "Longhouse", "Classical", ["human", "infantry", "melee"], ["soft-target", "worker"], "Basic Norse infantry and builder."),
    u("hirdman", "Hirdman", ["norse"], "Longhouse", "Classical", ["human", "infantry", "spearman"], ["cavalry", "raider"], "Norse anti-cavalry infantry."),
    u("throwing-axeman", "Throwing Axeman", ["norse"], "Longhouse", "Classical", ["human", "infantry", "ranged", "anti-infantry"], ["infantry", "spearman"], "Ranged infantry counter."),
    u("raiding-cavalry", "Raiding Cavalry", ["norse"], "Great Hall", "Classical", ["human", "cavalry", "raider"], ["archer", "siege", "worker"], "Fast Norse cavalry."),
    u("jarl", "Jarl", ["norse"], "Great Hall", "Heroic", ["human", "cavalry", "heavy"], ["archer", "siege", "worker"], "Heavy Norse cavalry."),
    u("huskarl", "Huskarl", ["norse"], "Hill Fort", "Heroic", ["human", "infantry", "anti-archer"], ["archer", "ranged"], "Norse anti-archer infantry."),
    u("portable-ram", "Portable Ram", ["norse"], "Hill Fort", "Heroic", ["siege", "melee"], ["building", "wall", "tower"], "Norse melee siege."),
    u("ballista", "Ballista", ["norse"], "Hill Fort", "Heroic", ["siege", "ranged"], ["building", "mass"], "Norse ranged siege."),

    u("murmillo", "Murmillo", ["atlanteans"], "Military Barracks", "Classical", ["human", "infantry", "melee"], ["soft-target", "archer"], "Atlantean mainline infantry."),
    u("contarius", "Contarius", ["atlanteans"], "Military Barracks", "Heroic", ["human", "cavalry", "melee"], ["archer", "siege", "worker"], "Atlantean heavy cavalry."),
    u("arcus", "Arcus", ["atlanteans"], "Military Barracks", "Classical", ["human", "archer", "ranged"], ["infantry", "slow-melee"], "Atlantean archer."),
    u("katapeltes", "Katapeltes", ["atlanteans"], "Counter Barracks", "Classical", ["human", "infantry", "anti-cavalry"], ["cavalry", "raider"], "Atlantean anti-cavalry infantry."),
    u("turma", "Turma", ["atlanteans"], "Counter Barracks", "Classical", ["human", "cavalry", "ranged", "anti-archer"], ["archer", "ranged"], "Atlantean ranged cavalry counter."),
    u("cheiroballista", "Cheiroballista", ["atlanteans"], "Counter Barracks", "Heroic", ["siege", "ranged", "anti-infantry"], ["infantry", "mass"], "Anti-infantry siege."),
    u("destroyer", "Destroyer", ["atlanteans"], "Palace", "Heroic", ["human", "infantry", "siege"], ["building", "wall"], "Atlantean building crusher."),
    u("fire-siphon", "Fire Siphon", ["atlanteans"], "Palace", "Mythic", ["siege", "ranged"], ["building", "mass"], "Atlantean heavy siege."),
    u("fanatic", "Fanatic", ["atlanteans"], "Palace", "Mythic", ["human", "infantry", "anti-infantry"], ["infantry", "spearman"], "Atlantean elite infantry counter."),

    u("dao-swordsman", "Dao Swordsman", ["chinese"], "Military Camp", "Classical", ["human", "infantry", "melee"], ["soft-target", "archer"], "Chinese melee infantry."),
    u("ge-halberdier", "Ge Halberdier", ["chinese"], "Military Camp", "Classical", ["human", "infantry", "spearman"], ["cavalry", "raider"], "Chinese anti-cavalry infantry."),
    u("wuzu-javelineer", "Wuzu Javelineer", ["chinese"], "Military Camp", "Classical", ["human", "ranged", "anti-archer"], ["archer", "ranged"], "Chinese ranged counter unit."),
    u("fire-archer", "Fire Archer", ["chinese"], "Machine Workshop", "Classical", ["human", "archer", "ranged"], ["infantry", "slow-melee"], "Chinese ranged unit."),
    u("chu-ko-nu", "Chu Ko Nu", ["chinese"], "Machine Workshop", "Heroic", ["human", "archer", "ranged"], ["infantry", "mass"], "Rapid-fire Chinese archer."),
    u("siege-crossbow", "Siege Crossbow", ["chinese"], "Machine Workshop", "Heroic", ["siege", "ranged"], ["building", "mass"], "Chinese siege crossbow."),
    u("axe-cart", "Axe Cart", ["chinese"], "Machine Workshop", "Heroic", ["human", "ranged", "anti-infantry"], ["infantry", "spearman"], "Chinese anti-infantry machine unit."),
    u("white-horse-cavalry", "White Horse Cavalry", ["chinese"], "Baolei", "Heroic", ["human", "cavalry", "raider"], ["archer", "siege", "worker"], "Chinese cavalry option."),
    u("tiger-cavalry", "Tiger Cavalry", ["chinese"], "Baolei", "Heroic", ["human", "cavalry", "heavy"], ["archer", "siege", "worker"], "Chinese heavy cavalry."),

    u("yari-spearman", "Yari Spearman", ["japanese"], "Guardhouse", "Classical", ["human", "infantry", "spearman"], ["cavalry", "raider"], "Japanese anti-cavalry infantry."),
    u("yumi-archer", "Yumi Archer", ["japanese"], "Guardhouse", "Classical", ["human", "archer", "ranged"], ["infantry", "slow-melee"], "Japanese archer."),
    u("bushi", "Bushi", ["japanese"], "Guardhouse", "Classical", ["human", "infantry", "anti-infantry"], ["infantry", "spearman"], "Japanese sword infantry counter."),
    u("naginata-rider", "Naginata Rider", ["japanese"], "Stable", "Classical", ["human", "cavalry", "raider"], ["archer", "siege", "worker"], "Japanese cavalry."),
    u("yumi-horse-archer", "Yumi Horse Archer", ["japanese"], "Stable", "Heroic", ["human", "cavalry", "archer", "ranged"], ["infantry", "slow-melee"], "Mobile Japanese archer cavalry."),
    u("daimyo", "Daimyo", ["japanese"], "Stable", "Heroic", ["hero", "human", "cavalry", "support"], ["myth", "support"], "Japanese mounted hero support."),
    u("samurai", "Samurai", ["japanese"], "Dojo", "Heroic", ["human", "infantry", "heavy"], ["infantry", "hero"], "Elite Japanese infantry."),
    u("shinobi", "Shinobi", ["japanese"], "Dojo", "Heroic", ["human", "infantry", "raider"], ["siege", "archer", "worker"], "Stealthy raid and pick unit."),
    u("onna-musha", "Onna-musha", ["japanese"], "Dojo", "Heroic", ["human", "archer", "ranged"], ["infantry", "slow-melee"], "Elite Japanese ranged unit."),
    u("oyumi", "Oyumi", ["japanese"], "Castle", "Heroic", ["siege", "ranged"], ["building", "mass"], "Japanese siege unit."),

    ...mythUnits("greeks", "Temple", [
      ["cyclops", "Cyclops", "Ares"],
      ["minotaur", "Minotaur", "Athena"],
      ["centaur", "Centaur", "Hermes"],
      ["lykaon", "Lykaon", "Pan"],
      ["manticore", "Manticore", "Apollo"],
      ["nemean-lion", "Nemean Lion", "Aphrodite"],
      ["hydra", "Hydra", "Dionysus"],
      ["hamadryad", "Hamadryad", "Hestia"],
      ["chimera", "Chimera", "Artemis"],
      ["colossus", "Colossus", "Hephaestus"],
      ["medusa", "Medusa", "Hera"],
      ["siren", "Siren", "Persephone"],
    ]),
    ...mythUnits("egyptians", "Temple", [
      ["anubite", "Anubite", "Anubis"],
      ["wadjet", "Wadjet", "Ptah"],
      ["sphinx", "Sphinx", "Bast"],
      ["petsuchos", "Petsuchos", "Sobek"],
      ["scarab", "Scarab", "Sekhmet"],
      ["scorpion-man", "Scorpion Man", "Nephthys"],
      ["avenger", "Avenger", "Horus"],
      ["mummy", "Mummy", "Osiris"],
      ["phoenix", "Phoenix", "Thoth"],
    ]),
    ...mythUnits("norse", "Temple", [
      ["valkyrie", "Valkyrie", "Freyja"],
      ["einheri", "Einheri", "Heimdall"],
      ["troll", "Troll", "Forseti"],
      ["draugr", "Draugr", "Ullr"],
      ["frost-giant", "Frost Giant", "Skadi or Hel"],
      ["mountain-giant", "Mountain Giant", "Njord or Hel"],
      ["battle-boar", "Battle Boar", "Bragi"],
      ["rock-giant", "Rock Giant", "Aegir"],
      ["fenris-wolf-brood", "Fenris Wolf Brood", "Tyr"],
      ["fire-giant", "Fire Giant", "Baldr or Hel"],
      ["fafnir", "Fafnir", "Vidar"],
    ]),
    ...mythUnits("atlanteans", "Temple", [
      ["promethean", "Promethean", "Prometheus"],
      ["automaton", "Automaton", "Leto"],
      ["caladria", "Caladria", "Oceanus"],
      ["behemoth", "Behemoth", "Rheia"],
      ["satyr", "Satyr", "Hyperion"],
      ["stymphalian-bird", "Stymphalian Bird", "Theia"],
      ["centimanus", "Centimanus", "Helios"],
      ["argus", "Argus", "Atlas"],
      ["lampades", "Lampades", "Hekate"],
    ]),
    ...mythUnits("chinese", "Temple", [
      ["qilin", "Qilin", "Xuannü"],
      ["yazi", "Yazi", "Chiyou"],
      ["qiongqi", "Qiongqi", "Houtu"],
      ["taowu", "Taowu", "Goumang"],
      ["taotie", "Taotie", "Nüba"],
      ["baihu", "Baihu", "Rushou"],
      ["qinglong", "Qinglong", "Gonggong"],
      ["hundun", "Hundun", "Huangdi"],
      ["zhuque", "Zhuque", "Zhurong"],
    ]),
    ...mythUnits("japanese", "Temple", [
      ["kitsune", "Kitsune", "all gods", { age: "Archaic", allGods: true, note: "Japanese Temple myth unit available to all Japanese gods; Tsukuyomi also receives free Kitsune on Age-up." }],
      ["kamaitachi", "Kamaitachi", "Ame-no-Uzume", { age: "Classical" }],
      ["wanyudo", "Wanyūdō", "Minakatatomi", { age: "Classical" }],
      ["jorogumo", "Jorogumo", "Inari Ōkami", { age: "Classical" }],
      ["tengu", "Tengu", "Hachiman", { age: "Heroic" }],
      ["raiju", "Raiju", "Raijin", { age: "Heroic" }],
      ["oni", "Oni", "Fūjin", { age: "Heroic" }],
      ["shinigami", "Shinigami", "Watatsumi", { age: "Mythic", note: "Watatsumi myth unit; with Eternal Haunting it respawns at the Temple in stronger forms." }],
      ["onmoraki", "Onmoraki", "Ōkuninushi", { age: "Mythic" }],
      ["asura", "Asura", "Takemikazuchi", { age: "Mythic" }],
    ]),
  ],
  technologies: [
    t("hand-axe", "Hand Axe", "Classical", "Storehouse / Lumber Camp", "wood", "+wood gather rate and carry capacity."),
    t("bow-saw", "Bow Saw", "Heroic", "Storehouse / Lumber Camp", "wood", "+wood gather rate and carry capacity."),
    t("carpenters", "Carpenters", "Mythic", "Storehouse / Lumber Camp", "wood", "+wood gather rate and carry capacity."),
    t("pickaxe", "Pickaxe", "Classical", "Storehouse / Mining Camp", "gold", "+gold gather rate and carry capacity."),
    t("shaft-mine", "Shaft Mine", "Heroic", "Storehouse / Mining Camp", "gold", "+gold gather rate and carry capacity."),
    t("quarry", "Quarry", "Mythic", "Storehouse / Mining Camp", "gold", "+gold gather rate and carry capacity."),
    t("husbandry", "Husbandry", "Classical", "Granary", "food", "Improves herdable animal food flow."),
    t("plow", "Plow", "Classical", "Granary / Farm", "food", "Improves farm economy."),
    t("irrigation", "Irrigation", "Heroic", "Granary / Farm", "food", "Improves farm economy."),
    t("flood-control", "Flood Control", "Mythic", "Granary / Farm", "food", "Improves farm economy."),
    t("copper-weapons", "Copper Weapons", "Classical", "Armory", "military", "+attack for human soldiers, heroes, buildings, and ships."),
    t("bronze-weapons", "Bronze Weapons", "Heroic", "Armory", "military", "+attack for human soldiers, heroes, buildings, and ships."),
    t("iron-weapons", "Iron Weapons", "Mythic", "Armory", "military", "+attack for human soldiers, heroes, buildings, and ships."),
    t("copper-armor", "Copper Armor", "Classical", "Armory", "military", "Reduces hack vulnerability."),
    t("bronze-armor", "Bronze Armor", "Heroic", "Armory", "military", "Reduces hack vulnerability."),
    t("iron-armor", "Iron Armor", "Mythic", "Armory", "military", "Reduces hack vulnerability."),
    t("copper-shields", "Copper Shields", "Classical", "Armory", "military", "Reduces pierce vulnerability."),
    t("bronze-shields", "Bronze Shields", "Heroic", "Armory", "military", "Reduces pierce vulnerability."),
    t("iron-shields", "Iron Shields", "Mythic", "Armory", "military", "Reduces pierce vulnerability."),
    t("ballistics", "Ballistics", "Classical", "Armory", "military", "Improves accuracy against moving targets."),
    t("burning-pitch", "Burning Pitch", "Mythic", "Armory", "siege", "Improves building and ship firepower against ships."),
    t("engineers", "Engineers", "Heroic", "Siege Works / Fortress", "siege", "Improves siege performance."),
    t("tax-collectors", "Tax Collectors", "Heroic", "Market", "economy", "Reduces tribute and market penalties."),
    t("ambassadors", "Ambassadors", "Mythic", "Market", "economy", "Removes tribute penalty and improves trade costs."),
    t("coinage", "Coinage", "Mythic", "Market", "economy", "Improves trade unit movement."),
    t("sacred-custodians", "Sacred Custodians", "Archaic", "Shrine", "religious", "Miko +50% heal rate and Sacred Hands ability.", { pantheons: ["japanese"] }),
    t("sakura-gardens", "Sakura Gardens", "Mythic", "Shrine", "economy", "Shrines spawn Cherry Trees.", { pantheons: ["japanese"] }),
    ...templeTechs("japanese", [
      ["tenshu", "Tenshu", "Archaic", "Tsukuyomi", "Sentry Tower / Castle", "Towers and Castles gain attack and line of sight."],
      ["crushing-waves", "Crushing Waves", "Archaic", "Susanoo", "Temple", "Myth units gain speed and divine damage."],
      ["wind-sickles", "Wind Sickles", "Classical", "Ame-no-Uzume", "Temple", "Upgrades Kamaitachi to Razorwind Kamaitachi."],
      ["condemned-soul", "Condemned Soul", "Classical", "Minakatatomi", "Temple", "Upgrades Wanyudo to Infernal Wanyudo."],
      ["deadly-snare", "Deadly Snare", "Classical", "Inari Ōkami", "Temple", "Upgrades Jorogumo to Jorogumo Venom-Spinner."],
      ["ivory-netsuke", "Ivory Netsuke", "Classical", "Inari Ōkami", "Temple", "Myth units generate gold when damaging units."],
      ["ascetic-practices", "Ascetic Practices", "Heroic", "Hachiman", "Temple", "Upgrades Tengu to Tengu Master."],
      ["oni-mask", "Oni Mask", "Heroic", "Fūjin", "Temple", "Improves Oni."],
      ["deadly-rage", "Deadly Rage", "Heroic", "Fūjin", "Temple", "Upgrades Oni to Oni Warlord."],
      ["thunderous-presence", "Thunderous Presence", "Heroic", "Raijin", "Temple", "Improves Raiju attack and speed."],
      ["den-den-drums", "Den Den Drums", "Heroic", "Raijin", "Temple", "Improves myth-unit or god-specific combat value."],
      ["eternal-haunting", "Eternal Haunting", "Mythic", "Watatsumi", "Temple", "Improves Shinigami respawn behavior."],
      ["restless-army", "Restless Army", "Mythic", "Ōkuninushi", "Temple", "Improves Onmoraki or army recursion."],
      ["burning-malevolence", "Burning Malevolence", "Mythic", "Takemikazuchi", "Temple", "Improves Asura."],
    ]),
  ],
  counterProfiles: [
    { id: "cavalry", name: "Cavalry", tags: ["cavalry", "raider"] },
    { id: "infantry", name: "Infantry", tags: ["infantry", "human"] },
    { id: "archer", name: "Archer", tags: ["archer", "ranged"] },
    { id: "myth", name: "Myth unit", tags: ["myth"] },
    { id: "hero", name: "Hero", tags: ["hero"] },
    { id: "siege", name: "Siege", tags: ["siege"] },
    { id: "building", name: "Building", tags: ["building", "wall", "tower"] },
    { id: "ship", name: "Ship", tags: ["ship", "naval"] },
  ],
};

function slug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function major(pantheon, names, focusByName) {
  return names.map((name) => ({
    id: slug(name),
    name,
    pantheon,
    tier: "major",
    age: "Archaic",
    focus: typeof focusByName[name] === "object" ? focusByName[name].focus : focusByName[name] || "Major god.",
    minorGods: typeof focusByName[name] === "object" ? focusByName[name].minorGods || [] : [],
    source: WIKI + encodeURIComponent(name).replace(/%20/g, "_"),
  }));
}

function minor(pantheon, age, names) {
  return names.map((name) => ({
    id: slug(name),
    name,
    pantheon,
    tier: "minor",
    age,
    focus: `${age} god option.`,
    source: WIKI + encodeURIComponent(name).replace(/%20/g, "_"),
  }));
}

function normalizePantheons(value) {
  if (value === "all") return ["all"];
  return Array.isArray(value) ? value : [value];
}

function b(id, name, pantheons, age, type, produces, upgrades, options = {}) {
  return {
    id,
    name,
    pantheons: normalizePantheons(pantheons),
    age,
    type,
    produces,
    upgrades,
    notes: options.notes || [],
    source: options.source || WIKI + encodeURIComponent(name).replace(/%20/g, "_"),
  };
}

function u(id, name, pantheons, building, age, classes, counters, note, availability = {}) {
  return {
    id,
    name,
    pantheons,
    building,
    age,
    classes,
    counters,
    note,
    availability,
    source: WIKI + encodeURIComponent(name).replace(/%20/g, "_"),
  };
}

function mythUnits(pantheon, building, rows) {
  return rows.map(([id, name, god, options = {}]) => {
    const availability = options.allGods ? {} : { minorGod: god, conditional: true };
    return u(
      id,
      name,
      [pantheon],
      building,
      options.age || "Varies",
      ["myth"],
      ["human", "building", "mass"],
      options.note || `Myth unit option from ${god}.`,
      availability,
    );
  });
}

function t(id, name, age, building, category, effect, options = {}) {
  return {
    id,
    name,
    age,
    building,
    category,
    effect,
    pantheons: options.pantheons || ["all"],
    availability: options.availability || {},
    source: WIKI + encodeURIComponent(name).replace(/%20/g, "_"),
  };
}

function templeTechs(pantheon, rows) {
  return rows.map(([id, name, age, god, building, effect]) =>
    t(id, name, age, building, "myth", effect, {
      pantheons: [pantheon],
      availability: { god },
    }),
  );
}
