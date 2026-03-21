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

type PerPatternMem = Partial<Omit<PatternState, 'pattern'>>;
const patternMemory = new Map<string, PerPatternMem>();

// ── Tile cache ────────────────────────────────────────────────────────
// We draw the pattern ONCE into a tile that is (3 × canvas size).
// Animation just translates this tile — no redrawing per frame.
// This works for ALL patterns including noise, waves, hex, carbon.
interface TileCache {
  canvas:   HTMLCanvasElement;
  stateKey: string;
  tileW:    number;
  tileH:    number;
}

function stateKey(s: PatternState): string {
  return `${s.pattern}|${s.bgColor}|${s.patColor}|${s.size}|${s.opacity}|${s.thickness}|${s.rotation}`;
}

function buildTile(s: PatternState, canvasW: number, canvasH: number): TileCache {
  // Tile is 3×3 canvas sizes — gives full coverage for any offset up to (W, H)
  const tileW = canvasW * 3;
  const tileH = canvasH * 3;
  const tile  = document.createElement('canvas');
  tile.width  = tileW;
  tile.height = tileH;
  const ctx   = tile.getContext('2d')!;

  // Fill bg
  ctx.fillStyle = s.bgColor;
  ctx.fillRect(0, 0, tileW, tileH);

  // For noise: tile the pattern in a 3×3 grid using separate seeded draws
  // For all others: draw with extMult=3 which covers the 3× canvas area perfectly
  if (s.pattern === 'noise') {
    // Draw noise 9 times to fill the 3×3 tile
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        // Create a small canvas for one cell
        const cell = document.createElement('canvas');
        cell.width = canvasW; cell.height = canvasH;
        const cc = cell.getContext('2d')!;
        drawPattern(cc, s, 5, 0, 0);
        ctx.drawImage(cell, col * canvasW, row * canvasH);
      }
    }
  } else {
    // Draw pattern centred in the tile with extMult=1 (tile IS the canvas equivalent)
    // We draw onto a canvas the size of the tile then blit it
    const tmp = document.createElement('canvas');
    tmp.width = tileW; tmp.height = tileH;
    const tc = tmp.getContext('2d')!;
    tc.fillStyle = s.bgColor;
    tc.fillRect(0, 0, tileW, tileH);
    // extMult=3 draws 3× the canvas — perfect for our 3× tile
    drawPattern(tc, s, 3, 0, 0);
    ctx.drawImage(tmp, 0, 0);
  }

  return { canvas: tile, stateKey: stateKey(s), tileW, tileH };
}

export interface UsePatternRendererReturn {
  state:      PatternState;
  setState:   (patch: Partial<PatternState>, activeOnly?: boolean) => void;
  canvasRef:  React.RefObject<HTMLCanvasElement | null>;
  thumbRefs:  React.MutableRefObject<Record<string, HTMLCanvasElement | null>>;
  resetState: () => void;
  redraw:     () => void;
  pausedRef:  React.MutableRefObject<boolean>;
}

export function usePatternRenderer(): UsePatternRendererReturn {
  const [state, setStateRaw] = useState<PatternState>(DEFAULT_STATE);
  const stateRef  = useRef<PatternState>(DEFAULT_STATE);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const rafId      = useRef<number>(0);
  const animRafId  = useRef<number>(0);
  // Offset in pixels — wraps to [0, tileW) and [0, tileH)
  const animOffset = useRef({ x: 0, y: 0 });
  const lastTime   = useRef<number>(0);
  const thumbTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // pausedRef: freezes animation without touching state.animation
  const pausedRef  = useRef(false);

  // Tile cache — rebuilt only when pattern/colours/size change
  const tileCache  = useRef<TileCache | null>(null);

  // ── Invalidate tile when state changes ───────────────────────────
  const invalidateTile = useCallback(() => {
    tileCache.current = null;
  }, []);

  // ── draw preview using tile cache ─────────────────────────────────
  const drawPreview = useCallback((s: PatternState, ox = 0, oy = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width || !canvas.height) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = s.bgColor;
    ctx.fillRect(0, 0, W, H);

    // Noise: always redraw fresh — the random flicker IS the animation
    // The 256px grain tile in engine.ts makes this fast enough for 60fps
    if (s.pattern === 'noise') {
      drawPattern(ctx, s, 5, 0, 0);
      return;
    }

    if (ox === 0 && oy === 0) {
      drawPattern(ctx, s, 5, 0, 0);
      return;
    }

    // All other patterns: use tile cache — draw once, translate per frame
    const key = stateKey(s);
    if (!tileCache.current || tileCache.current.stateKey !== key) {
      tileCache.current = buildTile(s, W, H);
    }

    const { canvas: tile, tileW, tileH } = tileCache.current;
    const wx = ((ox % tileW) + tileW) % tileW;
    const wy = ((oy % tileH) + tileH) % tileH;

    ctx.drawImage(tile, wx - tileW, wy - tileH);
    ctx.drawImage(tile, wx,         wy - tileH);
    ctx.drawImage(tile, wx - tileW, wy);
    ctx.drawImage(tile, wx,         wy);
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
  const stopAnim = useCallback(() => {
    cancelAnimationFrame(animRafId.current);
    animRafId.current = 0;
    lastTime.current  = 0;
  }, []);

  const startAnim = useCallback((s: PatternState) => {
    stopAnim();
    if (s.animation === 'none') return;

    const tick = (now: number) => {
      if (pausedRef.current) {
        // Paused — keep RAF alive, don't advance
        lastTime.current = 0; // reset so no jump when resumed
        animRafId.current = requestAnimationFrame(tick);
        return;
      }

      if (!lastTime.current) lastTime.current = now;
      const dt    = Math.min((now - lastTime.current) / 1000, 0.05);
      lastTime.current = now;

      const speed = stateRef.current.animSpeed ?? 40;
      const o     = animOffset.current;

      switch (stateRef.current.animation) {
        case 'left':       o.x -= speed * dt; break;
        case 'right':      o.x += speed * dt; break;
        case 'up':         o.y -= speed * dt; break;
        case 'down':       o.y += speed * dt; break;
        case 'diag-left':  o.x -= speed * dt; o.y += speed * dt; break;
        case 'diag-right': o.x += speed * dt; o.y += speed * dt; break;
      }

      drawPreview(stateRef.current, o.x, o.y);
      animRafId.current = requestAnimationFrame(tick);
    };

    animRafId.current = requestAnimationFrame(tick);
  }, [drawPreview, stopAnim]);

  // ── trigger render ────────────────────────────────────────────────
  const triggerRender = useCallback((s: PatternState, redrawAllThumbs: boolean) => {
    invalidateTile();

    if (s.animation !== 'none') {
      startAnim(s);
    } else {
      stopAnim();
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => drawPreview(s, 0, 0));
    }

    if (thumbTimer.current) clearTimeout(thumbTimer.current);
    thumbTimer.current = setTimeout(() => {
      if (redrawAllThumbs) {
        // Stagger only the non-active thumbs using their own remembered state
        PATTERNS.forEach((pat, i) => {
          if (pat.id === s.pattern) {
            requestAnimationFrame(() => drawThumb(pat.id, s));
          } else {
            setTimeout(() => {
              const mem  = patternMemory.get(pat.id);
              const defs = PATTERN_DEFAULTS[pat.id] ?? {};
              const ts: PatternState = { ...DEFAULT_STATE, ...defs, ...(mem ?? {}), pattern: pat.id };
              requestAnimationFrame(() => drawThumb(pat.id, ts));
            }, i * 16);
          }
        });
      } else {
        requestAnimationFrame(() => drawThumb(s.pattern, s));
      }
    }, 50);

    if (typeof window !== 'undefined') {
      history.replaceState(null, '', encodeState(s));
    }
  }, [drawPreview, drawThumb, invalidateTile, startAnim, stopAnim]);

  // ── setState ─────────────────────────────────────────────────────
  const setState = useCallback((patch: Partial<PatternState>, activeOnly = true) => {
    const cur      = stateRef.current;
    const isSwitch = patch.pattern !== undefined && patch.pattern !== cur.pattern;

    if (isSwitch) {
      patternMemory.set(cur.pattern, {
        size: cur.size, opacity: cur.opacity, thickness: cur.thickness,
        rotation: cur.rotation, bgColor: cur.bgColor, patColor: cur.patColor,
        animation: cur.animation, animSpeed: cur.animSpeed,
      });
      const newId = patch.pattern as string;
      const mem   = patternMemory.get(newId);
      const defs  = PATTERN_DEFAULTS[newId] ?? {};
      const next: PatternState = { ...cur, ...defs, ...(mem ?? defs), ...patch };
      stateRef.current = next;
      setStateRaw(next);
      // Reset offset on pattern switch so new pattern starts from origin
      animOffset.current = { x: 0, y: 0 };
      // Reset pause on pattern switch — fix issue 5
      pausedRef.current = false;
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
    tileCache.current  = null;
    animOffset.current = { x: 0, y: 0 };
    pausedRef.current  = false;
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

  return { state, setState, canvasRef, thumbRefs, resetState, redraw, pausedRef };
}
