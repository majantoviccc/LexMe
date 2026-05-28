"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Socket, Channel } from "phoenix";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000/socket";

export type SocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface ChatSocketHandlers {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError?: (reason: unknown) => void;
}

export function useChatSocket(handlers: ChatSocketHandlers) {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const socketRef = useRef<Socket | null>(null);
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
    socketRef.current = socket;

    const channel = socket.channel("chat:lobby", {});
    channel.on("token", (payload: { token: string | null }) => {
      if (payload?.token) handlersRef.current.onToken(payload.token);
    });
    channel.on("complete", () => {
      handlersRef.current.onComplete();
    });

    channel
      .join()
      .receive("error", (reason) => {
        setStatus("error");
        handlersRef.current.onError?.(reason);
      });

    channelRef.current = channel;

    return () => {
      channel.leave();
      socket.disconnect();
      channelRef.current = null;
      socketRef.current = null;
    };
  }, []);

  const sendMessage = useCallback((message: string) => {
    const ch = channelRef.current;
    if (!ch) return false;
    ch.push("send_message", { message });
    return true;
  }, []);

  return { status, sendMessage };
}
