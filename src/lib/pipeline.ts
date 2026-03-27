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
    label: "Step 1: Extract Nouns & Verbs",
    agentKey: "nounVerbExtractor",
    inputFields: [],
    outputField: "nounVerbList",
  },
  {
    id: 2,
    label: "Step 2: Generate Sentences",
    agentKey: "sentenceGenerator",
    inputFields: ["nounVerbList"],
    outputField: "sentences",
  },
];
