import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { vectorStore } from "../vector-stores/vector.store";

export const vectorStoreRetriever = (): VectorStoreRetriever => {
  try {
    const store = vectorStore.getStore();

    if (!store) {
      throw new Error(
        `[VECTOR STORE RETRIEVER ERROR]: Vector Store is not created.`,
      );
    }

    return store.asRetriever({
      k: 5,
      searchType: "similarity",
    });
  } catch (error) {
    console.error(`[VECTOR STORE RETRIEVER ERROR]: ${error}`);
    throw new Error(
      error instanceof Error ? error.message : "Unknown Error Occured.",
    );
  }
};
