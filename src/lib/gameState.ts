// Canonical GameState type — all pipeline steps read from and write to this shape.
// Add new fields here as new pipeline steps are introduced.

// ── Step 1 output ─────────────────────────────────────────────────────────────

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

// ── Steps 2 & 3 output (shared "attributes" field) ───────────────────────────

// Step 2: relational (interaction) attributes per entity
// Keys are entity names; values map attribute keys to a target entity name or null.
export type InteractionAttributeMap = Record<
  string,
  Record<string, string | null>
>;

// Step 3: individual (per-entity) attributes
// Keys are entity names; values map attribute keys to true/false.
export type IndividualAttributeMap = Record<string, Record<string, boolean>>;

export interface CombinedAttributes {
  interaction: InteractionAttributeMap;
  individual: IndividualAttributeMap;
}

// ── Step 4 output — selected recipes (win/lose conditions + layout) ───────────

// Property-based condition: watches a scalar property on a single entity.
export interface PropertyCondition {
  name: string;
  entity: string;
  property: "health" | "count" | "timer";
  value: number;
}

// Interaction-based condition: watches a relationship between two entities.
export interface InteractionCondition {
  name: string;
  entity: string;
  attribute: string;
  target: string;
}

export type GameCondition = PropertyCondition | InteractionCondition;

export interface LayoutSpawnZone {
  id: string;
  label: string;
  x: number; // Normalised [0,1] from left
  y: number; // Normalised [0,1] from top
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

// ── Step 5 output — fully-resolved game configuration for Phaser ──────────────

export interface EntityPhysics {
  isStatic: boolean;
  speed: number;         // px/s for movement
  hasMovement: boolean;  // autonomous movement (patrol, chase, wander)
}

export interface EntityAppearance {
  size: number;          // diameter / side length in px
  color: string;         // hex string, e.g. "#e74c3c"
  shape: "circle" | "rectangle";
}

export interface EntityLifecycle {
  health: number;        // starting HP (0 = one-hit destroy)
  maxCount: number;      // max simultaneous instances on screen (-1 = unlimited)
  spawnRate: number;     // instances per second (0 = spawned once at start)
}

export interface EntityDef {
  id: string;            // lower-snake-case unique id
  label: string;         // display name
  role: "player" | "enemy" | "collectible" | "goal" | "hazard" | "static";
  physics: EntityPhysics;
  appearance: EntityAppearance;
  lifecycle: EntityLifecycle;
}

// Interaction matrix entry: what happens when source overlaps target
export interface InteractionEntry {
  source: string;        // entity id
  target: string;        // entity id
  effect: string;        // attribute key: "isDamagedBy", "isDestroyedBy", etc.
}

// Spawn point: where an entity is placed in the world
export interface SpawnPoint {
  entityId: string;
  x: number;             // normalised [0,1] from left
  y: number;             // normalised [0,1] from top
}

// Layout: world config + spawn points
export interface LayoutDef {
  widthPx: number;
  heightPx: number;
  scrolling: boolean;
  movement: "horizontal" | "vertical" | "both" | "none";
  backgroundColor: string;
  spawnPoints: SpawnPoint[];
}

export interface GameJSON {
  title: string;
  entities: EntityDef[];
  interactionMatrix: InteractionEntry[];
  layout: LayoutDef;
  winCondition: GameCondition;
  loseCondition: GameCondition;
}

// ── Pipeline state ────────────────────────────────────────────────────────────

export interface GameState {
  prompt: string;
  completedSteps: number[];
  svoAnalysis?: SvoAnalysis;
  attributes?: CombinedAttributes;
  recipeSelection?: RecipeSelection;
  gameJSON?: GameJSON;
  [key: string]: unknown;
}
