import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

import { ingestion } from "@/ai_components/pipeline/ingestion.pipeline";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export const POST = async (request: NextRequest) => {
  let tempDirectory = "";

  try {
    const formData = await request.formData();

    const uploadedFiles = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "At least one PDF file is required.",
          error: {
            name: "ValidationError",
            message: "At least one file is required.",
          },
        },
        { status: 400 },
      );
    }

    if (uploadedFiles.length > MAX_FILES) {
      return NextResponse.json(
        {
          success: false,
          message: "You can upload at most 5 PDF files at a time.",
          error: {
            name: "ValidationError",
            message: "Maximum 5 files are allowed.",
          },
        },
        { status: 400 },
      );
    }

    for (const file of uploadedFiles) {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        return NextResponse.json(
          {
            success: false,
            message: `Only PDF files are allowed. Invalid file: ${file.name}`,
            error: {
              name: "ValidationError",
              message: "Only PDF files are accepted.",
            },
          },
          { status: 415 },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message: `${file.name} must be smaller than 20 MB.`,
            error: {
              name: "ValidationError",
              message: "File must be smaller than 20 MB.",
            },
          },
          { status: 413 },
        );
      }
    }

    tempDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "recallai-upload-"),
    );

    const tempFiles: {
      originalName: string;
      tempPath: string;
      size: number;
      type: string;
    }[] = [];

    for (const file of uploadedFiles) {
      const safeName = `${crypto.randomUUID()}.pdf`;
      const tempPath = path.join(tempDirectory, safeName);

      const buffer = Buffer.from(await file.arrayBuffer());

      await fs.writeFile(tempPath, buffer);

      tempFiles.push({
        originalName: file.name,
        tempPath,
        size: file.size,
        type: file.type || "application/pdf",
      });
    }

    const ingestionResults = [];
    for (const file of tempFiles) {
      try {
        const result = await ingestion.ingest(file.tempPath, file.originalName);

        ingestionResults.push({
          name: file.originalName,
          size: file.size,
          type: file.type,
          success: result.success,
          error: result.success ? undefined : result.error,
          total_documents: result.data?.totalDocuments,
          total_chunks: result.data?.totalChunks,
        });
      } catch (error) {
        ingestionResults.push({
          name: file.originalName,
          size: file.size,
          type: file.type,
          success: false,
          error: error instanceof Error ? error.message : "Ingestion failed.",
        });
      }
    }

    const failedFiles = ingestionResults.filter((result) => !result.success);

    if (failedFiles.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more files failed during ingestion.",
          files: ingestionResults,
        },
        { status: 422 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${uploadedFiles.length} PDF file${
          uploadedFiles.length > 1 ? "s" : ""
        } uploaded and processed successfully.`,
        ingestionResults,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("[RecallAI Upload Error]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process the uploaded documents.",
        error: {
          name: errorName,
          message: errorMessage,
        },
      },
      { status: 500 },
    );
  } finally {
    if (tempDirectory) {
      try {
        await fs.rm(tempDirectory, {
          recursive: true,
          force: true,
        });

        console.log(`[Upload Cleanup] Removed: ${tempDirectory}`);
      } catch (error) {
        console.error("[Temp Directory Cleanup Error]", error);
      }
    }
  }
};
