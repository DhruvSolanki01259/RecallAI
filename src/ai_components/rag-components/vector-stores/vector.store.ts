import { getHuggingFaceEmbeddings } from "@/ai_components/model/embeddings/huggingface.embeddings";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";

class VectorStoreManager {
  private readonly embeddings = getHuggingFaceEmbeddings;
  private store: MemoryVectorStore | null = null;

  constructor() {
    console.log(`[VECTOR STORE SUCCESS]: Vector Store Initialized.`);
  }

  async create(documents: Document[]): Promise<MemoryVectorStore> {
    console.log("Creating Vector Store.");

    if (!documents.length) {
      throw new Error(
        `[VECTOR STORE ERROR]: No documents are present to store in the vector store.`,
      );
    }

    if (this.store) {
      await this.store.addDocuments(documents);
      return this.store;
    }

    this.store = await MemoryVectorStore.fromDocuments(documents, this.embeddings);
    return this.store;
  }

  getStore(): MemoryVectorStore {
    console.log("Getting Vector Store.");

    if (!this.store) {
      throw new Error(`[VECTOR STORE ERROR]: Vector Store is not Initialized.`);
    }

    return this.store;
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (!documents.length) {
      throw new Error(
        `[VECTOR STORE ERROR]: No documents present for storing in Vector Store.`,
      );
    }

    const store = this.getStore();
    await store.addDocuments(documents);
    return;
  }
}

export const vectorStore = new VectorStoreManager();
