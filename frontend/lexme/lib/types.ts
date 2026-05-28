export type Role = "user" | "assistant";

export interface Message {
  id: string;
  threadId: string;
  role: Role;
  content: string;
  createdAt: number;
  streaming?: boolean;
}

export interface Thread {
  id: string;
  projectId: string | null;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

export interface AppState {
  projects: Project[];
  threads: Thread[];
  messages: Message[];
  activeThreadId: string | null;
  activeProjectId: string | null;
}
