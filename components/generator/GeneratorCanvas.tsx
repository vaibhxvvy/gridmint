'use client';

import { useEffect, useRef } from 'react';
import styles from './GeneratorCanvas.module.css';

interface Props {
  canvasRef:   React.RefObject<HTMLCanvasElement | null>;
  onResize:    (w: number, h: number) => void;
  badgeText?:  string;
}

export function GeneratorCanvas({ canvasRef, onResize, badgeText }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const calc = () => {
      const maxW = wrap.clientWidth  - 32;
      const maxH = wrap.clientHeight - 32;
      let w = maxW;
      let h = Math.round(w * 9 / 16);
      if (h > maxH) { h = maxH; w = Math.round(h * 16 / 9); }
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Only resize if dimensions actually changed
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width  = w;
        canvas.height = h;
        onResize(w, h);
      }
    };

    const ro = new ResizeObserver(calc);
    ro.observe(wrap);
    calc(); // initial
    return () => ro.disconnect();
  }, [canvasRef, onResize]);

  return (
    <div className={styles.area} ref={wrapRef}>
      <div className={styles.box}>
        <canvas ref={canvasRef} className={styles.canvas} />
        {badgeText && <div className={styles.badge}>{badgeText}</div>}
      </div>
    </div>
  );
}
