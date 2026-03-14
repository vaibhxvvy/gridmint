'use client';

import type { PatternState } from '@/types/pattern';
import { PatternGrid } from './PatternGrid';
import { Slider }      from './Slider';
import { ColorPicker } from './ColorPicker';
import { Presets }     from './Presets';
import styles from './GeneratorSidebar.module.css';

interface Props {
  state:     PatternState;
  thumbRefs: React.MutableRefObject<Record<string, HTMLCanvasElement | null>>;
  onChange:  (patch: Partial<PatternState>, activeOnly?: boolean) => void;
  onReset:   () => void;
}

export function GeneratorSidebar({ state, thumbRefs, onChange, onReset }: Props) {
  return (
    <aside className={styles.sidebar}>

      {/* Patterns */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>patterns</h3>
        <PatternGrid
          active={state.pattern}
          thumbRefs={thumbRefs}
          onSelect={id => onChange({ pattern: id }, false)}
        />
      </section>

      {/* Adjust */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>adjust</h3>
        <div className={styles.sliders}>
          <Slider label="size"      value={state.size}      min={4}  max={80}  unit="px" onChange={v => onChange({ size: v })} />
          <Slider label="opacity"   value={state.opacity}   min={1}  max={100} unit="%"  onChange={v => onChange({ opacity: v })} />
          <Slider label="thickness" value={state.thickness} min={1}  max={8}   unit="px" onChange={v => onChange({ thickness: v })} />
          <Slider label="rotation"  value={state.rotation}  min={0}  max={180} unit="°"  onChange={v => onChange({ rotation: v })} />
        </div>
      </section>

      {/* Colours */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>colours</h3>
        <div className={styles.colorStack}>
          <ColorPicker label="background" value={state.bgColor}  onChange={v => onChange({ bgColor: v })} />
          <ColorPicker label="pattern"    value={state.patColor} onChange={v => onChange({ patColor: v })} />
        </div>
        <button className={styles.resetBtn} onClick={onReset}>↺ reset all</button>
      </section>

      {/* Presets */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>presets</h3>
        <Presets onSelect={s => onChange(s, false)} />
      </section>

    </aside>
  );
}
