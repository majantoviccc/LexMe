"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ChatView } from "@/components/chat-view";
import { useApp } from "@/lib/app-context";

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const threadId = typeof params.id === "string" ? params.id : null;
  const { state, send } = useApp();

  const messages = useMemo(
    () =>
      threadId
        ? state.messages
            .filter((m) => m.threadId === threadId)
            .sort((a, b) => a.createdAt - b.createdAt)
        : [],
    [state.messages, threadId]
  );

  const handleSuggestion = useCallback(
    (text: string) => send(text, threadId),
    [send, threadId]
  );

  return <ChatView messages={messages} onSuggestionClick={handleSuggestion} />;
}
