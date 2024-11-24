"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { useChatWorker } from "../../context/chat-worker-context";
import { useToast } from "@/hooks/use-toast";
import { ChatMessageBubble } from "./chat-message-bubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export type ChatMessage = {
  content: string;
  role: "user" | "assistant";
  runId?: string;
  traceUrl?: string;
};

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { queryStore, isLoading } = useChatWorker();
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
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
  }

  return (
    <div className="flex flex-col p-4 md:p-8 bg-muted rounded-lg">
      <ScrollArea className="flex-grow flex flex-col rounded-xl p-2 h-[calc(100vh-20rem)] sm:h-[calc(100vh-25rem)]">
        <div className="flex flex-col">
          {messages.length > 0
            ? messages.map((m, i) => (
                <ChatMessageBubble key={i} message={m}></ChatMessageBubble>
              ))
            : ""}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <form onSubmit={sendMessage} className="flex w-full">
        <div className="flex w-full gap-2">
          <Textarea
            value={input}
            placeholder={"Qué opinas de mis últimos exámenes?"}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" loading={isLoading}>
            <SendHorizontal />
          </Button>
        </div>
      </form>
    </div>
  );
};
