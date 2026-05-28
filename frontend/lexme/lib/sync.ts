import {
  ApiError,
  projectsApi,
  threadsApi,
  messagesApi,
  type ApiProject,
  type ApiThread,
} from "./api";
import type { AppState, Message, Project, Thread } from "./types";

export interface SyncResult {
  ok: boolean;
  pushedProjects: number;
  pushedThreads: number;
  pushedMessages: number;
  errors: string[];
}

function emptyResult(): SyncResult {
  return {
    ok: true,
    pushedProjects: 0,
    pushedThreads: 0,
    pushedMessages: 0,
    errors: [],
  };
}

interface ProjectIdMap {
  [localId: string]: string;
}

interface ThreadIdMap {
  [localId: string]: string;
}

async function pushProjects(
  local: Project[],
  remote: ApiProject[],
  result: SyncResult
): Promise<ProjectIdMap> {
  const map: ProjectIdMap = {};
  const remoteByName = new Map(remote.map((p) => [p.name, p]));
  for (const p of local) {
    const match = remoteByName.get(p.name);
    if (match) {
      map[p.id] = match.id;
      continue;
    }
    try {
      const created = await projectsApi.create({ name: p.name });
      map[p.id] = created.id;
      result.pushedProjects++;
    } catch (e) {
      result.errors.push(
        `Projekat "${p.name}": ${e instanceof Error ? e.message : "err"}`
      );
    }
  }
  return map;
}

async function pushThreads(
  local: Thread[],
  remote: ApiThread[],
  projectMap: ProjectIdMap,
  result: SyncResult
): Promise<ThreadIdMap> {
  const map: ThreadIdMap = {};
  const remoteByTitle = new Map(remote.map((t) => [t.title, t]));
  for (const t of local) {
    const match = remoteByTitle.get(t.title);
    if (match) {
      map[t.id] = match.id;
      continue;
    }
    try {
      const created = await threadsApi.create({
        title: t.title,
        project_id: t.projectId ? (projectMap[t.projectId] ?? null) : null,
      });
      map[t.id] = created.id;
      result.pushedThreads++;
    } catch (e) {
      result.errors.push(
        `Chat "${t.title}": ${e instanceof Error ? e.message : "err"}`
      );
    }
  }
  return map;
}

async function pushMessages(
  local: Message[],
  threadMap: ThreadIdMap,
  result: SyncResult
): Promise<void> {
  const byThread = new Map<string, Message[]>();
  for (const m of local) {
    if (m.streaming) continue;
    const remoteThreadId = threadMap[m.threadId];
    if (!remoteThreadId) continue;
    if (!byThread.has(remoteThreadId)) byThread.set(remoteThreadId, []);
    byThread.get(remoteThreadId)!.push(m);
  }

  for (const [threadId, messages] of byThread) {
    let remoteCount = 0;
    try {
      const remote = await messagesApi.listByThread(threadId);
      remoteCount = remote.length;
    } catch {
      /* if list fails, push all */
    }

    const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt);
    const toPush = sorted.slice(remoteCount);

    for (const m of toPush) {
      try {
        if (m.role === "user") {
          await messagesApi.createUser({
            thread_id: threadId,
            content: m.content,
          });
        } else {
          const placeholder = await messagesApi.createAssistantPlaceholder({
            thread_id: threadId,
          });
          await messagesApi.markComplete(placeholder.id, {
            content: m.content,
          });
        }
        result.pushedMessages++;
      } catch (e) {
        result.errors.push(
          `Poruka: ${e instanceof Error ? e.message : "err"}`
        );
      }
    }
  }
}

export async function pushLocalToBackend(
  state: AppState
): Promise<SyncResult> {
  const result = emptyResult();

  let remoteProjects: ApiProject[] = [];
  let remoteThreads: ApiThread[] = [];
  try {
    [remoteProjects, remoteThreads] = await Promise.all([
      projectsApi.list(),
      threadsApi.list(),
    ]);
  } catch (e) {
    result.ok = false;
    result.errors.push(
      e instanceof ApiError && e.status === 0
        ? "Backend nije dostupan na :4000"
        : e instanceof Error
          ? e.message
          : "Nepoznata greska"
    );
    return result;
  }

  const projectMap = await pushProjects(
    state.projects,
    remoteProjects,
    result
  );
  const threadMap = await pushThreads(
    state.threads,
    remoteThreads,
    projectMap,
    result
  );
  await pushMessages(state.messages, threadMap, result);

  if (result.errors.length > 0) result.ok = false;
  return result;
}
