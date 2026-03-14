'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePatternRenderer }  from '@/lib/use-pattern-renderer';
import { getCSS, getBgCSS, getImgCSS } from '@/lib/patterns/engine';
import { decodeState }         from '@/lib/url-state';
import { GeneratorSidebar }    from '@/components/generator/GeneratorSidebar';
import { GeneratorCanvas }     from '@/components/generator/GeneratorCanvas';
import { CodeOutput }          from '@/components/generator/CodeOutput';
import { ExportMenu }          from '@/components/generator/ExportMenu';
import { Toast }               from '@/components/ui/Toast';
import { PATTERNS }            from '@/lib/patterns/engine';
import styles from './page.module.css';

export default function GeneratorPage() {
  const { state, setState, canvasRef, thumbRefs, resetState } = usePatternRenderer();
  const [badge,   setBadge]   = useState('');
  const [toast,   setToast]   = useState({ visible: false, msg: '' });
  const [copiedCSS, setCopied] = useState(false);

  // Load URL state on mount
  useEffect(() => {
    const decoded = decodeState(window.location.search);
    if (window.location.search) {
      setState(decoded, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast({ visible: true, msg });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  }, []);

  const handleResize = useCallback((w: number, h: number) => {
    setBadge(`${w} × ${h}  16:9`);
    // re-draw after resize
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, w, h);
  }, [canvasRef, state.bgColor]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() =>
      showToast('link copied to clipboard')
    );
  }, [showToast]);

  const handleCopyCSS = useCallback(() => {
    navigator.clipboard.writeText(getCSS(state)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }, [state]);

  // Keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) handleCopyCSS();
      if (e.key === 's' && !e.metaKey && !e.ctrlKey) handleShare();
      if (e.key === 'r') resetState();
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const ids  = PATTERNS.map(p => p.id);
        const idx  = ids.indexOf(state.pattern);
        const next = e.key === 'ArrowRight'
          ? (idx + 1) % ids.length
          : (idx - 1 + ids.length) % ids.length;
        setState({ pattern: ids[next] }, false);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [state, setState, resetState, handleCopyCSS, handleShare]);

  return (
    <div className={styles.page}>

      {/* ── TOPBAR ── */}
      <header className={styles.topbar}>
        <Link href="/" className={styles.topbarLogo}>gridbox</Link>
        <span className={styles.topbarTitle}>Grid Box</span>
        <div className={styles.topbarActions}>
          <button className={`${styles.tbBtn} ${styles.tbShare}`} onClick={handleShare}>
            ⇧ share
          </button>
          <a
            className={`${styles.tbBtn} ${styles.tbGithub}`}
            href="https://github.com/vaibhav/gridbox"
            target="_blank"
            rel="noopener noreferrer"
          >
            ★ star on github
          </a>
        </div>
      </header>

      {/* ── SHELL ── */}
      <div className={styles.shell}>

        {/* Sidebar */}
        <GeneratorSidebar
          state={state}
          thumbRefs={thumbRefs}
          onChange={setState}
          onReset={resetState}
        />

        {/* Right column */}
        <div className={styles.rightCol}>

          {/* Preview */}
          <GeneratorCanvas
            canvasRef={canvasRef}
            onResize={handleResize}
            badgeText={badge}
          />

          {/* Code output panel */}
          <div className={styles.codePanel}>
            <CodeOutput state={state} />
          </div>

          {/* Action bar */}
          <div className={styles.actionBar}>
            <div className={styles.cssStrip}>
              {getCSS(state).replace(/\n/g, ' ').substring(0, 90)}
              {getCSS(state).length > 90 ? '…' : ''}
            </div>
            <button
              className={`${styles.copyBtn} ${copiedCSS ? styles.copied : ''}`}
              onClick={handleCopyCSS}
            >
              {copiedCSS ? '✓ copied' : 'copy css'}
            </button>
            <ExportMenu state={state} />
          </div>

        </div>
      </div>

      <Toast message={toast.msg} visible={toast.visible} />
    </div>
  );
}
