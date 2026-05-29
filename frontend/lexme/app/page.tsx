"use client";

import { useCallback } from "react";
import { ChatView } from "@/components/chat-view";
import { useApp } from "@/lib/app-context";

export default function HomePage() {
  const { send } = useApp();
  const handleSuggestion = useCallback(
    (text: string) => send(text, null),
    [send]
  );
  return <ChatView messages={[]} onSuggestionClick={handleSuggestion} />;
}
