"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppProvider, useApp } from "@/lib/app-context";
import { Sidebar } from "@/components/sidebar";
import { ChatInput } from "@/components/chat-input";

function threadIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith("/c/")) return null;
  const rest = pathname.slice(3).split("/")[0];
  return rest || null;
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const threadId = threadIdFromPath(pathname);
  const { state, status, send, setActiveThread, hydrated } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (hydrated) setActiveThread(threadId);
  }, [hydrated, threadId, setActiveThread]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const handleSend = useCallback(
    (text: string) => send(text, threadId),
    [send, threadId]
  );

  const streaming = useMemo(
    () => state.messages.some((m) => m.threadId === threadId && m.streaming),
    [state.messages, threadId]
  );

  const activeThread = threadId
    ? state.threads.find((t) => t.id === threadId)
    : null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <main className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center gap-2 border-b border-border px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            title="Meni"
            className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-sidebar-hover cursor-pointer md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex-1 truncate text-sm font-medium">
            {activeThread?.title ?? "LexMe"}
          </span>
          <ConnectionBadge status={status} />
        </header>
        <div className="flex-1 overflow-hidden">{children}</div>
        <ChatInput
          onSend={handleSend}
          disabled={status !== "connected"}
          streaming={streaming}
        />
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <Shell>{children}</Shell>
    </AppProvider>
  );
}

function ConnectionBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    idle: { color: "bg-muted", label: "Inicijalizacija" },
    connecting: { color: "bg-yellow-500", label: "Povezivanje..." },
    connected: { color: "bg-green-500", label: "Povezano" },
    disconnected: { color: "bg-muted", label: "Prekinuto" },
    error: { color: "bg-red-500", label: "Greska" },
  };
  const s = map[status] ?? map.idle;
  return (
    <div className="flex items-center gap-2 text-xs text-muted shrink-0">
      <span className={`h-2 w-2 rounded-full ${s.color}`} />
      <span>{s.label}</span>
    </div>
  );
}
