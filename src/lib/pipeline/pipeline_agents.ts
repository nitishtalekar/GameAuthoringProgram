import { createOpenAIModel } from "@/lib/models";
import { buildAgentNode } from "@/lib/agent";
import type { NodeFunction } from "@/lib/types";
import { prompts } from "./pipeline_prompts";
import { NUMBER_OF_NOUNS } from "@library/constants";

export function buildNounVerbExtractorAgent(): NodeFunction {
  const llm = createOpenAIModel({ temperature: 0.2 });
  return buildAgentNode(llm, { systemPrompt: prompts.nounVerbExtractor(NUMBER_OF_NOUNS) });
}

export function buildSentenceGeneratorAgent(): NodeFunction {
  const llm = createOpenAIModel({ temperature: 0.7 });
  return buildAgentNode(llm, { systemPrompt: prompts.sentenceGenerator() });
}

export const pipelineAgents: Record<string, () => NodeFunction> = {
  nounVerbExtractor: buildNounVerbExtractorAgent,
  sentenceGenerator: buildSentenceGeneratorAgent,
};
