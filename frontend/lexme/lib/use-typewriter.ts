import { useEffect, useRef, useState } from "react";

// The one knob: steady typing speed in characters/second. Lower = slower.
// (The original effective speed was ~90 cps, so 30 is ~3x slower.)
const CHARS_PER_SEC = 60;

export interface TypewriterResult {
  /** The portion of `target` revealed so far. */
  text: string;
  /** True while there is still buffered text left to reveal. */
  revealing: boolean;
}

/**
 * Progressively reveals `target` one slice at a time at a fixed cadence,
 * decoupling what's shown on screen from how the source text arrives. Pass
 * `animate = true` while the message is streaming; once it has started
 * animating it keeps revealing to the end even after streaming stops, so a
 * response delivered in one big chunk still types out at the same speed.
 * Messages that were never streamed (e.g. history loaded from storage) render
 * instantly.
 *
 * Speed is driven by a fractional accumulator rather than "at least one char
 * per animation frame", so rates well below the ~60fps frame rate (i.e. slow,
 * readable typing) are honoured exactly.
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
  // Carries the sub-character remainder between frames so slow rates work.
  const accRef = useRef(0);
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
    accRef.current = 0;

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
      let cur = displayLenRef.current;
      if (cur >= tgt) {
        stop();
        return;
      }

      // Accumulate fractional progress; only advance whole characters.
      accRef.current += (CHARS_PER_SEC * dt) / 1000;
      const advance = Math.floor(accRef.current);
      if (advance >= 1) {
        accRef.current -= advance;
        cur = Math.min(tgt, cur + advance);
        displayLenRef.current = cur;
        setDisplayLen(cur);
      }

      if (cur >= tgt) {
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
