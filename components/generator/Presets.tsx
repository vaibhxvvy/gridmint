'use client';

import { PRESETS } from '@/lib/patterns/presets';
import type { PatternState } from '@/types/pattern';
import styles from './Presets.module.css';

interface Props {
  onSelect: (state: PatternState) => void;
}

export function Presets({ onSelect }: Props) {
  return (
    <div className={styles.grid}>
      {PRESETS.map(p => (
        <button
          key={p.name}
          className={styles.btn}
          onClick={() => onSelect(p.state)}
          title={p.name}
        >
          <span className={styles.dot} style={{ background: p.accent }} />
          {p.name}
        </button>
      ))}
    </div>
  );
}
