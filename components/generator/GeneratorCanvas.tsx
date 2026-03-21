'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { PatternState } from '@/types/pattern';
import styles from './GeneratorCanvas.module.css';

const CANVAS_W = 1280;
const CANVAS_H = 720;

type PreviewLayout = '16:9' | 'phone' | 'custom';

interface Props {
  canvasRef:     React.RefObject<HTMLCanvasElement | null>;
  onResize:      (w: number, h: number) => void;
  state:         PatternState;
  layout:        PreviewLayout;
  customW:       number;
  customH:       number;
  onLayoutChange: (l: PreviewLayout) => void;
  onCustomW:     (v: string) => void;
  onCustomH:     (v: string) => void;
  customWStr:    string;
  customHStr:    string;
}

export function GeneratorCanvas({
  canvasRef, onResize, state,
  layout, customW, customH,
  onLayoutChange, onCustomW, onCustomH,
  customWStr, customHStr,
}: Props) {
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
  const isPhone     = layout === 'phone';
  const isCustom    = layout === 'custom';

  // The canvas element itself is always 1280×720 (16:9) internally.
  // The CSS frame scales it to the desired display ratio using object-fit.
  // For phone: frame is 9:16, canvas fills it with object-fit:cover (crops sides)
  // For web:   frame is 16:9, canvas fills perfectly
  // For custom: frame is custom ratio, canvas fills with object-fit:cover

  const frameAspect = isPhone ? '9/16' : isCustom ? `${customW}/${customH}` : '16/9';

  return (
    <div className={styles.stage}>

      {/* Layout toggle — floating overlay top-left of stage */}
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
              <input
                className={styles.ratioInput}
                type="text"
                value={customWStr}
                onChange={e => onCustomW(e.target.value)}
                placeholder="16"
                maxLength={3}
              />
              <span className={styles.ratioSep}>:</span>
              <input
                className={styles.ratioInput}
                type="text"
                value={customHStr}
                onChange={e => onCustomH(e.target.value)}
                placeholder="9"
                maxLength={3}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pattern frame — aspect ratio driven, canvas scales inside via object-fit */}
      <motion.div
        className={`${styles.frame} ${isAnimating ? styles.animBorder : ''}`}
        style={{ aspectRatio: frameAspect }}
        layout
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={styles.canvas}
        />
        {isAnimating && (
          <div className={styles.animLabel}>⟳ {state.animation}</div>
        )}
      </motion.div>

    </div>
  );
}
