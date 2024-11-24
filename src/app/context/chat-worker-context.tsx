"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useToast } from "@/hooks/use-toast";

type ChatWindowMessage = {
  content: string;
  role: "user" | "assistant";
  runId?: string;
  traceUrl?: string;
};

interface ChatWorkerContextType {
  worker: Worker | null;
  isLoading: boolean;
  queryStore: (messages: ChatWindowMessage[]) => Promise<ReadableStream>;
  embedPDF: (file: File, onReadyToChat?: () => void) => Promise<void>;
}

const ChatWorkerContext = createContext<ChatWorkerContextType | undefined>(
  undefined
);

export function WorkerProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const worker = useRef<Worker | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL("../worker.ts", import.meta.url), {
        type: "module",
      });
      setIsLoading(false);
    }
  }, []);

  const queryStore = async (
    messages: ChatWindowMessage[]
  ): Promise<ReadableStream> => {
    if (!worker.current) {
      throw new Error("Worker is not ready.");
    }

    return new ReadableStream({
      start(controller) {
        if (!worker.current) {
          controller.close();
          return;
        }

        const payload: Record<string, any> = {
          messages,
          modelConfig: {
            model: "Phi-3.5-mini-instruct-q4f16_1-MLC",
            chatOptions: {
              temperature: 0.1,
            },
          },
        };

        if (
          process.env.NEXT_PUBLIC_LANGCHAIN_TRACING_V2 === "true" &&
          process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY !== undefined
        ) {
          payload.DEV_LANGCHAIN_TRACING = {
            LANGCHAIN_TRACING_V2: "true",
            LANGCHAIN_API_KEY: process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY,
            LANGCHAIN_PROJECT: process.env.NEXT_PUBLIC_LANGCHAIN_PROJECT,
          };
        }

        worker.current?.postMessage(payload);

        const onMessageReceived = async (e: any) => {
          switch (e.data.type) {
            case "log":
              console.log(e.data);
              break;
            case "init_progress":
              toast({
                title: "Cargando modelos...",
                description: `Este proceso puede durar unos minutos: ${
                  e.data.data.progress * 100
                }%`,
              });
              break;
            case "chunk":
              controller.enqueue(e.data.data);
              break;
            case "error":
              worker.current?.removeEventListener("message", onMessageReceived);
              console.log(e.data.error);
              controller.error(new Error(e.data.error));
              break;
            case "complete":
              worker.current?.removeEventListener("message", onMessageReceived);
              controller.close();
              break;
          }
        };

        worker.current?.addEventListener("message", onMessageReceived);
      },
    });
  };

  const embedPDF = async (
    file: File,
    onReadyToChat?: () => void
  ): Promise<void> => {
    if (!worker.current) {
      throw new Error("Worker is not ready.");
    }

    return new Promise((resolve, reject) => {
      worker.current?.postMessage({ pdf: file });

      const onMessageReceived = (e: any) => {
        switch (e.data.type) {
          case "log":
            console.log(e.data);
            break;
          case "error":
            worker.current?.removeEventListener("message", onMessageReceived);
            console.log(e.data.error);
            reject(new Error(e.data.error));
            break;
          case "complete":
            worker.current?.removeEventListener("message", onMessageReceived);
            onReadyToChat?.();
            resolve();
            break;
        }
      };

      worker.current?.addEventListener("message", onMessageReceived);
    });
  };

  const value = {
    worker: worker.current,
    isLoading,
    queryStore,
    embedPDF,
  };

  return (
    <ChatWorkerContext.Provider value={value}>
      {children}
    </ChatWorkerContext.Provider>
  );
}

// Custom hook to use the worker context
export function useChatWorker() {
  const context = useContext(ChatWorkerContext);
  if (context === undefined) {
    throw new Error("useWorker must be used within a WorkerProvider");
  }
  return context;
}
