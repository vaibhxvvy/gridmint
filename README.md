<div align="center">

```
 ██████╗ ██████╗ ██╗██████╗ ███╗   ███╗██╗███╗   ██╗████████╗
██╔════╝ ██╔══██╗██║██╔══██╗████╗ ████║██║████╗  ██║╚══██╔══╝
██║  ███╗██████╔╝██║██║  ██║██╔████╔██║██║██╔██╗ ██║   ██║
██║   ██║██╔══██╗██║██║  ██║██║╚██╔╝██║██║██║╚██╗██║   ██║
╚██████╔╝██║  ██║██║██████╔╝██║ ╚═╝ ██║██║██║ ╚████║   ██║
 ╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝
```

**CSS background pattern generator**

Pick a pattern. Tweak it. Copy the code in any format.

<br/>

[![Live](https://img.shields.io/badge/▶%20Live-gridmint.ink-c8ff00?style=for-the-badge&labelColor=0a0a0a)](https://gridmint.ink)
&nbsp;
[![Stars](https://img.shields.io/github/stars/vaibhxvvy/gridbox?style=for-the-badge&labelColor=0a0a0a&color=c8ff00)](https://github.com/vaibhxvvy/gridbox/stargazers)
&nbsp;
[![npm](https://img.shields.io/npm/v/gridmint?style=for-the-badge&labelColor=0a0a0a&color=c8ff00)](https://npmjs.com/package/gridmint)
&nbsp;
[![License](https://img.shields.io/badge/License-Personal_Use-c8ff00?style=for-the-badge&labelColor=0a0a0a)](LICENSE)

<br/>

![gridmint screenshot](public/screenshot.png)

</div>

---

## What is gridmint?

gridmint is an open-source background pattern generator. Select from 12 patterns, control every parameter in real time, then export the code in whichever format your project needs.

Use it at **[gridmint.ink](https://gridmint.ink)** or install the npm package.

No account. No limits. No watermarks.

---

## npm package

```bash
npm install gridmint
# or
pnpm add gridmint
# or
yarn add gridmint
```

### React component

```tsx
import { GridmintPattern } from 'gridmint';

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
}
```

### Hook

```tsx
import { useGridmintPattern } from 'gridmint';

export default function Section() {
  const { style } = useGridmintPattern({
    pattern: 'grid', bgColor: '#0a0a0a', patColor: '#ffffff',
    size: 24, opacity: 20, thickness: 1, rotation: 0,
  });

  return <div style={{ ...style, minHeight: '400px' }} />;
}
```

### CSS string

```ts
import { getCSS } from 'gridmint';

const css = getCSS({
  pattern: 'hatch', bgColor: '#111', patColor: '#fff',
  size: 16, opacity: 20, thickness: 1, rotation: 0,
});
// Inject into a stylesheet or use with CSS-in-JS
```

Full API docs at **[gridmint.ink/install](https://gridmint.ink/install)**

---

## Output formats

| Format | Output |
|--------|--------|
| **CSS** | `.bg-pattern { background-color: ...; background-image: ...; }` |
| **SCSS** | Same with nesting |
| **Tailwind** | Arbitrary value classes |
| **React** | Functional component with `style` object |
| **Next.js** | Component + CSS Module pair |
| **TSX** | Fully typed `React.FC` with `CSSProperties` |

---

## Patterns

| Pattern | CSS technique |
|---------|--------------|
| Noise | SVG `feTurbulence` |
| Dots | `radial-gradient` |
| Grid | `linear-gradient` 2-axis |
| Rect | `linear-gradient` 2:1 ratio |
| Diagonal | `repeating-linear-gradient` |
| Crosshatch | Double `repeating-linear-gradient` |
| Carbon | 4-layer `linear-gradient` |
| Halftone | Dual offset `radial-gradient` |
| Plus | `linear-gradient` with offset |
| Hexagon | Inline SVG |
| Waves | Inline SVG bezier |
| Circuit | Canvas-rendered |

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `← →` | Cycle patterns |
| `C` | Copy CSS |
| `S` | Copy share link |
| `R` | Reset |
| `X` | Randomize |

---

## Shareable URLs

Every change encodes into the URL automatically.

```
https://gridmint.ink/generate?pat=dots&bg=0d0d0d&col=c8ff00&sz=18&op=40&tk=2&rot=0
```

---

## Project structure

```
gridmint/
├── app/
│   ├── page.tsx              ← landing page
│   ├── generate/             ← generator app
│   └── install/              ← npm package docs
├── components/generator/     ← all UI components
├── lib/
│   ├── patterns/engine.ts    ← 12 pattern draw + CSS functions
│   ├── codegen.ts            ← 6-format code generator
│   ├── url-state.ts          ← encode/decode URL
│   └── use-pattern-renderer.ts ← RAF hook (lag fix)
├── packages/gridmint/        ← npm package source
│   └── src/
│       ├── components/       ← GridmintPattern component
│       ├── hooks/            ← useGridmintPattern
│       └── engine.ts         ← pattern engine
└── types/pattern.ts          ← TypeScript types
```

---

## Performance

- **Cancel/reschedule RAF** — every `setState` cancels the previous frame and schedules a new one — no dropped renders, no double-click bugs
- **Active-only thumb updates** — while dragging sliders, only the current pattern's thumbnail redraws
- **Per-pattern adjustment reset** — switching patterns resets size/opacity/thickness/rotation to sensible defaults for that pattern, preventing lag from huge values carrying over
- **Staggered full redraws** — on pattern switch, all 12 thumbnails redraw 20ms apart

---

## Running locally

```bash
git clone https://github.com/vaibhxvvy/gridbox
cd gridbox
npm install
npm run dev
# open http://localhost:3000
```

---

## Deploy

Connect the GitHub repo to Vercel — zero config needed, Next.js is auto-detected.

---

## Contributing

PRs welcome.

**Good first issues:**
- Add new patterns (triangles, moroccan tile, zigzag)
- Gradient background support
- Animated pattern preview
- Mobile layout improvements

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-pattern`
3. Add your pattern to `lib/patterns/engine.ts`
4. Open a PR with a screenshot

---

## GitHub topics

```
css  pattern-generator  background-texture  design-tools  nextjs
typescript  tailwind  react  open-source  web-design  css-patterns
```

---

## License

Personal use and open-source projects — free.
Commercial use of the application requires written permission.
The **generated CSS/code output** is free to use in any project, commercial or personal.

See [LICENSE](LICENSE) for full terms.

---

<div align="center">

[gridmint.ink](https://gridmint.ink) &nbsp;·&nbsp;
[generator](https://gridmint.ink/generate) &nbsp;·&nbsp;
[install](https://gridmint.ink/install) &nbsp;·&nbsp;
[report a bug](https://github.com/vaibhxvvy/gridbox/issues)

</div>
