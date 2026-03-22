import type { Pattern, PatternState } from '@/types/pattern';

// ── utils ────────────────────────────────────────────────────────────
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [255, 255, 255];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function validHex(h: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(h);
}

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sets up canvas transform: translate to center, rotate, offset so
 * the pattern tiles cover the full canvas even when rotated.
 * extMult controls how much bigger than the canvas we draw.
 * Use extMult=6 for full preview, extMult=2 for thumbnails (much faster).
 */
function drawSetup(
  ctx: CanvasRenderingContext2D,
  rot: number,
  W: number,
  H: number,
  extMult: number,
  offsetX = 0,
  offsetY = 0,
) {
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.translate((-W * extMult) / 2 + offsetX, (-H * extMult) / 2 + offsetY);
}

// ── pattern definitions ──────────────────────────────────────────────
export const PATTERNS: Pattern[] = [
  // ── NOISE ──
  {
    id: 'noise', name: 'Noise',
    draw(ctx, { patColor, opacity }) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      if (!W || !H) return;
      const [r, g, b] = hexToRgb(patColor);
      const a = opacity / 100;
      // Small grain tile (256×256) tiled across canvas — 16× fewer pixels,
      // redrawn every frame for authentic CRT static flicker at 60fps
      const GRAIN = 256;
      const grain = document.createElement('canvas');
      grain.width = GRAIN; grain.height = GRAIN;
      const gc  = grain.getContext('2d')!;
      const img = gc.createImageData(GRAIN, GRAIN);
      const d   = img.data;
      const al  = Math.round(255 * Math.min(a * 2.5, 1));
      for (let i = 0; i < d.length; i += 4) {
        if (Math.random() < a) {
          const br = Math.random();
          d[i] = r * br; d[i+1] = g * br; d[i+2] = b * br; d[i+3] = al;
        }
      }
      gc.putImageData(img, 0, 0);
      const pat = ctx.createPattern(grain, 'repeat');
      if (pat) { ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); }
    },
    css({ bgColor, patColor, opacity }) {
      const [r, g, b] = hexToRgb(patColor);
      const a = (opacity / 100).toFixed(2);
      return `background-color: ${bgColor};\nbackground-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='${a}'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='rgb(${r},${g},${b})' filter='url(%23n)'/%3E%3C/svg%3E");\nbackground-repeat: repeat;\nbackground-size: 200px 200px;`;
    },
  },

  // ── DOTS ──
  {
    id: 'dots', name: 'Dots',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5, offsetX = 0, offsetY = 0) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult, offsetX, offsetY);
      ctx.fillStyle = `rgba(${r},${g},${b},${opacity / 100})`;
      const rad = Math.max(0.5, thickness * 0.7);
      const ext = Math.max(W, H) * extMult;
      for (let x = 0; x < ext; x += size)
        for (let y = 0; y < ext; y += size) {
          ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
        }
      ctx.restore();
    },
    css({ bgColor, patColor, opacity, size, thickness, rotation }) {
      const [r, g, b] = hexToRgb(patColor);
      const a = (opacity / 100).toFixed(2);
      const rad = Math.max(1, Math.round(thickness * 0.7));
      const rotLine = rotation ? `\ntransform: rotate(${rotation}deg);` : '';
      return `background-color: ${bgColor};\nbackground-image: radial-gradient(circle, rgba(${r},${g},${b},${a}) ${rad}px, transparent ${rad}px);\nbackground-size: ${size}px ${size}px;${rotLine}`;
    },
  },

  // ── GRID ──
  {
    id: 'grid', name: 'Grid',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5, offsetX = 0, offsetY = 0) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult, offsetX, offsetY);
      ctx.strokeStyle = `rgba(${r},${g},${b},${opacity / 100})`; ctx.lineWidth = thickness;
      const ext = Math.max(W, H) * extMult;
      for (let x = 0; x <= ext; x += size) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ext); ctx.stroke(); }
      for (let y = 0; y <= ext; y += size) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ext, y); ctx.stroke(); }
      ctx.restore();
    },
    css({ bgColor, patColor, opacity, size, thickness, rotation }) {
      const [r, g, b] = hexToRgb(patColor);
      const c = `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
      const rotLine = rotation ? `\ntransform: rotate(${rotation}deg);` : '';
      return `background-color: ${bgColor};\nbackground-image: linear-gradient(${c} ${thickness}px, transparent ${thickness}px), linear-gradient(90deg, ${c} ${thickness}px, transparent ${thickness}px);\nbackground-size: ${size}px ${size}px;${rotLine}`;
    },
  },

  // ── RECT ──
  {
    id: 'rect', name: 'Rectangle',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5, offsetX = 0, offsetY = 0) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult, offsetX, offsetY);
      ctx.strokeStyle = `rgba(${r},${g},${b},${opacity / 100})`; ctx.lineWidth = thickness;
      const hs = size * 0.5, ext = Math.max(W, H) * extMult;
      for (let x = 0; x <= ext; x += size) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ext); ctx.stroke(); }
      for (let y = 0; y <= ext; y += hs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ext, y); ctx.stroke(); }
      ctx.restore();
    },
    css({ bgColor, patColor, opacity, size, thickness, rotation }) {
      const [r, g, b] = hexToRgb(patColor);
      const c = `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
      const h2 = Math.round(size * 0.5);
      const rotLine = rotation ? `\ntransform: rotate(${rotation}deg);` : '';
      return `background-color: ${bgColor};\nbackground-image: linear-gradient(${c} ${thickness}px, transparent ${thickness}px), linear-gradient(90deg, ${c} ${thickness}px, transparent ${thickness}px);\nbackground-size: ${size}px ${h2}px;${rotLine}`;
    },
  },

  // ── DIAGONAL ──
  {
    id: 'diagonal', name: 'Diagonal',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5, offsetX = 0, offsetY = 0) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation + 45, W, H, extMult);
      ctx.strokeStyle = `rgba(${r},${g},${b},${opacity / 100})`; ctx.lineWidth = thickness;
      const ext = Math.max(W, H) * extMult;
      for (let x = 0; x <= ext; x += size) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ext); ctx.stroke(); }
      ctx.restore();
    },
    css({ bgColor, patColor, opacity, size, thickness, rotation }) {
      const [r, g, b] = hexToRgb(patColor);
      const c = `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
      return `background-color: ${bgColor};\nbackground-image: repeating-linear-gradient(${45 + rotation}deg, ${c} 0, ${c} ${thickness}px, transparent 0, transparent 50%);\nbackground-size: ${size}px ${size}px;`;
    },
  },

  // ── CROSSHATCH ──
  {
    id: 'hatch', name: 'Hatch',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5, offsetX = 0, offsetY = 0) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult, offsetX, offsetY);
      ctx.strokeStyle = `rgba(${r},${g},${b},${opacity / 100})`; ctx.lineWidth = thickness;
      const ext = Math.max(W, H) * extMult;
      for (let i = -ext; i < ext * 2; i += size) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + ext, ext); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i + ext, 0); ctx.lineTo(i, ext); ctx.stroke();
      }
      ctx.restore();
    },
    css({ bgColor, patColor, opacity, size, thickness, rotation }) {
      const [r, g, b] = hexToRgb(patColor);
      const c = `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
      return `background-color: ${bgColor};\nbackground-image: repeating-linear-gradient(${45 + rotation}deg, ${c} 0, ${c} ${thickness}px, transparent 0, transparent 50%), repeating-linear-gradient(${-45 + rotation}deg, ${c} 0, ${c} ${thickness}px, transparent 0, transparent 50%);\nbackground-size: ${size}px ${size}px;`;
    },
  },

  // ── CARBON ──
  {
    id: 'carbon', name: 'Carbon',
    draw(ctx, { patColor, opacity, size, rotation }, extMult = 5, offsetX = 0, offsetY = 0) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult, offsetX, offsetY);
      const hs = size / 2, ext = Math.max(W, H) * extMult;
      const a1 = (opacity / 100 * 0.15).toFixed(3);
      const a2 = (opacity / 100 * 0.30).toFixed(3);
      for (let x = 0; x < ext; x += size)
        for (let y = 0; y < ext; y += size) {
          ctx.fillStyle = `rgba(${r},${g},${b},${a1})`; ctx.fillRect(x, y, hs, hs);
          ctx.fillStyle = `rgba(${r},${g},${b},${a2})`; ctx.fillRect(x, y + hs, hs, hs);
          ctx.fillStyle = `rgba(${r},${g},${b},${a2})`; ctx.fillRect(x + hs, y, hs, hs);
          ctx.fillStyle = `rgba(${r},${g},${b},${a1})`; ctx.fillRect(x + hs, y + hs, hs, hs);
        }
      ctx.restore();
    },
    css({ bgColor, patColor, opacity, size, rotation }) {
      const [r, g, b] = hexToRgb(patColor);
      const a2 = (opacity / 100 * 0.30).toFixed(2);
      const hs = Math.round(size / 2);
      const rotLine = rotation ? `\ntransform: rotate(${rotation}deg);` : '';
      return `background-color: ${bgColor};\nbackground-image: linear-gradient(135deg, rgba(${r},${g},${b},${a2}) 25%, transparent 25%) -${hs}px 0, linear-gradient(225deg, rgba(${r},${g},${b},${a2}) 25%, transparent 25%) -${hs}px 0, linear-gradient(315deg, rgba(${r},${g},${b},${a2}) 25%, transparent 25%), linear-gradient(45deg, rgba(${r},${g},${b},${a2}) 25%, transparent 25%);\nbackground-size: ${size}px ${size}px;${rotLine}`;
    },
  },

  // ── HALFTONE ──
  {
    id: 'halftone', name: 'Halftone',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5, offsetX = 0, offsetY = 0) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult, offsetX, offsetY);
      const ext = Math.max(W, H) * extMult;
      const rows = Math.ceil(ext / (size * 0.866)) + 2;
      const cols = Math.ceil(ext / size) + 2;
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++) {
          const x = col * size + (row % 2 === 0 ? 0 : size / 2);
          const y = row * size * 0.866;
          const rad = Math.max(0.5, (size / 2 - 1) * (opacity / 100) * (thickness / 4));
          ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},0.9)`; ctx.fill();
        }
      ctx.restore();
    },
    css({ bgColor, patColor, opacity, size, thickness, rotation }) {
      const [r, g, b] = hexToRgb(patColor);
      const rad = Math.max(1, Math.round((size / 2 - 1) * (opacity / 100) * (thickness / 4)));
      const rowH = Math.round(size * 0.866);
      const rotLine = rotation ? `\ntransform: rotate(${rotation}deg);` : '';
      return `background-color: ${bgColor};\nbackground-image: radial-gradient(circle, rgba(${r},${g},${b},0.9) ${rad}px, transparent ${rad}px), radial-gradient(circle, rgba(${r},${g},${b},0.9) ${rad}px, transparent ${rad}px);\nbackground-size: ${size}px ${rowH}px;\nbackground-position: 0 0, ${Math.round(size / 2)}px ${Math.round(rowH / 2)}px;${rotLine}`;
    },
  },

  // ── PLUS ──
  {
    id: 'plus', name: 'Plus',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5, offsetX = 0, offsetY = 0) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult, offsetX, offsetY);
      ctx.strokeStyle = `rgba(${r},${g},${b},${opacity / 100})`; ctx.lineWidth = thickness;
      const arm = size * 0.3, ext = Math.max(W, H) * extMult;
      for (let x = size / 2; x < ext; x += size)
        for (let y = size / 2; y < ext; y += size) {
          ctx.beginPath(); ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm); ctx.stroke();
        }
      ctx.restore();
    },
    css({ bgColor, patColor, opacity, size, thickness, rotation }) {
      const [r, g, b] = hexToRgb(patColor);
      const c = `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
      const rotLine = rotation ? `\ntransform: rotate(${rotation}deg);` : '';
      return `background-color: ${bgColor};\nbackground-image: linear-gradient(${c} ${thickness}px, transparent ${thickness}px), linear-gradient(90deg, ${c} ${thickness}px, transparent ${thickness}px);\nbackground-size: ${size}px ${size}px;\nbackground-position: ${Math.round(size / 2)}px 0, 0 ${Math.round(size / 2)}px;${rotLine}`;
    },
  },

  // ── CHECKERBOARD ──
  {
    id: 'checker', name: 'Checker',
    draw(ctx, { patColor, bgColor, opacity, size, rotation }, extMult = 5, offsetX = 0, offsetY = 0) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult, offsetX, offsetY);
      ctx.fillStyle = `rgba(${r},${g},${b},${opacity / 100})`;
      const ext = Math.max(W, H) * extMult;
      for (let x = 0; x < ext; x += size)
        for (let y = 0; y < ext; y += size)
          if (Math.floor(x / size + y / size) % 2 === 0)
            ctx.fillRect(x, y, size, size);
      ctx.restore();
    },
    css({ bgColor, patColor, opacity, size, rotation }) {
      const [r, g, b] = hexToRgb(patColor);
      const a = (opacity / 100).toFixed(2);
      const s = size, h = Math.round(size / 2);
      const rotLine = rotation ? `\ntransform: rotate(${rotation}deg);` : '';
      return `background-color: ${bgColor};\nbackground-image: linear-gradient(45deg, rgba(${r},${g},${b},${a}) 25%, transparent 25%), linear-gradient(-45deg, rgba(${r},${g},${b},${a}) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(${r},${g},${b},${a}) 75%), linear-gradient(-45deg, transparent 75%, rgba(${r},${g},${b},${a}) 75%);\nbackground-size: ${s}px ${s}px;\nbackground-position: 0 0, 0 ${h}px, ${h}px -${h}px, -${h}px 0px;${rotLine}`;
    },
  },

  // ── WAVES ──
  {
    id: 'waves', name: 'Waves',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5, offsetX = 0, offsetY = 0) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult, offsetX, offsetY);
      ctx.strokeStyle = `rgba(${r},${g},${b},${opacity / 100})`; ctx.lineWidth = thickness;
      const amp = size * 0.4, freq = (Math.PI * 2) / (size * 1.5), ext = Math.max(W, H) * extMult;
      for (let sy = -size * 2; sy < ext; sy += size) {
        ctx.beginPath();
        for (let x = 0; x <= ext; x += 2) {
          const y = sy + Math.sin(x * freq) * amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    },
    css({ bgColor, patColor, opacity, size, thickness, rotation }) {
      const [r, g, b] = hexToRgb(patColor);
      const a = (opacity / 100).toFixed(2);
      const rotLine = rotation ? `\ntransform: rotate(${rotation}deg);` : '';
      // Tile: one full sine cycle. Width = size*2π approx (use size*6 for good shape),
      // Height = size. Control points chosen to match natural sine: peaks at W/4 and 3W/4.
      const W = size * 6;
      const H = size;
      const mid = H * 0.5;
      const amp = H * 0.38;
      // Proper sine bezier: C points at ~0.36 of wavelength for accurate sine shape
      const c1x = Math.round(W * 0.17), c2x = Math.round(W * 0.33);
      const c3x = Math.round(W * 0.67), c4x = Math.round(W * 0.83);
      const d = `M 0 ${mid} C ${c1x} ${Math.round(mid - amp)}, ${c2x} ${Math.round(mid - amp)}, ${Math.round(W * 0.5)} ${mid} C ${c3x} ${Math.round(mid + amp)}, ${c4x} ${Math.round(mid + amp)}, ${W} ${mid}`;
      const stroke = `rgba(${r},${g},${b},${a})`;
      const svg = `%3Csvg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' preserveAspectRatio='none'%3E%3Cpath d='${encodeURIComponent(d)}' fill='none' stroke='${encodeURIComponent(stroke)}' stroke-width='${thickness}'/%3E%3C/svg%3E`;
      return `background-color: ${bgColor};\nbackground-image: url("data:image/svg+xml,${svg}");\nbackground-size: ${W}px ${H}px;${rotLine}`;
    },
  },

  // ── CIRCUIT ──
  {
    id: 'circuit', name: 'Circuit',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5, offsetX = 0, offsetY = 0) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult, offsetX, offsetY);
      ctx.strokeStyle = `rgba(${r},${g},${b},${opacity / 100})`;
      ctx.fillStyle   = `rgba(${r},${g},${b},${opacity / 100})`;
      ctx.lineWidth   = thickness;
      const rng = mulberry32(42), ext = Math.max(W, H) * extMult;
      for (let x = 0; x < ext; x += size)
        for (let y = 0; y < ext; y += size) {
          ([[1,0],[0,1],[-1,0],[0,-1]] as [number,number][])
            .filter(() => rng() > 0.5)
            .forEach(([dx, dy]) => {
              ctx.beginPath();
              ctx.moveTo(x + size / 2, y + size / 2);
              ctx.lineTo(x + size / 2 + dx * size * 0.4, y + size / 2 + dy * size * 0.4);
              ctx.stroke();
            });
          if (rng() > 0.6) {
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, thickness + 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      ctx.restore();
    },
    css({ bgColor, patColor, opacity, size, thickness }) {
      const [r,g,b] = hexToRgb(patColor);
      const a = (opacity/100).toFixed(2);
      const s = size;
      // SVG inline that mimics circuit lines + dots
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${s*4}' height='${s*4}'>`
        + `<line x1='${s*0.5}' y1='${s*0.5}' x2='${s*0.5}' y2='${s*1.5}' stroke='rgba(${r},${g},${b},${a})' stroke-width='${thickness}'/>`
        + `<line x1='${s*0.5}' y1='${s*0.5}' x2='${s*1.5}' y2='${s*0.5}' stroke='rgba(${r},${g},${b},${a})' stroke-width='${thickness}'/>`
        + `<line x1='${s*2.5}' y1='${s*0.5}' x2='${s*2.5}' y2='${s*2.5}' stroke='rgba(${r},${g},${b},${a})' stroke-width='${thickness}'/>`
        + `<line x1='${s*0.5}' y1='${s*2.5}' x2='${s*2.0}' y2='${s*2.5}' stroke='rgba(${r},${g},${b},${a})' stroke-width='${thickness}'/>`
        + `<circle cx='${s*0.5}' cy='${s*0.5}' r='${thickness+0.5}' fill='rgba(${r},${g},${b},${a})'/>`
        + `<circle cx='${s*2.5}' cy='${s*2.5}' r='${thickness+0.5}' fill='rgba(${r},${g},${b},${a})'/>`
        + `</svg>`;
      return `background-color: ${bgColor};\nbackground-image: url("data:image/svg+xml,${encodeURIComponent(svg)}");\nbackground-size: ${s*4}px ${s*4}px;\n/* Note: use Export PNG for highest fidelity */`;
    },
  },
];

// ── draw a pattern onto any canvas context ───────────────────────────
/**
 * extMult: 5 for full preview canvas, 2 for thumbnails.
 * Lower extMult = dramatically less work = no lag on thumbnails.
 */
export function drawPattern(
  ctx: CanvasRenderingContext2D,
  state: PatternState,
  extMult = 5,
  offsetX = 0,
  offsetY = 0,
) {
  if (!ctx.canvas.width || !ctx.canvas.height) return;
  const pat = PATTERNS.find(p => p.id === state.pattern);
  if (!pat) return;
  pat.draw(ctx, state, extMult, offsetX, offsetY);
}

export function getCSS(state: PatternState): string {
  const pat = PATTERNS.find(p => p.id === state.pattern);
  return pat ? pat.css(state) : `background-color: ${state.bgColor};`;
}

export function getBgCSS(state: PatternState): string {
  return `background-color: ${state.bgColor};`;
}

export function getImgCSS(state: PatternState): string {
  const lines = getCSS(state).split('\n').filter(l =>
    l.includes('background-image') ||
    l.includes('background-size') ||
    l.includes('background-repeat') ||
    l.includes('background-position'),
  );
  return lines.length ? lines.join('\n') : '/* no image for this pattern */';
}

// ── CSS-animatable patterns ────────────────────────────────────────────
// All patterns with CSS background-image output can animate via background-position.
// SVG url() patterns (hex, waves) work too — browser tiles them seamlessly.
export const CSS_ANIMATABLE = new Set([
  'dots', 'grid', 'rect', 'diagonal', 'hatch', 'carbon', 'halftone', 'plus',
  'checker', 'waves',
]);

// Extract animatable CSS properties from a pattern.
// tileW/tileH = exact background-size in px — this is what GSAP animates by.
export function getAnimatableCSS(state: PatternState): {
  backgroundImage:    string;
  backgroundSize:     string;
  backgroundPosition: string;
  tileW:              number;
  tileH:              number;
} | null {
  if (!CSS_ANIMATABLE.has(state.pattern)) return null;
  const pat = PATTERNS.find(p => p.id === state.pattern);
  if (!pat) return null;

  const raw   = pat.css(state);
  const lines = raw.split('\n');

  const imgLine  = lines.find(l => l.startsWith('background-image:'));
  const sizeLine = lines.find(l => l.startsWith('background-size:'));
  const posLine  = lines.find(l => l.startsWith('background-position:'));

  if (!imgLine || !sizeLine) return null;

  const sizeStr = sizeLine.replace('background-size:', '').replace(/;$/, '').trim();
  // Parse "WIDTHpx HEIGHTpx" — take first background-size value
  const firstSize = sizeStr.split(',')[0].trim();
  const [wStr, hStr] = firstSize.split(/\s+/);
  const tileW = parseFloat(wStr) || state.size;
  const tileH = parseFloat(hStr ?? wStr) || state.size;

  return {
    backgroundImage:    imgLine.replace('background-image:', '').replace(/;$/, '').trim(),
    backgroundSize:     sizeStr,
    backgroundPosition: posLine
      ? posLine.replace('background-position:', '').replace(/;$/, '').trim()
      : '0px 0px',
    tileW,
    tileH,
  };
}
