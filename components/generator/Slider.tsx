'use client';

import styles from './Slider.module.css';

interface Props {
  label: string;
  value: number;
  min:   number;
  max:   number;
  unit?: string;
  onChange: (v: number) => void;
}

export function Slider({ label, value, min, max, unit = '', onChange }: Props) {
  return (
    <div className={styles.ctrl}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}
