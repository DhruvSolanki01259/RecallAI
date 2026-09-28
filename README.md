# RecallAI

RecallAI is a document-question-answering application. Upload up to five PDFs, then chat with an assistant that searches the uploaded content and returns grounded answers as streaming Markdown.

**Live Demo:** `https://your-recallai-deployment-url.vercel.app`

## What is implemented

* PDF upload validation: 1–5 files, PDF-only, maximum 20 MB per file.
* Page-aware text extraction with `unpdf`, recursive chunking, Hugging Face embeddings, and in-memory similarity search.
* A LangGraph conversation workflow with tool routing, retrieval, short-term conversation summarization, and in-memory checkpointing.
* Groq chat models for orchestration and RAG answer generation.
* Streaming chat endpoint and progressive Markdown rendering: headings, emphasis, lists, code, links, and paragraphs.
* Responsive upload/chat UI, error feedback, reset action, and a themed Not Found page.

## Tech stack

Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, LangChain, LangGraph, Groq, Hugging Face Inference, `unpdf`, and an in-memory LangChain vector store.

## RAG architecture

```text
PDF upload → text extraction by page → chunking → embeddings → MemoryVectorStore
User question → LangGraph chat node → rag_search tool → similarity retrieval
→ grounded Groq response → NDJSON tokens → Markdown chat UI
```

### Ingestion and retrieval

`POST /api/upload` temporarily writes validated PDFs, extracts page text, creates overlapping chunks, and adds them to the existing process-local vector store. Files are ingested sequentially so each upload is retained. Retrieval uses similarity search (`k: 20`) and provides retrieved context to the RAG tool.

The vector store is intentionally in memory: documents live only for the running server process and are not durable or isolated per user/session.

### LangGraph conversation flow

Each `/api/chat` request provides a browser-generated `conversationId`, which is used as LangGraph's `thread_id` for `MemorySaver` checkpoints.

1. `chat_node` receives the new user message plus conversation state.
2. If the model requests `rag_search`, `tool_node` retrieves document context and returns control to `chat_node`.
3. The model generates its grounded answer. When the message history exceeds 20 messages, `summarize_node` condenses older messages and keeps the latest six.
4. The API emits status and token records as newline-delimited JSON; the browser appends token text to the active assistant message.

## API routes

| Route              | Purpose                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/upload` | Validates and ingests uploaded PDF files. Send multipart form field `files`.                                                                                     |
| `POST /api/chat`   | Starts the LangGraph workflow. Send `{ "query": "...", "conversationId": "optional-id" }`; returns `application/x-ndjson` status, token, error, and done events. |

## Run locally

1. Install dependencies: `npm install`
2. Create `.env` with:

```env
GROQ_API_KEY=...
GROQ_MODEL=...
RAG_GROQ_API_KEY=...
RAG_GROQ_MODEL=...
HUGGINGFACEHUB_API_KEY=...
HUGGINGFACEHUB_MODEL=...
```

3. Start development: `npm run dev`
4. Open `http://localhost:3000`, upload PDFs, and ask a question.

For a production check, run `npm run build` followed by `npm start`.
