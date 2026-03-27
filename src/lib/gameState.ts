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

export interface GameState {
  prompt: string;
  completedSteps: number[];
  nounVerbList?: NounVerbList;
  sentences?: Sentences;
  svoAnalysis?: SvoAnalysis;
  interactionAttributes?: InteractionAttributeMap;
  individualAttributes?: IndividualAttributeMap;
  recipeSelection?: RecipeSelection;
  [key: string]: unknown;
}
