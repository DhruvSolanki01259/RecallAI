import { vectorStoreRetriever } from "../rag-components/retrievers/vector.store.retriever";

import { Document } from "langchain";
interface RetrievalResultResponse {
  success: boolean;
  error: true | null;
  data: {
    query: string;
    documents: Document[];
    totalRetrievedDocuments: number;
  } | null;
}

class RetrievalPipeline {
  private readonly retriever = async (
    userQuery: string,
  ): Promise<RetrievalResultResponse> => {
    if (!userQuery) {
      throw new Error(`[RETRIEVAL PIPELINE ERROR]: User query is required.`);
    }

    const retriever = vectorStoreRetriever();
    if (!retriever) {
      throw new Error(
        `[RETRIEVAL PIPELINE ERROR]: Could not find Vector Store Retriever.`,
      );
    }

    const retrievedData = await retriever.invoke(userQuery);
    if (!retrievedData.length) {
      throw new Error(
        `[RETRIEVAL PIPELINE ERROR]: No relevant documents found.`,
      );
    }

    return {
      success: true,
      error: null,
      data: {
        query: userQuery,
        documents: retrievedData,
        totalRetrievedDocuments: retrievedData.length,
      },
    };
  };

  async retrieve(userQuery: string): Promise<RetrievalResultResponse> {
    return this.retriever(userQuery);
  }
}

export const retrieval = new RetrievalPipeline();
