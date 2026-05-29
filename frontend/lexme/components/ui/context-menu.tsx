"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

interface Props {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const MENU_WIDTH = 180;
const MENU_GAP = 4;

export function ContextMenu({ open, x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleScroll = () => onClose();
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxX =
    typeof window !== "undefined" ? window.innerWidth - MENU_WIDTH - 8 : x;
  const clampedX = Math.min(x, maxX);
  const clampedY =
    typeof window !== "undefined"
      ? Math.min(y, window.innerHeight - items.length * 36 - 16)
      : y;

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 rounded-lg border border-border bg-sidebar shadow-xl py-1"
      style={{
        top: clampedY + MENU_GAP,
        left: clampedX,
        width: MENU_WIDTH,
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          role="menuitem"
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-sidebar-hover cursor-pointer",
            item.destructive
              ? "text-red-400 hover:text-red-300"
              : "text-foreground"
          )}
        >
          {item.icon && <span className="shrink-0">{item.icon}</span>}
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
