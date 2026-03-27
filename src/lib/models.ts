import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { ModelOptions, LLMProvider } from "./types";

// Reads OPENAI_API_KEY and OPENAI_MODEL from the environment.
// Default model: "gpt-4o"
export function createOpenAIModel(options: ModelOptions = {}): ChatOpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY. Add it to .env.local.");

  return new ChatOpenAI({
    apiKey,
    modelName: options.modelName ?? process.env.OPENAI_MODEL ?? "gpt-4o",
    temperature: options.temperature ?? 0.7,
    streaming: options.streaming ?? false,
  });
}

// Reads GOOGLE_API_KEY and GOOGLE_MODEL from the environment.
// Default model: "gemini-2.0-flash"
export function createGoogleModel(options: ModelOptions = {}): ChatGoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_API_KEY. Add it to .env.local.");

  return new ChatGoogleGenerativeAI({
    apiKey,
    model: options.modelName ?? process.env.GOOGLE_MODEL ?? "gemini-2.0-flash",
    temperature: options.temperature ?? 0.7,
    streaming: options.streaming ?? false,
  });
}

// Provider dispatcher — use this when the provider may change at runtime.
export function createModel(
  provider: LLMProvider,
  options: ModelOptions = {}
): ChatOpenAI | ChatGoogleGenerativeAI {
  return provider === "google"
    ? createGoogleModel(options)
    : createOpenAIModel(options);
}
