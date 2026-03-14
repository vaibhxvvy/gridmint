'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PatternState } from '@/types/pattern';
import { PATTERNS, drawPattern } from '@/lib/patterns/engine';
import { DEFAULT_STATE } from '@/lib/url-state';

const THUMB_SIZE = 58;

interface UsePatternRendererReturn {
  state:        PatternState;
  setState:     (patch: Partial<PatternState>, activeOnly?: boolean) => void;
  canvasRef:    React.RefObject<HTMLCanvasElement | null>;
  thumbRefs:    React.MutableRefObject<Record<string, HTMLCanvasElement | null>>;
  resetState:   () => void;
}

export function usePatternRenderer(): UsePatternRendererReturn {
  const [state, setStateRaw] = useState<PatternState>(DEFAULT_STATE);
  const stateRef  = useRef(state);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  // RAF dirty flag — main preview
  const rafPending   = useRef(false);
  const pendingState = useRef<PatternState>(state);

  // Thumb debounce
  const thumbTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thumbActiveOnly = useRef(true);

  // ── draw main preview ──────────────────────────────────────────────
  const drawPreview = useCallback((s: PatternState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = s.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // extMult=5 for preview — full coverage
    drawPattern(ctx, s, 5);
  }, []);

  // ── draw single thumb ─────────────────────────────────────────────
  const drawThumb = useCallback((patId: string, s: PatternState) => {
    const canvas = thumbRefs.current[patId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pat = PATTERNS.find(p => p.id === patId);
    if (!pat) return;
    ctx.clearRect(0, 0, THUMB_SIZE, THUMB_SIZE);
    ctx.fillStyle = s.bgColor;
    ctx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE);
    // thumbnail state: scaled-down size, extMult=2 (much less work)
    const thumbState: PatternState = {
      ...s,
      size: Math.max(5, Math.round(s.size * 0.36)),
      opacity: Math.min(s.opacity * 1.5, 100),
    };
    pat.draw(ctx, thumbState, 2);
  }, []);

  // ── schedule thumb update ─────────────────────────────────────────
  // activeOnly=true  → only redraw active pattern's thumb (during slider drag)
  // activeOnly=false → redraw all after 280ms debounce (after pattern switch)
  const scheduleThumbUpdate = useCallback((activeOnly: boolean) => {
    if (!activeOnly) thumbActiveOnly.current = false; // don't downgrade
    if (thumbTimer.current) clearTimeout(thumbTimer.current);
    thumbTimer.current = setTimeout(() => {
      const s = stateRef.current;
      const wasActiveOnly = thumbActiveOnly.current;
      thumbActiveOnly.current = true; // reset

      if (wasActiveOnly) {
        // Only redraw the active thumb instantly
        requestAnimationFrame(() => drawThumb(s.pattern, s));
      } else {
        // Stagger all 12 redraws 20ms apart so main thread never spikes
        PATTERNS.forEach((pat, i) => {
          setTimeout(() => requestAnimationFrame(() => drawThumb(pat.id, s)), i * 20);
        });
      }
    }, 280);
  }, [drawThumb]);

  // ── main render trigger ───────────────────────────────────────────
  const triggerRender = useCallback((s: PatternState, activeOnly: boolean) => {
    if (!activeOnly) thumbActiveOnly.current = false;
    if (rafPending.current) return;
    rafPending.current = true;
    requestAnimationFrame(() => {
      rafPending.current = false;
      drawPreview(pendingState.current);
      scheduleThumbUpdate(thumbActiveOnly.current);
      // push URL state
      if (typeof window !== 'undefined') {
        const p = new URLSearchParams({
          pat: pendingState.current.pattern,
          bg:  pendingState.current.bgColor.replace('#', ''),
          col: pendingState.current.patColor.replace('#', ''),
          sz:  String(pendingState.current.size),
          op:  String(pendingState.current.opacity),
          tk:  String(pendingState.current.thickness),
          rot: String(pendingState.current.rotation),
        });
        history.replaceState(null, '', '?' + p.toString());
      }
    });
  }, [drawPreview, scheduleThumbUpdate]);

  // ── setState wrapper ──────────────────────────────────────────────
  const setState = useCallback((patch: Partial<PatternState>, activeOnly = true) => {
    const next = { ...stateRef.current, ...patch };
    stateRef.current   = next;
    pendingState.current = next;
    setStateRaw(next);
    triggerRender(next, activeOnly);
  }, [triggerRender]);

  const resetState = useCallback(() => {
    const next = { ...DEFAULT_STATE };
    stateRef.current   = next;
    pendingState.current = next;
    setStateRaw(next);
    triggerRender(next, false); // full thumb redraw on reset
  }, [triggerRender]);

  // ── initial draw ──────────────────────────────────────────────────
  useEffect(() => {
    drawPreview(stateRef.current);
    // Draw all thumbs on mount, staggered
    PATTERNS.forEach((pat, i) => {
      setTimeout(() => requestAnimationFrame(() => drawThumb(pat.id, stateRef.current)), i * 20);
    });
  }, [drawPreview, drawThumb]);

  return { state, setState, canvasRef, thumbRefs, resetState };
}
