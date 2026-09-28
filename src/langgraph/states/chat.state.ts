import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { BaseMessage } from "langchain";

export const ChatState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    value: messagesStateReducer,
    default: () => [],
  }),
  summary: Annotation<string>({
    value: (_, update) => update,
    default: () => "",
  }),
});
