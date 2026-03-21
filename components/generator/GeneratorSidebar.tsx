'use client';

import { useState } from 'react';
import type { PatternState, AnimationDir } from '@/types/pattern';
import Link from 'next/link';
import { PatternGrid } from './PatternGrid';
import { Slider }      from './Slider';
import { ColorPicker } from './ColorPicker';
import { Presets }     from './Presets';
import styles from './GeneratorSidebar.module.css';

// Lucide-style open source SVG arrows — correct directions
const DirIcons: Record<string, React.ReactNode> = {
  // Left: arrow pointing left
  left: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  // Right: arrow pointing right
  right: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  // Up: arrow pointing up
  up: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  // Down: arrow pointing down
  down: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  // Diag-left: arrow pointing top-left (↖)
  'diag-left': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="17" x2="7" y2="7"/><polyline points="7 17 7 7 17 7"/></svg>,
  // Diag-right: arrow pointing top-right (↗)
  'diag-right': <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
};

const ANIM_DIRS: { id: AnimationDir; label: string }[] = [
  { id: 'left',       label: 'Left Side'        },
  { id: 'right',      label: 'Right Side'       },
  { id: 'up',         label: 'Upward'           },
  { id: 'down',       label: 'Downward'         },
  { id: 'diag-left',  label: 'Top Left Corner'  },
  { id: 'diag-right', label: 'Top Right Corner' },
];

interface Props {
  state:     PatternState;
  thumbRefs: React.MutableRefObject<Record<string, HTMLCanvasElement | null>>;
  onChange:  (patch: Partial<PatternState>, activeOnly?: boolean) => void;
  onReset:   () => void;
}

export function GeneratorSidebar({ state, thumbRefs, onChange, onReset }: Props) {
  const [patternsOpen, setPatternsOpen] = useState(true);
  const [presetsOpen,  setPresetsOpen]  = useState(false);
  const animOn = state.animation !== 'none';

  return (
    <aside className={styles.sidebar}>

      <Link href="/install" className={styles.installBanner}>
        <span className={styles.installDot} />
        <code className={styles.installCmd}>npm install gridmint</code>
        <span className={styles.installArrow}>→</span>
      </Link>

      {/* PATTERNS — always mounted so canvases keep their drawn content */}
      <div className={styles.sectionHead} onClick={() => setPatternsOpen(o => !o)}>
        <span className={styles.sectionTitle}>PATTERNS</span>
        <span className={styles.chevron}>{patternsOpen ? '▲' : '▼'}</span>
      </div>
      <div className={styles.sectionBody} style={{ display: patternsOpen ? undefined : 'none' }}>
        <PatternGrid active={state.pattern} thumbRefs={thumbRefs} onSelect={id => onChange({ pattern: id }, false)} />
      </div>

      {/* ADJUST */}
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>ADJUST</span>
      </div>
      <div className={styles.sectionBody}>
        <div className={styles.sliders}>
          <Slider label="size"      value={state.size}      min={4}  max={state.pattern === 'rect' ? 240 : 80} unit="px" onChange={v => onChange({ size: v })} />
          <Slider label="opacity"   value={state.opacity}   min={1}  max={100} unit="%" onChange={v => onChange({ opacity: v })} />
          <Slider label="thickness" value={state.thickness} min={1}  max={20}  unit="px" onChange={v => onChange({ thickness: v })} />
          <Slider label="rotation"  value={state.rotation}  min={0}  max={180} unit="°" onChange={v => onChange({ rotation: v })} />
        </div>
      </div>

      {/* ANIMATE — toggle + direction grid + speed only (no play/pause here) */}
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>ANIMATE</span>
        <button
          className={`${styles.toggle} ${animOn ? styles.toggleOn : ''}`}
          onClick={() => onChange({ animation: animOn ? 'none' : 'right' })}
          title={animOn ? 'Stop animation' : 'Start animation'}
        >
          <span className={styles.toggleKnob} />
        </button>
      </div>
      <div className={styles.sectionBody}>
        <div className={`${styles.dirGrid} ${!animOn ? styles.dirGridDisabled : ''}`}>
          {ANIM_DIRS.map(d => (
            <button
              key={d.id}
              className={`${styles.dirBtn} ${animOn && state.animation === d.id ? styles.dirBtnActive : ''}`}
              onClick={() => onChange({ animation: d.id })}
              title={d.label}
              disabled={!animOn}
            >
              {DirIcons[d.id]}
            </button>
          ))}
        </div>
        {animOn && (
          <div className={styles.speedRow}>
            <Slider label="speed" value={state.animSpeed ?? 40} min={5} max={200} unit="" onChange={v => onChange({ animSpeed: v })} />
          </div>
        )}
      </div>

      {/* COLORS */}
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>COLORS</span>
      </div>
      <div className={styles.sectionBody}>
        <ColorPicker label="background" value={state.bgColor}  onChange={v => onChange({ bgColor: v })} />
        <ColorPicker label="pattern"    value={state.patColor} onChange={v => onChange({ patColor: v })} />
        <button className={styles.resetBtn} onClick={onReset}>↺ reset all</button>
      </div>

      {/* PRESETS — always mounted */}
      <div className={styles.sectionHead} onClick={() => setPresetsOpen(o => !o)}>
        <span className={styles.sectionTitle}>PRESETS</span>
        <span className={styles.chevron}>{presetsOpen ? '▲' : '▼'}</span>
      </div>
      <div className={styles.sectionBody} style={{ display: presetsOpen ? undefined : 'none' }}>
        <Presets state={state} onSelect={patch => onChange(patch)} />
      </div>

      <div className={`${styles.sectionHead} ${styles.sectionDisabled}`}>
        <span className={styles.sectionTitle}>GRADIENTS</span>
        <span className={styles.futureBadge}>soon</span>
      </div>
      <div className={`${styles.sectionHead} ${styles.sectionDisabled}`}>
        <span className={styles.sectionTitle}>TEXTURES</span>
        <span className={styles.futureBadge}>soon</span>
      </div>

    </aside>
  );
}
