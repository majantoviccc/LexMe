"use client";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  MessageSquarePlus,
  MoreHorizontal,
  Scale,
  Search,
  Trash2,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";
import type { Project, Thread } from "@/lib/types";

function threadIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith("/c/")) return null;
  const rest = pathname.slice(3).split("/")[0];
  return rest || null;
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeId = threadIdFromPath(pathname);
  const {
    state,
    createProject,
    deleteThread,
    deleteProject,
  } = useApp();

  const [query, setQuery] = useState("");
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [confirmThread, setConfirmThread] = useState<Thread | null>(null);
  const [confirmProject, setConfirmProject] = useState<Project | null>(null);

  const filteredThreads = useMemo(() => {
    if (!query.trim()) return state.threads;
    const q = query.toLowerCase();
    return state.threads.filter((t) => t.title.toLowerCase().includes(q));
  }, [state.threads, query]);

  const standaloneThreads = useMemo(
    () =>
      filteredThreads
        .filter((t) => !t.projectId)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [filteredThreads]
  );

  const threadsByProject = useMemo(() => {
    const m: Record<string, Thread[]> = {};
    for (const t of filteredThreads) {
      if (!t.projectId) continue;
      (m[t.projectId] ??= []).push(t);
    }
    for (const id of Object.keys(m)) {
      m[id].sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return m;
  }, [filteredThreads]);

  const handleNewChat = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleSelectThread = useCallback(
    (id: string) => {
      router.push(`/c/${id}`);
    },
    [router]
  );

  const handleConfirmDeleteThread = useCallback(() => {
    if (!confirmThread) return;
    const id = confirmThread.id;
    deleteThread(id);
    if (activeId === id) router.push("/");
    setConfirmThread(null);
  }, [confirmThread, deleteThread, activeId, router]);

  const handleConfirmDeleteProject = useCallback(() => {
    if (!confirmProject) return;
    const project = confirmProject;
    const wasActive = state.threads.some(
      (t) => t.projectId === project.id && t.id === activeId
    );
    deleteProject(project.id);
    if (wasActive) router.push("/");
    setConfirmProject(null);
  }, [confirmProject, deleteProject, state.threads, activeId, router]);

  const handleCreateProject = useCallback(
    (name: string) => {
      createProject(name);
      setNewProjectOpen(false);
    },
    [createProject]
  );

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-4 py-4">
        <Scale className="h-5 w-5" />
        <h1 className="text-base font-semibold tracking-tight">LexMe</h1>
      </div>

      <div className="px-3 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleNewChat}
        >
          <MessageSquarePlus className="h-4 w-4" />
          Novi chat
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => setNewProjectOpen(true)}
        >
          <FolderPlus className="h-4 w-4" />
          Novi projekat
        </Button>
      </div>

      <div className="px-3 py-3">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-hover px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pretrazi chatove"
            className="w-full bg-transparent text-xs focus:outline-hidden placeholder:text-muted"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4">
        {state.projects.length > 0 && (
          <div className="mb-2">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Projekti
            </p>
            {state.projects.map((p) => {
              const open = openProjects[p.id] ?? true;
              const items = threadsByProject[p.id] ?? [];
              return (
                <div key={p.id} className="mb-1">
                  <div className="group flex items-center rounded-lg hover:bg-sidebar-hover">
                    <button
                      onClick={() =>
                        setOpenProjects((s) => ({ ...s, [p.id]: !open }))
                      }
                      className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm cursor-pointer"
                    >
                      {open ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted" />
                      )}
                      <Folder className="h-3.5 w-3.5" />
                      <span className="truncate">{p.name}</span>
                    </button>
                    <button
                      onClick={() => setConfirmProject(p)}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1.5 text-muted hover:text-red-400 cursor-pointer"
                      title="Obrisi projekat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {open && (
                    <div className="ml-4 mt-0.5 space-y-0.5">
                      {items.length === 0 ? (
                        <p className="px-2 py-1 text-xs text-muted">
                          Nema chatova
                        </p>
                      ) : (
                        items.map((t) => (
                          <ThreadRow
                            key={t.id}
                            thread={t}
                            active={t.id === activeId}
                            onSelect={handleSelectThread}
                            onDelete={() => setConfirmThread(t)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div>
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Chatovi
          </p>
          {standaloneThreads.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted">
              Jos uvijek nema chatova
            </p>
          ) : (
            standaloneThreads.map((t) => (
              <ThreadRow
                key={t.id}
                thread={t}
                active={t.id === activeId}
                onSelect={handleSelectThread}
                onDelete={() => setConfirmThread(t)}
              />
            ))
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="text-xs text-muted">
          AI asistent za crnogorsko pravo
        </p>
      </div>

      <PromptDialog
        open={newProjectOpen}
        title="Novi projekat"
        description="Projekti grupisu povezane chatove na jednom mjestu."
        placeholder="npr. Krivicno pravo"
        submitLabel="Kreiraj"
        onSubmit={handleCreateProject}
        onCancel={() => setNewProjectOpen(false)}
      />

      <ConfirmDialog
        open={confirmThread !== null}
        title="Obrisi chat"
        message={
          confirmThread
            ? `Sigurno zelis da obrises chat "${confirmThread.title}"? Sve poruke ce biti izgubljene.`
            : ""
        }
        confirmLabel="Obrisi"
        destructive
        onConfirm={handleConfirmDeleteThread}
        onCancel={() => setConfirmThread(null)}
      />

      <ConfirmDialog
        open={confirmProject !== null}
        title="Obrisi projekat"
        message={
          confirmProject
            ? `Sigurno zelis da obrises projekat "${confirmProject.name}" i sve njegove chatove?`
            : ""
        }
        confirmLabel="Obrisi"
        destructive
        onConfirm={handleConfirmDeleteProject}
        onCancel={() => setConfirmProject(null)}
      />
    </aside>
  );
}

interface ThreadRowProps {
  thread: Thread;
  active: boolean;
  onSelect: (id: string) => void;
  onDelete: () => void;
}

function ThreadRow({ thread, active, onSelect, onDelete }: ThreadRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center rounded-lg",
        active ? "bg-sidebar-active" : "hover:bg-sidebar-hover"
      )}
    >
      <button
        onClick={() => onSelect(thread.id)}
        className="flex-1 truncate px-2 py-1.5 text-left text-sm cursor-pointer"
      >
        {thread.title || "Novi chat"}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 px-2 py-1.5 text-muted hover:text-red-400 cursor-pointer"
        title="Obrisi chat"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
