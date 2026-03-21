'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePatternRenderer }  from '@/lib/use-pattern-renderer';
import { PATTERNS }            from '@/lib/patterns/engine';
import { decodeState }         from '@/lib/url-state';
import { useGithubStars }      from '@/lib/use-github-stars';
import { GeneratorSidebar }    from '@/components/generator/GeneratorSidebar';
import { GeneratorCanvas }     from '@/components/generator/GeneratorCanvas';
import { CodeOutput }          from '@/components/generator/CodeOutput';
import { Toast }               from '@/components/ui/Toast';
import styles from './GeneratorApp.module.css';

type PreviewLayout = '16:9' | 'phone' | 'custom';

// ── SVG Icons (Lucide-style, open source MIT) ──
const IconShuffle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8"/><polyline points="4 20 21 3"/>
    <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
    <line x1="4" y1="4" x2="9" y2="9"/>
  </svg>
);

const IconShare = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

const IconGithub = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

export default function GeneratorApp() {
  const { state, setState, canvasRef, thumbRefs, resetState, redraw } = usePatternRenderer();
  const [toast,         setToast]        = useState({ visible: false, msg: '' });
  const [previewLayout, setPreviewLayout] = useState<PreviewLayout>('16:9');
  const [customW,       setCustomW]       = useState('16');
  const [customH,       setCustomH]       = useState('9');
  const [playing,       setPlaying]       = useState(true);
  const stars = useGithubStars('vaibhxvvy/gridbox');

  useEffect(() => {
    if (window.location.search) {
      const decoded = decodeState(window.location.search);
      setState(decoded, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast({ visible: true, msg });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  }, []);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('link copied'));
  }, [showToast]);

  // Play / pause — toggles animation on/off while remembering direction
  const lastAnimDir = useState(state.animation !== 'none' ? state.animation : 'right')[0];
  const handlePlayPause = useCallback(() => {
    if (state.animation !== 'none') {
      setState({ animation: 'none' });
      setPlaying(false);
    } else {
      setState({ animation: lastAnimDir });
      setPlaying(true);
    }
  }, [state.animation, setState, lastAnimDir]);

  const handleRandomize = useCallback(() => {
    const palettes = [
      { bg: '#0a0a0a', pat: '#c8ff00' },
      { bg: '#080810', pat: '#00ccff' },
      { bg: '#0d0a0a', pat: '#ff4d00' },
      { bg: '#0a0a12', pat: '#8866ff' },
      { bg: '#080f08', pat: '#00ff88' },
      { bg: '#100808', pat: '#ff5566' },
      { bg: '#080810', pat: '#ffcc00' },
      { bg: '#06100e', pat: '#00ddaa' },
      { bg: '#111111', pat: '#ffffff' },
    ];
    const palette    = palettes[Math.floor(Math.random() * palettes.length)];
    const animatable = ['dots','grid','rect','diagonal','hatch','plus','hex','waves','circuit'];
    const all        = PATTERNS.map(p => p.id);
    const animDirs: Array<import('@/types/pattern').AnimationDir> =
      ['none','none','left','right','up','down','diag-left','diag-right'];
    const animation  = animDirs[Math.floor(Math.random() * animDirs.length)];
    const pool       = animation !== 'none' ? animatable : all;
    const pattern    = pool[Math.floor(Math.random() * pool.length)];
    const sizeMap: Record<string,[number,number]> = {
      noise:[10,30],dots:[10,28],grid:[16,40],rect:[20,60],diagonal:[8,20],
      hatch:[10,22],carbon:[4,12],halftone:[10,24],plus:[14,30],hex:[16,34],
      waves:[14,30],circuit:[16,36],
    };
    const [mn,mx] = sizeMap[pattern] ?? [10,30];
    setState({
      pattern, bgColor: palette.bg, patColor: palette.pat, animation,
      size:      Math.floor(Math.random() * (mx - mn)) + mn,
      opacity:   Math.floor(Math.random() * 40) + 20,
      thickness: Math.floor(Math.random() * 2) + 1,
      rotation:  [0,0,0,45,90,135][Math.floor(Math.random() * 6)],
      animSpeed: animation !== 'none' ? Math.floor(Math.random() * 60) + 20 : 40,
    }, false);
    if (animation !== 'none') setPlaying(true);
    showToast('randomized ✦');
  }, [setState, showToast]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 's' && !e.metaKey && !e.ctrlKey) handleShare();
      if (e.key === 'r') resetState();
      if (e.key === 'x') handleRandomize();
      if (e.key === ' ') { e.preventDefault(); handlePlayPause(); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const ids = PATTERNS.map(p => p.id);
        const idx = ids.indexOf(state.pattern);
        const next = e.key === 'ArrowRight'
          ? (idx + 1) % ids.length : (idx - 1 + ids.length) % ids.length;
        setState({ pattern: ids[next] }, false);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [state, setState, resetState, handleShare, handleRandomize, handlePlayPause]);

  // Aspect ratio — phone view = portrait canvas INSIDE the 16:9 preview area
  const isPhone  = previewLayout === 'phone';
  const wParsed  = parseInt(customW) || 16;
  const hParsed  = parseInt(customH) || 9;
  const ratio    = previewLayout === 'custom' ? `${wParsed}/${hParsed}` : '16/9';

  const infoText = [
    state.pattern.charAt(0).toUpperCase() + state.pattern.slice(1),
    `${state.size}px`,
    `${state.opacity}%`,
    `${state.thickness}px stroke`,
    state.animation !== 'none' ? `⟳ ${state.animation}` : null,
  ].filter(Boolean).join('  ·  ');

  const isAnimating = state.animation !== 'none';

  return (
    <div className={styles.page}>

      {/* ── TOPBAR ── */}
      <header className={styles.topbar}>
        <Link href="/" className={styles.topbarLogo}>gridmint</Link>
        <div className={styles.topbarActions}>
          <button className={`${styles.tbBtn} ${styles.tbRandom}`} onClick={handleRandomize} title="Randomize (X)">
            <IconShuffle /> Random
          </button>
          <button className={`${styles.tbBtn} ${styles.tbShare}`} onClick={handleShare} title="Share (S)">
            <IconShare /> Share
          </button>
          <a
            className={`${styles.tbBtn} ${styles.tbGithub}`}
            href="https://github.com/vaibhxvvy/gridbox"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconGithub />
            <span>{stars}</span>
          </a>
        </div>
      </header>

      {/* ── SHELL ── */}
      <div className={styles.shell}>

        <GeneratorSidebar
          state={state}
          thumbRefs={thumbRefs}
          onChange={setState}
          onReset={resetState}
          playing={playing}
          onPlayPause={handlePlayPause}
        />

        {/* ── RIGHT COL — scrollable ── */}
        <div className={styles.rightCol}>

          {/* Layout bar */}
          <div className={styles.layoutBar}>
            <select
              className={styles.layoutSelect}
              value={previewLayout}
              onChange={e => setPreviewLayout(e.target.value as PreviewLayout)}
            >
              <option value="16:9">Web View 16:9</option>
              <option value="phone">Phone View</option>
              <option value="custom">Custom Ratio</option>
            </select>
            {previewLayout === 'custom' && (
              <div className={styles.customRatio}>
                <input
                  type="text"
                  value={customW}
                  onChange={e => setCustomW(e.target.value)}
                  className={styles.ratioInput}
                  placeholder="16"
                  maxLength={3}
                />
                <span className={styles.ratioSep}>:</span>
                <input
                  type="text"
                  value={customH}
                  onChange={e => setCustomH(e.target.value)}
                  className={styles.ratioInput}
                  placeholder="9"
                  maxLength={3}
                />
              </div>
            )}
          </div>

          {/* Canvas — phone view renders portrait canvas centred inside 16:9 area */}
          <GeneratorCanvas
            canvasRef={canvasRef}
            onResize={() => requestAnimationFrame(() => redraw())}
            state={state}
            aspectRatio={ratio}
            phoneMode={isPhone}
          />

          {/* Info bar */}
          <div className={styles.infoBar}>
            <span className={styles.infoText}>{infoText}</span>
            <span className={styles.infoRight}>
              <span className={styles.infoSwatch} style={{ background: state.bgColor }} />
              <span className={styles.infoSwatch} style={{ background: state.patColor }} />
              <span className={styles.infoDims}>
                {previewLayout === 'phone' ? '9:16' : previewLayout === 'custom' ? `${wParsed}:${hParsed}` : '16:9'}
              </span>
              {isAnimating && (
                <button
                  className={`${styles.playBtn} ${playing ? styles.playBtnActive : ''}`}
                  onClick={handlePlayPause}
                  title="Play/Pause (Space)"
                >
                  {playing ? (
                    // Pause icon
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                    </svg>
                  ) : (
                    // Play icon
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  )}
                </button>
              )}
            </span>
          </div>

          {/* Code output */}
          <div className={styles.codePanel}>
            <CodeOutput state={state} />
          </div>

        </div>
      </div>

      <Toast message={toast.msg} visible={toast.visible} />
    </div>
  );
}
