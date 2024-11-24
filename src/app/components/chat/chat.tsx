"use client";

import { FormEvent, useState, useEffect, useRef, KeyboardEvent } from "react";
import { useChatWorker } from "../../context/chat-worker-context";
import { useToast } from "@/hooks/use-toast";
import { ChatMessageBubble } from "./chat-message-bubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export type ChatMessage = {
  content: React.ReactNode;
  role: "user" | "assistant";
  runId?: string;
  traceUrl?: string;
};

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { queryStore, isLoading } = useChatWorker();
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading || !input) {
      return;
    }

    const initialInput = input;
    const initialMessages = [...messages];
    const newMessages = [
      ...initialMessages,
      { role: "user" as const, content: input },
    ];

    setMessages(newMessages);
    setInput("");

    try {
      const stream = await queryStore(newMessages);
      const reader = stream.getReader();

      let chunk = await reader.read();

      const aiResponseMessage: ChatMessage = {
        content: "",
        role: "assistant" as const,
      };

      setMessages([...newMessages, aiResponseMessage]);

      while (!chunk.done) {
        aiResponseMessage.content = aiResponseMessage.content + chunk.value;
        setMessages([...newMessages, aiResponseMessage]);
        chunk = await reader.read();
      }
    } catch (e: any) {
      setMessages(initialMessages);
      setInput(initialInput);
      toast({
        title: "There was an issue with querying your PDF",
        description: e.message,
      });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="flex flex-col p-2 bg-muted rounded-xl gap-2">
      <ScrollArea className="flex flex-col rounded-xl h-[calc(100vh-23rem)] sm:h-[calc(100vh-33rem)] sm:pr-4">
        <div className="flex flex-col">
          {messages.length > 0
            ? messages.map((m, i) => (
                <ChatMessageBubble key={i} message={m}></ChatMessageBubble>
              ))
            : ""}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <form ref={formRef} onSubmit={handleSubmit} className="flex w-full">
        <div className="flex w-full gap-2 items-stretch">
          <Textarea
            value={input}
            placeholder={"Qué opinas de mis últimos exámenes?"}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button type="submit" className="h-full" loading={isLoading}>
            <SendHorizontal />
          </Button>
        </div>
      </form>
    </div>
  );
};
