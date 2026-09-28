import { StreamMode } from "@langchain/langgraph";

export interface ChatRequestBody {
  conversationId?: string;
  query?: string;
}

export interface Personalization {
  enabled: boolean;
  nickname: string;
  profession: string;
  interests: string;
  responseStyle: string;
  responseLength: string;
  technicalLevel: string;
  emojis: boolean;
  structuredResponses: boolean;
  instructions: string;
}

export interface StreamEvent {
  type: "token" | "status" | "title" | "done" | "error";
  content?: string;
  node?: string;
  message?: string;
  conversationId?: string;
  title?: string;
  retryAfterSeconds?: number;
}

export function getConversationConfig(conversationId: string) {
  return {
    configurable: {
      thread_id: conversationId,
    },
    streamMode: ["messages", "updates"] as StreamMode[],
  };
}

export function isChatRequestBody(body: unknown): body is ChatRequestBody {
  return typeof body === "object" && body !== null;
}

export function getStreamMessageMetadata(
  data: unknown,
): Record<string, unknown> {
  if (!Array.isArray(data)) {
    return {};
  }

  const metadata = data[1];

  if (typeof metadata === "object" && metadata !== null) {
    return metadata as Record<string, unknown>;
  }

  return {};
}

export function getStreamNodeName(data: unknown): string | undefined {
  const metadata = getStreamMessageMetadata(data);

  const nodeName =
    metadata.langgraph_node ?? metadata.langgraphNode ?? metadata.node;

  return typeof nodeName === "string" ? nodeName : undefined;
}
