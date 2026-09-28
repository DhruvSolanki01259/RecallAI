import { FileText, Search, Sparkles } from "lucide-react";
import { ChatMessage } from "./chat-message";

export const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_DOCUMENTS = 5;

export const features = [
  {
    icon: FileText,
    title: "Upload your documents",
    description:
      "Bring together up to five documents and keep your questions grounded in the material.",
  },
  {
    icon: Search,
    title: "Ask naturally",
    description:
      "Ask questions, summarize sections, compare ideas, or find specific information.",
  },
  {
    icon: Sparkles,
    title: "Get grounded answers",
    description:
      "RecallAI is designed to answer from your uploaded knowledge instead of guessing.",
  },
];

export const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: `Your documents are ready. Ask me anything about them, and I’ll keep the answers grounded in your uploaded material.

> **Free model notice:** Groq’s free model has TPM limits. Please avoid sending requests too quickly. If you hit the limit, wait a moment and try again.
`,
  },
];
