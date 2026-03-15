'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PatternState } from '@/types/pattern';
import { PATTERNS, drawPattern } from '@/lib/patterns/engine';
import { DEFAULT_STATE } from '@/lib/url-state';

const THUMB_SIZE = 58;

// Per-pattern default adjustments — reset when switching patterns
const PATTERN_DEFAULTS: Partial<Record<string, Partial<PatternState>>> = {
  noise:    { size: 20, opacity: 20, thickness: 1, rotation: 0 },
  dots:     { size: 18, opacity: 25, thickness: 2, rotation: 0 },
  grid:     { size: 24, opacity: 25, thickness: 1, rotation: 0 },
  rect:     { size: 24, opacity: 25, thickness: 1, rotation: 0 },
  diagonal: { size: 14, opacity: 20, thickness: 1, rotation: 0 },
  hatch:    { size: 16, opacity: 20, thickness: 1, rotation: 0 },
  carbon:   { size: 8,  opacity: 80, thickness: 1, rotation: 0 },
  halftone: { size: 16, opacity: 60, thickness: 4, rotation: 0 },
  plus:     { size: 20, opacity: 30, thickness: 1, rotation: 0 },
  hex:      { size: 22, opacity: 35, thickness: 1, rotation: 0 },
  waves:    { size: 20, opacity: 35, thickness: 1, rotation: 0 },
  circuit:  { size: 24, opacity: 50, thickness: 1, rotation: 0 },
};

interface UsePatternRendererReturn {
  state:      PatternState;
  setState:   (patch: Partial<PatternState>, activeOnly?: boolean) => void;
  canvasRef:  React.RefObject<HTMLCanvasElement | null>;
  thumbRefs:  React.MutableRefObject<Record<string, HTMLCanvasElement | null>>;
  resetState: () => void;
  redraw:     () => void;
}

export function usePatternRenderer(): UsePatternRendererReturn {
  const [state, setStateRaw] = useState<PatternState>(DEFAULT_STATE);
  const stateRef   = useRef<PatternState>(DEFAULT_STATE);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const thumbRefs  = useRef<Record<string, HTMLCanvasElement | null>>({});

  // RAF — we don't use a dirty-flag guard anymore because it was causing
  // the double-click bug. Instead we cancel and re-schedule on every call.
  const rafId      = useRef<number>(0);

  // Thumb debounce
  const thumbTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thumbActiveOnly = useRef(true);

  // ── draw main preview ─────────────────────────────────────────────
  const drawPreview = useCallback((s: PatternState) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width || !canvas.height) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = s.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPattern(ctx, s, 5);
  }, []);

  // ── draw single thumb ────────────────────────────────────────────
  const drawThumb = useCallback((patId: string, s: PatternState) => {
    const canvas = thumbRefs.current[patId];
    if (!canvas || !canvas.width || !canvas.height) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pat = PATTERNS.find(p => p.id === patId);
    if (!pat) return;
    ctx.clearRect(0, 0, THUMB_SIZE, THUMB_SIZE);
    ctx.fillStyle = s.bgColor;
    ctx.fillRect(0, 0, THUMB_SIZE, THUMB_SIZE);
    pat.draw(ctx, {
      ...s,
      size:    Math.max(5, Math.round(s.size * 0.36)),
      opacity: Math.min(s.opacity * 1.5, 100),
    }, 2);
  }, []);

  // ── schedule thumb update ────────────────────────────────────────
  const scheduleThumbUpdate = useCallback((activeOnly: boolean) => {
    if (!activeOnly) thumbActiveOnly.current = false;
    if (thumbTimer.current) clearTimeout(thumbTimer.current);

    // Pattern switch → redraw all thumbs immediately (no debounce)
    // Slider drag → debounce 280ms so we don't redraw 60× per second
    const delay = thumbActiveOnly.current ? 280 : 0;

    thumbTimer.current = setTimeout(() => {
      const s = stateRef.current;
      const wasActiveOnly = thumbActiveOnly.current;
      thumbActiveOnly.current = true;
      if (wasActiveOnly) {
        requestAnimationFrame(() => drawThumb(s.pattern, s));
      } else {
        // Stagger only on slider-triggered full redraws, instant on pattern switch
        PATTERNS.forEach((pat, i) =>
          setTimeout(() => requestAnimationFrame(() => drawThumb(pat.id, s)), i * 16)
        );
      }
    }, delay);
  }, [drawThumb]);

  // ── trigger render — cancel previous RAF, schedule new one ───────
  // This fixes the double-click bug: no dirty-flag that drops renders,
  // instead we cancel and reschedule so every setState always renders.
  const triggerRender = useCallback((s: PatternState, activeOnly: boolean) => {
    if (!activeOnly) thumbActiveOnly.current = false;
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      drawPreview(s);
      scheduleThumbUpdate(thumbActiveOnly.current);
      thumbActiveOnly.current = true;
      if (typeof window !== 'undefined') {
        const p = new URLSearchParams({
          pat: s.pattern,
          bg:  s.bgColor.replace('#', ''),
          col: s.patColor.replace('#', ''),
          sz:  String(s.size),
          op:  String(s.opacity),
          tk:  String(s.thickness),
          rot: String(s.rotation),
        });
        history.replaceState(null, '', '?' + p.toString());
      }
    });
  }, [drawPreview, scheduleThumbUpdate]);

  // ── setState ─────────────────────────────────────────────────────
  const setState = useCallback((patch: Partial<PatternState>, activeOnly = true) => {
    // If switching pattern, reset adjustments to per-pattern defaults
    const isPatternSwitch = patch.pattern !== undefined && patch.pattern !== stateRef.current.pattern;
    const adjustReset = isPatternSwitch
      ? (PATTERN_DEFAULTS[patch.pattern as string] ?? PATTERN_DEFAULTS[DEFAULT_STATE.pattern]!)
      : {};

    const next: PatternState = {
      ...stateRef.current,
      ...adjustReset,
      ...patch,
    };
    stateRef.current = next;
    setStateRaw(next);
    triggerRender(next, isPatternSwitch ? false : activeOnly);
  }, [triggerRender]);

  const resetState = useCallback(() => {
    const next = { ...DEFAULT_STATE };
    stateRef.current = next;
    setStateRaw(next);
    triggerRender(next, false);
  }, [triggerRender]);

  // ── initial draw ─────────────────────────────────────────────────
  useEffect(() => {
    drawPreview(stateRef.current);
    PATTERNS.forEach((pat, i) =>
      setTimeout(() => requestAnimationFrame(() => drawThumb(pat.id, stateRef.current)), i * 20)
    );
  }, [drawPreview, drawThumb]);

  const redraw = useCallback(() => {
    drawPreview(stateRef.current);
  }, [drawPreview]);

  return { state, setState, canvasRef, thumbRefs, resetState, redraw };
}
