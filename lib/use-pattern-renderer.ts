'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PatternState } from '@/types/pattern';
import { PATTERNS, drawPattern } from '@/lib/patterns/engine';
import { DEFAULT_STATE, encodeState } from '@/lib/url-state';

const THUMB_SIZE = 58;

const PATTERN_DEFAULTS: Record<string, Partial<PatternState>> = {
  noise:    { size: 20, opacity: 20, thickness: 1, rotation: 0, animation: 'none', animSpeed: 40 },
  dots:     { size: 18, opacity: 25, thickness: 2, rotation: 0, animation: 'none', animSpeed: 40 },
  grid:     { size: 24, opacity: 25, thickness: 1, rotation: 0, animation: 'none', animSpeed: 40 },
  rect:     { size: 24, opacity: 25, thickness: 1, rotation: 0, animation: 'none', animSpeed: 40 },
  diagonal: { size: 14, opacity: 20, thickness: 1, rotation: 0, animation: 'none', animSpeed: 40 },
  hatch:    { size: 16, opacity: 20, thickness: 1, rotation: 0, animation: 'none', animSpeed: 40 },
  carbon:   { size: 8,  opacity: 80, thickness: 1, rotation: 0, animation: 'none', animSpeed: 40 },
  halftone: { size: 16, opacity: 60, thickness: 4, rotation: 0, animation: 'none', animSpeed: 40 },
  plus:     { size: 20, opacity: 30, thickness: 1, rotation: 0, animation: 'none', animSpeed: 40 },
  hex:      { size: 22, opacity: 35, thickness: 1, rotation: 0, animation: 'none', animSpeed: 40 },
  waves:    { size: 20, opacity: 35, thickness: 1, rotation: 0, animation: 'none', animSpeed: 40 },
  circuit:  { size: 24, opacity: 50, thickness: 1, rotation: 0, animation: 'none', animSpeed: 40 },
};

// Per-pattern memory — remembers user settings when switching patterns
type PerPatternMem = Partial<Omit<PatternState, 'pattern'>>;
const patternMemory = new Map<string, PerPatternMem>();

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
  const stateRef  = useRef<PatternState>(DEFAULT_STATE);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const rafId      = useRef<number>(0);
  const animRafId  = useRef<number>(0);
  // offset stays in [0, size) — wraps cleanly, never resets visually
  const animOffset = useRef({ x: 0, y: 0 });
  const lastTime   = useRef<number>(0);
  const thumbTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── draw preview ──────────────────────────────────────────────────
  // ox/oy are in [0, size) — passed directly into drawPattern which
  // forwards them to drawSetup as a pre-rotation translation offset.
  // extMult=5 draws 5× the canvas area so offset never causes gaps.
  const drawPreview = useCallback((s: PatternState, ox = 0, oy = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width || !canvas.height) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = s.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // extMult=3 during animation (fast), 5 for static (full quality)
    const ext = (ox !== 0 || oy !== 0) ? 3 : 5;
    drawPattern(ctx, s, ext, ox, oy);
  }, []);

  // ── draw thumb ────────────────────────────────────────────────────
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
    }, 2, 0, 0);
  }, []);

  // ── animation loop ────────────────────────────────────────────────
  // Key: offset always wraps to [0, size) so it NEVER resets — just
  // cycles through the same tile-sized range forever, perfectly seamless.
  const stopAnim = useCallback(() => {
    cancelAnimationFrame(animRafId.current);
    animRafId.current = 0;
    lastTime.current  = 0;
    // Don't reset offset — keep position so resuming feels smooth
  }, []);

  const startAnim = useCallback((s: PatternState) => {
    stopAnim();
    if (s.animation === 'none') return;

    const tick = (now: number) => {
      if (!lastTime.current) lastTime.current = now;
      const dt    = Math.min((now - lastTime.current) / 1000, 0.05); // max 50ms step
      lastTime.current = now;

      const speed = stateRef.current.animSpeed ?? 40;
      const size  = Math.max(stateRef.current.size, 4);
      const o     = animOffset.current;

      switch (stateRef.current.animation) {
        case 'left':       o.x -= speed * dt; break;
        case 'right':      o.x += speed * dt; break;
        case 'up':         o.y -= speed * dt; break;
        case 'down':       o.y += speed * dt; break;
        case 'diag-left':  o.x -= speed * dt; o.y -= speed * dt; break;
        case 'diag-right': o.x += speed * dt; o.y -= speed * dt; break;
      }

      // Wrap to [0, size) — this is the key to seamless infinite loop
      // modulo can return negative in JS so we add size before mod
      o.x = ((o.x % size) + size) % size;
      o.y = ((o.y % size) + size) % size;

      drawPreview(stateRef.current, o.x, o.y);
      animRafId.current = requestAnimationFrame(tick);
    };

    animRafId.current = requestAnimationFrame(tick);
  }, [drawPreview, stopAnim]);

  // ── trigger render ────────────────────────────────────────────────
  const triggerRender = useCallback((s: PatternState, redrawAllThumbs: boolean) => {
    if (s.animation !== 'none') {
      startAnim(s);
    } else {
      stopAnim();
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => drawPreview(s, 0, 0));
    }

    if (thumbTimer.current) clearTimeout(thumbTimer.current);
    if (redrawAllThumbs) {
      PATTERNS.forEach((pat, i) =>
        setTimeout(() => requestAnimationFrame(() => {
          const mem = patternMemory.get(pat.id);
          const ts: PatternState = {
            ...DEFAULT_STATE,
            ...(PATTERN_DEFAULTS[pat.id] ?? {}),
            ...(mem ?? {}),
            pattern:  pat.id,
            bgColor:  s.bgColor,
          };
          drawThumb(pat.id, ts);
        }), i * 16)
      );
    } else {
      thumbTimer.current = setTimeout(() =>
        requestAnimationFrame(() => drawThumb(s.pattern, s))
      , 200);
    }

    if (typeof window !== 'undefined') {
      history.replaceState(null, '', encodeState(s));
    }
  }, [drawPreview, drawThumb, startAnim, stopAnim]);

  // ── setState ─────────────────────────────────────────────────────
  const setState = useCallback((patch: Partial<PatternState>, activeOnly = true) => {
    const cur = stateRef.current;
    const isSwitch = patch.pattern !== undefined && patch.pattern !== cur.pattern;

    if (isSwitch) {
      // Save current pattern's state
      patternMemory.set(cur.pattern, {
        size: cur.size, opacity: cur.opacity, thickness: cur.thickness,
        rotation: cur.rotation, bgColor: cur.bgColor, patColor: cur.patColor,
        animation: cur.animation, animSpeed: cur.animSpeed,
      });
      const newId  = patch.pattern as string;
      const mem    = patternMemory.get(newId);
      const defs   = PATTERN_DEFAULTS[newId] ?? {};
      const next: PatternState = { ...cur, ...defs, ...(mem ?? defs), ...patch };
      stateRef.current = next;
      setStateRaw(next);
      triggerRender(next, true);
    } else {
      const next: PatternState = { ...cur, ...patch };
      stateRef.current = next;
      setStateRaw(next);
      triggerRender(next, false);
    }
  }, [triggerRender]);

  const resetState = useCallback(() => {
    patternMemory.clear();
    animOffset.current = { x: 0, y: 0 };
    const next = { ...DEFAULT_STATE };
    stateRef.current = next;
    setStateRaw(next);
    triggerRender(next, true);
  }, [triggerRender]);

  const redraw = useCallback(() => {
    const s = stateRef.current;
    if (s.animation !== 'none') startAnim(s);
    else drawPreview(s, 0, 0);
  }, [drawPreview, startAnim]);

  useEffect(() => {
    drawPreview(stateRef.current, 0, 0);
    PATTERNS.forEach((pat, i) =>
      setTimeout(() => requestAnimationFrame(() =>
        drawThumb(pat.id, { ...DEFAULT_STATE, ...(PATTERN_DEFAULTS[pat.id] ?? {}), pattern: pat.id })
      ), i * 20)
    );
    return () => { stopAnim(); cancelAnimationFrame(rafId.current); };
  }, [drawPreview, drawThumb, stopAnim]);

  return { state, setState, canvasRef, thumbRefs, resetState, redraw };
}
