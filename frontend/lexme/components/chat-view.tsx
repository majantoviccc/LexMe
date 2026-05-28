"use client";

import { Scale } from "lucide-react";
import { useEffect, useRef } from "react";
import { ChatMessage } from "./chat-message";
import type { Message } from "@/lib/types";

interface Props {
  messages: Message[];
  onSuggestionClick: (text: string) => void;
}

const SUGGESTIONS = [
  "Koja je razlika izmedju krivicnog djela i prekrsaja?",
  "Sta kaze Zakon o radu o otkaznom roku?",
  "Kako se podnosi tuzba u parnicnom postupku?",
  "Koja su prava potrosaca u Crnoj Gori?",
];

const NEAR_BOTTOM_PX = 120;

export function ChatView({ messages, onSuggestionClick }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(messages.length);

  useEffect(() => {
    const container = scrollRef.current;
    const target = endRef.current;
    if (!container || !target) return;

    const newMessageAdded = messages.length > lastCountRef.current;
    lastCountRef.current = messages.length;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < NEAR_BOTTOM_PX;

    if (newMessageAdded) {
      target.scrollIntoView({ behavior: "smooth", block: "end" });
    } else if (nearBottom) {
      target.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sidebar-hover">
          <Scale className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">
          Kako mogu da ti pomognem?
        </h2>
        <p className="mt-1 text-sm text-muted">
          AI asistent specijalizovan za crnogorsko pravo
        </p>
        <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestionClick(s)}
              className="rounded-xl border border-border bg-transparent px-4 py-3 text-left text-sm text-foreground hover:bg-sidebar-hover cursor-pointer transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex h-full flex-col overflow-y-auto scrollbar-thin"
    >
      <div className="mx-auto w-full max-w-3xl py-6">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
