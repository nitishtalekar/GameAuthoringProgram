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
    outputField: "interactionAttributes",
  },
  {
    id: 3,
    label: "Step 3: Individual Attributes",
    agentKey: "individualAttributeSelector",
    inputFields: ["svoAnalysis"],
    outputField: "individualAttributes",
  },
  {
    id: 4,
    label: "Step 4: Recipe Selection",
    agentKey: "recipeSelector",
    inputFields: ["interactionAttributes", "individualAttributes"],
    outputField: "recipeSelection",
  },
];
