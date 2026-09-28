import { documentSplitter } from "../rag-components/splitters/document.splitter";
import { documentLoader } from "../rag-components/loaders/document.loader";
import { vectorStore } from "../rag-components/vector-stores/vector.store";

interface IngestionResultResponse {
  success: boolean;
  error: true | null;
  data: {
    totalDocuments: number;
    totalChunks: number;
  } | null;
}

class IngestionsPipeline {
  private readonly ingestTrace = async (
    filePath: string,
    sourceName?: string,
  ): Promise<IngestionResultResponse> => {
    if (!filePath) {
      throw new Error(`[INGESTION PIPELINE ERROR]: Document Path is required.`);
    }

    const documents = await documentLoader(filePath, sourceName);
    if (!documents.length) {
      throw new Error(`[INGESTION PIPELINE ERROR]: No documents were loaded.`);
    }

    const chunks = await documentSplitter(documents);
    if (!chunks.length) {
      throw new Error(`[INGESTION PIPELINE ERROR]: Chunking was not done.`);
    }

    const store = await vectorStore.create(chunks);
    if (!store) {
      throw new Error(
        `[INGESTION PIPELINE ERROR]: Vector Store creation failed.`,
      );
    }

    return {
      success: true,
      error: null,
      data: {
        totalDocuments: documents.length,
        totalChunks: chunks.length,
      },
    };
  };

  async ingest(
    filePath: string,
    sourceName?: string,
  ): Promise<IngestionResultResponse> {
    return this.ingestTrace(filePath, sourceName);
  }
}

export const ingestion = new IngestionsPipeline();
