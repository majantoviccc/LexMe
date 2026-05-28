"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useChatSocket, type SocketStatus } from "./use-chat-socket";
import { emptyState, loadState, saveStateDebounced } from "./storage";
import { uid } from "./utils";
import type { AppState, Message, Project, Thread } from "./types";

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "set_active_thread"; id: string | null }
  | { type: "set_active_project"; id: string | null }
  | {
      type: "create_thread";
      id: string;
      projectId: string | null;
      title?: string;
    }
  | { type: "delete_thread"; id: string }
  | { type: "new_project"; name: string }
  | { type: "delete_project"; id: string }
  | { type: "add_message"; msg: Message }
  | { type: "append_token"; messageId: string; token: string }
  | { type: "finish_streaming"; messageId: string }
  | { type: "cancel_all_streaming" }
  | { type: "update_thread_title"; threadId: string; title: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "set_active_thread": {
      if (state.activeThreadId === action.id) return state;
      const t = action.id
        ? state.threads.find((x) => x.id === action.id)
        : null;
      return {
        ...state,
        activeThreadId: action.id,
        activeProjectId: t?.projectId ?? state.activeProjectId,
      };
    }
    case "set_active_project":
      if (state.activeProjectId === action.id) return state;
      return { ...state, activeProjectId: action.id };
    case "create_thread": {
      if (state.threads.some((t) => t.id === action.id)) return state;
      const thread: Thread = {
        id: action.id,
        projectId: action.projectId,
        title: action.title ?? "Novi chat",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return {
        ...state,
        threads: [thread, ...state.threads],
        activeThreadId: action.id,
        activeProjectId: action.projectId,
      };
    }
    case "delete_thread": {
      const threads = state.threads.filter((t) => t.id !== action.id);
      const messages = state.messages.filter((m) => m.threadId !== action.id);
      return {
        ...state,
        threads,
        messages,
        activeThreadId:
          state.activeThreadId === action.id ? null : state.activeThreadId,
      };
    }
    case "new_project": {
      const p: Project = {
        id: uid(),
        name: action.name,
        createdAt: Date.now(),
      };
      return { ...state, projects: [p, ...state.projects] };
    }
    case "delete_project": {
      const threadIds = state.threads
        .filter((t) => t.projectId === action.id)
        .map((t) => t.id);
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.id),
        threads: state.threads.filter((t) => t.projectId !== action.id),
        messages: state.messages.filter(
          (m) => !threadIds.includes(m.threadId)
        ),
        activeThreadId: threadIds.includes(state.activeThreadId ?? "")
          ? null
          : state.activeThreadId,
        activeProjectId:
          state.activeProjectId === action.id ? null : state.activeProjectId,
      };
    }
    case "add_message": {
      const threads = state.threads.map((t) =>
        t.id === action.msg.threadId ? { ...t, updatedAt: Date.now() } : t
      );
      return {
        ...state,
        messages: [...state.messages, action.msg],
        threads,
      };
    }
    case "append_token": {
      let changed = false;
      const messages = state.messages.map((m) => {
        if (m.id === action.messageId) {
          changed = true;
          return { ...m, content: m.content + action.token };
        }
        return m;
      });
      return changed ? { ...state, messages } : state;
    }
    case "finish_streaming": {
      let changed = false;
      const messages = state.messages.map((m) => {
        if (m.id === action.messageId && m.streaming) {
          changed = true;
          return { ...m, streaming: false };
        }
        return m;
      });
      return changed ? { ...state, messages } : state;
    }
    case "cancel_all_streaming": {
      let changed = false;
      const messages = state.messages.map((m) => {
        if (m.streaming) {
          changed = true;
          return { ...m, streaming: false };
        }
        return m;
      });
      return changed ? { ...state, messages } : state;
    }
    case "update_thread_title": {
      const threads = state.threads.map((t) =>
        t.id === action.threadId ? { ...t, title: action.title } : t
      );
      return { ...state, threads };
    }
  }
}

interface AppContextValue {
  state: AppState;
  status: SocketStatus;
  hydrated: boolean;
  send: (text: string, currentThreadId: string | null) => void;
  createProject: (name: string) => void;
  deleteThread: (id: string) => void;
  deleteProject: (id: string) => void;
  setActiveThread: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
}

const Ctx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, emptyState);
  const [hydrated, markHydrated] = useReducer(() => true, false);
  const stateRef = useRef(state);
  const streamingMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    dispatch({ type: "hydrate", state: loadState() });
    dispatch({ type: "cancel_all_streaming" });
    markHydrated();
  }, []);

  useEffect(() => {
    if (hydrated) saveStateDebounced(state);
  }, [state, hydrated]);

  const socketHandlers = useMemo(
    () => ({
      onToken: (token: string) => {
        const id = streamingMessageIdRef.current;
        if (id) dispatch({ type: "append_token", messageId: id, token });
      },
      onComplete: () => {
        const id = streamingMessageIdRef.current;
        if (id) {
          dispatch({ type: "finish_streaming", messageId: id });
          streamingMessageIdRef.current = null;
        }
      },
    }),
    []
  );

  const { status, sendMessage: socketSend } = useChatSocket(socketHandlers);

  useEffect(() => {
    if (status === "error" || status === "disconnected") {
      const id = streamingMessageIdRef.current;
      if (id) {
        dispatch({ type: "finish_streaming", messageId: id });
        streamingMessageIdRef.current = null;
      }
    }
  }, [status]);

  const send = useCallback(
    (text: string, currentThreadId: string | null) => {
      const current = stateRef.current;
      let threadId = currentThreadId;
      let needsNavigation = false;

      if (!threadId) {
        threadId = uid();
        needsNavigation = true;
        dispatch({
          type: "create_thread",
          id: threadId,
          projectId: current.activeProjectId,
        });
      } else if (!current.threads.some((t) => t.id === threadId)) {
        dispatch({
          type: "create_thread",
          id: threadId,
          projectId: current.activeProjectId,
        });
      }

      const userMsg: Message = {
        id: uid(),
        threadId,
        role: "user",
        content: text,
        createdAt: Date.now(),
      };
      const assistantMsg: Message = {
        id: uid(),
        threadId,
        role: "assistant",
        content: "",
        createdAt: Date.now() + 1,
        streaming: true,
      };
      dispatch({ type: "add_message", msg: userMsg });
      dispatch({ type: "add_message", msg: assistantMsg });

      const existing = current.threads.find((t) => t.id === threadId);
      if (!existing || existing.title === "Novi chat") {
        const title = text.slice(0, 40) + (text.length > 40 ? "..." : "");
        dispatch({ type: "update_thread_title", threadId, title });
      }

      streamingMessageIdRef.current = assistantMsg.id;
      const ok = socketSend(text);
      if (!ok) {
        dispatch({
          type: "append_token",
          messageId: assistantMsg.id,
          token:
            "[Greska: nije moguca konekcija sa backend serverom na ws://localhost:4000/socket]",
        });
        dispatch({ type: "finish_streaming", messageId: assistantMsg.id });
        streamingMessageIdRef.current = null;
      }

      if (needsNavigation) router.push(`/c/${threadId}`);
    },
    [socketSend, router]
  );

  const createProject = useCallback((name: string) => {
    dispatch({ type: "new_project", name });
  }, []);

  const deleteThread = useCallback((id: string) => {
    dispatch({ type: "delete_thread", id });
  }, []);

  const deleteProject = useCallback((id: string) => {
    dispatch({ type: "delete_project", id });
  }, []);

  const setActiveThread = useCallback((id: string | null) => {
    dispatch({ type: "set_active_thread", id });
  }, []);

  const setActiveProject = useCallback((id: string | null) => {
    dispatch({ type: "set_active_project", id });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      status,
      hydrated,
      send,
      createProject,
      deleteThread,
      deleteProject,
      setActiveThread,
      setActiveProject,
    }),
    [
      state,
      status,
      hydrated,
      send,
      createProject,
      deleteThread,
      deleteProject,
      setActiveThread,
      setActiveProject,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}
