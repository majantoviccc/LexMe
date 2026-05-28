"use client";

import { Scale, User } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface Props {
  message: Message;
}

function ChatMessageImpl({ message }: Props) {
  const isUser = message.role === "user";

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
        <div
          className={cn(
            "whitespace-pre-wrap wrap-break-word",
            message.streaming && "cursor-blink"
          )}
        >
          {message.content}
        </div>
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
