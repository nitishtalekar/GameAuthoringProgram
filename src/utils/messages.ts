import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";

// Constructors
export const human = (content: string) => new HumanMessage({ content });
export const ai    = (content: string) => new AIMessage({ content });
export const system = (content: string) => new SystemMessage({ content });

// Swaps Human <-> AI roles. Pass-through for SystemMessages.
// Use when building conversation history from another agent's perspective.
export function swapRoles(messages: BaseMessage[]): BaseMessage[] {
  return messages.map((msg) => {
    if (msg instanceof HumanMessage) return new AIMessage({ content: msg.content });
    if (msg instanceof AIMessage) return new HumanMessage({ content: msg.content });
    return msg;
  });
}

// Returns the string content of the last message in an array (or "" if empty).
export function getLastMessageContent(messages: BaseMessage[]): string {
  if (messages.length === 0) return "";
  const last = messages[messages.length - 1];
  return typeof last.content === "string" ? last.content : JSON.stringify(last.content);
}

// Deserialize from plain { role, content } objects (e.g. incoming API request body).
export function deserializeMessages(
  raw: Array<{ role: "human" | "ai" | "system"; content: string }>
): BaseMessage[] {
  return raw.map(({ role, content }) => {
    if (role === "human") return new HumanMessage({ content });
    if (role === "ai") return new AIMessage({ content });
    return new SystemMessage({ content });
  });
}

// Serialize to plain { role, content } objects for JSON API responses.
export function serializeMessages(
  messages: BaseMessage[]
): Array<{ role: string; content: unknown }> {
  return messages.map((msg) => {
    let role = "unknown";
    if (msg instanceof HumanMessage) role = "human";
    else if (msg instanceof AIMessage) role = "ai";
    else if (msg instanceof SystemMessage) role = "system";
    return { role, content: msg.content };
  });
}
