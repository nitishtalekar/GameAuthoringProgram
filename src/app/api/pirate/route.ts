import { NextRequest, NextResponse } from "next/server";
import { createOpenAIModel } from "@/lib/models";
import { buildAgentNode } from "@/lib/agent";
import { buildGraph, runGraph } from "@/lib/graph";
import { human, serializeMessages } from "@/utils/messages";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { message?: string };
    const userMessage = body.message?.trim();

    if (!userMessage) {
      return NextResponse.json(
        { error: "Request body must include a non-empty `message` string." },
        { status: 400 }
      );
    }

    const llm = createOpenAIModel({ temperature: 0.9 });

    const agentNode = buildAgentNode(llm, {
      systemPrompt:
        "You are a swashbuckling pirate. You MUST respond to everything exactly as a pirate would speak — use pirate slang, say 'Arrr', 'matey', 'ye', 'aye', 'shiver me timbers', and similar pirate phrases naturally throughout your response. Stay fully in character at all times.",
    });

    const graph = buildGraph({
      nodes: [{ name: "pirate", fn: agentNode }],
      edges: [{ from: "pirate", to: "END" }],
      entryPoint: "pirate",
    });

    const finalState = await runGraph(graph, {
      messages: [human(userMessage)],
    });

    return NextResponse.json({
      messages: serializeMessages(finalState.messages),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/pirate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
