'use client';

import { useState } from 'react';
import type { PatternState, AnimationDir } from '@/types/pattern';
import Link from 'next/link';
import { PatternGrid } from './PatternGrid';
import { Slider }      from './Slider';
import { ColorPicker } from './ColorPicker';
import { Presets }     from './Presets';
import styles from './GeneratorSidebar.module.css';

const ANIM_DIRS: { id: AnimationDir; label: string }[] = [
  { id: 'left',       label: '← Left'       },
  { id: 'right',      label: '→ Right'      },
  { id: 'up',         label: '↑ Up'         },
  { id: 'down',       label: '↓ Down'       },
  { id: 'diag-left',  label: '↙ Diag Left'  },
  { id: 'diag-right', label: '↘ Diag Right' },
];

interface Props {
  state:       PatternState;
  thumbRefs:   React.MutableRefObject<Record<string, HTMLCanvasElement | null>>;
  onChange:    (patch: Partial<PatternState>, activeOnly?: boolean) => void;
  onReset:     () => void;
  playing:     boolean;
  onPlayPause: () => void;
}

export function GeneratorSidebar({ state, thumbRefs, onChange, onReset, playing, onPlayPause }: Props) {
  const [patternsOpen, setPatternsOpen] = useState(true);
  const [presetsOpen,  setPresetsOpen]  = useState(false);

  const animOn = state.animation !== 'none';

  return (
    <aside className={styles.sidebar}>

      {/* Install banner */}
      <Link href="/install" className={styles.installBanner}>
        <span className={styles.installDot} />
        <code className={styles.installCmd}>npm install gridmint</code>
        <span className={styles.installArrow}>→</span>
      </Link>

      {/* ── PATTERNS (collapsible) ── */}
      <div className={styles.sectionHead} onClick={() => setPatternsOpen(o => !o)}>
        <span className={styles.sectionTitle}>PATTERNS</span>
        <span className={styles.chevron}>{patternsOpen ? '▲' : '▼'}</span>
      </div>
      {patternsOpen && (
        <div className={styles.sectionBody}>
          <PatternGrid
            active={state.pattern}
            thumbRefs={thumbRefs}
            onSelect={id => onChange({ pattern: id }, false)}
          />
        </div>
      )}

      {/* ── ADJUST ── */}
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>ADJUST</span>
      </div>
      <div className={styles.sectionBody}>
        <div className={styles.sliders}>
          <Slider label="size"      value={state.size}      min={4}   max={state.pattern === 'rect' ? 240 : 80} unit="px" onChange={v => onChange({ size: v })} />
          <Slider label="opacity"   value={state.opacity}   min={1}   max={100} unit="%" onChange={v => onChange({ opacity: v })} />
          <Slider label="thickness" value={state.thickness} min={1}   max={20}  unit="px" onChange={v => onChange({ thickness: v })} />
          <Slider label="rotation"  value={state.rotation}  min={0}   max={180} unit="°" onChange={v => onChange({ rotation: v })} />
        </div>
      </div>

      {/* ── ANIMATE ── */}
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>ANIMATE</span>
        {/* Toggle switch */}
        <button
          className={`${styles.toggle} ${animOn ? styles.toggleOn : ''}`}
          onClick={() => onChange({ animation: animOn ? 'none' : 'right' })}
          title={animOn ? 'Stop animation' : 'Start animation'}
        >
          <span className={styles.toggleKnob} />
        </button>
      </div>
      <div className={styles.sectionBody}>
        {/* Direction dropdown */}
        <select
          className={styles.animSelect}
          value={animOn ? state.animation : ''}
          disabled={!animOn}
          onChange={e => onChange({ animation: e.target.value as AnimationDir })}
        >
          {!animOn && <option value="">Direction</option>}
          {ANIM_DIRS.map(d => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>

        {/* Speed + play/pause row — only when animating */}
        {animOn && (
          <div className={styles.speedRow}>
            <Slider
              label="speed"
              value={state.animSpeed ?? 40}
              min={5}
              max={200}
              unit=""
              onChange={v => onChange({ animSpeed: v })}
            />
            <button
              className={`${styles.playPauseBtn} ${playing ? styles.playPauseBtnActive : ''}`}
              onClick={onPlayPause}
              title="Play / Pause (Space)"
            >
              {playing ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── COLORS ── */}
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>COLORS</span>
      </div>
      <div className={styles.sectionBody}>
        <ColorPicker label="background" value={state.bgColor}  onChange={v => onChange({ bgColor: v })} />
        <ColorPicker label="pattern"    value={state.patColor} onChange={v => onChange({ patColor: v })} />
        <button className={styles.resetBtn} onClick={onReset}>↺ reset all</button>
      </div>

      {/* ── PRESETS (collapsible) ── */}
      <div className={styles.sectionHead} onClick={() => setPresetsOpen(o => !o)}>
        <span className={styles.sectionTitle}>PRESETS</span>
        <span className={styles.chevron}>{presetsOpen ? '▲' : '▼'}</span>
      </div>
      {presetsOpen && (
        <div className={styles.sectionBody}>
          <Presets state={state} onSelect={patch => onChange(patch)} />
        </div>
      )}

      {/* ── GRADIENTS (future) ── */}
      <div className={`${styles.sectionHead} ${styles.sectionDisabled}`}>
        <span className={styles.sectionTitle}>GRADIENTS</span>
        <span className={styles.futureBadge}>soon</span>
      </div>

      {/* ── TEXTURES (future) ── */}
      <div className={`${styles.sectionHead} ${styles.sectionDisabled}`}>
        <span className={styles.sectionTitle}>TEXTURES</span>
        <span className={styles.futureBadge}>soon</span>
      </div>

    </aside>
  );
}
