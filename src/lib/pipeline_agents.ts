import { createOpenAIModel } from "@/lib/models";
import { buildAgentNode } from "@/lib/agent";
import type { NodeFunction } from "@/lib/types";

export function buildNounVerbExtractorAgent(): NodeFunction {
  const llm = createOpenAIModel({ temperature: 0.2 });

  const systemPrompt = `You are a linguistics assistant. Given a text prompt, extract all nouns and verbs.

OUTPUT: Respond ONLY with valid JSON matching this exact schema — no markdown, no explanation:
{ "nouns": ["noun1", "noun2", ...], "verbs": ["verb1", "verb2", ...] }`;

  return buildAgentNode(llm, { systemPrompt });
}

export function buildSentenceGeneratorAgent(): NodeFunction {
  const llm = createOpenAIModel({ temperature: 0.7 });

  const systemPrompt = `You are a creative writing assistant. Given a list of nouns and verbs, generate sentences in the pattern: NOUN VERB NOUN.
Use the provided nouns and verbs to create at least 5 varied sentences.

OUTPUT: Respond ONLY with valid JSON matching this exact schema — no markdown, no explanation:
{ "sentences": ["Sentence one.", "Sentence two.", ...] }`;

  return buildAgentNode(llm, { systemPrompt });
}

export const pipelineAgents: Record<string, () => NodeFunction> = {
  nounVerbExtractor: buildNounVerbExtractorAgent,
  sentenceGenerator: buildSentenceGeneratorAgent,
};
