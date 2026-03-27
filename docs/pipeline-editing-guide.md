# Pipeline Editing Guide

This document explains how to add or modify pipeline steps, prompts, constants, and the GameState type.

---

## Overview: The Files That Matter

| What you want to change | File |
|---|---|
| Add/remove/reorder pipeline steps | `src/lib/pipeline/pipeline.ts` |
| Edit agent system prompts | `src/lib/pipeline/pipeline_prompts.ts` |
| Add/change numeric/string constants | `library/constants.ts` |
| Build or update agent logic | `src/lib/pipeline/pipeline_agents.ts` |
| Add fields to GameState | `src/lib/gameState.ts` |

---

## 1. Adding a New Pipeline Step

### Step 1 — Define the step in `pipeline.ts`

`src/lib/pipeline/pipeline.ts` holds the ordered list of steps. Each step has this shape:

```typescript
export interface PipelineStep {
  id: number;       // unique, sequential integer
  label: string;    // display label shown in the UI
  agentKey: string; // must match a key in pipelineAgents (pipeline_agents.ts)
  inputFields: string[];  // GameState fields required before this step runs
  outputField: string;    // GameState field where this step's output is written
}
```

To add a step, append to the `pipeline` array:

```typescript
{
  id: 3,
  label: "Step 3: Classify Sentences",
  agentKey: "sentenceClassifier",
  inputFields: ["sentences"],   // must already exist in GameState before this step
  outputField: "classifications",
}
```

- `id` values must be unique. Use the next sequential integer.
- `inputFields` enforces prerequisites — the API route will reject the step if any listed field is missing from GameState.
- `outputField` names a new or existing field on GameState where the parsed JSON response is stored.

### Step 2 — Add a prompt in `pipeline_prompts.ts`

`src/lib/pipeline/pipeline_prompts.ts` exports a `prompts` object keyed by `agentKey`:

```typescript
export const prompts = {
  // existing prompts ...

  sentenceClassifier: () =>
    `You are a linguistics classifier. Given a list of sentences, classify each as action, descriptive, or dialogue.

OUTPUT: Respond ONLY with valid JSON matching this exact schema — no markdown, no explanation:
{ "classifications": [{ "sentence": "...", "type": "action" | "descriptive" | "dialogue" }] }`,
};
```

Rules for writing prompts:
- Always end with the JSON output schema — the API route calls `JSON.parse()` on the raw response.
- No markdown, no preamble in the output. Tell the model this explicitly.
- If the prompt needs a tunable constant (like `maxNouns`), accept it as a parameter: `sentenceClassifier: (maxItems: number) => \`...\``.

### Step 3 — Register the agent in `pipeline_agents.ts`

`src/lib/pipeline/pipeline_agents.ts` maps each `agentKey` to a builder function:

```typescript
export function buildSentenceClassifierAgent(): NodeFunction {
  const llm = createOpenAIModel({ temperature: 0.3 });
  return buildAgentNode(llm, { systemPrompt: prompts.sentenceClassifier() });
}

export const pipelineAgents: Record<string, () => NodeFunction> = {
  nounVerbExtractor: buildNounVerbExtractorAgent,
  sentenceGenerator: buildSentenceGeneratorAgent,
  sentenceClassifier: buildSentenceClassifierAgent,  // <-- add here
};
```

Notes:
- The key in `pipelineAgents` must exactly match the `agentKey` in `pipeline.ts`.
- Choose `temperature` based on the task: lower (0.1–0.3) for extraction/classification, higher (0.6–0.8) for generation.
- Pass constants into the prompt call if your prompt is parameterized: `prompts.sentenceClassifier(MAX_ITEMS)`.

### Step 4 — Extend GameState

If your step writes to a new `outputField`, add a typed field and its type to `src/lib/gameState.ts`. See [Section 4](#4-updating-the-gamestate-type) below.

---

## 2. Editing an Existing Prompt

All prompts live in `src/lib/pipeline/pipeline_prompts.ts`.

- Find the key matching the `agentKey` of the step you want to change.
- Edit the template string.
- If you change the JSON output schema (field names or structure), update the matching type in `src/lib/gameState.ts` and the `outputField` in `pipeline.ts`.

---

## 3. Adding or Changing Constants

`library/constants.ts` holds tunable values referenced by agents:

```typescript
export const NUMBER_OF_NOUNS = 2; // max nouns buildNounVerbExtractorAgent will extract
```

To add a constant:

```typescript
export const MAX_CLASSIFICATIONS = 10;
```

Then import and use it in `pipeline_agents.ts`:

```typescript
import { NUMBER_OF_NOUNS, MAX_CLASSIFICATIONS } from "@library/constants";

export function buildSentenceClassifierAgent(): NodeFunction {
  const llm = createOpenAIModel({ temperature: 0.3 });
  return buildAgentNode(llm, { systemPrompt: prompts.sentenceClassifier(MAX_CLASSIFICATIONS) });
}
```

---

## 4. Updating the GameState Type

`src/lib/gameState.ts` defines:
- `GameState` — the shared state passed between pipeline steps
- Per-step output types (e.g. `NounVerbList`, `Sentences`)

### Adding a new output type and field

```typescript
// 1. Define the output shape
export interface Classifications {
  classifications: Array<{ sentence: string; type: "action" | "descriptive" | "dialogue" }>;
}

// 2. Add it as an optional field on GameState
export interface GameState {
  prompt: string;
  completedSteps: number[];
  nounVerbList?: NounVerbList;
  sentences?: Sentences;
  classifications?: Classifications;  // <-- add here
  [key: string]: unknown;
}
```

Rules:
- New fields are always optional (`?`) because GameState accumulates across steps.
- The field name must exactly match the `outputField` in `pipeline.ts` — the API route uses this name as the key when merging step output into GameState.
- The `[key: string]: unknown` index signature is already present and allows the index access pattern used in the API route; do not remove it.

---

## 5. How the API Route Wires Everything Together

`src/app/api/pipeline/route.ts` handles `POST /api/pipeline`. On each call it:

1. Looks up the step by `id` in `pipeline.ts`.
2. Checks that all `inputFields` exist in the incoming `GameState`.
3. Looks up the agent builder by `agentKey` in `pipelineAgents`.
4. Builds a single-node graph, runs it, and parses the JSON response.
5. Merges `{ [step.outputField]: parsedResponse }` into GameState and returns it.

You do not need to edit `route.ts` when adding a new step — it is generic. The only reason to touch it is if you need to change how the human message is constructed (lines 73–79) or how JSON is extracted from the response.

---

## 6. Full Checklist for Adding a New Step

- [ ] Add a `PipelineStep` entry to `pipeline` in `src/lib/pipeline/pipeline.ts`
- [ ] Add a prompt function under the matching key in `src/lib/pipeline/pipeline_prompts.ts`
- [ ] Add any new tunable values to `library/constants.ts`
- [ ] Add a builder function and register it in `pipelineAgents` in `src/lib/pipeline/pipeline_agents.ts`
- [ ] Add the output type and field to `src/lib/gameState.ts`

---

## 7. Full Checklist for Editing an Existing Step

| Goal | Files to change |
|---|---|
| Change what the LLM is told to do | `pipeline_prompts.ts` |
| Change a numeric/string tuning value | `library/constants.ts` |
| Change the output JSON schema | `pipeline_prompts.ts` + `gameState.ts` |
| Change which prior step's output is required | `pipeline.ts` (`inputFields`) |
| Change the LLM temperature or model | `pipeline_agents.ts` (builder function) |
| Rename a step's output field | `pipeline.ts` (`outputField`) + `gameState.ts` |
