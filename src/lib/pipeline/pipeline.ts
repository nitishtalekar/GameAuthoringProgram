export interface PipelineStep {
  id: number;
  label: string;
  agentKey: string;
  // gameState fields required as input (in addition to the raw prompt)
  inputFields: string[];
  // gameState field where this step's parsed output is stored
  outputField: string;
}

export const pipeline: PipelineStep[] = [
  {
    id: 1,
    label: "Step 1: SVO Analysis",
    agentKey: "svoAnalyzer",
    inputFields: [],
    outputField: "svoAnalysis",
  },
  {
    id: 2,
    label: "Step 2: Interaction Attributes",
    agentKey: "interactionAttributeSelector",
    inputFields: ["svoAnalysis"],
    outputField: "attributes",
  },
  {
    id: 3,
    label: "Step 3: Individual Attributes",
    agentKey: "individualAttributeSelector",
    inputFields: ["svoAnalysis", "attributes"],
    outputField: "attributes",
  },
  {
    id: 4,
    label: "Step 4: Recipe Selection",
    agentKey: "recipeSelector",
    inputFields: ["attributes"],
    outputField: "recipeSelection",
  },
  {
    id: 5,
    label: "Step 5: Game JSON Builder",
    agentKey: "gameJsonBuilder",
    inputFields: ["attributes", "recipeSelection"],
    outputField: "gameJSON",
  },
];
