window.AOM_RUNTIME_INDEXES = {
  create(data) {
    const normalize = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const uniqueById = (items) => Array.from(new Map(items.map((item) => [item.id, item])).values());
    const groupByPantheon = (items) => {
      const groups = new Map();
      for (const item of items) {
        for (const pantheon of item.pantheons || ["all"]) {
          if (!groups.has(pantheon)) groups.set(pantheon, []);
          groups.get(pantheon).push(item);
        }
      }
      return groups;
    };

    const pantheonById = new Map(data.pantheons.map((item) => [item.id, item]));
    const godById = new Map(data.gods.map((item) => [item.id, item]));
    const unitById = new Map(data.units.map((item) => [item.id, item]));
    const buildingById = new Map(data.buildings.map((item) => [item.id, item]));
    const technologyById = new Map(data.technologies.map((item) => [item.id, item]));
    const buildingsByName = new Map();
    const unitsByName = new Map();
    const unitIdsByBuildingId = new Map(data.buildings.map((building) => [building.id, new Set()]));

    for (const building of data.buildings) {
      const key = normalize(building.name);
      if (!buildingsByName.has(key)) buildingsByName.set(key, []);
      buildingsByName.get(key).push(building);
    }

    for (const unit of data.units) {
      unitsByName.set(normalize(unit.name), unit);
      unitsByName.set(normalize(unit.id), unit);
      for (const buildingName of unit.productionBuildings || [unit.building]) {
        for (const building of buildingsByName.get(normalize(buildingName)) || []) {
          unitIdsByBuildingId.get(building.id)?.add(unit.id);
        }
      }
    }

    for (const building of data.buildings) {
      for (const producedName of building.produces || []) {
        const unit = unitsByName.get(normalize(producedName));
        if (unit) unitIdsByBuildingId.get(building.id)?.add(unit.id);
      }
    }

    const unitsByPantheon = groupByPantheon(data.units);
    const buildingsByPantheon = groupByPantheon(data.buildings);
    const technologiesByPantheon = groupByPantheon(data.technologies);
    const forPantheon = (groups, pantheonId) => uniqueById([...(groups.get("all") || []), ...(groups.get(pantheonId) || [])]);

    return {
      pantheonById,
      godById,
      unitById,
      buildingById,
      technologyById,
      unitsForPantheon: (pantheonId) => forPantheon(unitsByPantheon, pantheonId),
      buildingsForPantheon: (pantheonId) => forPantheon(buildingsByPantheon, pantheonId),
      technologiesForPantheon: (pantheonId) => forPantheon(technologiesByPantheon, pantheonId),
      unitIdsForBuilding: (buildingId) => unitIdsByBuildingId.get(buildingId) || new Set(),
    };
  },
};
