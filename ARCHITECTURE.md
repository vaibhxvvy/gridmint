# gridmint — Architecture & Code Map

A reference doc for understanding where everything lives and how it connects.
Use this before editing anything to avoid breaking other parts.

---

## Directory Structure

```
gridmint/
├── app/
│   ├── layout.tsx              ← Root layout. FONTS loaded here as <link> tags ONLY.
│   ├── globals.css             ← Global resets. No @import ever.
│   ├── page.tsx                ← Landing page component
│   ├── page.module.css         ← Landing page styles
│   ├── generate/
│   │   ├── page.tsx            ← Dynamic import wrapper (ssr:false)
│   │   ├── GeneratorApp.tsx    ← Main generator page — topbar, shell, layout
│   │   ├── GeneratorApp.module.css
│   │   └── loading.tsx
│   └── install/
│       ├── page.tsx
│       └── page.module.css
├── components/
│   └── generator/
│       ├── GeneratorSidebar.tsx/.module.css   ← Left sidebar — all controls
│       ├── GeneratorCanvas.tsx/.module.css    ← Canvas preview area
│       ├── CodeOutput.tsx/.module.css         ← Language tabs + copy + export
│       ├── ExportMenu.tsx/.module.css         ← Export dropdown (PNG/JPG/SVG/CSS)
│       ├── PatternGrid.tsx/.module.css        ← 3-col pattern thumbnail grid
│       ├── Slider.tsx/.module.css             ← Reusable range slider
│       ├── ColorPicker.tsx/.module.css        ← HSB color picker with quick swatches
│       └── Presets.tsx/.module.css            ← Preset list with canvas thumbnails
├── lib/
│   ├── patterns/
│   │   ├── engine.ts           ← ALL 12 pattern draw functions + drawSetup + CSS gen
│   │   └── presets.ts          ← 12 preset definitions (name, state, accent)
│   ├── use-pattern-renderer.ts ← Core rendering hook — animation loop, state, thumbs
│   ├── url-state.ts            ← Encode/decode state to/from URL params
│   ├── codegen.ts              ← CSS/SCSS/Tailwind/React/Next.js/TSX code generation
│   └── use-github-stars.ts     ← Fetches live star count from GitHub API
├── styles/
│   ├── tokens.css              ← ALL CSS variables (colours, spacing, fonts)
│   └── globals.css             ← Base resets, imports tokens.css
├── types/
│   └── pattern.ts              ← TypeScript types: PatternState, Pattern, AnimationDir
└── packages/
    └── gridmint/               ← npm package source (not yet published)
```

---

## Core Data Flow

```
User interaction
      ↓
GeneratorSidebar / GeneratorApp
  calls setState(patch)
      ↓
usePatternRenderer.setState()
  → saves old pattern to patternMemory (if switching)
  → builds next PatternState
  → calls triggerRender(next, redrawAllThumbs)
      ↓
triggerRender()
  → if animation !== 'none': startAnim()
  → else: drawPreview(s, 0, 0) via RAF
  → schedules thumb update
  → encodes state to URL
      ↓
drawPreview(s, ox, oy)
  → clears canvas
  → fills bgColor
  → calls drawPattern(ctx, s, extMult, ox, oy)
      ↓
engine.ts drawPattern()
  → finds pattern by id
  → calls pat.draw(ctx, state, extMult, offsetX, offsetY)
      ↓
drawSetup() translates/rotates canvas
  → pattern draws its shapes
```

---

## PatternState Type

```ts
interface PatternState {
  pattern:   string;       // 'noise'|'dots'|'grid'|'rect'|'diagonal'|'hatch'|
                           // 'carbon'|'halftone'|'plus'|'hex'|'waves'|'circuit'
  bgColor:   string;       // hex, e.g. '#0a0a0a'
  patColor:  string;       // hex
  size:      number;       // pattern tile size in px (4-240)
  opacity:   number;       // 1-100
  thickness: number;       // stroke width (1-20)
  rotation:  number;       // degrees (0-180)
  animation: AnimationDir; // 'none'|'left'|'right'|'up'|'down'|'diag-left'|'diag-right'
  animSpeed: number;       // px/sec (5-200)
}
```

---

## Animation System

**File:** `lib/use-pattern-renderer.ts`

The animation loop uses `requestAnimationFrame`. On each frame:

1. If `pausedRef.current === true` — keeps RAF alive but skips draw (true pause)
2. Increments `animOffset.x / .y` by `speed * deltaTime`
3. Wraps offset to `[0, size)` — this is what makes it seamless (no jumps)
4. Calls `drawPreview(state, ox, oy)`
5. `drawPreview` calls `drawPattern(ctx, s, extMult=3, ox, oy)` (extMult=3 for perf during anim)
6. `drawSetup` in engine.ts applies the offset as a pre-rotation translation

**Special case — noise pattern:**
Noise uses `Math.random()` so it can't use offset (would flicker). Instead:
- A 3× canvas tile is drawn once and cached (`tileCache` ref)
- Cache is invalidated when state changes (colour, size, etc.)
- On each frame, the cached tile is translated using `ctx.drawImage`

**Pause vs Stop:**
- `pausedRef.current = true` → pauses visually, animation direction preserved in state
- `setState({ animation: 'none' })` → stops completely, resets offset

---

## Pattern Engine

**File:** `lib/patterns/engine.ts`

### drawSetup(ctx, rotation, W, H, extMult, offsetX, offsetY)
Sets up the canvas transform before drawing:
- Translates to canvas centre
- Rotates by `rotation` degrees
- Translates back by `(-W * extMult / 2 + offsetX, -H * extMult / 2 + offsetY)`

`extMult` controls how much larger than the canvas the pattern draws.
- `extMult=5` — static preview (full quality, covers canvas even when rotated)
- `extMult=3` — animated preview (faster, still covers canvas with rotation)
- `extMult=2` — thumbnails (small canvas, minimal overdraw needed)

### Adding a new pattern
1. Add entry to `PATTERNS` array in `engine.ts`
2. Add defaults to `PATTERN_DEFAULTS` in `use-pattern-renderer.ts`
3. Add a preset in `presets.ts` (optional)
4. Pattern `draw()` must accept `(ctx, state, extMult, offsetX, offsetY)` signature
5. Must call `drawSetup(ctx, rotation, W, H, extMult, offsetX, offsetY)` for offset/anim to work
6. Must call `ctx.restore()` at the end

---

## Per-Pattern Memory

When switching patterns, the current pattern's settings are saved to `patternMemory` (a `Map`).
When switching back, those settings are restored.

This means: editing dots → switching to grid → switching back to dots restores your dots settings.

Presets apply the **full preset state** including pattern switch. This triggers the memory save/restore flow.

---

## Sidebar Sections

| Section    | Collapsible | What it does |
|------------|-------------|--------------|
| PATTERNS   | ✓           | 3-col thumbnail grid, click to switch pattern |
| ADJUST     | ✗           | size / opacity / thickness / rotation sliders |
| ANIMATE    | ✗           | toggle on/off + direction grid + speed + play/pause |
| COLORS     | ✗           | HSB color picker for bg and pattern + reset |
| PRESETS    | ✓           | Canvas thumbnail list, applies full preset state |
| GRADIENTS  | — (future)  | Placeholder |
| TEXTURES   | — (future)  | Placeholder |

---

## Code Generation

**File:** `lib/codegen.ts`

Takes `PatternState` and outputs code for:
- `css` — plain CSS background-image
- `scss` — SCSS variable format
- `tailwind` — Tailwind arbitrary value style
- `react` — React inline style object
- `nextjs` — Next.js style with CSS module
- `tsx` — TypeScript React component

---

## URL State

**File:** `lib/url-state.ts`

All state is encoded in URL params on every change (`history.replaceState`).
This enables shareable links. Params: `p` (pattern), `bg`, `pc` (patColor), `s` (size), `o` (opacity), `t` (thickness), `r` (rotation), `an` (animation), `spd` (animSpeed).

---

## Design Tokens

**File:** `styles/tokens.css`

| Variable         | Value     | Used for |
|------------------|-----------|----------|
| `--gb-bg`        | `#0a0a0a` | Page background |
| `--gb-surface`   | `#111111` | Sidebar background |
| `--gb-s2`        | `#181818` | Topbar, info bar |
| `--gb-s3`        | `#202020` | Buttons, inputs |
| `--gb-border`    | `#2c2c2c` | All borders |
| `--gb-accent`    | `#c8ff00` | Lime green — active states, logo |
| `--gb-text`      | `#f0f0f0` | Primary text |
| `--gb-muted`     | `#606060` | Dimmed labels |
| `--gb-muted2`    | `#999999` | Secondary text |
| `--gb-font-mono` | Space Mono | All UI text |

---

## CRITICAL RULES

1. **NO `@import` in any CSS file** — fonts are loaded via `<link>` tags in `app/layout.tsx` only
2. **Never redraw all 12 thumbnails** when only one pattern changes — use `triggerRender(next, false)`
3. **Preset apply** triggers `isSwitch=true` in setState which saves/restores per-pattern memory
4. **Noise pattern** cannot use offset animation — it uses tileCache instead
5. **extMult must be ≥ 3** for animated draws, ≥ 5 for static (coverage during rotation)
6. **pausedRef** controls pause state — never set `animation: 'none'` to "pause"

