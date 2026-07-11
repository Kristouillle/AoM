window.AOM_STRATEGY = {
  version: 1,
  openings: {
    greeks: {
      action: "Open on stable food and wood, scout early, then place the first military building around the confirmed threat.",
      reason: "Greek units are dependable but expensive, so delaying the wrong production building is costly.",
      priorities: ["food", "wood", "gold"],
    },
    egyptians: {
      action: "Use Pharaoh empowerment on safe drop sites and keep Barracks access available before committing to a Migdol plan.",
      reason: "Egyptian openings gain tempo from empowerment but need an early answer while gold-heavy options come online.",
      priorities: ["gold", "food", "wood"],
    },
    norse: {
      action: "Use active infantry builders to establish flexible production, but forward-build only after the enemy timing is known.",
      reason: "Norse military construction rewards initiative while exposing builders if the read is wrong.",
      priorities: ["food", "wood", "gold"],
    },
    atlanteans: {
      action: "Lean on Citizen efficiency and Oracle vision while reserving resources for hero promotions against myth pressure.",
      reason: "Atlantean scouting and flexible heroization let the opening adapt without rebuilding the whole composition.",
      priorities: ["food", "wood", "gold"],
    },
    chinese: {
      action: "Protect the early economy and hero support, then choose Military Camp or Machine Workshop from the scouted unit tags.",
      reason: "Chinese production choices are strongest when the first specialist building answers a known unit class.",
      priorities: ["food", "wood", "gold"],
    },
    japanese: {
      action: "Secure Shrine value and Miko safety, then decide between Guardhouse, Stable, and Dojo from the first enemy line.",
      reason: "Japanese openings can branch efficiently once scouting identifies the correct production route.",
      priorities: ["food", "wood", "gold"],
    },
    aztecs: {
      action: "Protect the opening economy and use the scouted unit class to choose War Hut, Noble's Hut, or Great Temple production.",
      reason: "The Aztec roster is specialized, so the first building should have a clear matchup purpose.",
      priorities: ["food", "wood", "gold"],
    },
    default: {
      action: "Open with scouting first and commit military production only after identifying the first enemy line.",
      reason: "A flexible opening preserves resources until the matchup has useful information.",
      priorities: ["food", "wood", "gold"],
    },
  },
  godRules: [
    {
      id: "tsukuyomi-bushido",
      playerGodIds: ["tsukuyomi"],
      action: "Fit safe technology researches into the opening when they do not delay the required counter mass.",
      reason: "Tsukuyomi gains Bushido experience from researched technologies.",
    },
  ],
  enemyPantheons: {
    greeks: {
      scout: "Track the first specialist military building and whether a second production line appears before the age-up.",
      reason: "Greek armies often become expensive two-unit compositions with strong named heroes.",
    },
    egyptians: {
      scout: "Check gold access, monument investment, and whether the opponent is staying on Barracks units or preparing a Migdol transition.",
      reason: "Egyptian power shifts sharply when empowered gold supports Migdol units and myth production.",
    },
    norse: {
      scout: "Watch forward-building infantry and the location of the first military structure, not only the enemy base.",
      reason: "Norse pressure can move production onto the map earlier than other pantheons.",
    },
    atlanteans: {
      scout: "Track Oracle vision, hero promotions, and whether a small expensive army is switching unit type.",
      reason: "Atlantean units can change matchup roles through heroization without adding a new building.",
    },
    chinese: {
      scout: "Identify whether the first commitment is human soldiers, machines, or hero-supported myth units.",
      reason: "Chinese production branches demand different counter tags and different positioning.",
    },
    japanese: {
      scout: "Identify the first Guardhouse, Stable, or Dojo line and watch Shrine placement for the economic follow-up.",
      reason: "Japanese openings can pivot between several specialized production buildings.",
    },
    aztecs: {
      scout: "Identify which specialist building appears first and protect vulnerable economic units from early pressure.",
      reason: "Aztec unit roles are strongly tied to War Hut, Noble's Hut, and Great Temple choices.",
    },
  },
  threatRules: [
    {
      id: "anti-cavalry",
      label: "Cavalry response",
      priority: 90,
      tagsAny: ["cavalry"],
      response: "Anchor the army with the best available anti-cavalry unit and fight near production until its count is stable.",
      transition: "Re-scout for an archer switch before overproducing slow melee counters.",
      priorities: ["food", "gold", "wood"],
    },
    {
      id: "anti-archer",
      label: "Archer response",
      priority: 85,
      tagsAny: ["archer", "ranged"],
      response: "Prioritize the strongest anti-archer or mobile counter and avoid feeding unsupported infantry into ranged focus fire.",
      transition: "Watch for a frontline cavalry or infantry addition protecting the ranged mass.",
      priorities: ["food", "wood", "gold"],
    },
    {
      id: "anti-infantry",
      label: "Infantry response",
      priority: 80,
      tagsAny: ["infantry"],
      response: "Build the best anti-infantry damage line and preserve space so the enemy mass cannot surround it.",
      transition: "Check whether infantry is only a screen for archers, siege, or myth units behind it.",
      priorities: ["food", "wood", "gold"],
    },
    {
      id: "anti-myth",
      label: "Myth-unit response",
      priority: 100,
      tagsAny: ["myth"],
      response: "Add reliable hero access immediately and keep heroes protected by a conventional unit screen.",
      transition: "Do not overinvest in heroes if the opponent returns to human soldiers after the first myth timing.",
      priorities: ["food", "favor", "gold"],
    },
    {
      id: "anti-siege",
      label: "Siege response",
      priority: 95,
      tagsAny: ["siege"],
      response: "Use mobile melee pressure or the highest-ranked siege counter and attack from more than one angle.",
      transition: "Expect the opponent to add a bodyguard unit that counters your dive composition.",
      priorities: ["food", "gold", "wood"],
    },
    {
      id: "anti-naval",
      label: "Naval response",
      priority: 110,
      tagsAny: ["ship", "naval"],
      response: "Match Dock production early, protect fishing economy, and mass the highest-ranked naval counter before taking open-water fights.",
      transition: "Recheck whether the opponent is adding siege ships or abandoning water for a land timing.",
      priorities: ["wood", "food", "gold"],
    },
    {
      id: "anti-building",
      label: "Fortification response",
      priority: 70,
      tagsAny: ["building", "wall", "tower"],
      response: "Preserve the army while adding crush damage; avoid trading ordinary units into repaired fortifications.",
      transition: "Scout behind the fortification for the economic or age-up advantage it is protecting.",
      priorities: ["wood", "gold", "food"],
    },
  ],
};
