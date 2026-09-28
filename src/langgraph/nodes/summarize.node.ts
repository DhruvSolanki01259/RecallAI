import { ChatState } from "../states/chat.state";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from "langchain";
import { RemoveMessage } from "@langchain/core/messages";
import { getGroqChatModel } from "@/ai_components/model/chat/groq";
import { SHORT_TERM_MEMORY_PROMPT } from "@/ai_components/prompts/short.term.memory.prompt";

const MAX_MESSAGES_LIMIT = 20;
const KEEP_LATEST_MESSAGES = 6;

const model = getGroqChatModel;

const getPrompt = async (state: typeof ChatState.State) => {
  const messagesToTrim = state.messages.slice(0, -KEEP_LATEST_MESSAGES);
  const conversationHistory = messagesToTrim.map((msg) => {
    let role = null;

    if (msg instanceof AIMessage) role = "AI";
    else if (msg instanceof HumanMessage) role = "HUMAN";
    else if (msg instanceof ToolMessage) role = "TOOL";
    else if (msg instanceof SystemMessage) role = "SYSTEM";

    return `${role} - ${msg.content}`;
  });

  const summaryPresent = state.summary ? true : false;
  const systemPrompt = SHORT_TERM_MEMORY_PROMPT(summaryPresent);

  const formattedPrompt = await systemPrompt.format({
    conversation: conversationHistory,
    summary: state.summary,
  });
  return formattedPrompt;
};

export const SummarizeNode = async (state: typeof ChatState.State) => {
  if (state.messages.length <= MAX_MESSAGES_LIMIT) return {};

  const prompt = await getPrompt(state);
  const response = await model.invoke(prompt);

  const updatedSummary =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  const messagesToTrim = state.messages.slice(0, -KEEP_LATEST_MESSAGES);
  const deleteMessages = messagesToTrim.map(
    (msg) => new RemoveMessage({ id: msg.id! }),
  );

  return { messages: deleteMessages, summary: updatedSummary };
};
