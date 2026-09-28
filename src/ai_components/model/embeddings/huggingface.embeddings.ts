import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { loadEnv } from "../../utils/loadEnv";

export const getHuggingFaceEmbeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: loadEnv.HuggingFaceApiKey,
  model: loadEnv.HuggingFaceModel,
  provider: "hf-inference",
});
