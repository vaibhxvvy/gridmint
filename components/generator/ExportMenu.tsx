'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { PatternState } from '@/types/pattern';
import { drawPattern, getCSS } from '@/lib/patterns/engine';
import styles from './ExportMenu.module.css';

interface Props { state: PatternState; }

const OPTIONS = [
  { id: 'png-512',  label: 'PNG — tile 512px',    fmt: 'PNG' },
  { id: 'png-1080', label: 'PNG — HD 1920×1080',  fmt: 'PNG' },
  { id: 'png-4k',   label: 'PNG — 4K 3840×2160',  fmt: 'PNG' },
  { id: 'jpg-1080', label: 'JPG — HD 1920×1080',  fmt: 'JPG' },
  { id: 'svg',      label: 'SVG — vector tile',   fmt: 'SVG' },
  { id: 'css-file', label: 'CSS — save .css file', fmt: 'CSS' },
] as const;

function renderOffscreen(state: PatternState, w: number, h: number) {
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const ctx = off.getContext('2d')!;
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, w, h);
  drawPattern(ctx, state, 6);
  return off;
}

function dl(href: string, name: string) {
  const a = document.createElement('a');
  a.href = href; a.download = name; a.click();
}

export function ExportMenu({ state }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) &&
          !dropRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    if (!open || !btnRef.current || !dropRef.current) return;
    const br  = btnRef.current.getBoundingClientRect();
    const dh  = dropRef.current.scrollHeight;
    const pw  = Math.max(dropRef.current.offsetWidth, 192);
    let top   = br.top - dh - 6;
    if (top < 6) top = br.bottom + 6;
    let left  = br.left;
    if (left + pw > window.innerWidth - 6) left = window.innerWidth - pw - 6;
    dropRef.current.style.top   = `${top}px`;
    dropRef.current.style.left  = `${left}px`;
    dropRef.current.style.width = `${pw}px`;
  }, [open]);

  const handle = useCallback((id: string) => {
    setOpen(false);
    const blob = (canvas: HTMLCanvasElement, name: string, type = 'image/png', q = 1) =>
      canvas.toBlob(b => dl(URL.createObjectURL(b!), name), type, q);

    if (id === 'png-512')  blob(renderOffscreen(state, 512, 512),   `gridbox-${state.pattern}-512.png`);
    if (id === 'png-1080') blob(renderOffscreen(state, 1920, 1080), `gridbox-${state.pattern}-1080.png`);
    if (id === 'png-4k')   blob(renderOffscreen(state, 3840, 2160), `gridbox-${state.pattern}-4k.png`);
    if (id === 'jpg-1080') blob(renderOffscreen(state, 1920, 1080), `gridbox-${state.pattern}-1080.jpg`, 'image/jpeg', 0.92);
    if (id === 'svg') {
      const w = state.size * 8;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}"><rect width="100%" height="100%" fill="${state.bgColor}"/></svg>`;
      dl('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), `gridbox-${state.pattern}.svg`);
    }
    if (id === 'css-file') {
      const css = `.bg-pattern {\n  ${getCSS(state).split('\n').join('\n  ')}\n}`;
      dl('data:text/css;charset=utf-8,' + encodeURIComponent(css), `gridbox-${state.pattern}.css`);
    }
  }, [state]);

  return (
    <div className={styles.wrap}>
      <button ref={btnRef} className={styles.btn} onClick={() => setOpen(o => !o)}>
        export <span className={styles.caret}>▾</span>
      </button>
      {open && (
        <div ref={dropRef} className={styles.drop}>
          {OPTIONS.map(o => (
            <button key={o.id} className={styles.opt} onClick={() => handle(o.id)}>
              <span className={styles.badge}>{o.fmt}</span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
