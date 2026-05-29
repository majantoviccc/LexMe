"use client";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Scale,
  Search,
  Trash2,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/context-menu";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import { SyncButton } from "@/components/sync-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";
import type { Project, Thread } from "@/lib/types";

function threadIdFromPath(pathname: string): string | null {
  if (!pathname.startsWith("/c/")) return null;
  const rest = pathname.slice(3).split("/")[0];
  return rest || null;
}

type MenuTarget =
  | { kind: "thread"; thread: Thread }
  | { kind: "project"; project: Project };

interface MenuState {
  x: number;
  y: number;
  target: MenuTarget;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const activeId = threadIdFromPath(pathname);
  const {
    state,
    createProject,
    deleteThread,
    renameThread,
    deleteProject,
    renameProject,
  } = useApp();

  const [query, setQuery] = useState("");
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [confirmThread, setConfirmThread] = useState<Thread | null>(null);
  const [confirmProject, setConfirmProject] = useState<Project | null>(null);
  const [renameThreadTarget, setRenameThreadTarget] = useState<Thread | null>(
    null
  );
  const [renameProjectTarget, setRenameProjectTarget] = useState<Project | null>(
    null
  );
  const [menu, setMenu] = useState<MenuState | null>(null);

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

  const handleSelectThread = useCallback(
    (id: string) => {
      router.push(`/c/${id}`);
      onClose();
    },
    [router, onClose]
  );

  const goHome = useCallback(() => {
    router.push("/");
    onClose();
  }, [router, onClose]);

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

  const handleRenameThread = useCallback(
    (title: string) => {
      if (renameThreadTarget) renameThread(renameThreadTarget.id, title);
      setRenameThreadTarget(null);
    },
    [renameThread, renameThreadTarget]
  );

  const handleRenameProject = useCallback(
    (name: string) => {
      if (renameProjectTarget) renameProject(renameProjectTarget.id, name);
      setRenameProjectTarget(null);
    },
    [renameProject, renameProjectTarget]
  );

  const openMenuAt = useCallback(
    (e: ReactMouseEvent, target: MenuTarget) => {
      e.preventDefault();
      e.stopPropagation();
      setMenu({ x: e.clientX, y: e.clientY, target });
    },
    []
  );

  const openMenuFromButton = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>, target: MenuTarget) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setMenu({ x: rect.left, y: rect.bottom, target });
    },
    []
  );

  const menuItems: ContextMenuItem[] = useMemo(() => {
    if (!menu) return [];
    if (menu.target.kind === "thread") {
      const thread = menu.target.thread;
      return [
        {
          label: "Preimenuj",
          icon: <Pencil className="h-3.5 w-3.5" />,
          onClick: () => setRenameThreadTarget(thread),
        },
        {
          label: "Obrisi",
          icon: <Trash2 className="h-3.5 w-3.5" />,
          destructive: true,
          onClick: () => setConfirmThread(thread),
        },
      ];
    }
    const project = menu.target.project;
    return [
      {
        label: "Preimenuj",
        icon: <Pencil className="h-3.5 w-3.5" />,
        onClick: () => setRenameProjectTarget(project),
      },
      {
        label: "Obrisi",
        icon: <Trash2 className="h-3.5 w-3.5" />,
        destructive: true,
        onClick: () => setConfirmProject(project),
      },
    ];
  }, [menu]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "sidebar-theme fixed inset-y-0 left-0 z-40 flex h-full w-72 shrink-0 flex-col border-r border-border bg-sidebar transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
      <button
        type="button"
        onClick={goHome}
        title="Pocetna"
        className="flex items-center gap-2 px-4 py-4 hover:bg-sidebar-hover transition-colors cursor-pointer"
      >
        <Scale className="h-5 w-5" />
        <h1 className="text-base font-semibold tracking-tight">LexMe</h1>
      </button>

      <div className="px-3 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={goHome}
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
                  <div
                    className="group flex items-center rounded-lg hover:bg-sidebar-hover"
                    onContextMenu={(e) =>
                      openMenuAt(e, { kind: "project", project: p })
                    }
                  >
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
                      onClick={(e) =>
                        openMenuFromButton(e, { kind: "project", project: p })
                      }
                      className="opacity-0 group-hover:opacity-100 px-2 py-1.5 text-muted hover:text-foreground cursor-pointer"
                      title="Opcije"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
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
                            onContextMenu={(e) =>
                              openMenuAt(e, { kind: "thread", thread: t })
                            }
                            onMoreClick={(e) =>
                              openMenuFromButton(e, {
                                kind: "thread",
                                thread: t,
                              })
                            }
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
                onContextMenu={(e) =>
                  openMenuAt(e, { kind: "thread", thread: t })
                }
                onMoreClick={(e) =>
                  openMenuFromButton(e, { kind: "thread", thread: t })
                }
              />
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
        <SyncButton />
        <ThemeToggle />
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

      <PromptDialog
        open={renameThreadTarget !== null}
        title="Preimenuj chat"
        defaultValue={renameThreadTarget?.title ?? ""}
        submitLabel="Sacuvaj"
        onSubmit={handleRenameThread}
        onCancel={() => setRenameThreadTarget(null)}
      />

      <PromptDialog
        open={renameProjectTarget !== null}
        title="Preimenuj projekat"
        defaultValue={renameProjectTarget?.name ?? ""}
        submitLabel="Sacuvaj"
        onSubmit={handleRenameProject}
        onCancel={() => setRenameProjectTarget(null)}
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

      <ContextMenu
        open={menu !== null}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        items={menuItems}
        onClose={() => setMenu(null)}
      />
      </aside>
    </>
  );
}

interface ThreadRowProps {
  thread: Thread;
  active: boolean;
  onSelect: (id: string) => void;
  onContextMenu: (e: ReactMouseEvent) => void;
  onMoreClick: (e: ReactMouseEvent<HTMLButtonElement>) => void;
}

function ThreadRow({
  thread,
  active,
  onSelect,
  onContextMenu,
  onMoreClick,
}: ThreadRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center rounded-lg",
        active ? "bg-sidebar-active" : "hover:bg-sidebar-hover"
      )}
      onContextMenu={onContextMenu}
    >
      <button
        onClick={() => onSelect(thread.id)}
        className="flex-1 truncate px-2 py-1.5 text-left text-sm cursor-pointer"
      >
        {thread.title || "Novi chat"}
      </button>
      <button
        onClick={onMoreClick}
        className="opacity-0 group-hover:opacity-100 px-2 py-1.5 text-muted hover:text-foreground cursor-pointer"
        title="Opcije"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
