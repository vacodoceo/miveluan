"use client";

import { FormEvent, useState } from "react";
import { useChatWorker } from "../../context/chat-worker-context";
import { useToast } from "@/hooks/use-toast";
import { ChatMessageBubble } from "./chat-message-bubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type ChatMessage = {
  content: string;
  role: "user" | "assistant";
  runId?: string;
  traceUrl?: string;
};

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const { queryStore, isLoading } = useChatWorker();
  const { toast } = useToast();

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
    <div
      className={`flex flex-col items-center p-4 md:p-8 grow overflow-hidden bg-white border rounded-lg`}
    >
      <div className="flex flex-col-reverse w-full mb-4 overflow-auto grow">
        {messages.length > 0
          ? [...messages]
              .reverse()
              .map((m, i) => (
                <ChatMessageBubble key={i} message={m}></ChatMessageBubble>
              ))
          : ""}
      </div>

      <form onSubmit={sendMessage} className="flex w-full flex-col">
        <div className="flex w-full mt-4">
          <Textarea
            className="grow mr-8 p-4 rounded"
            value={input}
            placeholder={"Qué opinas de mis últimos exámenes?"}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" loading={isLoading}>
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
};
