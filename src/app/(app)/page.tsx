"use client";

import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowUp,
  Check,
  FileText,
  RefreshCw,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { MAX_DOCUMENTS, features, initialMessages } from "@/utils/ui-data";

import { DocumentItem } from "@/utils/document-item";
import { ChatMessage } from "@/utils/chat-message";
import { COLORS } from "@/utils/colors";
import Footer from "@/components/ui/Footer";
import Header from "@/components/ui/Header";

export default function HTMLFormElement() {
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<Map<string, File>>(new Map());
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [streamStatus, setStreamStatus] = useState(
    "Searching your documents...",
  );
  const conversationIdRef = useRef<string>(crypto.randomUUID());

  const hasDocuments = documents.length > 0;
  const canAddMore = documents.length < MAX_DOCUMENTS;

  useEffect(() => {
    const chatScroll = chatScrollRef.current;
    if (!chatScroll) return;

    chatScroll.scrollTo({ top: chatScroll.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const addFiles = (files: File[]) => {
    const remainingSlots = MAX_DOCUMENTS - documents.length;

    if (remainingSlots <= 0) {
      toast.error("You can upload a maximum of 5 documents.");
      return;
    }

    const nextFiles = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast("Only 5 documents can be uploaded at once.", {
        icon: "!",
        style: {
          background: COLORS.secondary,
          color: COLORS.text,
        },
      });
    }

    const validFiles = nextFiles.filter((file) => {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        toast.error(`${file.name} is not a PDF. Only PDF files are allowed.`);
        return false;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 20 MB file size limit.`);
        return false;
      }

      return true;
    });

    const newDocuments: DocumentItem[] = validFiles.map((file) => {
      const id = `${file.name}-${file.lastModified}-${crypto.randomUUID()}`;

      filesRef.current.set(id, file);

      return {
        id,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || "application/pdf",
      };
    });

    setDocuments((current) => [...current, ...newDocuments]);
    setDocumentsUploaded(false);

    if (newDocuments.length > 0) {
      toast.success(
        `${newDocuments.length} document${newDocuments.length > 1 ? "s" : ""} added.`,
      );
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (!canAddMore) {
      toast.error("You already have the maximum of 5 documents.");
      return;
    }

    addFiles(Array.from(event.dataTransfer.files));
  };

  const removeDocument = (id: string) => {
    filesRef.current.delete(id);

    setDocuments((current) => current.filter((document) => document.id !== id));

    setDocumentsUploaded(false);
    toast("Document removed.", {
      style: {
        background: COLORS.secondary,
        color: COLORS.text,
      },
    });
  };

  const handleUpload = async () => {
    if (!hasDocuments) {
      toast.error("Add at least one document first.");
      return;
    }

    if (isUploading) {
      return;
    }

    const files = documents
      .map((document) => filesRef.current.get(document.id))
      .filter((file): file is File => file instanceof File);

    if (files.length === 0) {
      toast.error(
        "The selected files are no longer available. Please select them again.",
      );
      return;
    }

    if (files.length !== documents.length) {
      toast.error(
        "Some selected files are unavailable. Please select them again.",
      );
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          String(
            result.message ||
              result.error?.message ||
              "Documents could not be uploaded.",
          ),
        );
      }

      // console.log(`API CALL RESULT: `, result);

      setDocumentsUploaded(true);
      conversationIdRef.current = crypto.randomUUID();
      setMessages(initialMessages);

      toast.success(
        result.message ||
          "Documents are ready. You can start asking questions.",
      );
    } catch (error) {
      console.error("RecallAI upload error:", error);

      setDocumentsUploaded(false);

      toast.error(
        error instanceof Error
          ? error.message
          : "Documents could not be uploaded.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAsk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) return;

    if (!documentsUploaded) {
      toast.error("Upload your documents before starting a conversation.");
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuery,
    };

    setMessages((current) => [...current, userMessage]);
    setQuery("");
    setIsThinking(true);

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((current) => [...current, assistantMessage]);
    setStreamStatus("Thinking...");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmedQuery,
          conversationId: conversationIdRef.current,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.message || "The chat request could not be started.",
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      let receivedAnswer = false;

      const processEvent = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line) as {
          type: "token" | "status" | "error" | "done";
          content?: string;
          message?: string;
        };

        if (event.type === "token" && event.content) {
          receivedAnswer = true;
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessage.id
                ? { ...message, content: message.content + event.content }
                : message,
            ),
          );
        } else if (event.type === "status" && event.message) {
          setStreamStatus(event.message);
        } else if (event.type === "error") {
          throw new Error(
            event.message || "The response could not be generated.",
          );
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const lines = pending.split("\n");
        pending = lines.pop() ?? "";
        lines.forEach(processEvent);
        if (done) break;
      }

      if (pending) processEvent(pending);
      if (!receivedAnswer) throw new Error("No answer was generated.");
    } catch (error) {
      setMessages((current) =>
        current.filter((message) => message.id !== assistantMessage.id),
      );
      toast.error(
        error instanceof Error
          ? error.message
          : "The response could not be generated.",
      );
    } finally {
      setIsThinking(false);
      setStreamStatus("Searching your documents...");
    }
  };

  return (
    <div
      className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden"
      style={{
        backgroundColor: COLORS.background,
        color: COLORS.text,
      }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2800,
          style: {
            background: COLORS.secondary,
            color: COLORS.text,
            border: `1px solid ${COLORS.primary}`,
            boxShadow: "none",
          },
        }}
      />

      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <AnimatePresence mode="wait">
          {!documentsUploaded ? (
            <motion.section
              key="upload"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35 }}
              className="mx-auto max-w-5xl"
            >
              <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
                <div className="min-w-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                    style={{
                      borderColor: `${COLORS.accent}35`,
                      backgroundColor: COLORS.secondary,
                      color: COLORS.primary,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: COLORS.accent }}
                    />
                    Your private document workspace
                  </motion.div>

                  <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                    Ask questions.
                    <br />
                    <span style={{ color: COLORS.primary }}>
                      Get answers from your documents.
                    </span>
                  </h1>

                  <p
                    className="mt-5 max-w-xl text-base leading-7 sm:text-lg"
                    style={{ color: `${COLORS.text}B3` }}
                  >
                    RecallAI turns your documents into a searchable knowledge
                    base. Upload up to five files, then ask questions in plain
                    language and explore answers grounded in what you provided.
                  </p>

                  <AnimatedGroup
                    preset="slide"
                    className="mt-8 grid gap-3 sm:grid-cols-3"
                  >
                    {features.map((feature) => {
                      const Icon = feature.icon;

                      return (
                        <div
                          key={feature.title}
                          className="rounded-2xl border p-4"
                          style={{
                            borderColor: `${COLORS.primary}18`,
                            backgroundColor: COLORS.secondary,
                          }}
                        >
                          <div
                            className="mb-3 grid size-9 place-items-center rounded-xl"
                            style={{
                              backgroundColor: COLORS.background,
                              color: COLORS.primary,
                            }}
                          >
                            <Icon size={17} />
                          </div>

                          <h2 className="text-sm font-bold">{feature.title}</h2>

                          <p
                            className="mt-1.5 text-xs leading-5"
                            style={{ color: `${COLORS.text}99` }}
                          >
                            {feature.description}
                          </p>
                        </div>
                      );
                    })}
                  </AnimatedGroup>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="min-w-0 rounded-3xl border p-4 shadow-sm sm:p-6"
                  style={{
                    borderColor: `${COLORS.primary}20`,
                    backgroundColor: COLORS.secondary,
                  }}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">Add documents</p>
                      <p
                        className="mt-1 text-sm"
                        style={{ color: `${COLORS.text}99` }}
                      >
                        {documents.length}/{MAX_DOCUMENTS} documents selected
                      </p>
                    </div>

                    <div
                      className="rounded-full px-3 py-1 text-xs font-bold"
                      style={{
                        backgroundColor: COLORS.background,
                        color: COLORS.primary,
                      }}
                    >
                      Max 5
                    </div>
                  </div>

                  <motion.div
                    animate={{
                      scale: isDragging ? 1.015 : 1,
                      borderColor: isDragging
                        ? COLORS.accent
                        : `${COLORS.primary}30`,
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className="rounded-2xl border-2 border-dashed p-6 text-center sm:p-8"
                    style={{
                      backgroundColor: COLORS.background,
                    }}
                  >
                    <motion.div
                      animate={{ y: isDragging ? -4 : 0 }}
                      className="mx-auto grid size-14 place-items-center rounded-2xl"
                      style={{
                        backgroundColor: COLORS.primary,
                        color: COLORS.background,
                      }}
                    >
                      <Upload size={24} />
                    </motion.div>

                    <h2 className="mt-5 text-base font-bold">
                      Drop your files here
                    </h2>

                    <p
                      className="mx-auto mt-2 max-w-sm text-sm leading-6"
                      style={{ color: `${COLORS.text}99` }}
                    >
                      PDF documents only. You can upload between 1 and 5
                      documents, with a maximum size of 20 MB per file.
                    </p>

                    <button
                      type="button"
                      disabled={!canAddMore}
                      onClick={() => inputRef.current?.click()}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-transform disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        backgroundColor: COLORS.primary,
                        color: COLORS.background,
                      }}
                    >
                      <Upload size={16} />
                      Choose files
                    </button>

                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      accept="application/pdf,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </motion.div>

                  <AnimatePresence initial={false}>
                    {documents.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-2 overflow-hidden"
                      >
                        {documents.map((document) => (
                          <motion.div
                            layout
                            key={document.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex min-w-0 items-center gap-3 rounded-xl border p-3"
                            style={{
                              borderColor: `${COLORS.primary}18`,
                              backgroundColor: COLORS.background,
                            }}
                          >
                            <div
                              className="grid size-9 shrink-0 place-items-center rounded-lg"
                              style={{
                                backgroundColor: COLORS.secondary,
                                color: COLORS.primary,
                              }}
                            >
                              <FileText size={17} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="max-w-full truncate text-sm font-semibold">
                                {document.name}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: `${COLORS.text}80` }}
                              >
                                {document.size}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeDocument(document.id)}
                              className="grid size-8 shrink-0 place-items-center rounded-lg"
                              style={{
                                color: COLORS.text,
                                backgroundColor: COLORS.secondary,
                              }}
                              aria-label={`Remove ${document.name}`}
                            >
                              <X size={15} />
                            </button>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="button"
                    disabled={!hasDocuments || isUploading}
                    onClick={handleUpload}
                    whileHover={hasDocuments && !isUploading ? { y: -1 } : {}}
                    whileTap={
                      hasDocuments && !isUploading ? { scale: 0.98 } : {}
                    }
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45"
                    style={{
                      backgroundColor: COLORS.primary,
                      color: COLORS.background,
                    }}
                  >
                    {isUploading ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            ease: "linear",
                          }}
                        >
                          <RefreshCw size={16} />
                        </motion.span>
                        Preparing documents...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        Upload & start asking
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="chat"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="grid h-[calc(100dvh-10.5rem)] min-h-96 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border sm:min-h-128 sm:rounded-3xl lg:h-[calc(100dvh-9rem)] lg:min-h-170 lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-1"
              style={{
                borderColor: `${COLORS.primary}20`,
                backgroundColor: COLORS.background,
              }}
            >
              <aside
                className="overflow-hidden border-b p-4 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r"
                style={{ borderColor: `${COLORS.primary}18` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Your documents</p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: `${COLORS.text}80` }}
                    >
                      {documents.length} of {MAX_DOCUMENTS} slots used
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={!canAddMore}
                    className="grid size-8 place-items-center rounded-lg disabled:opacity-40"
                    style={{
                      backgroundColor: COLORS.secondary,
                      color: COLORS.primary,
                    }}
                    aria-label="Add another document"
                  >
                    <Upload size={15} />
                  </button>

                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="recall-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-5 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex w-52 shrink-0 items-center gap-3 rounded-xl border p-3 lg:w-auto"
                      style={{
                        borderColor: `${COLORS.primary}18`,
                        backgroundColor: COLORS.secondary,
                      }}
                    >
                      <FileText
                        size={17}
                        className="shrink-0"
                        style={{ color: COLORS.primary }}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {document.name}
                        </p>
                        <p
                          className="mt-0.5 text-[11px]"
                          style={{ color: `${COLORS.text}75` }}
                        >
                          {document.size}
                        </p>
                      </div>

                      <Check
                        size={15}
                        style={{ color: COLORS.accent }}
                        strokeWidth={2.5}
                      />
                    </div>
                  ))}
                </div>

                <div
                  className="mt-4 rounded-xl border p-3 lg:mt-5"
                  style={{
                    borderColor: `${COLORS.accent}30`,
                    backgroundColor: COLORS.secondary,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} style={{ color: COLORS.accent }} />
                    <span className="text-xs font-bold">Grounded mode</span>
                  </div>

                  <p
                    className="mt-1.5 text-[11px] leading-5"
                    style={{ color: `${COLORS.text}85` }}
                  >
                    Answers should be generated from the documents in this
                    session.
                  </p>
                </div>
              </aside>

              <div className="flex min-h-0 flex-col">
                <div
                  className="border-b px-4 py-4 sm:px-6"
                  style={{ borderColor: `${COLORS.primary}18` }}
                >
                  <p className="text-sm font-bold">Document chat</p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: `${COLORS.text}80` }}
                  >
                    Ask anything about your uploaded knowledge.
                  </p>
                </div>

                <div
                  ref={chatScrollRef}
                  className="recall-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-6"
                >
                  <div className="mx-auto flex max-w-3xl flex-col gap-5">
                    <AnimatePresence initial={false}>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{
                            opacity: 0,
                            y: 10,
                            scale: 0.99,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                          }}
                          className={`flex ${
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className="max-w-[94%] wrap-break-words rounded-2xl px-4 py-3 sm:max-w-[75%]"
                            style={{
                              backgroundColor:
                                message.role === "user"
                                  ? COLORS.primary
                                  : COLORS.secondary,
                              color:
                                message.role === "user"
                                  ? COLORS.background
                                  : COLORS.text,
                            }}
                          >
                            {message.role === "assistant" ? (
                              <div className="recall-markdown min-w-0 text-sm leading-6">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-sm leading-6">
                                {message.content}
                              </p>
                            )}

                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {message.sources.map((source) => (
                                  <span
                                    key={source}
                                    className="rounded-lg px-2 py-1 text-[10px] font-semibold"
                                    style={{
                                      backgroundColor: COLORS.background,
                                      color: COLORS.text,
                                    }}
                                  >
                                    {source}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isThinking && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-xs font-medium"
                        style={{ color: COLORS.primary }}
                      >
                        <motion.span
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.9,
                          }}
                          className="size-2 rounded-full"
                          style={{ backgroundColor: COLORS.accent }}
                        />
                        {streamStatus}
                      </motion.div>
                    )}
                  </div>
                </div>

                <div
                  className="border-t p-4 sm:p-6"
                  style={{ borderColor: `${COLORS.primary}18` }}
                >
                  <form
                    onSubmit={handleAsk}
                    className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border p-2 shadow-sm"
                    style={{
                      borderColor: `${COLORS.primary}25`,
                      backgroundColor: COLORS.secondary,
                    }}
                  >
                    <textarea
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      rows={1}
                      placeholder="Ask RecallAI about your documents..."
                      className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-base leading-6 outline-none placeholder:opacity-50 sm:text-sm"
                      style={{ color: COLORS.text }}
                    />

                    <motion.button
                      type="submit"
                      disabled={!query.trim() || isThinking}
                      whileTap={{ scale: 0.94 }}
                      className="grid size-11 shrink-0 place-items-center rounded-xl transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        backgroundColor: COLORS.primary,
                        color: COLORS.background,
                      }}
                      aria-label="Send question"
                    >
                      <ArrowUp size={18} />
                    </motion.button>
                  </form>

                  <p
                    className="mx-auto mt-2 max-w-3xl text-center text-[10px]"
                    style={{ color: `${COLORS.text}65` }}
                  >
                    RecallAI answers should remain grounded in your uploaded
                    documents.
                  </p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
