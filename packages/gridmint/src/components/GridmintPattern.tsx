import React, { CSSProperties, ElementType } from 'react';
import { getCSS } from '../engine';
import type { PatternState } from '../types';

interface GridmintPatternProps {
  /** Pattern configuration */
  state: PatternState;
  /** Additional className */
  className?: string;
  /** Override or extend styles */
  style?: CSSProperties;
  /** Content to render inside the pattern background */
  children?: React.ReactNode;
  /** HTML element to render as (default: div) */
  as?: ElementType;
}

/**
 * GridmintPattern
 *
 * Renders a div (or any element) with a gridmint CSS background pattern applied.
 *
 * @example
 * ```tsx
 * import { GridmintPattern } from 'gridmint';
 *
 * const state = {
 *   pattern: 'dots',
 *   bgColor: '#0a0a0a',
 *   patColor: '#c8ff00',
 *   size: 20,
 *   opacity: 30,
 *   thickness: 2,
 *   rotation: 0,
 * };
 *
 * export default function Hero() {
 *   return (
 *     <GridmintPattern state={state} style={{ height: '100vh' }}>
 *       <h1>Hello World</h1>
 *     </GridmintPattern>
 *   );
 * }
 * ```
 */
export function GridmintPattern({
  state,
  className,
  style,
  children,
  as: Tag = 'div',
}: GridmintPatternProps) {
  const css = getCSS(state);
  const lines = css.split('\n');

  // Parse CSS string into style object
  const bgStyle: CSSProperties = {};
  lines.forEach(line => {
    const [key, ...rest] = line.split(':');
    if (!key || !rest.length) return;
    const value = rest.join(':').trim().replace(/;$/, '');
    const camel = key.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    (bgStyle as any)[camel] = value;
  });

  return (
    <Tag
      className={className}
      style={{ ...bgStyle, ...style }}
    >
      {children}
    </Tag>
  );
}

export default GridmintPattern;
