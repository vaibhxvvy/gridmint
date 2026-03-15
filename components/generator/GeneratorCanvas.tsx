'use client';

import { useEffect, useRef } from 'react';
import styles from './GeneratorCanvas.module.css';

const CANVAS_W = 830;
const CANVAS_H = 467; // 16:9 exactly

interface Props {
  canvasRef:  React.RefObject<HTMLCanvasElement | null>;
  onResize:   (w: number, h: number) => void;
  badgeText?: string;
}

export function GeneratorCanvas({ canvasRef, onResize, badgeText }: Props) {
  const didInit = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || didInit.current) return;
    didInit.current = true;
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;
    onResize(CANVAS_W, CANVAS_H);
  }, [canvasRef, onResize]);

  return (
    <div className={styles.area}>
      <div className={styles.box}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={styles.canvas}
        />
        {badgeText && <div className={styles.badge}>{badgeText}</div>}
      </div>
    </div>
  );
}
