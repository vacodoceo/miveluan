"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ToasterToast, useToast } from "@/hooks/use-toast";
import type { MemoryVectorStore } from "langchain/vectorstores/memory";
import { useAuth } from "@/app/contexts/auth.context";
import { getVectorsFromGoogleDrive } from "@/lib/repositories/vectors/sync-vectors";
import { VECTOR_FOLDER_NAME, VECTOR_FILE_NAME } from "@/constants";

type MemoryVector = MemoryVectorStore["memoryVectors"][number];
import { ChatMessage } from "../components/chat/chat";
import { useMedicalRecords } from "../contexts/medical-record.context";

interface ChatWorkerContextType {
  worker: Worker | null;
  isLoading: boolean;
  queryStore: (messages: ChatMessage[]) => Promise<ReadableStream>;
  embedPDF: (
    file: File,
    onReadyToChat?: () => void
  ) => Promise<MemoryVector[] | undefined>;
  vectors: MemoryVector[];
}

const ChatWorkerContext = createContext<ChatWorkerContextType | undefined>(
  undefined
);

export function WorkerProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const { accessToken } = useAuth();
  const [areEmbeddingsLoaded, setAreEmbeddingsLoaded] = useState(false);
  const { records } = useMedicalRecords();

  const [vectors, setVectors] = useState<MemoryVector[]>([]);
  const worker = useRef<Worker | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (records.length > 0) {
      worker.current?.postMessage({
        records,
        type: "log",
      });
    }
  }, [records]);

  useEffect(() => {
    if (areEmbeddingsLoaded) return;
    if (!accessToken) return;
    console.log("loading vectors");
    setAreEmbeddingsLoaded(true);
    getVectorsFromGoogleDrive(
      VECTOR_FILE_NAME,
      VECTOR_FOLDER_NAME,
      accessToken
    ).then((vectors) => {
      const mappedVectors = vectors.map((vector) => ({
        ...vector,
        metadata: vector.metadata || {},
      }));
      setVectors(mappedVectors);
      worker.current?.postMessage({
        vectors: mappedVectors,
        type: "log",
      });
      setAreEmbeddingsLoaded(true);
    });
  }, [accessToken]);
  const initToast = useRef<null | {
    update: (params: ToasterToast) => void;
    id: string;
    dismiss: () => void;
  }>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL("../worker.ts", import.meta.url), {
        type: "module",
      });
    }

    setIsLoading(false);
  }, []);

  const queryStore = async (
    messages: ChatMessage[]
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

        const payload: Record<string, any> = { messages };

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
              setIsLoading(true);
              if (initToast.current) {
                initToast.current.update({
                  id: initToast.current.id,
                  title: "Cargando modelos",
                  description: (
                    <div className="space-y-2 w-full">
                      <p>Este proceso puede durar unos segundos</p>
                    </div>
                  ),
                });
              } else {
                const { update, id, dismiss } = toast({
                  title: "Cargando modelos",
                  description: (
                    <div className="space-y-2 w-full">
                      <p>Este proceso puede durar unos segundos</p>
                    </div>
                  ),
                });
                initToast.current = { update, id, dismiss };
              }
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
              if (initToast.current) {
                initToast.current.dismiss();
              }
              setIsLoading(false);
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
  ): Promise<MemoryVector[] | undefined> => {
    if (!worker.current) {
      throw new Error("Worker is not ready.");
    }

    return new Promise((resolve, reject) => {
      worker.current?.postMessage({ pdf: file });

      let data: MemoryVector[] | undefined;
      const onMessageReceived = (e: any) => {
        switch (e.data.type) {
          case "data":
            data = e.data.data;
            if (data) {
              setVectors(data);
            }
            break;
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
            resolve(data);
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
    vectors,
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
