import { useEffect, useRef, useState } from "react";

// Minimum reveal speed (characters/second) — sets the steady "typing" cadence
// the eye reads as word-by-word.
const MIN_CHARS_PER_SEC = 5;
// Max time (seconds) the rendered text is allowed to trail behind the text we
// have actually received. When the backend dumps a big chunk (or the whole
// answer) at once, the backlog drains within this window instead of crawling.
const MAX_LAG_SECONDS = 0.7;

export interface TypewriterResult {
  /** The portion of `target` revealed so far. */
  text: string;
  /** True while there is still buffered text left to reveal. */
  revealing: boolean;
}

/**
 * Progressively reveals `target` one slice at a time, decoupling what's shown
 * on screen from how the source text arrives. Pass `animate = true` while the
 * message is streaming; once it has started animating it keeps revealing to the
 * end even after streaming stops, so a response delivered in one big chunk
 * still types out. Messages that were never streamed (e.g. history loaded from
 * storage) render instantly.
 */
export function useTypewriter(
  target: string,
  animate: boolean,
): TypewriterResult {
  const [displayLen, setDisplayLen] = useState(() =>
    animate ? 0 : target.length,
  );

  const targetLenRef = useRef(target.length);
  const displayLenRef = useRef(displayLen);
  // Latches on the first time this message is animating; keeps the reveal going
  // until it catches up, even after `animate` flips back to false.
  const everAnimatedRef = useRef(animate);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  // Mirror the latest render into refs so the rAF loop reads fresh values
  // without restarting on every token. Declared before the animation effect so
  // the refs are current by the time it runs in the same commit.
  useEffect(() => {
    targetLenRef.current = target.length;
    displayLenRef.current = displayLen;
  });

  useEffect(() => {
    if (animate) everAnimatedRef.current = true;

    // Nothing to do for never-streamed messages, while a loop is already
    // running, or once we've caught up to everything received so far.
    if (
      !everAnimatedRef.current ||
      runningRef.current ||
      displayLenRef.current >= targetLenRef.current
    ) {
      return;
    }

    runningRef.current = true;
    lastTsRef.current = null;

    const stop = () => {
      runningRef.current = false;
      lastTsRef.current = null;
      rafRef.current = null;
    };

    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      const tgt = targetLenRef.current;
      const cur = displayLenRef.current;
      if (cur >= tgt) {
        stop();
        return;
      }

      const remaining = tgt - cur;
      const cps = Math.max(MIN_CHARS_PER_SEC, remaining / MAX_LAG_SECONDS);
      const next = Math.min(
        tgt,
        cur + Math.max(1, Math.round((cps * dt) / 1000)),
      );

      displayLenRef.current = next;
      setDisplayLen(next);

      if (next >= tgt) {
        stop();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    // No cleanup here on purpose: the loop must survive token-driven re-renders.
    // It self-terminates once caught up, and is cancelled on unmount below.
  }, [target, animate]);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  return {
    text: target.slice(0, displayLen),
    revealing: displayLen < target.length,
  };
}
