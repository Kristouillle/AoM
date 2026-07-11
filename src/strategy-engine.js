(function () {
  function createPlan(context, strategy = window.AOM_STRATEGY || {}) {
    const opening = strategy.openings?.[context.playerGod.pantheon] || strategy.openings?.default || {};
    const godRule = (strategy.godRules || []).find((rule) => rule.playerGodIds?.includes(context.playerGod.id));
    const enemyRule = context.enemyGod ? strategy.enemyPantheons?.[context.enemyGod.pantheon] : null;
    const target = context.target || context.inferredTarget || null;
    const targetTags = new Set(target?.tags || []);
    const threatRule = (strategy.threatRules || [])
      .filter((rule) => rule.tagsAny?.some((tag) => targetTags.has(tag)))
      .sort((a, b) => b.priority - a.priority)[0] || null;
    const counters = context.counters || [];
    const primaryCounter = counters[0] || null;
    const enemyLabel = context.enemyGod?.name || "the opponent";
    const targetLabel = context.target?.name || (context.inferredTarget ? `${context.inferredTarget.name.toLowerCase()} pressure` : "the first scouted unit line");
    const productionBuilding = primaryCounter?.building || context.fallbackBuilding || "your first military building";
    const counterNames = counters.length ? formatList(counters.map((unit) => unit.name)) : "your best confirmed counter";
    const priorities = unique([...(threatRule?.priorities || []), ...(opening.priorities || [])]).slice(0, 4);
    const specificity = context.target?.unit ? "Exact-unit plan" : context.target ? "Unit-class plan" : context.enemyGod ? "Roster-aware plan" : "Scouting baseline";
    const matchedRules = [
      { label: `${context.playerGod.name} opening`, reason: opening.reason },
      enemyRule ? { label: `${enemyLabel} matchup`, reason: enemyRule.reason } : null,
      threatRule ? { label: threatRule.label, reason: `Triggered by ${Array.from(targetTags).join(", ") || "the inferred threat"}.` } : null,
      godRule ? { label: `${context.playerGod.name} bonus`, reason: godRule.reason } : null,
    ].filter(Boolean);

    const steps = [
      {
        phase: "Opening",
        action: opening.action || "Open flexibly and scout before committing production.",
        reason: opening.reason || "This preserves options until the first enemy line is known.",
      },
      godRule ? { phase: "God bonus", action: godRule.action, reason: godRule.reason } : null,
      {
        phase: "Scout",
        action: enemyRule?.scout || `Scout ${enemyLabel}'s first production building and confirm whether the threat is ${targetLabel}.`,
        reason: enemyRule?.reason || "The first confirmed production choice should determine the initial counter building.",
      },
      {
        phase: "Respond",
        action: `${threatRule?.response || "Commit to the strongest confirmed counter line."} Produce ${counterNames} from ${productionBuilding}.`,
        reason: primaryCounter
          ? `${primaryCounter.name} is the highest-ranked available fit for this age and roster scope.`
          : "No exact counter is confirmed yet, so keep the commitment reversible.",
      },
      {
        phase: "Upgrade",
        action: context.upgradeAction || "Delay military upgrades until the enemy line is confirmed; spend first on economy and counter mass.",
        reason: context.upgradeReason || "Unit count usually matters more than an early upgrade when the matchup is still uncertain.",
      },
      {
        phase: "Transition",
        action: transitionAction(context, threatRule),
        reason: "The recommendation should change when the opponent changes unit tags or the age filter advances.",
      },
    ].filter(Boolean);

    return {
      version: strategy.version || 1,
      specificity,
      title: target ? `${context.playerGod.name} response to ${target.name}` : `${context.playerGod.name} scouting plan`,
      summary: summaryText(context, primaryCounter, target),
      priorities,
      steps,
      matchedRules,
    };
  }

  function transitionAction(context, threatRule) {
    if (context.target?.unit && context.targetIsLaterAge) {
      return `${context.target.unit.name} arrives after ${context.age}; treat it as a transition warning rather than an immediate production order.`;
    }
    if (threatRule?.transition) return threatRule.transition;
    if (context.age === "all") return "Update the age filter as you advance, then re-check the counter ranking before adding the second army line.";
    const topThreat = context.threats?.[0]?.name;
    return topThreat
      ? `Before aging again, verify whether ${context.enemyGod?.name || "the opponent"} is staying on ${topThreat.toLowerCase()} or switching.`
      : "Before aging again, re-scout production so the next building answers the real switch.";
  }

  function summaryText(context, primaryCounter, target) {
    if (target && primaryCounter) {
      return `${primaryCounter.name} is the current lead response to ${target.name}; build enough production to establish its count before branching.`;
    }
    if (context.enemyGod) {
      return `This plan uses ${context.enemyGod.name}'s roster profile until an exact unit is selected.`;
    }
    return "This is a low-commitment baseline. Select an enemy god or unit to produce a more specific plan.";
  }

  function formatList(items) {
    if (!items.length) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
  }

  function unique(items) {
    return Array.from(new Set(items.filter(Boolean)));
  }

  window.AOM_STRATEGY_ENGINE = { createPlan };
})();
