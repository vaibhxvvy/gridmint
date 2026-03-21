'use client';

import { useEffect, useRef } from 'react';
import type { PatternState } from '@/types/pattern';
import styles from './GeneratorCanvas.module.css';

const CANVAS_W = 1280;
const CANVAS_H = 720;

interface Props {
  canvasRef:   React.RefObject<HTMLCanvasElement | null>;
  onResize:    (w: number, h: number) => void;
  badgeText?:  string;
  state:       PatternState;
}

export function GeneratorCanvas({ canvasRef, onResize, badgeText, state }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Always set the internal canvas resolution to 1280x720
    // The CSS handles display scaling via width:100% on the canvas element
    if (canvas.width !== CANVAS_W || canvas.height !== CANVAS_H) {
      canvas.width  = CANVAS_W;
      canvas.height = CANVAS_H;
      onResize(CANVAS_W, CANVAS_H);
    }
  }, [canvasRef, onResize]);

  const isAnimating = state.animation !== 'none';

  return (
    <div className={styles.area}>
      <div ref={boxRef} className={`${styles.box} ${isAnimating ? styles.animBorder : ''}`}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={styles.canvas}
        />
        {badgeText && !isAnimating && <div className={styles.badge}>{badgeText}</div>}
        {isAnimating && <div className={styles.animLabel}>{state.animation} ⟳</div>}
      </div>
    </div>
  );
}
