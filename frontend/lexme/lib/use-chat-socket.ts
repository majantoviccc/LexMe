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

export interface ChatSocketHandlers {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (reason: string) => void;
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
    channel.on("chunk", (payload: { text?: string }) => {
      if (payload?.text) handlersRef.current.onChunk(payload.text);
    });
    channel.on("done", () => {
      handlersRef.current.onDone();
    });
    channel.on("error", (payload: { error?: string }) => {
      handlersRef.current.onError(payload?.error ?? "unknown");
    });

    channel.join().receive("error", (reason) => {
      setStatus("error");
      handlersRef.current.onError(
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

  const sendPrompt = useCallback((prompt: string): boolean => {
    const ch = channelRef.current;
    if (!ch) return false;
    ch.push("prompt", { prompt });
    return true;
  }, []);

  return { status, sendPrompt };
}
