'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// ── contrast helper ──────────────────────────────────────────────────
// Returns black or white text colour based on bg luminance (WCAG formula)
function contrastColor(hex: string): '#000000' | '#ffffff' {
  const h = hex.replace('#', '').padEnd(6, '0');
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.45 ? '#000000' : '#ffffff';
}

function withAlpha(hex: '#000000' | '#ffffff', alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex + a;
}

// ── pattern data ─────────────────────────────────────────────────────
// Plus uses an inline SVG data URL — only reliable way to get true plus crosses
const plusSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'>
  <line x1='10' y1='4' x2='10' y2='16' stroke='rgba(0,255,65,0.6)' stroke-width='1.2'/>
  <line x1='4'  y1='10' x2='16' y2='10' stroke='rgba(0,255,65,0.6)' stroke-width='1.2'/>
</svg>`;
const plusUrl = `url("data:image/svg+xml,${encodeURIComponent(plusSvg)}")`;

const PREVIEW_PATTERNS = [
  {
    id: 'grid', name: 'Grid', bg: '#0a0a0a',
    bgImage: 'linear-gradient(rgba(200,255,0,0.25) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.25) 1px,transparent 1px)',
    bgSize: '24px 24px', bgPos: '',
  },
  {
    id: 'dots', name: 'Dots', bg: '#0d0d0d',
    bgImage: 'radial-gradient(circle,rgba(200,255,0,0.45) 1.5px,transparent 1.5px)',
    bgSize: '18px 18px', bgPos: '',
  },
  {
    id: 'diagonal', name: 'Diagonal', bg: '#0a0a0a',
    bgImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.14) 0,rgba(255,255,255,0.14) 1px,transparent 0,transparent 50%)',
    bgSize: '12px 12px', bgPos: '',
  },
  {
    id: 'hatch', name: 'Hatch', bg: '#111111',
    bgImage: [
      'repeating-linear-gradient(45deg,rgba(255,255,255,0.12) 0,rgba(255,255,255,0.12) 1px,transparent 0,transparent 50%)',
      'repeating-linear-gradient(-45deg,rgba(255,255,255,0.12) 0,rgba(255,255,255,0.12) 1px,transparent 0,transparent 50%)',
    ].join(','),
    bgSize: '14px 14px', bgPos: '',
  },
  {
    id: 'circuit', name: 'Circuit', bg: '#061010',
    // Circuit uses a dot-grid approximation for the landing page preview
    // (actual circuit needs canvas — this gives the right vibe)
    bgImage: [
      'radial-gradient(circle, rgba(0,221,170,0.5) 1px, transparent 1px)',
      'linear-gradient(rgba(0,221,170,0.07) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(0,221,170,0.07) 1px, transparent 1px)',
    ].join(','),
    bgSize: '24px 24px, 24px 24px, 24px 24px', bgPos: '12px 12px, 0 0, 0 0',
  },
  {
    id: 'plus', name: 'Plus', bg: '#0a1a0a',
    bgImage: plusUrl,
    bgSize: '20px 20px', bgPos: '',
  },
];

export default function LandingPage() {
  const [activeBg, setActiveBg] = useState<null | typeof PREVIEW_PATTERNS[0]>(null);

  const pageBg = activeBg ? {
    backgroundColor:   activeBg.bg,
    backgroundImage:   activeBg.bgImage,
    backgroundSize:    activeBg.bgSize,
    ...(activeBg.bgPos ? { backgroundPosition: activeBg.bgPos } : {}),
  } : {};

  const tc  = activeBg ? contrastColor(activeBg.bg) : '#ffffff';
  const isActive = activeBg !== null;

  return (
    <div className={styles.page} style={pageBg}>

      {/* NAV */}
      <nav className={styles.nav}>
        <span className={styles.navLogo} style={{ color: tc }}>gridmint</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/install" style={{ fontFamily: 'var(--gb-font-mono)', fontSize: '11px', color: 'var(--gb-muted2)', textDecoration: 'none', letterSpacing: '0.08em' }}>
            install
          </Link>
          <Link href="/generate" style={{ fontFamily: 'var(--gb-font-mono)', fontSize: '11px', color: 'var(--gb-muted2)', textDecoration: 'none', letterSpacing: '0.08em' }}>
            generator
          </Link>
          <a
            className={styles.navGithub}
            href="https://github.com/vaibhxvvy/gridbox"
            target="_blank"
            rel="noopener noreferrer"
            style={isActive ? { borderColor: withAlpha(tc, 0.5), color: tc } : {}}
          >
            ★ stars on github
          </a>
        </div>
      </nav>

      {/* HERO */}
      <main className={styles.hero}>

        <div
          className={styles.badge}
          style={isActive ? { borderColor: withAlpha(tc, 0.25), color: withAlpha(tc, 0.85) } : {}}
        >
          <span className={styles.badgeDot} />
          <span>new pattern added every day</span>
          <span className={styles.badgeArrow}>→</span>
        </div>

        <h1 className={styles.headline} style={{ color: tc }}>
          Build Beautiful<br />
          Pattern Backgrounds
        </h1>

        <p className={styles.sub} style={{ color: withAlpha(tc, 0.75) }}>
          Professional-grade background patterns and gradients.<br />
          Easily copy the code and seamlessly integrate it into your projects.<br />
          <em style={{ color: withAlpha(tc, 0.5) }}>crafted for everyone.</em>
        </p>

        <div className={styles.ctaGrid}>
          {(['one click copy', 'live preview', 'explore'] as const).map(label => (
            <Link
              key={label}
              href="/generate"
              className={styles.ctaOutline}
              style={isActive ? {
                borderColor: withAlpha(tc, 0.45),
                color: tc,
                background: withAlpha(tc, 0.06),
              } : {}}
            >
              {label}
            </Link>
          ))}
          <a
            href="https://github.com/vaibhxvvy/gridbox"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaFilled}
          >
            contribute here
          </a>
        </div>

      </main>

      {/* PREVIEW STRIP */}
      <section className={styles.previewStrip}>
        {PREVIEW_PATTERNS.map((p) => (
          <div
            key={p.id}
            className={`${styles.previewCell} ${activeBg?.id === p.id ? styles.previewCellActive : ''}`}
            onClick={() => setActiveBg(prev => prev?.id === p.id ? null : p)}
            title={`Click to preview ${p.name}`}
          >
            <div
              className={styles.previewSwatch}
              style={{
                backgroundColor:  p.bg,
                backgroundImage:  p.bgImage,
                backgroundSize:   p.bgSize,
                backgroundRepeat: 'repeat',
                ...(p.bgPos ? { backgroundPosition: p.bgPos } : {}),
              }}
            />
            <div className={styles.previewFooter}>
              <span className={styles.previewLabel}>{p.name}</span>
              <Link
                href={`/generate?pat=${p.id}`}
                className={styles.previewEdit}
                onClick={e => e.stopPropagation()}
              >
                edit →
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer className={styles.footer} style={{ color: withAlpha(tc, 0.6) }}>
        <span>gridmint.ink</span>
        <span className={styles.footerSep}>·</span>
        <a
          href="https://github.com/vaibhxvvy/gridbox"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: withAlpha(tc, 0.6) }}
        >
          github
        </a>
        <span className={styles.footerSep}>·</span>
        <span>BSL license</span>
      </footer>

    </div>
  );
}
