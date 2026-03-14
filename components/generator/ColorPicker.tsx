'use client';

import { useState } from 'react';
import { validHex } from '@/lib/patterns/engine';
import styles from './ColorPicker.module.css';

interface Props {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ label, value, onChange }: Props) {
  const [raw, setRaw] = useState(value);

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRaw(e.target.value);
    onChange(e.target.value);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    setRaw(v);
    if (!v.startsWith('#')) v = '#' + v;
    if (validHex(v)) onChange(v);
  };

  const handleBlur = () => {
    let v = raw;
    if (!v.startsWith('#')) v = '#' + v;
    if (!validHex(v)) setRaw(value);
    else setRaw(v);
  };

  // Keep raw in sync when value changes externally (preset/reset)
  if (raw !== value && document.activeElement?.tagName !== 'INPUT') {
    // only sync if not focused
  }

  return (
    <div className={styles.block}>
      <label className={styles.label}>{label}</label>
      <div className={styles.wrap}>
        <button
          className={styles.swatchBtn}
          onClick={() => document.getElementById(`picker-${label}`)?.click()}
          type="button"
        >
          <input
            id={`picker-${label}`}
            type="color"
            value={value}
            onChange={handlePickerChange}
          />
        </button>
        <input
          className={styles.hexInput}
          type="text"
          value={raw}
          onChange={handleHexInput}
          onBlur={handleBlur}
          maxLength={7}
          spellCheck={false}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
