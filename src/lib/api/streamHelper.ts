import type { StreamEvent } from "@/lib/api/chatUtils";

export const extractMessageContent = (content: unknown): string => {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "text" in item &&
        typeof item.text === "string"
      ) {
        return item.text;
      }

      return "";
    })
    .join("");
};

export const encodeEvent = (
  encoder: TextEncoder,
  event: StreamEvent,
): Uint8Array => {
  return encoder.encode(`${JSON.stringify(event)}\n`);
};

export const getNodeLabel = (nodeName: string): string => {
  const normalized = nodeName.toLowerCase();

  if (
    normalized.includes("search") ||
    normalized.includes("retrieve") ||
    normalized.includes("memory")
  ) {
    return "Searching memory";
  }

  if (
    normalized.includes("tool") ||
    normalized.includes("browser") ||
    normalized.includes("api")
  ) {
    return "Using tools";
  }

  if (normalized.includes("reason") || normalized.includes("think")) {
    return "Thinking";
  }

  if (
    normalized.includes("model") ||
    normalized.includes("llm") ||
    normalized.includes("agent")
  ) {
    return "Generating response";
  }

  return nodeName
    .replace(/[\_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
};
