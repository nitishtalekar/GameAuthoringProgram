import type { BaseMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { GraphState, NodeFunction } from "./types";

export interface AgentNodeOptions {
  // A pre-built ChatPromptTemplate. Its messages are prepended before state.messages.
  prompt?: ChatPromptTemplate;
  // Plain system prompt string. Ignored if `prompt` is provided.
  systemPrompt?: string;
}

export function buildAgentNode(
  llm: BaseChatModel,
  options: AgentNodeOptions = {}
): NodeFunction {
  return async (
    state: GraphState,
    _config?: RunnableConfig
  ): Promise<Partial<GraphState>> => {
    let messages: BaseMessage[] = state.messages;

    if (options.prompt) {
      const formatted = await options.prompt.formatMessages({});
      messages = [...formatted, ...state.messages];
    } else if (options.systemPrompt) {
      const { SystemMessage } = await import("@langchain/core/messages");
      messages = [new SystemMessage(options.systemPrompt), ...state.messages];
    }

    const response = await llm.invoke(messages);
    return { messages: [response] };
  };
}

// For single-turn chains outside of a LangGraph workflow.
export function buildChain(prompt: ChatPromptTemplate, llm: BaseChatModel) {
  return prompt.pipe(llm);
}
