import { Document } from "langchain";
import { extractText } from "unpdf";
import fs from "fs/promises";

export const documentLoader = async (
  filePath: string,
  sourceName = filePath,
): Promise<Document[]> => {
  try {
    if (!filePath)
      throw new Error("[DOCUMENT LOADER ERROR]: File Path is not valid.");

    const docBuffer = await fs.readFile(filePath);

    const result = await extractText(new Uint8Array(docBuffer));
    if (!result.text.length) {
      throw new Error(
        "[DOCUMENT LOADER ERROR]: No text could be extracted from the document.",
      );
    }

    // console.log(result);

    return result.text.map(
      (pageText, index) =>
        new Document({
          pageContent: pageText,
          metadata: {
            source: sourceName,
            page: index + 1,
            totalPages: result.totalPages,
          },
        }),
    );
  } catch (error) {
    console.error(`[DOCUMENT LOADER ERROR]: ${error}`);
    throw new Error(
      error instanceof Error ? error.message : "Unknown Error Occured.",
    );
  }
};
