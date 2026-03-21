'use client';

import { useEffect, useRef } from 'react';
import { PRESETS } from '@/lib/patterns/presets';
import { drawPattern } from '@/lib/patterns/engine';
import type { PatternState } from '@/types/pattern';
import styles from './Presets.module.css';

interface Props {
  state:     PatternState;
  onSelect:  (patch: Partial<PatternState>) => void;
}

function PresetThumb({ preset }: { preset: typeof PRESETS[0] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = preset.state.bgColor;
    ctx.fillRect(0, 0, 36, 36);
    drawPattern(ctx, { ...preset.state, size: Math.max(5, Math.round(preset.state.size * 0.4)), opacity: Math.min(preset.state.opacity * 1.4, 100) }, 2, 0, 0);
  }, [preset]);
  return <canvas ref={ref} width={36} height={36} className={styles.thumb} />;
}

export function Presets({ state, onSelect }: Props) {
  return (
    <div className={styles.list}>
      {PRESETS.map(p => (
        <button
          key={p.name}
          className={styles.row}
          onClick={() => onSelect(p.state)}
          title={`Apply ${p.name}`}
        >
          <PresetThumb preset={p} />
          <span className={styles.name}>{p.name}</span>
          <span className={styles.patName}>{p.state.pattern}</span>
        </button>
      ))}
    </div>
  );
}
