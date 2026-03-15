import { useMemo } from 'react';
import { getCSS, getBgCSS, getImgCSS } from '../engine';
import type { PatternState } from '../types';
import type { CSSProperties } from 'react';

interface UseGridmintPatternReturn {
  /** Full CSS string (background-color + background-image etc.) */
  css: string;
  /** Just the background-color line */
  bgCSS: string;
  /** Just the background-image/size/position lines */
  imgCSS: string;
  /** React inline style object — spread directly onto any element */
  style: CSSProperties;
}

/**
 * useGridmintPattern
 *
 * Returns CSS string and a React style object for a given pattern state.
 *
 * @example
 * ```tsx
 * import { useGridmintPattern } from 'gridmint';
 *
 * export default function MyComponent() {
 *   const { style } = useGridmintPattern({
 *     pattern: 'grid',
 *     bgColor: '#0a0a0a',
 *     patColor: '#ffffff',
 *     size: 24,
 *     opacity: 20,
 *     thickness: 1,
 *     rotation: 0,
 *   });
 *
 *   return <div style={{ ...style, height: '400px' }} />;
 * }
 * ```
 */
export function useGridmintPattern(state: PatternState): UseGridmintPatternReturn {
  return useMemo(() => {
    const css    = getCSS(state);
    const bgCSS  = getBgCSS(state);
    const imgCSS = getImgCSS(state);

    // Build React style object from CSS string
    const style: CSSProperties = {};
    css.split('\n').forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;
      const key   = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/;$/, '');
      if (!key || !value || key.startsWith('/*')) return;
      const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      (style as any)[camel] = value;
    });

    return { css, bgCSS, imgCSS, style };
  }, [state]);
}
