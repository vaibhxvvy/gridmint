'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import type { PatternState } from '@/types/pattern';
import { CSS_ANIMATABLE, getAnimatableCSS } from '@/lib/patterns/engine';
import styles from './GeneratorCanvas.module.css';

const CANVAS_W = 1920;
const CANVAS_H = 1080;

type PreviewLayout = '16:9' | 'phone' | 'custom';

interface Props {
  canvasRef:      React.RefObject<HTMLCanvasElement | null>;
  onResize:       (w: number, h: number) => void;
  state:          PatternState;
  layout:         PreviewLayout;
  customW:        number;
  customH:        number;
  onLayoutChange: (l: PreviewLayout) => void;
  onCustomW:      (v: string) => void;
  onCustomH:      (v: string) => void;
  customWStr:     string;
  customHStr:     string;
  isPaused:       boolean;
}

export function GeneratorCanvas({
  canvasRef, onResize, state,
  layout, customW, customH,
  onLayoutChange, onCustomW, onCustomH,
  customWStr, customHStr,
  isPaused,
}: Props) {
  const cssLayerRef  = useRef<HTMLDivElement>(null);
  const tweenRef     = useRef<gsap.core.Tween | null>(null);
  // Live offset — GSAP mutates this object directly
  const offsetRef    = useRef({ x: 0, y: 0 });
  // Track what the tween was built for — only restart if direction/speed/tileSize changed
  const tweenKeyRef  = useRef('');
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== CANVAS_W || canvas.height !== CANVAS_H) {
      canvas.width  = CANVAS_W;
      canvas.height = CANVAS_H;
      onResize(CANVAS_W, CANVAS_H);
    }
  }, [canvasRef, onResize]);

  const isAnimating = state.animation !== 'none';
  const isCSSMode   = isAnimating && CSS_ANIMATABLE.has(state.pattern);
  const animCSS     = isCSSMode ? getAnimatableCSS(state) : null;

  // ── GSAP tween management ────────────────────────────────────────────
  const stopTween = useCallback(() => {
    tweenRef.current?.kill();
    tweenRef.current = null;
    tweenKeyRef.current = '';
  }, []);

  const buildTween = useCallback((
    css: NonNullable<ReturnType<typeof getAnimatableCSS>>,
    animation: string,
    speed: number,
  ) => {
    const el = cssLayerRef.current;
    if (!el) return;

    const { tileW, tileH } = css;
    const secPerTileX = tileW / speed;
    const secPerTileY = tileH / speed;

    // Kill previous
    tweenRef.current?.kill();

    // Determine per-tick delta
    let dx = 0, dy = 0;
    switch (animation) {
      case 'left':       dx = -1; break;
      case 'right':      dx =  1; break;
      case 'up':         dy = -1; break;
      case 'down':       dy =  1; break;
      case 'diag-left':  dx = -1; dy = -1; break;
      case 'diag-right': dx =  1; dy = -1; break;
    }

    // We animate a proxy object and write backgroundPosition each tick.
    // Offset wraps to tile size — this is the seamless part.
    // GSAP modifiers handle the wrap so the tween value never grows unbounded.
    const proxy = { t: 0 };
    const speed_x = dx * speed; // px/sec
    const speed_y = dy * speed;
    let prevT = 0;

    tweenRef.current = gsap.to(proxy, {
      t: 1,
      duration: Math.max(secPerTileX, secPerTileY, 0.1),
      ease: 'none',
      repeat: -1,
      onUpdate() {
        if (!cssLayerRef.current) return;
        const now = proxy.t;
        const dt  = now - prevT;
        prevT = now;
        offsetRef.current.x += speed_x * dt * Math.max(secPerTileX, secPerTileY);
        offsetRef.current.y += speed_y * dt * Math.max(secPerTileX, secPerTileY);
        // Wrap to tile size — seamless
        offsetRef.current.x = ((offsetRef.current.x % tileW) + tileW) % tileW;
        offsetRef.current.y = ((offsetRef.current.y % tileH) + tileH) % tileH;
        cssLayerRef.current.style.backgroundPosition =
          `${offsetRef.current.x}px ${offsetRef.current.y}px`;
      },
    });
  }, []);

  // Pause / resume without rebuilding
  useEffect(() => {
    if (!tweenRef.current) return;
    if (isPaused) tweenRef.current.pause();
    else tweenRef.current.resume();
  }, [isPaused]);

  // Main effect — update CSS properties live, only restart tween when needed
  useEffect(() => {
    const el = cssLayerRef.current;

    if (!isCSSMode || !animCSS || !el) {
      stopTween();
      return;
    }

    // Always update the CSS properties immediately (colour/size/opacity changes)
    el.style.backgroundColor    = state.bgColor;
    el.style.backgroundImage    = animCSS.backgroundImage;
    el.style.backgroundSize     = animCSS.backgroundSize;

    // Only restart tween if direction, speed, or tile size changed
    const tweenKey = `${state.animation}|${state.animSpeed}|${animCSS.tileW}|${animCSS.tileH}`;
    if (tweenKey === tweenKeyRef.current && tweenRef.current) {
      // Tween is already running with correct params — don't restart
      return;
    }

    tweenKeyRef.current = tweenKey;

    // Debounce restart so rapid slider drags don't spam tween creation
    if (restartTimer.current) clearTimeout(restartTimer.current);
    restartTimer.current = setTimeout(() => {
      buildTween(animCSS, state.animation, state.animSpeed ?? 40);
      if (isPaused && tweenRef.current) tweenRef.current.pause();
    }, 60);

    return () => {
      if (restartTimer.current) clearTimeout(restartTimer.current);
    };
  }, [
    isCSSMode, animCSS?.backgroundImage, animCSS?.backgroundSize,
    animCSS?.tileW, animCSS?.tileH,
    state.bgColor, state.animation, state.animSpeed,
    isPaused, stopTween, buildTween,
  ]);

  // Cleanup on unmount
  useEffect(() => () => stopTween(), [stopTween]);

  const isPhone     = layout === 'phone';
  const isCustom    = layout === 'custom';
  const frameAspect = isPhone ? '9/16' : isCustom ? `${customW}/${customH}` : '16/9';

  return (
    <div className={styles.stage}>

      {/* Layout toggle overlay */}
      <div className={styles.layoutOverlay}>
        <div className={styles.layoutPills}>
          {(['16:9', 'phone', 'custom'] as PreviewLayout[]).map(l => (
            <button
              key={l}
              className={`${styles.layoutPill} ${layout === l ? styles.layoutPillActive : ''}`}
              onClick={() => onLayoutChange(l)}
            >
              {l === '16:9' ? 'Web' : l === 'phone' ? 'Mobile' : 'Custom'}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {isCustom && (
            <motion.div
              className={styles.customInputs}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{    opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <input className={styles.ratioInput} type="text" value={customWStr}
                onChange={e => onCustomW(e.target.value)} placeholder="16" maxLength={3}/>
              <span className={styles.ratioSep}>:</span>
              <input className={styles.ratioInput} type="text" value={customHStr}
                onChange={e => onCustomH(e.target.value)} placeholder="9" maxLength={3}/>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pattern frame */}
      <motion.div
        className={`${styles.frame} ${isAnimating ? styles.animBorder : ''}`}
        style={{ aspectRatio: frameAspect }}
        layout
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        {/* Canvas — hidden during CSS animation, used for static + export */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={styles.canvas}
          style={{ opacity: isCSSMode ? 0 : 1 }}
        />

        {/* CSS seamless layer */}
        <div
          ref={cssLayerRef}
          className={styles.cssLayer}
          style={{
            display:             isCSSMode ? 'block' : 'none',
            backgroundColor:     state.bgColor,
            backgroundImage:     animCSS?.backgroundImage ?? '',
            backgroundSize:      animCSS?.backgroundSize  ?? '',
            backgroundPosition:  '0px 0px',
            backgroundRepeat:    'repeat',
          }}
        />

        {/* Label */}
        {isAnimating && (
          <div className={styles.animLabel}>
            {isCSSMode ? '✦ seamless' : `⟳ ${state.animation}`}
          </div>
        )}
      </motion.div>

    </div>
  );
}
