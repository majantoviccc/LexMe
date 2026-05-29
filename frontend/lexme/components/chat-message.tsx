"use client";

import { Scale, User } from "lucide-react";
import { memo } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { useTypewriter } from "@/lib/use-typewriter";
import type { Message } from "@/lib/types";

interface Props {
  message: Message;
}

function ChatMessageImpl({ message }: Props) {
  const isUser = message.role === "user";
  // Reveal assistant text gradually for a token-by-token feel, regardless of
  // how the backend chunks the response. User messages render instantly.
  const { text, revealing } = useTypewriter(
    message.content,
    !isUser && !!message.streaming
  );

  return (
    <div
      className={cn(
        "flex w-full gap-3 px-4 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-hover">
          <Scale className="h-3.5 w-3.5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[min(720px,80%)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-user-bubble text-foreground"
            : "bg-transparent text-foreground"
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap wrap-break-word">
            {message.content}
          </div>
        ) : (
          <Streamdown
            parseIncompleteMarkdown
            className={cn(
              "wrap-break-word space-y-3",
              (message.streaming || revealing) && "cursor-blink"
            )}
            shikiTheme={["github-light", "github-dark"]}
          >
            {text}
          </Streamdown>
        )}
      </div>
      {isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-user-bubble">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}

export const ChatMessage = memo(ChatMessageImpl);
