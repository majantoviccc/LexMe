"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "lexme:sidebar-width";
const DEFAULT_WIDTH = 288; // w-72
export const MIN_SIDEBAR_WIDTH = 220;
export const MAX_SIDEBAR_WIDTH = 480;

function clamp(value: number): number {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, value));
}

export function useResizableSidebar() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDesktop, setIsDesktop] = useState(false);
  const [resizing, setResizing] = useState(false);
  const resizingRef = useRef(false);

  // Hydrate persisted width + track desktop breakpoint (Tailwind md = 768px).
  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    if (stored) setWidth(clamp(stored));

    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!resizing) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!resizingRef.current) return;
      const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
      if (clientX == null) return;
      // Prevent the page from scrolling while dragging on touch devices.
      if ("touches" in e) e.preventDefault();
      setWidth(clamp(clientX));
    };
    const onUp = () => {
      resizingRef.current = false;
      setResizing(false);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
    document.addEventListener("touchcancel", onUp);
    // Avoid text selection / wrong cursor while dragging.
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      document.removeEventListener("touchcancel", onUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [resizing]);

  // Persist width after each change (skip while actively dragging is fine too).
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  const startResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    resizingRef.current = true;
    setResizing(true);
  }, []);

  const resetWidth = useCallback(() => setWidth(DEFAULT_WIDTH), []);

  return { width, isDesktop, resizing, startResize, resetWidth };
}
