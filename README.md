<div align="center">

<br/>

```
 ██████╗ ██████╗ ██╗██████╗ ██████╗  ██████╗ ██╗  ██╗
██╔════╝ ██╔══██╗██║██╔══██╗██╔══██╗██╔═══██╗╚██╗██╔╝
██║  ███╗██████╔╝██║██║  ██║██████╔╝██║   ██║ ╚███╔╝
██║   ██║██╔══██╗██║██║  ██║██╔══██╗██║   ██║ ██╔██╗
╚██████╔╝██║  ██║██║██████╔╝██████╔╝╚██████╔╝██╔╝ ██╗
 ╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
```

**CSS background pattern generator**

Pick a pattern. Tweak it. Copy the code in any format.

<br/>

[![Live](https://img.shields.io/badge/▶%20Live-gridbox.ink-c8ff00?style=for-the-badge&labelColor=0a0a0a)](https://gridbox.ink)
&nbsp;
[![Stars](https://img.shields.io/github/stars/vaibhav/gridbox?style=for-the-badge&labelColor=0a0a0a&color=c8ff00)](https://github.com/vaibhav/gridbox/stargazers)
&nbsp;
[![License](https://img.shields.io/badge/License-MIT-c8ff00?style=for-the-badge&labelColor=0a0a0a)](LICENSE)
&nbsp;
[![Next.js](https://img.shields.io/badge/Next.js%2014-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)

<br/>

![gridbox screenshot](public/screenshot.png)

</div>

---

## What is Gridbox?

Gridbox is an open-source background pattern generator. Select from 12 patterns, control every parameter in real time, then export the code in whichever format your project needs — plain CSS, SCSS, Tailwind, React, Next.js, or TSX.

No account. No limits. No watermarks.

---

## Output formats

Every pattern generates ready-to-paste code in six formats:

| Format | Output |
|--------|--------|
| **CSS** | `.bg-pattern { background-color: ...; background-image: ...; }` |
| **SCSS** | Same with nesting + `&.overlay` helper |
| **Tailwind** | Arbitrary value classes + `tailwind.config.js` snippet |
| **React** | Functional component with typed `style` object |
| **Next.js** | Component + CSS Module pair |
| **TSX** | Fully typed `React.FC` component with `CSSProperties` |

---

## Patterns

| Pattern | CSS technique |
|---------|--------------|
| Noise | SVG `feTurbulence` fractal noise |
| Dots | `radial-gradient` |
| Grid | `linear-gradient` 2-axis |
| Rect | `linear-gradient` 2:1 ratio |
| Diagonal | `repeating-linear-gradient` |
| Crosshatch | Double `repeating-linear-gradient` |
| Carbon | 4-layer `linear-gradient` |
| Halftone | Dual offset `radial-gradient` |
| Plus | `linear-gradient` with `background-position` |
| Hexagon | Inline SVG `background-image` |
| Waves | Inline SVG bezier path |
| Circuit | Canvas-rendered (export as PNG) |

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `← →` | Cycle patterns |
| `C` | Copy full CSS |
| `S` | Copy share link |
| `R` | Reset to defaults |

---

## Shareable URLs

Every state change encodes itself into the URL silently.

```
https://gridbox.ink/generate?pat=dots&bg=0d0d0d&col=c8ff00&sz=18&op=40&tk=2&rot=0
```

Share it or bookmark it — the full config is in the URL.

---

## Project structure

```
gridbox/
├── app/
│   ├── layout.tsx              ← root layout + metadata
│   ├── page.tsx                ← landing page
│   ├── globals.css
│   └── generate/
│       └── page.tsx            ← generator app
│
├── components/
│   ├── generator/
│   │   ├── GeneratorSidebar    ← left panel
│   │   ├── GeneratorCanvas     ← 16:9 preview
│   │   ├── PatternGrid         ← 12 pattern thumbnails
│   │   ├── Slider              ← size/opacity/thickness/rotation
│   │   ├── ColorPicker         ← swatch + hex editor
│   │   ├── Presets             ← 12 one-click presets
│   │   ├── CodeOutput          ← 6-format tabbed code panel
│   │   └── ExportMenu          ← PNG/JPG/SVG/CSS download
│   └── ui/
│       └── Toast               ← share feedback
│
├── lib/
│   ├── patterns/
│   │   ├── engine.ts           ← all 12 draw functions + CSS generators
│   │   └── presets.ts          ← preset configs
│   ├── codegen.ts              ← multi-format code generator
│   ├── url-state.ts            ← encode/decode URL params
│   └── use-pattern-renderer.ts ← RAF hook (lag fix)
│
├── types/
│   └── pattern.ts              ← PatternState, Pattern, Preset types
│
└── styles/
    ├── globals.css
    └── tokens.css              ← CSS custom properties
```

---

## Performance

The lag you see in single-file generators is caused by redrawing all thumbnails on every slider event. Gridbox fixes this properly:

- **Dirty-flag RAF** — `render()` uses a pending flag so rapid slider drags collapse to one canvas draw per animation frame
- **Active-only thumb updates** — while dragging a slider, only the current pattern's thumbnail redraws. The other 11 are untouched until you stop
- **Debounced scheduling** — thumbnail redraws are debounced 280ms after the last input event
- **Staggered full redraws** — on pattern switch, all 12 thumbnails redraw 20ms apart so the main thread never spikes
- **`extMult` parameter** — preview canvas draws at `extMult=5` (full coverage), thumbnails at `extMult=2` (dramatically less work). Same patterns, 60% less computation for thumbs

---

## Running locally

```bash
git clone https://github.com/vaibhav/gridbox
cd gridbox
npm install
npm run dev
# open http://localhost:3000
```

---

## Deploy to Netlify

```bash
npm run build
# drag the .next folder to netlify.com/drop
# or connect the repo and set:
#   build command: npm run build
#   publish dir:   .next
```

For Netlify to serve Next.js correctly, add a `netlify.toml`:

```toml
[build]
  command   = "npm run build"
  publish   = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

## Contributing

Issues and PRs welcome.

**Good first issues:**
- Add a new pattern (triangles, moroccan tile, tartan, zigzag)
- Add gradient background support
- Improve SVG export for more pattern types
- Add a random shuffle button
- Mobile layout improvements

**To contribute:**
1. Fork the repo
2. Create a branch: `git checkout -b feat/your-pattern`
3. Add your pattern to `lib/patterns/engine.ts` following the existing structure
4. Test in Chrome and Firefox
5. Open a PR — describe what you added and show a screenshot

---

## GitHub topics

Add these in **Settings → Topics** for discoverability:

```
css  pattern-generator  background-texture  design-tools  nextjs
typescript  tailwind  react  open-source  web-design  css-patterns
```

---

## License

MIT — free for personal and commercial use.

---

<div align="center">

[gridbox.ink](https://gridbox.ink) &nbsp;·&nbsp; [Report a bug](https://github.com/vaibhav/gridbox/issues) &nbsp;·&nbsp; [Request a pattern](https://github.com/vaibhav/gridbox/issues)

</div>
