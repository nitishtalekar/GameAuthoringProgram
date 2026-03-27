import type { BaseMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

export type LLMProvider = "openai" | "google";

export interface ModelOptions {
  modelName?: string;
  temperature?: number;
  streaming?: boolean;
}

// The state object passed between graph nodes.
// Always contains a messages array; extend with additional fields as needed.
export interface GraphState {
  messages: BaseMessage[];
  [key: string]: unknown;
}

// A node function receives state (and an optional RunnableConfig) and returns
// a partial state update. LangGraph merges the partial back into the full state.
export type NodeFunction = (
  state: GraphState,
  config?: RunnableConfig
) => Promise<Partial<GraphState>>;

export type EdgeCondition = (state: GraphState) => string;

export interface NodeDefinition {
  name: string;
  fn: NodeFunction;
}

export interface ConditionalEdgeDefinition {
  from: string;
  condition: EdgeCondition;
  pathMap: Record<string, string>;
}

// Passed to buildGraph() to describe the full graph topology.
export interface GraphConfig {
  nodes: NodeDefinition[];
  edges: Array<{ from: string; to: string }>;
  conditionalEdges?: ConditionalEdgeDefinition[];
  entryPoint: string;
}

// One chunk yielded by streamGraph() — the node name and its state update.
export interface StreamChunk {
  node: string;
  state: Partial<GraphState>;
}
