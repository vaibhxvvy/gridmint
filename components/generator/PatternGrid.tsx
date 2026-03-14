'use client';

import { PATTERNS } from '@/lib/patterns/engine';
import type { PatternState } from '@/types/pattern';
import styles from './PatternGrid.module.css';

interface Props {
  active:    string;
  thumbRefs: React.MutableRefObject<Record<string, HTMLCanvasElement | null>>;
  onSelect:  (id: string) => void;
}

export function PatternGrid({ active, thumbRefs, onSelect }: Props) {
  return (
    <div className={styles.grid}>
      {PATTERNS.map(p => (
        <button
          key={p.id}
          className={`${styles.cell} ${p.id === active ? styles.active : ''}`}
          onClick={() => onSelect(p.id)}
          title={p.name}
        >
          <canvas
            width={58}
            height={58}
            ref={el => { thumbRefs.current[p.id] = el; }}
            className={styles.canvas}
          />
          <span className={styles.label}>{p.name}</span>
        </button>
      ))}
    </div>
  );
}
