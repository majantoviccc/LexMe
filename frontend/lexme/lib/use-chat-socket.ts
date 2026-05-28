"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Socket, Channel } from "phoenix";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/socket";
const CHANNEL_TOPIC =
  process.env.NEXT_PUBLIC_WS_TOPIC ?? "chat:lobby";

export type SocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface GeminiHistoryItem {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface ChatSocketHandlers {
  onChunk: (messageId: string | null, text: string) => void;
  onDone: (messageId: string | null) => void;
  onError: (messageId: string | null, reason: string) => void;
}

export function useChatSocket(handlers: ChatSocketHandlers) {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const channelRef = useRef<Channel | null>(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const socket = new Socket(WS_URL, {});
    socket.onOpen(() => setStatus("connected"));
    socket.onError(() => setStatus("error"));
    socket.onClose(() => setStatus("disconnected"));
    socket.connect();

    const channel = socket.channel(CHANNEL_TOPIC, {});
    channel.on(
      "ai_chunk",
      (payload: { message_id?: string | null; text?: string }) => {
        if (payload?.text) {
          handlersRef.current.onChunk(payload.message_id ?? null, payload.text);
        }
      }
    );
    channel.on("ai_done", (payload: { message_id?: string | null }) => {
      handlersRef.current.onDone(payload?.message_id ?? null);
    });
    channel.on(
      "ai_error",
      (payload: { message_id?: string | null; reason?: string }) => {
        handlersRef.current.onError(
          payload?.message_id ?? null,
          payload?.reason ?? "unknown"
        );
      }
    );

    channel.join().receive("error", (reason) => {
      setStatus("error");
      handlersRef.current.onError(
        null,
        typeof reason === "string" ? reason : "join_failed"
      );
    });

    channelRef.current = channel;

    return () => {
      channel.leave();
      socket.disconnect();
      channelRef.current = null;
    };
  }, []);

  const sendMessage = useCallback(
    (history: GeminiHistoryItem[], messageId: string): boolean => {
      const ch = channelRef.current;
      if (!ch) return false;
      ch.push("new_message", { history, message_id: messageId });
      return true;
    },
    []
  );

  return { status, sendMessage };
}
