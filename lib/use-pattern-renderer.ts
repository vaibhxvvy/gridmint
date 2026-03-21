'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PatternState } from '@/types/pattern';
import { PATTERNS, drawPattern } from '@/lib/patterns/engine';
import { DEFAULT_STATE, encodeState } from '@/lib/url-state';
import { gsap } from 'gsap';

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
// Pattern is drawn ONCE into a 3× canvas tile.
// Every animation frame just blits it with a different offset — zero redraw.
interface TileCache {
  canvas:   HTMLCanvasElement;
  stateKey: string;
  tileW:    number;
  tileH:    number;
}

function makeStateKey(s: PatternState): string {
  return `${s.pattern}|${s.bgColor}|${s.patColor}|${s.size}|${s.opacity}|${s.thickness}|${s.rotation}`;
}

function buildTile(s: PatternState, canvasW: number, canvasH: number): TileCache {
  const tileW = canvasW * 3;
  const tileH = canvasH * 3;
  const tile  = document.createElement('canvas');
  tile.width  = tileW;
  tile.height = tileH;
  const ctx   = tile.getContext('2d')!;
  ctx.fillStyle = s.bgColor;
  ctx.fillRect(0, 0, tileW, tileH);
  const tmp = document.createElement('canvas');
  tmp.width = tileW; tmp.height = tileH;
  const tc = tmp.getContext('2d')!;
  tc.fillStyle = s.bgColor;
  tc.fillRect(0, 0, tileW, tileH);
  drawPattern(tc, s, 3, 0, 0);
  ctx.drawImage(tmp, 0, 0);
  return { canvas: tile, stateKey: makeStateKey(s), tileW, tileH };
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

  const thumbTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafId      = useRef<number>(0);

  // pausedRef: true = freeze animation without changing state.animation
  const pausedRef = useRef(false);

  // Tile cache — invalidated whenever pattern/colours/size change
  const tileCache = useRef<TileCache | null>(null);

  // GSAP ticker callback ref — stored so we can remove it cleanly
  const tickerFn = useRef<((time: number, deltaTime: number) => void) | null>(null);

  // Accumulated offset in px — wraps to tile size
  const offset = useRef({ x: 0, y: 0 });

  // ── draw preview ──────────────────────────────────────────────────
  const drawPreview = useCallback((s: PatternState, ox = 0, oy = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width || !canvas.height) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = s.bgColor;
    ctx.fillRect(0, 0, W, H);

    // Noise: redraw fresh every frame — the flicker IS the effect
    if (s.pattern === 'noise') {
      drawPattern(ctx, s, 5, 0, 0);
      return;
    }

    // Static draw
    if (ox === 0 && oy === 0) {
      drawPattern(ctx, s, 5, 0, 0);
      return;
    }

    // Animated: blit from tile cache
    const key = makeStateKey(s);
    if (!tileCache.current || tileCache.current.stateKey !== key) {
      tileCache.current = buildTile(s, W, H);
    }
    const { canvas: tile, tileW, tileH } = tileCache.current;
    const wx = ((ox % tileW) + tileW) % tileW;
    const wy = ((oy % tileH) + tileH) % tileH;
    // 4-quadrant blit for seamless wrap
    ctx.drawImage(tile, wx - tileW, wy - tileH);
    ctx.drawImage(tile, wx,         wy - tileH);
    ctx.drawImage(tile, wx - tileW, wy);
    ctx.drawImage(tile, wx,         wy);
  }, []);

  // ── draw thumb ────────────────────────────────────────────────────
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
    pat.draw(ctx, {
      ...s,
      size:    Math.max(5, Math.round(s.size * 0.36)),
      opacity: Math.min(s.opacity * 1.5, 100),
    }, 2, 0, 0);
  }, []);

  // ── stop animation ────────────────────────────────────────────────
  const stopAnim = useCallback(() => {
    if (tickerFn.current) {
      gsap.ticker.remove(tickerFn.current);
      tickerFn.current = null;
    }
  }, []);

  // ── start animation using GSAP ticker ────────────────────────────
  // GSAP ticker gives rock-solid delta time, handles tab visibility,
  // frame drops, and is synced to the display refresh rate.
  const startAnim = useCallback((s: PatternState) => {
    stopAnim();
    if (s.animation === 'none') return;

    const fn = (_time: number, deltaTime: number) => {
      if (pausedRef.current) return;

      // deltaTime from GSAP is in ms — convert to seconds, cap at 50ms
      const dt    = Math.min(deltaTime / 1000, 0.05);
      const speed = stateRef.current.animSpeed ?? 40;
      const o     = offset.current;

      switch (stateRef.current.animation) {
        case 'left':       o.x -= speed * dt; break;
        case 'right':      o.x += speed * dt; break;
        case 'up':         o.y -= speed * dt; break;
        case 'down':       o.y += speed * dt; break;
        case 'diag-left':  o.x -= speed * dt; o.y += speed * dt; break;
        case 'diag-right': o.x += speed * dt; o.y += speed * dt; break;
      }

      drawPreview(stateRef.current, o.x, o.y);
    };

    tickerFn.current = fn;
    gsap.ticker.add(fn);
  }, [drawPreview, stopAnim]);

  // ── trigger render ────────────────────────────────────────────────
  const triggerRender = useCallback((s: PatternState, redrawAllThumbs: boolean) => {
    tileCache.current = null; // invalidate on any state change

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
  }, [drawPreview, drawThumb, startAnim, stopAnim]);

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
      offset.current     = { x: 0, y: 0 };
      pausedRef.current  = false;  // unpause on pattern switch
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
    offset.current     = { x: 0, y: 0 };
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
    // Set GSAP ticker to use RAF (default) and max fps
    gsap.ticker.fps(60);

    drawPreview(stateRef.current, 0, 0);
    PATTERNS.forEach((pat, i) =>
      setTimeout(() => requestAnimationFrame(() =>
        drawThumb(pat.id, { ...DEFAULT_STATE, ...(PATTERN_DEFAULTS[pat.id] ?? {}), pattern: pat.id })
      ), i * 20)
    );
    return () => {
      stopAnim();
      cancelAnimationFrame(rafId.current);
    };
  }, [drawPreview, drawThumb, stopAnim]);

  return { state, setState, canvasRef, thumbRefs, resetState, redraw, pausedRef };
}
