import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.page}>

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <span className={styles.navLogo}>gridbox</span>
        <a
          className={styles.navGithub}
          href="https://github.com/vaibhav/gridbox"
          target="_blank"
          rel="noopener noreferrer"
        >
          ★ stars on github
        </a>
      </nav>

      {/* ── HERO ── */}
      <main className={styles.hero}>

        {/* Badge */}
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          <span>new pattern added every day</span>
          <span className={styles.badgeArrow}>←</span>
        </div>

        {/* Headline */}
        <h1 className={styles.headline}>
          Build Beautiful<br />
          Pattern Backgrounds
        </h1>

        {/* Subtext */}
        <p className={styles.sub}>
          Professional-grade background patterns and gradients.<br />
          Easily copy the code and seamlessly integrate it into your projects.<br />
          <em>crafted for everyone.</em>
        </p>

        {/* CTA grid */}
        <div className={styles.ctaGrid}>
          <Link href="/generate" className={styles.ctaOutline}>
            one click copy
          </Link>
          <Link href="/generate" className={styles.ctaOutline}>
            live preview
          </Link>
          <a
            href="https://github.com/vaibhav/gridbox"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaFilled}
          >
            contribute here
          </a>
          <Link href="/generate" className={styles.ctaOutline}>
            explore
          </Link>
        </div>

      </main>

      {/* ── PREVIEW STRIP ── */}
      <section className={styles.previewStrip}>
        {PREVIEW_PATTERNS.map((p) => (
          <Link key={p.id} href={`/generate?pat=${p.id}`} className={styles.previewCell}>
            <div className={styles.previewSwatch} style={{ background: p.bg }}>
              <div className={styles.previewOverlay} style={{ backgroundImage: p.bgImage, backgroundSize: p.bgSize }} />
            </div>
            <span className={styles.previewLabel}>{p.name}</span>
          </Link>
        ))}
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <span>gridbox.ink</span>
        <span className={styles.footerSep}>·</span>
        <a href="https://github.com/vaibhav/gridbox" target="_blank" rel="noopener noreferrer">github</a>
        <span className={styles.footerSep}>·</span>
        <span>MIT license</span>
      </footer>

    </div>
  );
}

/* Static preview data — no canvas needed for landing page */
const PREVIEW_PATTERNS = [
  { id: 'grid',     name: 'Grid',     bg: '#0a0a0a', bgImage: 'linear-gradient(rgba(200,255,0,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(200,255,0,0.2) 1px,transparent 1px)', bgSize: '24px 24px' },
  { id: 'dots',     name: 'Dots',     bg: '#0d0d0d', bgImage: 'radial-gradient(circle,rgba(200,255,0,0.4) 1px,transparent 1px)', bgSize: '18px 18px' },
  { id: 'diagonal', name: 'Diagonal', bg: '#0a0a0a', bgImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.1) 0,rgba(255,255,255,0.1) 1px,transparent 0,transparent 50%)', bgSize: '12px 12px' },
  { id: 'hatch',    name: 'Hatch',    bg: '#111111', bgImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.1) 0,rgba(255,255,255,0.1) 1px,transparent 0,transparent 50%),repeating-linear-gradient(-45deg,rgba(255,255,255,0.1) 0,rgba(255,255,255,0.1) 1px,transparent 0,transparent 50%)', bgSize: '14px 14px' },
  { id: 'carbon',   name: 'Carbon',   bg: '#111',    bgImage: 'linear-gradient(135deg,rgba(255,255,255,0.06) 25%,transparent 25%) -4px 0,linear-gradient(225deg,rgba(255,255,255,0.06) 25%,transparent 25%) -4px 0,linear-gradient(315deg,rgba(255,255,255,0.06) 25%,transparent 25%),linear-gradient(45deg,rgba(255,255,255,0.06) 25%,transparent 25%)', bgSize: '8px 8px' },
  { id: 'plus',     name: 'Plus',     bg: '#0d1a0d', bgImage: 'linear-gradient(rgba(0,255,65,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,65,0.3) 1px,transparent 1px)', bgSize: '20px 20px', },
];
