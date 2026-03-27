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

export interface GameState {
  prompt: string;
  completedSteps: number[];
  nounVerbList?: NounVerbList;
  sentences?: Sentences;
  svoAnalysis?: SvoAnalysis;
  interactionAttributes?: InteractionAttributeMap;
  individualAttributes?: IndividualAttributeMap;
  [key: string]: unknown;
}
