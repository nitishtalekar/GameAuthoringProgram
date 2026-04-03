// Recipe library for Step 4: win conditions, lose conditions, and layout types.
// Recipes are the high-level game structure derived from entity attributes.

// ─── Entity Properties ────────────────────────────────────────────────────────
// A closed list of scalar properties the engine tracks per entity.
// Used in property-based conditions.

export type EntityProperty = "health" | "count" | "timer";

export const ENTITY_PROPERTIES: EntityProperty[] = ["health", "count", "timer"];

// ─── Condition Recipes ────────────────────────────────────────────────────────
// conditionType determines which output shape the LLM must produce:
//   "property"    → { name, entity, property, value }
//   "interaction" → { name, entity, attribute, target }

export interface ConditionRecipe {
  key: string;
  description: string;
  conditionType: "property" | "interaction";
  // Which individual or interaction attribute signals this recipe applies
  triggerAttribute: string;
  example: string;
}

export const WIN_CONDITIONS: ConditionRecipe[] = [
  {
    key: "allEnemiesDestroyed",
    description:
      "Win when every enemy has been destroyed by the player. " +
      "Applies when enemy entities have the 'isDestroyedBy' interaction attribute. " +
      "Output: entity = enemy, attribute = isDestroyedBy, target = the entity that destroys them.",
    conditionType: "interaction",
    triggerAttribute: "isDestroyedBy",
    example: '{ "name": "allEnemiesDestroyed", "entity": "Goblin", "attribute": "isDestroyedBy", "target": "Knight" }',
  },
  {
    key: "allCollectiblesCollected",
    description:
      "Win when every collectible has been picked up. " +
      "Applies when collectible entities have the 'isCollectedBy' interaction attribute. " +
      "Output: entity = collectible, attribute = isCollectedBy, target = the entity that collects them.",
    conditionType: "interaction",
    triggerAttribute: "isCollectedBy",
    example: '{ "name": "allCollectiblesCollected", "entity": "Coin", "attribute": "isCollectedBy", "target": "Player" }',
  },
  {
    key: "playerReachesGoal",
    description:
      "Win when the player activates a goal entity (door, flag, exit). " +
      "Applies when a goal entity has the 'isActivatedBy' interaction attribute pointing to the player. " +
      "Output: entity = goal, attribute = isActivatedBy, target = player entity.",
    conditionType: "interaction",
    triggerAttribute: "isActivatedBy",
    example: '{ "name": "playerReachesGoal", "entity": "Door", "attribute": "isActivatedBy", "target": "Knight" }',
  },
  {
    key: "surviveUntilTime",
    description:
      "Win by surviving until the timer reaches zero. " +
      "Applies when the scene has hazards or enemies but no destroy/collect objective. " +
      "Output: property = timer, value = 0 (timer counts down to zero).",
    conditionType: "property",
    triggerAttribute: "isHazard",
    example: '{ "name": "surviveUntilTime", "entity": "Game", "property": "timer", "value": 0 }',
  },
];

export const LOSE_CONDITIONS: ConditionRecipe[] = [
  {
    key: "playerHealthDepleted",
    description:
      "Lose when the player's health reaches zero. " +
      "Applies when the player has the 'hasHealth' individual attribute and is damaged by something. " +
      "Output: entity = player, property = health, value = 0.",
    conditionType: "property",
    triggerAttribute: "hasHealth",
    example: '{ "name": "playerHealthDepleted", "entity": "Knight", "property": "health", "value": 0 }',
  },
  {
    key: "playerDestroyed",
    description:
      "Lose when the player is destroyed in a single hit (no health bar). " +
      "Applies when the player has 'isDestroyedBy' but NOT 'hasHealth'. " +
      "Output: entity = player, attribute = isDestroyedBy, target = whatever destroys the player.",
    conditionType: "interaction",
    triggerAttribute: "isDestroyedBy",
    example: '{ "name": "playerDestroyed", "entity": "Ship", "attribute": "isDestroyedBy", "target": "Meteor" }',
  },
  {
    key: "enemyReachesGoal",
    description:
      "Lose when an enemy destroys or activates a protected goal entity. " +
      "Applies when a goal entity has 'isDestroyedBy' or 'isActivatedBy' pointing to an enemy. " +
      "Output: entity = goal, attribute = isDestroyedBy or isActivatedBy, target = enemy entity.",
    conditionType: "interaction",
    triggerAttribute: "isDestroyedBy",
    example: '{ "name": "enemyReachesGoal", "entity": "Castle", "attribute": "isDestroyedBy", "target": "Dragon" }',
  },
  {
    key: "outOfTime",
    description:
      "Lose when the timer expires before the win condition is met. " +
      "Pairs with any win condition that has a time limit. " +
      "Output: property = timer, value = 0.",
    conditionType: "property",
    triggerAttribute: "isHazard",
    example: '{ "name": "outOfTime", "entity": "Game", "property": "timer", "value": 0 }',
  },
];

// ─── Layout Recipes ───────────────────────────────────────────────────────────

export interface SpawnZone {
  id: string;
  label: string;
  // Normalised position [0,1] from top-left
  x: number;
  y: number;
  // Which entity role belongs here
  role: "player" | "enemy" | "collectible" | "goal" | "hazard" | "static";
}

export interface LayoutRecipe {
  key: string;
  description: string;
  movement: "horizontal" | "vertical" | "both" | "none";
  scrolling: boolean;
  spawnZones: SpawnZone[];
  example: string;
}

export const LAYOUT_RECIPES: LayoutRecipe[] = [
  {
    key: "topdown_arena",
    description:
      "Fixed single-screen top-down view. Player in the centre, enemies and collectibles scattered around. " +
      "Use for combat or collection games on a single screen with no scrolling.",
    movement: "both",
    scrolling: false,
    spawnZones: [
      { id: "player_start", label: "Player Start", x: 0.5,  y: 0.5,  role: "player" },
      { id: "enemy_zone",   label: "Enemy Zone",   x: 0.8,  y: 0.2,  role: "enemy" },
      { id: "collectible",  label: "Collectibles", x: 0.3,  y: 0.3,  role: "collectible" },
      { id: "hazard",       label: "Hazard",       x: 0.5,  y: 0.15, role: "hazard" },
      { id: "goal",         label: "Goal",         x: 0.5,  y: 0.05, role: "goal" },
    ],
    example: "A wizard fights enemies from all directions in an open room.",
  },
  {
    key: "topdown_shooter",
    description:
      "Vertically scrolling top-down shooter. Player at the bottom shoots upward at descending enemies. " +
      "Use when enemies spawn from the top and the player moves freely across the screen.",
    movement: "both",
    scrolling: true,
    spawnZones: [
      { id: "player_start", label: "Player Start", x: 0.5,  y: 0.85, role: "player" },
      { id: "enemy_zone",   label: "Enemy Spawn",  x: 0.5,  y: 0.05, role: "enemy" },
      { id: "collectible",  label: "Collectibles", x: 0.5,  y: 0.5,  role: "collectible" },
      { id: "hazard",       label: "Hazard",       x: 0.5,  y: 0.3,  role: "hazard" },
    ],
    example: "A spaceship shoots upward at descending alien waves.",
  },
  {
    key: "topdown_explorer",
    description:
      "Scrolling top-down world with a goal to reach. Player explores the map, avoids hazards, and reaches an exit. " +
      "Use when the player navigates a larger space with a clear destination.",
    movement: "both",
    scrolling: true,
    spawnZones: [
      { id: "player_start", label: "Player Start", x: 0.1,  y: 0.5,  role: "player" },
      { id: "enemy_zone",   label: "Enemy Zone",   x: 0.6,  y: 0.4,  role: "enemy" },
      { id: "collectible",  label: "Collectibles", x: 0.4,  y: 0.3,  role: "collectible" },
      { id: "hazard",       label: "Hazard",       x: 0.5,  y: 0.6,  role: "hazard" },
      { id: "goal",         label: "Goal",         x: 0.9,  y: 0.5,  role: "goal" },
    ],
    example: "An adventurer navigates a dungeon map, avoids traps, and reaches the exit.",
  },
  {
    key: "topdown_collect",
    description:
      "Fixed single-screen top-down view focused on collecting all items. " +
      "Use when the win condition is picking up all collectibles while avoiding enemies or hazards.",
    movement: "both",
    scrolling: false,
    spawnZones: [
      { id: "player_start", label: "Player Start", x: 0.5,  y: 0.5,  role: "player" },
      { id: "collectible",  label: "Collectibles", x: 0.25, y: 0.25, role: "collectible" },
      { id: "enemy_zone",   label: "Enemy Zone",   x: 0.75, y: 0.75, role: "enemy" },
      { id: "hazard",       label: "Hazard",       x: 0.75, y: 0.25, role: "hazard" },
    ],
    example: "Pac-Man style: collect all pellets while avoiding ghosts.",
  },
];

export const RECIPE_KEYS = {
  winConditions: WIN_CONDITIONS.map((r) => r.key),
  loseConditions: LOSE_CONDITIONS.map((r) => r.key),
  layouts: LAYOUT_RECIPES.map((r) => r.key),
};
