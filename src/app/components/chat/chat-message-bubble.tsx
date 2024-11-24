import { ChatMessage } from "./chat";

export const ChatMessageBubble = (props: { message: ChatMessage }) => {
  const { role, content } = props.message;

  const colorClassName =
    role === "user"
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-secondary-foreground";
  const alignmentClassName = role === "user" ? "ml-auto" : "mr-auto";
  const prefix = role === "user" ? "🧑" : "🤖";

  return (
    <div
      className={`${alignmentClassName} ${colorClassName} rounded px-4 py-2 max-w-[80%] mb-2 flex flex-col`}
    >
      <div className="flex hover:group group">
        <div className="mr-2">{prefix}</div>
        <div className="whitespace-pre-wrap">
          {/* TODO: Remove. Hacky fix, stop sequences don't seem to work with WebLLM yet. */}
          {content.trim().split("\nInstruct:")[0].split("\nInstruction:")[0]}
        </div>
      </div>
    </div>
  );
};
