import { loadEnv } from "@/ai_components/utils/loadEnv";
import { ChatGroq } from "@langchain/groq";

export const getRagModel = new ChatGroq({
  model: loadEnv.RagGroqModel!,
  apiKey: loadEnv.RagGroqApiKey!,
  temperature: 0.3,
  maxTokens: 700,
});
