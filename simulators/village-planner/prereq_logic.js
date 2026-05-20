/**
 * TravianTools — Village Planner
 * Prerequisite resolution engine v2 — with demolish tracking
 */

/**
 * @typedef {Object} PlanEntry
 * @property {number}  gid
 * @property {number}  targetLevel      - level to build up to
 * @property {boolean} userPlaced       - true = user added to slot
 * @property {number|null} autoAddedByGid
 * @property {boolean} willDemolish     - true = will be demolished after use
 * @property {number}  demolishToLevel  - level to demolish down to (0 = remove entirely)
 */

const DEMOLISH_REQUIRES_MB_LEVEL = 10;
const MB_GID = 15;

/**
 * Resolve all prerequisite chains recursively, tracking demolish requirements.
 *
 * @param {Map<number, number>} userPlan  - gid → targetLevel (user-placed slots)
 * @param {Object[]} buildingDb
 * @returns {{ plan: PlanEntry[], hiddenCosts: PlanEntry[], warnings: Object[] }}
 */
function resolvePrerequisites(userPlan, buildingDb) {
  const db = new Map(buildingDb.map(b => [b.gid, b]));

  // Working plan: gid → PlanEntry
  const plan = new Map();

  // Seed with user plan — no demolish for user-placed buildings
  for (const [gid, level] of userPlan) {
    plan.set(gid, {
      gid,
      targetLevel: level,
      userPlaced: true,
      autoAddedByGid: null,
      willDemolish: false,
      demolishToLevel: null,
    });
  }

  // BFS queue
  const queue = [...userPlan.keys()];
  const visited = new Set();

  while (queue.length > 0) {
    const gid = queue.shift();
    if (visited.has(gid)) continue;
    visited.add(gid);

    const building = db.get(gid);
    if (!building) continue;

    for (const prereq of (building.prerequisites || [])) {
      const existing = plan.get(prereq.gid);

      if (!existing) {
        // Not in plan at all → auto-add at min level, mark demolish to lv0
        plan.set(prereq.gid, {
          gid: prereq.gid,
          targetLevel: prereq.level,
          userPlaced: false,
          autoAddedByGid: gid,
          willDemolish: true,
          demolishToLevel: 0,
        });
        queue.push(prereq.gid);

      } else if (existing.userPlaced && existing.targetLevel < prereq.level) {
        // User-placed but level too low → warn, and track that it needs to go higher
        // then be demolished back to user's target
        // We do NOT override user's targetLevel — surface as warning
        // But we DO note that a temp build + demolish is needed
        if (!existing.willDemolish) {
          plan.set(prereq.gid, {
            ...existing,
            willDemolish: true,
            demolishToLevel: existing.targetLevel,
            // tempLevel = prereq.level (build up to this, then demolish back)
            tempLevel: prereq.level,
          });
        } else {
          // Already marked for demolish — maybe another building needs it even higher
          const current = plan.get(prereq.gid);
          if (prereq.level > (current.tempLevel ?? current.targetLevel)) {
            plan.set(prereq.gid, {
              ...current,
              tempLevel: prereq.level,
            });
          }
        }
        if (!visited.has(prereq.gid)) queue.push(prereq.gid);

      } else if (!existing.userPlaced && existing.targetLevel < prereq.level) {
        // Auto-added but another building needs it higher → upgrade
        plan.set(prereq.gid, {
          ...existing,
          targetLevel: prereq.level,
          autoAddedByGid: gid,
        });
        if (!visited.has(prereq.gid)) queue.push(prereq.gid);

      } else {
        // Already satisfied — still need to check its prereqs
        if (!visited.has(prereq.gid)) queue.push(prereq.gid);
      }
    }
  }

  // If any demolish exists → ensure MB lv10 is in plan
  const hasDemolish = [...plan.values()].some(e => e.willDemolish);
  if (hasDemolish) {
    const mbEntry = plan.get(MB_GID);
    if (!mbEntry) {
      plan.set(MB_GID, {
        gid: MB_GID,
        targetLevel: DEMOLISH_REQUIRES_MB_LEVEL,
        userPlaced: false,
        autoAddedByGid: null,
        willDemolish: false,
        demolishToLevel: null,
        autoAddReason: 'Required for demolish',
      });
      // Recurse MB prereqs
      const mbBuilding = db.get(MB_GID);
      // MB has no prereqs, but run through queue anyway for safety
    } else if (mbEntry.userPlaced && mbEntry.targetLevel < DEMOLISH_REQUIRES_MB_LEVEL) {
      // User has MB but level too low for demolish — add as warning
      plan.set(MB_GID, {
        ...mbEntry,
        willDemolish: false,
        demolishWarning: true, // MB level too low to demolish
      });
    } else if (!mbEntry.userPlaced && mbEntry.targetLevel < DEMOLISH_REQUIRES_MB_LEVEL) {
      plan.set(MB_GID, { ...mbEntry, targetLevel: DEMOLISH_REQUIRES_MB_LEVEL });
    }
  }

  const allEntries = [...plan.values()];
  const hiddenCosts = allEntries.filter(e => !e.userPlaced);

  // Warnings: user-placed buildings that need temp upgrade for prereq
  const warnings = allEntries
    .filter(e => e.userPlaced && e.willDemolish)
    .map(e => ({
      gid: e.gid,
      name: db.get(e.gid)?.name,
      userTargetLevel: e.targetLevel,
      tempLevel: e.tempLevel,
      demolishToLevel: e.demolishToLevel,
    }));

  // Also warn if MB is too low for demolish
  const mbFinal = plan.get(MB_GID);
  if (mbFinal?.demolishWarning) {
    warnings.push({
      gid: MB_GID,
      name: 'Main Building',
      issue: `Level ${mbFinal.targetLevel} tapi demolish butuh lv${DEMOLISH_REQUIRES_MB_LEVEL}`,
    });
  }

  return { plan: allEntries, hiddenCosts, warnings };
}

/**
 * Calculate cumulative cost from level 0 (or fromLevel) to toLevel.
 * If entry has tempLevel (user-placed, needs temp upgrade), cost = lv0→tempLevel.
 */
function calcCost(building, fromLevel = 0, toLevel) {
  const result = { lumber: 0, clay: 0, iron: 0, crop: 0, time: 0 };
  if (!building?.levels) return result;
  for (const lvl of building.levels) {
    if (lvl.level > fromLevel && lvl.level <= toLevel) {
      result.lumber += lvl.cost[0];
      result.clay   += lvl.cost[1];
      result.iron   += lvl.cost[2];
      result.crop   += lvl.cost[3];
      result.time   += lvl.time;
    }
  }
  return result;
}

/**
 * Full cost summary for the resolved plan.
 */
function calcPlanCost(plan, buildingDb) {
  const db = new Map(buildingDb.map(b => [b.gid, b]));
  const totals = { lumber: 0, clay: 0, iron: 0, crop: 0, time: 0 };
  const rows = [];

  for (const entry of plan) {
    const building = db.get(entry.gid);
    if (!building) continue;

    // If user-placed with tempLevel: cost = 0 → tempLevel (they must build higher first)
    // If auto-added: cost = 0 → targetLevel
    const buildTo = entry.tempLevel ?? entry.targetLevel;
    const cost = calcCost(building, 0, buildTo);

    totals.lumber += cost.lumber;
    totals.clay   += cost.clay;
    totals.iron   += cost.iron;
    totals.crop   += cost.crop;
    totals.time   += cost.time;

    rows.push({
      gid: entry.gid,
      name: building.name,
      targetLevel: entry.targetLevel,
      tempLevel: entry.tempLevel ?? null,
      userPlaced: entry.userPlaced,
      autoAddedByGid: entry.autoAddedByGid,
      autoAddReason: entry.autoAddReason ?? null,
      willDemolish: entry.willDemolish ?? false,
      demolishToLevel: entry.demolishToLevel ?? null,
      cost,
    });
  }

  return { rows, totals };
}

if (typeof module !== 'undefined') {
  module.exports = { resolvePrerequisites, calcCost, calcPlanCost };
}
