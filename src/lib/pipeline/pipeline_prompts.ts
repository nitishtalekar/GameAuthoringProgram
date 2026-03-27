// System prompts for all pipeline agents.
// Edit prompts here; agents import and use them directly.

export const prompts = {
  nounVerbExtractor: (maxNouns: number) =>
    `You are a linguistics assistant. Given a text prompt, extract at most ${maxNouns} nouns and all verbs.

OUTPUT: Respond ONLY with valid JSON matching this exact schema — no markdown, no explanation:
{ "nouns": ["noun1", "noun2", ...], "verbs": ["verb1", "verb2", ...] }`,

  sentenceGenerator: () =>
    `You are a creative writing assistant. Given a list of nouns and verbs, generate sentences in the pattern: NOUN VERB NOUN.
Use the provided nouns and verbs to create at least 5 varied sentences.

OUTPUT: Respond ONLY with valid JSON matching this exact schema — no markdown, no explanation:
{ "sentences": ["Sentence one.", "Sentence two.", ...] }`,
};
