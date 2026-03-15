import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Install — gridmint',
  description: 'Install the gridmint npm package. Use CSS background patterns in React, Next.js, and TypeScript projects.',
};

const INSTALL_TABS = [
  { id: 'npm',  cmd: 'npm install gridmint' },
  { id: 'pnpm', cmd: 'pnpm add gridmint' },
  { id: 'yarn', cmd: 'yarn add gridmint' },
  { id: 'bun',  cmd: 'bun add gridmint' },
];

const CODE_EXAMPLES = [
  {
    label: 'React component',
    lang: 'tsx',
    code: `import { GridmintPattern } from 'gridmint';

export default function Hero() {
  return (
    <GridmintPattern
      state={{
        pattern:   'dots',
        bgColor:   '#0a0a0a',
        patColor:  '#c8ff00',
        size:      20,
        opacity:   30,
        thickness: 2,
        rotation:  0,
      }}
      style={{ height: '100vh' }}
    >
      <h1>Hello World</h1>
    </GridmintPattern>
  );
}`,
  },
  {
    label: 'Hook',
    lang: 'tsx',
    code: `import { useGridmintPattern } from 'gridmint';

export default function Section() {
  const { style } = useGridmintPattern({
    pattern:   'grid',
    bgColor:   '#0a0a0a',
    patColor:  '#ffffff',
    size:      24,
    opacity:   20,
    thickness: 1,
    rotation:  0,
  });

  return <div style={{ ...style, minHeight: '400px' }} />;
}`,
  },
  {
    label: 'CSS string',
    lang: 'ts',
    code: `import { getCSS } from 'gridmint';

const css = getCSS({
  pattern:   'hatch',
  bgColor:   '#111111',
  patColor:  '#ffffff',
  size:      16,
  opacity:   20,
  thickness: 1,
  rotation:  0,
});

// Inject into a stylesheet or use with CSS-in-JS
console.log(css);
// background-color: #111111;
// background-image: repeating-linear-gradient(...);
// background-size: 16px 16px;`,
  },
  {
    label: 'Vanilla CSS',
    lang: 'css',
    code: `/* Use the generator at gridmint.ink/generate
   Copy any format — CSS, SCSS, Tailwind, React, Next.js, TSX */

.hero {
  background-color: #0a0a0a;
  background-image: radial-gradient(
    circle,
    rgba(200,255,0,0.3) 1px,
    transparent 1px
  );
  background-size: 20px 20px;
}`,
  },
];

export default function InstallPage() {
  return (
    <div className={styles.page}>

      {/* NAV */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>gridmint</Link>
        <div className={styles.navLinks}>
          <Link href="/generate" className={styles.navLink}>generator</Link>
          <Link href="/install" className={`${styles.navLink} ${styles.navLinkActive}`}>install</Link>
          <a href="https://github.com/vaibhxvvy/gridbox" target="_blank" rel="noopener noreferrer" className={styles.navGithub}>
            ★ github
          </a>
        </div>
      </nav>

      <main className={styles.main}>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            npm package
          </div>
          <h1 className={styles.title}>Install gridmint</h1>
          <p className={styles.sub}>
            Use gridmint patterns in any React or Next.js project.<br />
            Zero dependencies. Fully typed. Works with CSS, SCSS, Tailwind, and more.
          </p>
        </div>

        {/* Install commands */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Installation</h2>
          <div className={styles.installGrid}>
            {INSTALL_TABS.map(t => (
              <div key={t.id} className={styles.installCmd}>
                <span className={styles.cmdPkg}>{t.id}</span>
                <code className={styles.cmdText}>{t.cmd}</code>
              </div>
            ))}
          </div>
        </section>

        {/* Quick start */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick start</h2>
          <div className={styles.examples}>
            {CODE_EXAMPLES.map(ex => (
              <div key={ex.label} className={styles.example}>
                <div className={styles.exampleHeader}>
                  <span className={styles.exampleLabel}>{ex.label}</span>
                  <span className={styles.exampleLang}>{ex.lang}</span>
                </div>
                <pre className={styles.code}><code>{ex.code}</code></pre>
              </div>
            ))}
          </div>
        </section>

        {/* API reference */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>API reference</h2>
          <div className={styles.apiGrid}>
            <div className={styles.apiCard}>
              <div className={styles.apiName}>{'<GridmintPattern />'}</div>
              <div className={styles.apiDesc}>React component. Renders any element with a pattern background applied as inline styles.</div>
              <div className={styles.apiProps}>
                <div className={styles.apiProp}><code>state</code> <span>PatternState</span> — pattern config</div>
                <div className={styles.apiProp}><code>as</code> <span>string</span> — HTML tag (default: div)</div>
                <div className={styles.apiProp}><code>className</code> <span>string</span> — CSS class</div>
                <div className={styles.apiProp}><code>style</code> <span>CSSProperties</span> — override styles</div>
                <div className={styles.apiProp}><code>children</code> <span>ReactNode</span> — content inside</div>
              </div>
            </div>
            <div className={styles.apiCard}>
              <div className={styles.apiName}>useGridmintPattern(state)</div>
              <div className={styles.apiDesc}>Hook. Returns CSS strings and a React style object for a given pattern state.</div>
              <div className={styles.apiProps}>
                <div className={styles.apiProp}><code>css</code> <span>string</span> — full CSS string</div>
                <div className={styles.apiProp}><code>bgCSS</code> <span>string</span> — background-color only</div>
                <div className={styles.apiProp}><code>imgCSS</code> <span>string</span> — background-image only</div>
                <div className={styles.apiProp}><code>style</code> <span>CSSProperties</span> — React style object</div>
              </div>
            </div>
            <div className={styles.apiCard}>
              <div className={styles.apiName}>getCSS(state)</div>
              <div className={styles.apiDesc}>Returns the full CSS string for a pattern state. Use with any CSS-in-JS solution or inject into a stylesheet.</div>
            </div>
            <div className={styles.apiCard}>
              <div className={styles.apiName}>PATTERNS</div>
              <div className={styles.apiDesc}>Array of all 12 pattern definitions. Each has <code>id</code>, <code>name</code>, <code>draw()</code>, and <code>css()</code>.</div>
            </div>
          </div>
        </section>

        {/* PatternState type */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>PatternState</h2>
          <pre className={styles.code}><code>{`interface PatternState {
  pattern:   string;  // 'noise' | 'dots' | 'grid' | 'rect' | 'diagonal' |
                      // 'hatch' | 'carbon' | 'halftone' | 'plus' | 'hex' |
                      // 'waves' | 'circuit'
  bgColor:   string;  // hex color e.g. '#0a0a0a'
  patColor:  string;  // hex color e.g. '#ffffff'
  size:      number;  // tile size in px (4–240)
  opacity:   number;  // 1–100
  thickness: number;  // stroke thickness 1–8
  rotation:  number;  // 0–180 degrees
}`}</code></pre>
        </section>

        {/* CTA */}
        <div className={styles.cta}>
          <Link href="/generate" className={styles.ctaPrimary}>
            open generator →
          </Link>
          <a href="https://github.com/vaibhxvvy/gridbox" target="_blank" rel="noopener noreferrer" className={styles.ctaSecondary}>
            ★ star on github
          </a>
        </div>

      </main>

      <footer className={styles.footer}>
        <span>gridmint.ink</span>
        <span className={styles.sep}>·</span>
        <a href="https://github.com/vaibhxvvy/gridbox" target="_blank" rel="noopener noreferrer">github</a>
        <span className={styles.sep}>·</span>
        <span>BSL license</span>
      </footer>

    </div>
  );
}
