// Canonical GameState type — all pipeline steps read from and write to this shape.
// Add new fields here as new pipeline steps are introduced.

export interface NounVerbList {
  nouns: string[];
  verbs: string[];
}

export interface Sentences {
  sentences: string[];
}

export interface GameState {
  prompt: string;
  completedSteps: number[];
  nounVerbList?: NounVerbList;
  sentences?: Sentences;
  [key: string]: unknown;
}
