import { createOpenAIModel } from "@/lib/models";
import { buildAgentNode } from "@/lib/agent";
import type { NodeFunction } from "@/lib/types";
import { prompts } from "./pipeline_prompts";
import { INTERACTION_ATTRIBUTES } from "@library/interaction_attributes";
import { INDIVIDUAL_ATTRIBUTES } from "@library/individual_attributes";
import { WIN_CONDITIONS, LOSE_CONDITIONS, LAYOUT_RECIPES } from "@library/recipes";


export function buildSvoAnalyzerAgent(): NodeFunction {
  const llm = createOpenAIModel({ temperature: 0.2 });
  return buildAgentNode(llm, { systemPrompt: prompts.svoAnalyzer() });
}

export function buildInteractionAttributeSelectorAgent(): NodeFunction {
  const llm = createOpenAIModel({ temperature: 0.2 });
  return buildAgentNode(llm, {
    systemPrompt: prompts.interactionAttributeSelector(INTERACTION_ATTRIBUTES),
  });
}

export function buildIndividualAttributeSelectorAgent(): NodeFunction {
  const llm = createOpenAIModel({ temperature: 0.2 });
  return buildAgentNode(llm, {
    systemPrompt: prompts.individualAttributeSelector(INDIVIDUAL_ATTRIBUTES),
  });
}

export function buildRecipeSelectorAgent(): NodeFunction {
  const llm = createOpenAIModel({ temperature: 0.2 });
  return buildAgentNode(llm, {
    systemPrompt: prompts.recipeSelector(WIN_CONDITIONS, LOSE_CONDITIONS, LAYOUT_RECIPES),
  });
}

export function buildGameJsonBuilderAgent(): NodeFunction {
  const llm = createOpenAIModel({ temperature: 0.2 });
  return buildAgentNode(llm, { systemPrompt: prompts.gameJsonBuilder() });
}

export const pipelineAgents: Record<string, () => NodeFunction> = {
  svoAnalyzer: buildSvoAnalyzerAgent,
  interactionAttributeSelector: buildInteractionAttributeSelectorAgent,
  individualAttributeSelector: buildIndividualAttributeSelectorAgent,
  recipeSelector: buildRecipeSelectorAgent,
  gameJsonBuilder: buildGameJsonBuilderAgent,
};
