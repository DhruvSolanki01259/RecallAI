import { SystemMessage } from "@langchain/core/messages";

import { ChatState } from "../states/chat.state";
import { tools } from "../tools/index";
import { getGroqChatModel } from "@/ai_components/model/chat/groq";
import { RECALLAI_SYSTEM_PROMPT } from "@/ai_components/prompts/recallai.system.prompt";

const model = getGroqChatModel;

const modelWithTools = model.bindTools(tools);

export const ChatNode = async (state: typeof ChatState.State) => {
  const messages = [
    new SystemMessage(RECALLAI_SYSTEM_PROMPT),
    ...state.messages,
  ];

  const response = await modelWithTools.invoke(messages);

  return {
    messages: [response],
  };
};
