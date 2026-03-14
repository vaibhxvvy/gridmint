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
) {
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.translate((-W * extMult) / 2, (-H * extMult) / 2);
}

// ── pattern definitions ──────────────────────────────────────────────
export const PATTERNS: Pattern[] = [
  // ── NOISE ──
  {
    id: 'noise', name: 'Noise',
    draw(ctx, { patColor, opacity }) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      if (!W || !H) return; // guard against zero dimensions
      const [r, g, b] = hexToRgb(patColor);
      const a = opacity / 100;
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const oc = off.getContext('2d')!;
      const id = oc.createImageData(W, H);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (Math.random() < a) {
          const br = Math.random();
          d[i] = r * br; d[i + 1] = g * br; d[i + 2] = b * br;
          d[i + 3] = Math.round(255 * Math.min(a * 2.5, 1));
        }
      }
      oc.putImageData(id, 0, 0);
      ctx.drawImage(off, 0, 0);
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
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult);
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
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult);
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
    id: 'rect', name: 'Rect',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult);
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
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5) {
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
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult);
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
    draw(ctx, { patColor, opacity, size, rotation }, extMult = 5) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult);
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
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult);
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
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult);
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

  // ── HEX ──
  {
    id: 'hex', name: 'Hex',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult);
      ctx.strokeStyle = `rgba(${r},${g},${b},${opacity / 100})`; ctx.lineWidth = thickness;
      const hh = size * Math.sqrt(3) / 2, ext = Math.max(W, H) * extMult;
      const rows = Math.ceil(ext / (hh * 2)) + 3, cols = Math.ceil(ext / (size * 1.5)) + 3;
      for (let row = -1; row < rows; row++)
        for (let c2 = -1; c2 < cols; c2++) {
          const cx = c2 * size * 1.5, cy = row * hh * 2 + (c2 % 2 === 0 ? 0 : hh);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const ang = (Math.PI / 180) * (60 * i - 30);
            i === 0 ? ctx.moveTo(cx + size * Math.cos(ang), cy + size * Math.sin(ang))
                    : ctx.lineTo(cx + size * Math.cos(ang), cy + size * Math.sin(ang));
          }
          ctx.closePath(); ctx.stroke();
        }
      ctx.restore();
    },
    css({ bgColor, patColor, opacity, size, thickness, rotation }) {
      const [r, g, b] = hexToRgb(patColor);
      const a = (opacity / 100).toFixed(2);
      const sw = Math.round(size * 3), sh = Math.round(size * Math.sqrt(3));
      const rotLine = rotation ? `\ntransform: rotate(${rotation}deg);` : '';
      return `background-color: ${bgColor};\nbackground-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${sw}' height='${sh}'%3E%3Cpolygon points='${size},0 ${size * 1.5},${Math.round(size * Math.sqrt(3) / 2)} ${size},${sh} ${size * 0.5},${Math.round(size * Math.sqrt(3) / 2)}' fill='none' stroke='rgba(${r}%2C${g}%2C${b}%2C${a})' stroke-width='${thickness}'/%3E%3C/svg%3E");\nbackground-size: ${sw}px ${sh}px;${rotLine}`;
    },
  },

  // ── WAVES ──
  {
    id: 'waves', name: 'Waves',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult);
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
      return `background-color: ${bgColor};\nbackground-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size * 6}' height='${size}'%3E%3Cpath d='M 0 ${Math.round(size * 0.5)} Q ${Math.round(size * 1.5)} 0 ${size * 3} ${Math.round(size * 0.5)} Q ${Math.round(size * 4.5)} ${size} ${size * 6} ${Math.round(size * 0.5)}' fill='none' stroke='rgba(${r}%2C${g}%2C${b}%2C${a})' stroke-width='${thickness}'/%3E%3C/svg%3E");\nbackground-size: ${size * 6}px ${size}px;${rotLine}`;
    },
  },

  // ── CIRCUIT ──
  {
    id: 'circuit', name: 'Circuit',
    draw(ctx, { patColor, opacity, size, thickness, rotation }, extMult = 5) {
      const W = ctx.canvas.width, H = ctx.canvas.height;
      const [r, g, b] = hexToRgb(patColor);
      drawSetup(ctx, rotation, W, H, extMult);
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
    css({ bgColor }) {
      return `/* Circuit is canvas-rendered — export as PNG for best fidelity */\nbackground-color: ${bgColor};`;
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
) {
  if (!ctx.canvas.width || !ctx.canvas.height) return; // never draw on unsized canvas
  const pat = PATTERNS.find(p => p.id === state.pattern);
  if (!pat) return;
  pat.draw(ctx, state, extMult);
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
