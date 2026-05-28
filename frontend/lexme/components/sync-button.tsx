"use client";

import { Check, CloudUpload, Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { pushLocalToBackend, type SyncResult } from "@/lib/sync";
import { cn } from "@/lib/utils";

type Status = "idle" | "syncing" | "ok" | "error";

export function SyncButton() {
  const { state } = useApp();
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setStatus("syncing");
    setResult(null);
    try {
      const r = await pushLocalToBackend(state);
      setResult(r);
      setStatus(r.ok ? "ok" : "error");
      window.setTimeout(() => setStatus("idle"), 3000);
    } catch (e) {
      setResult({
        ok: false,
        pushedProjects: 0,
        pushedThreads: 0,
        pushedMessages: 0,
        errors: [e instanceof Error ? e.message : "Nepoznata greska"],
      });
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const Icon =
    status === "syncing"
      ? Loader2
      : status === "ok"
        ? Check
        : status === "error"
          ? TriangleAlert
          : CloudUpload;

  const title =
    status === "syncing"
      ? "Sinhronizujem..."
      : status === "ok"
        ? `Sinhronizovano: ${result?.pushedProjects ?? 0} projekata, ${result?.pushedThreads ?? 0} chatova, ${result?.pushedMessages ?? 0} poruka`
        : status === "error"
          ? `Greska: ${result?.errors[0] ?? ""}`
          : "Sinhronizuj sa backend-om";

  const color =
    status === "ok"
      ? "text-green-500"
      : status === "error"
        ? "text-red-400"
        : "text-muted hover:text-foreground";

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={status === "syncing"}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full hover:bg-sidebar-hover cursor-pointer transition-colors disabled:cursor-wait",
        color
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5", status === "syncing" && "animate-spin")}
      />
    </button>
  );
}
