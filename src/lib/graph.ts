import { StateGraph, END, MessagesAnnotation } from "@langchain/langgraph";
import type { GraphConfig, GraphState, StreamChunk } from "./types";

export function buildGraph(config: GraphConfig) {
  const graph = new StateGraph(MessagesAnnotation);
  const g = graph as any; // cast needed — addEdge/addNode have strict literal types

  for (const node of config.nodes) {
    g.addNode(node.name, node.fn);
  }

  g.addEdge("__start__", config.entryPoint);

  for (const edge of config.edges) {
    const target = edge.to === "END" ? END : edge.to;
    g.addEdge(edge.from, target);
  }

  if (config.conditionalEdges) {
    for (const ce of config.conditionalEdges) {
      g.addConditionalEdges(ce.from, ce.condition, ce.pathMap);
    }
  }

  return graph.compile();
}

// Run a compiled graph to completion; returns the final accumulated state.
export async function runGraph(
  graph: ReturnType<typeof buildGraph>,
  initialState: Partial<GraphState>
): Promise<GraphState> {
  const result = await graph.invoke(initialState);
  return result as GraphState;
}

// Stream a compiled graph; yields one StreamChunk per node execution.
export async function* streamGraph(
  graph: ReturnType<typeof buildGraph>,
  initialState: Partial<GraphState>
): AsyncGenerator<StreamChunk> {
  const stream = await graph.stream(initialState);
  for await (const chunk of stream) {
    for (const [node, state] of Object.entries(chunk)) {
      yield { node, state: state as Partial<GraphState> };
    }
  }
}
