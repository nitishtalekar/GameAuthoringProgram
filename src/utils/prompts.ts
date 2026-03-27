import { ChatPromptTemplate } from "@langchain/core/prompts";

export interface PromptMessage {
  role: "system" | "human" | "ai";
  content: string; // may contain {variable} placeholders
}

// Async — supports pre-filling partial variables via the second argument.
export async function buildPrompt(
  messages: PromptMessage[],
  partials: Record<string, string> = {}
): Promise<ChatPromptTemplate> {
  const templateMessages = messages.map(({ role, content }) => {
    const r = role === "ai" ? "assistant" : role;
    return [r, content] as [string, string];
  });

  const prompt = ChatPromptTemplate.fromMessages(templateMessages);

  if (Object.keys(partials).length > 0) {
    return prompt.partial(partials) as unknown as ChatPromptTemplate;
  }

  return prompt;
}

// Synchronous — no partial fill support.
export function buildPromptSync(messages: PromptMessage[]): ChatPromptTemplate {
  const templateMessages = messages.map(({ role, content }) => {
    const r = role === "ai" ? "assistant" : role;
    return [r, content] as [string, string];
  });

  return ChatPromptTemplate.fromMessages(templateMessages);
}
