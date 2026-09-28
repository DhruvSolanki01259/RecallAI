import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "langchain";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 250;

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
});

export const documentSplitter = async (
  documents: Document[],
): Promise<Document[]> => {
  try {
    if (!documents.length) {
      throw new Error(
        `[DOCUMENT SPLITTER ERROR]: No documents present to split into chunks.`,
      );
    }

    const chunks = await splitter.splitDocuments(documents);
    if (!chunks) {
      throw new Error(`[DOCUMENT SPLITTER ERROR]: No chunks were created.`);
    }

    // console.log(chunks);

    return chunks;
  } catch (error) {
    console.error(`[DOCUMENT SPLITTER ERROR]: ${error}`);
    throw new Error(
      error instanceof Error ? error.message : "Unknown Error Occured.",
    );
  }
};
