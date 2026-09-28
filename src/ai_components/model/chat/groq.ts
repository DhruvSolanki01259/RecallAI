import { loadEnv } from "@/ai_components/utils/loadEnv";
import { ChatGroq } from "@langchain/groq";

export const getGroqChatModel = new ChatGroq({
  apiKey: loadEnv.GroqApiKey!,
  model: loadEnv.GroqModel!,
  temperature: 0.3,
  maxTokens: 700,
});
