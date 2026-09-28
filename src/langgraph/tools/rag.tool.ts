import { RAG_SYSTEM_PROMPT } from "@/ai_components/prompts/rag.system.prompt";
import { retrieval } from "@/ai_components/pipeline/retrieval.pipeline";
import { getRagModel } from "@/ai_components/model/rag/rag-model";
import { tool } from "langchain";
import { z } from "zod";

const systemPrompt = RAG_SYSTEM_PROMPT;
const model = getRagModel;
const MAX_DOCUMENT_CHARACTERS = 1_800;

export const RagTool = tool(
  async ({ query }) => {
    try {
      const { data } = await retrieval.retrieve(query);
      const context = data?.documents
        .map(
          (doc, index) => `
          [DOC-${index + 1}]
          Source: ${doc.metadata?.source ?? "Unknown Source"}
          Page: ${doc.metadata?.page ?? "Unknown"}
         Relevance Score: ${
           doc.metadata?.relevanceScore != null
             ? `${(doc.metadata.relevanceScore * 100).toFixed(2)}%`
             : "Unknown"
         }

          Content:
          ${doc.pageContent.slice(0, MAX_DOCUMENT_CHARACTERS)}
        `,
        )
        .join("\n==================================================\n\n");

      const prompt = await systemPrompt.format({ query, context });
      const response = await model.invoke(prompt);
      return response.content;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown Error Message Occured.";
      const errorName =
        error instanceof Error ? error.name : "Unknown Error Name Occured.";
      console.log(`[RAG TOOL ERROR]: `, error);

      if (
        errorName.toLowerCase().includes("ratelimit") ||
        errorMessage.includes("429") ||
        errorMessage.includes("rate_limit")
      ) {
        throw error;
      }

      return {
        success: false,
        error: { name: errorName, message: errorMessage },
      };
    }
  },
  {
    name: "rag_search",
    description:
      "Search the knowledge base for relevant documents and information related to the user's query. Use this tool when the user asks about information that may be available in the uploaded or indexed documents.",
    schema: z.object({
      query: z.string().min(1).describe("The user's question or search query."),
    }),
  },
);
