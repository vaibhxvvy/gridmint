'use client';

import { useState, useCallback } from 'react';
import { generateCode, type OutputFormat } from '@/lib/codegen';
import type { PatternState } from '@/types/pattern';
import styles from './CodeOutput.module.css';

const FORMATS: { id: OutputFormat; label: string }[] = [
  { id: 'css',      label: 'CSS'     },
  { id: 'scss',     label: 'SCSS'    },
  { id: 'tailwind', label: 'Tailwind'},
  { id: 'react',    label: 'React'   },
  { id: 'nextjs',   label: 'Next.js' },
  { id: 'tsx',      label: 'TSX'     },
];

interface Props {
  state: PatternState;
}

export function CodeOutput({ state }: Props) {
  const [format, setFormat] = useState<OutputFormat>('css');
  const [copied, setCopied]  = useState(false);

  const code = generateCode(state, format);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }, [code]);

  return (
    <div className={styles.wrap}>
      {/* Tab row */}
      <div className={styles.tabs}>
        {FORMATS.map(f => (
          <button
            key={f.id}
            className={`${styles.tab} ${format === f.id ? styles.active : ''}`}
            onClick={() => setFormat(f.id)}
          >
            {f.label}
          </button>
        ))}
        <button
          className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
          onClick={copy}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>

      {/* Code */}
      <pre className={styles.code}><code>{code}</code></pre>
    </div>
  );
}
