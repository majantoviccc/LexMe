"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl",
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Zatvori"
          className="absolute top-3 right-3 p-1 rounded-md text-muted hover:text-foreground hover:bg-sidebar-hover cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
        {title && (
          <h2
            id="dialog-title"
            className="text-lg font-semibold tracking-tight pr-6"
          >
            {title}
          </h2>
        )}
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
        <div className={cn(title || description ? "mt-4" : "")}>{children}</div>
      </div>
    </div>
  );
}
