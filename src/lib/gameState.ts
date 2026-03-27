// Canonical GameState type — all pipeline steps read from and write to this shape.
// Add new fields here as new pipeline steps are introduced.

export interface NounVerbList {
  nouns: string[];
  verbs: string[];
}

export interface Sentences {
  sentences: string[];
}

// Step 1 output
export interface SvoRelation {
  subject: string;
  verb: string;
  object: string;
}

export interface SvoAnalysis {
  svo_sentences: string[];
  entities: string[]; // deduplicated set of all subjects and objects
  relations: SvoRelation[];
}

// Step 2 output — relational (interaction) attributes per entity
// Keys are entity names; values are objects mapping attribute keys to a target entity name or null.
export type InteractionAttributeMap = Record<
  string,
  Record<string, string | null>
>;

// Step 3 output — individual (per-entity) attributes
// Keys are entity names; values are objects mapping attribute keys to true/false.
export type IndividualAttributeMap = Record<string, Record<string, boolean>>;

// Step 4 output — selected recipes (win/lose conditions + layout)

// Property-based condition: watches a scalar property on a single entity.
// e.g. Knight.health === 0
export interface PropertyCondition {
  name: string;              // Recipe key, e.g. "playerHealthDepleted"
  entity: string;            // Entity being watched, e.g. "Knight"
  property: "health" | "count" | "timer";
  value: number;             // Threshold that triggers the condition
}

// Interaction-based condition: watches a relationship between two entities.
// e.g. Goblin.isDestroyedBy === "Knight"
export interface InteractionCondition {
  name: string;              // Recipe key, e.g. "allEnemiesDestroyed"
  entity: string;            // Entity being watched, e.g. "Goblin"
  attribute: string;         // Interaction attribute key, e.g. "isDestroyedBy"
  target: string;            // The other entity involved, e.g. "Knight"
}

export type GameCondition = PropertyCondition | InteractionCondition;

export interface LayoutSpawnZone {
  id: string;
  label: string;
  x: number;  // Normalised [0,1] from left
  y: number;  // Normalised [0,1] from top
  role: "player" | "enemy" | "collectible" | "goal" | "hazard" | "static";
}

export interface GameLayout {
  key: string;
  movement: "horizontal" | "vertical" | "both" | "none";
  scrolling: boolean;
  spawnZones: LayoutSpawnZone[];
}

export interface RecipeSelection {
  win_condition: GameCondition;
  lose_condition: GameCondition;
  layout: GameLayout;
}

// Step 5 output — fully-resolved game configuration ready for Phaser rendering

export interface EntityPhysics {
  hasGravity: boolean;
  isStatic: boolean;
  speed: number;          // px/s for movement
  jumpForce: number;      // initial vertical velocity when jumping (0 if canJump is false)
}

export interface EntityAppearance {
  size: number;           // diameter / side length in px (square hitbox assumed)
  color: string;          // hex string, e.g. "#e74c3c" — placeholder until sprites are added
  shape: "circle" | "rectangle";
}

export interface EntityLifecycle {
  health: number;         // starting HP (0 = one-hit destroy)
  maxCount: number;       // max simultaneous instances on screen (-1 = unlimited)
  spawnRate: number;      // instances per second (0 = spawned once at start)
  spawnZoneId: string;    // references GameLayout.spawnZones[].id
}

// A resolved interaction: who is the target entity and what happens
export interface ResolvedInteraction {
  target: string;         // entity id that triggers this interaction
  attributeKey: string;   // e.g. "isDestroyedBy", "isCollectedBy"
}

export interface EntityConfig {
  id: string;             // lower-snake-case unique id, e.g. "knight"
  label: string;          // display name, e.g. "Knight"
  // Role inferred from individualAttributes — drives Phaser group/archetype
  role: "player" | "enemy" | "collectible" | "goal" | "hazard" | "static";
  physics: EntityPhysics;
  appearance: EntityAppearance;
  lifecycle: EntityLifecycle;
  // Flat list of directional interactions this entity participates in
  interactions: ResolvedInteraction[];
}

export interface GameWorld {
  widthPx: number;        // logical canvas width
  heightPx: number;       // logical canvas height
  gravityY: number;       // Phaser gravity.y value (0 for top-down games)
  scrolling: boolean;
  movement: "horizontal" | "vertical" | "both" | "none";
  backgroundColor: string;
}

export interface GameJSON {
  title: string;
  world: GameWorld;
  entities: EntityConfig[];
  winCondition: GameCondition;
  loseCondition: GameCondition;
}

export interface GameState {
  prompt: string;
  completedSteps: number[];
  nounVerbList?: NounVerbList;
  sentences?: Sentences;
  svoAnalysis?: SvoAnalysis;
  interactionAttributes?: InteractionAttributeMap;
  individualAttributes?: IndividualAttributeMap;
  recipeSelection?: RecipeSelection;
  gameJSON?: GameJSON;
  [key: string]: unknown;
}
