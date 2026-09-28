import { workflow } from "@/langgraph/workflow";
import { NextRequest } from "next/server";
import { HumanMessage } from "langchain";

import {
  encodeEvent,
  extractMessageContent,
  getNodeLabel,
} from "@/lib/api/streamHelper";

import {
  getConversationConfig,
  getStreamNodeName,
  StreamEvent,
} from "@/lib/api/chatUtils";
import { getErrorDetails } from "@/lib/api/errorHandler";
import { errorResponse } from "@/lib/api/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getRetryAfterSeconds = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null || !("headers" in error)) {
    return undefined;
  }

  const headers = error.headers;
  if (!headers || typeof headers !== "object" || !("get" in headers)) {
    return undefined;
  }

  const retryAfter = (headers as Headers).get("retry-after");
  const seconds = Number(retryAfter);
  return Number.isFinite(seconds) && seconds > 0
    ? Math.ceil(seconds)
    : undefined;
};

const isRateLimitError = (error: unknown, message: string) =>
  (error instanceof Error && error.name.toLowerCase().includes("ratelimit")) ||
  message.includes("429") ||
  message.includes("rate_limit");

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400, {
        name: "ValidationError",
        message: "The request body must contain valid JSON.",
        cause: undefined,
      });
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("query" in body) ||
      typeof body.query !== "string"
    ) {
      return errorResponse("Invalid request body", 400, {
        name: "ValidationError",
        message: "The request body must contain a valid query.",
        cause: undefined,
      });
    }

    const userQuery = body.query.trim();
    if (!userQuery) {
      return errorResponse("Query is required", 400, {
        name: "ValidationError",
        message: "A non-empty query is required.",
        cause: undefined,
      });
    }

    const conversationId =
      "conversationId" in body && typeof body.conversationId === "string"
        ? body.conversationId.trim() || crypto.randomUUID()
        : crypto.randomUUID();

    let result;
    try {
      result = await workflow.stream(
        {
          messages: [new HumanMessage(userQuery)],
        },
        getConversationConfig(conversationId),
      );
    } catch (error) {
      const { name, message, cause } = getErrorDetails(error);

      console.error("Failed to start Recall AI workflow:", {
        name,
        message,
        cause,
      });

      return errorResponse("Failed to invoke workflow", 500, {
        name,
        message,
        cause,
      });
    }

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let assistantContent = "";
        let streamClosed = false;

        const closeStream = () => {
          if (streamClosed) {
            return;
          }

          streamClosed = true;

          try {
            controller.close();
          } catch {
            // Stream may already be closed.
          }
        };

        const sendEvent = (event: StreamEvent) => {
          if (streamClosed) {
            return;
          }

          try {
            controller.enqueue(encodeEvent(encoder, event));
          } catch (error) {
            console.error("Failed to enqueue stream event:", error);
            streamClosed = true;
          }
        };

        const handleAbort = () => {
          console.log("Recall AI chat stream aborted.");

          streamClosed = true;

          try {
            controller.close();
          } catch {
            // Stream is already closed.
          }
        };

        request.signal.addEventListener("abort", handleAbort, {
          once: true,
        });

        // Workflow started
        sendEvent({
          type: "status",
          node: "workflow",
          message: "Thinking",
          conversationId,
        });

        try {
          for await (const chunk of result) {
            if (request.signal.aborted || streamClosed) {
              break;
            }

            if (!Array.isArray(chunk)) {
              continue;
            }

            const [mode, data] = chunk;

            if (mode === "messages") {
              if (!Array.isArray(data)) {
                continue;
              }

              const nodeName = getStreamNodeName(data);

              if (
                nodeName &&
                nodeName !== "chat_node" &&
                nodeName !== "answer_node"
              ) {
                continue;
              }

              const [messageChunk] = data;

              if (!messageChunk) {
                continue;
              }

              const token = extractMessageContent(messageChunk.content);

              if (!token) {
                continue;
              }

              assistantContent += token;

              sendEvent({
                type: "token",
                content: token,
              });

              continue;
            }

            if (mode === "updates") {
              if (typeof data !== "object" || data === null) {
                continue;
              }

              const entries = Object.entries(data);

              for (const [nodeName, nodeData] of entries) {
                if (request.signal.aborted || streamClosed) {
                  break;
                }

                const label = getNodeLabel(nodeName);

                sendEvent({
                  type: "status",
                  node: nodeName,
                  message: `${label} completed`,
                });

                void nodeData;
              }
            }
          }

          if (request.signal.aborted) {
            console.log("Recall AI chat request cancelled.");
            return;
          }

          const finalAssistantContent = assistantContent.trim();

          if (!finalAssistantContent) {
            throw new Error("No assistant response was generated.");
          }

          sendEvent({
            type: "done",
            conversationId,
          });

          closeStream();
        } catch (error) {
          if (request.signal.aborted) {
            return;
          }

          const { name, message, cause } = getErrorDetails(error);

          console.error("Recall AI streaming error:", {
            name,
            message,
            cause,
          });

          const retryAfterSeconds = getRetryAfterSeconds(error);
          const rateLimited = isRateLimitError(error, message);

          sendEvent({
            type: "error",
            message: rateLimited
              ? `RecallAI has reached Groq's temporary token limit. Please try again${retryAfterSeconds ? ` in about ${retryAfterSeconds} seconds` : " shortly"}.`
              : "Something went wrong while generating the response.",
            retryAfterSeconds,
          });

          closeStream();
        } finally {
          request.signal.removeEventListener("abort", handleAbort);
        }
      },

      cancel() {
        console.log("Recall AI chat stream cancelled.");
      },
    });

    // Return NDJSON stream
    return new Response(readable, {
      status: 200,

      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Accel-Buffering": "no",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const { name, message, cause } = getErrorDetails(error);

    console.error("POST /api/chat error:", {
      name,
      message,
      cause,
    });

    return errorResponse("Failed to invoke workflow", 500, {
      name,
      message,
      cause,
    });
  }
}
