const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...opts?.headers },
      ...opts,
    });
  } catch (e) {
    throw new ApiError(
      0,
      e instanceof Error ? e.message : "Network error"
    );
  }
  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, `${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  const json = (await res.json()) as { data?: T };
  return (json.data ?? (json as unknown)) as T;
}

export interface ApiProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  inserted_at: string;
  updated_at: string;
}

export interface ApiThread {
  id: string;
  title: string;
  status: string;
  project_id: string | null;
  inserted_at: string;
  updated_at: string;
}

export interface ApiMessage {
  id: string;
  role: "user" | "assistant" | string;
  content: string;
  metadata: Record<string, unknown> | null;
  thread_id: string;
  status: string;
  error: string | null;
  model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  inserted_at: string;
  updated_at: string;
}

export const projectsApi = {
  list: () => api<ApiProject[]>("/projects"),
  create: (data: { name: string; description?: string }) =>
    api<ApiProject>("/projects", {
      method: "POST",
      body: JSON.stringify({ project: data }),
    }),
  remove: (id: string) => api<void>(`/projects/${id}`, { method: "DELETE" }),
};

export const threadsApi = {
  list: () => api<ApiThread[]>("/threads"),
  create: (data: { title: string; project_id?: string | null }) =>
    api<ApiThread>("/threads", {
      method: "POST",
      body: JSON.stringify({ thread: data }),
    }),
  remove: (id: string) => api<void>(`/threads/${id}`, { method: "DELETE" }),
};

export const messagesApi = {
  listByThread: (threadId: string) =>
    api<ApiMessage[]>(`/messages?thread_id=${encodeURIComponent(threadId)}`),
  createUser: (data: { thread_id: string; content: string }) =>
    api<ApiMessage>("/messages/user", {
      method: "POST",
      body: JSON.stringify({ message: data }),
    }),
  createAssistantPlaceholder: (data: { thread_id: string }) =>
    api<ApiMessage>("/messages/assistant-placeholder", {
      method: "POST",
      body: JSON.stringify({ message: data }),
    }),
  appendChunk: (id: string, chunk: string) =>
    api<ApiMessage>(`/messages/${id}/append`, {
      method: "PATCH",
      body: JSON.stringify({ chunk }),
    }),
  markComplete: (
    id: string,
    data?: {
      model?: string;
      prompt_tokens?: number;
      completion_tokens?: number;
      metadata?: Record<string, unknown>;
      content?: string;
    }
  ) =>
    api<ApiMessage>(`/messages/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify(data ?? {}),
    }),
  markFailed: (id: string, error: string) =>
    api<ApiMessage>(`/messages/${id}/fail`, {
      method: "PATCH",
      body: JSON.stringify({ error }),
    }),
  remove: (id: string) => api<void>(`/messages/${id}`, { method: "DELETE" }),
};

export async function pingBackend(): Promise<boolean> {
  try {
    await projectsApi.list();
    return true;
  } catch {
    return false;
  }
}
