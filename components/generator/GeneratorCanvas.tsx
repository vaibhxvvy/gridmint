'use client';

import { useEffect } from 'react';
import type { PatternState } from '@/types/pattern';
import styles from './GeneratorCanvas.module.css';

const CANVAS_W = 1280;
const CANVAS_H = 720;

interface Props {
  canvasRef:    React.RefObject<HTMLCanvasElement | null>;
  onResize:     (w: number, h: number) => void;
  state:        PatternState;
  aspectRatio?: string;
  phoneMode?:   boolean;
  badgeText?:   string;
}

export function GeneratorCanvas({ canvasRef, onResize, state, aspectRatio = '16/9', phoneMode, badgeText }: Props) {
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

  return (
    /* Outer area: always 16:9 landscape — phone mode pads inside */
    <div className={`${styles.area} ${phoneMode ? styles.areaPhone : ''}`}>
      <div
        className={`${styles.box} ${isAnimating ? styles.animBorder : ''} ${phoneMode ? styles.boxPhone : ''}`}
        style={!phoneMode ? { aspectRatio } : undefined}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={styles.canvas}
        />
        {isAnimating && <div className={styles.animLabel}>{state.animation} ⟳</div>}
        {badgeText && !isAnimating && <div className={styles.badge}>{badgeText}</div>}
      </div>
    </div>
  );
}
