"use client";

import { ArrowUp, Paperclip } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  streaming?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled,
  streaming,
  placeholder,
}: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled && !streaming;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const effectivePlaceholder = disabled
    ? "Cekam vezu sa serverom..."
    : streaming
      ? "Cekam odgovor..."
      : (placeholder ?? "Pitaj sta god o crnogorskom pravu...");

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-3xl border border-border bg-input-bg px-3 py-2.5 shadow-sm focus-within:border-muted transition-colors">
          <button
            type="button"
            disabled
            title="Upload fajla (uskoro)"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sidebar-hover disabled:opacity-50 cursor-not-allowed"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <Textarea
            ref={ref}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled || streaming}
            placeholder={effectivePlaceholder}
            className="flex-1 max-h-[200px] py-2 text-sm"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-opacity",
              canSend
                ? "bg-accent text-accent-foreground hover:opacity-90 cursor-pointer"
                : "bg-sidebar-hover text-muted cursor-not-allowed"
            )}
            title="Posalji"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted">
          LexMe moze da pogrijesi. Ne predstavlja pravni savjet.
        </p>
      </div>
    </div>
  );
}
