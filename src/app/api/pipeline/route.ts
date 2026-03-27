import { NextRequest, NextResponse } from "next/server";
import { buildGraph, runGraph } from "@/lib/graph";
import { human, getLastMessageContent } from "@/utils/messages";
import { pipeline } from "@/lib/pipeline";
import { pipelineAgents } from "@/lib/pipeline_agents";

export const runtime = "nodejs";

export interface GameState {
  prompt: string;
  completedSteps: number[];
  [key: string]: unknown;
}

function parseJson<T>(raw: string, agentLabel: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `${agentLabel} returned invalid JSON. First 300 chars: ${cleaned.slice(0, 300)}`
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { step?: number; state?: GameState };
    const { step, state } = body;

    if (typeof step !== "number" || !state) {
      return NextResponse.json(
        { error: "Request body must include `step` (number) and `state` (GameState)." },
        { status: 400 }
      );
    }

    const stepDef = pipeline.find((s) => s.id === step);
    if (!stepDef) {
      return NextResponse.json(
        { error: `No pipeline step with id ${step}.` },
        { status: 400 }
      );
    }

    // Validate required input fields
    for (const field of stepDef.inputFields) {
      if (state[field] == null) {
        return NextResponse.json(
          { error: `Step ${step} requires state.${field} from a previous step.` },
          { status: 400 }
        );
      }
    }

    const agentBuilder = pipelineAgents[stepDef.agentKey];
    if (!agentBuilder) {
      return NextResponse.json(
        { error: `No agent registered for key "${stepDef.agentKey}".` },
        { status: 500 }
      );
    }

    const agentNode = agentBuilder();
    const graph = buildGraph({
      nodes: [{ name: stepDef.agentKey, fn: agentNode }],
      edges: [{ from: stepDef.agentKey, to: "END" }],
      entryPoint: stepDef.agentKey,
    });

    // Build the human message: always include the prompt, plus any required prior state fields
    const contextParts: string[] = [`User prompt: ${state.prompt}`];
    for (const field of stepDef.inputFields) {
      contextParts.push(
        `${field}:\n${JSON.stringify(state[field], null, 2)}`
      );
    }
    const humanMsg = contextParts.join("\n\n");

    const finalState = await runGraph(graph, {
      messages: [human(humanMsg)],
    });

    const raw = getLastMessageContent(finalState.messages);
    const parsed = parseJson<unknown>(raw, stepDef.agentKey);

    const updatedState: GameState = {
      ...state,
      completedSteps: [...(state.completedSteps ?? []), step],
      [stepDef.outputField]: parsed,
    };

    return NextResponse.json({ state: updatedState });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/pipeline]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
