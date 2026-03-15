import type { Preset } from './types';

export const PRESETS: Preset[] = [
  { name: 'dark noise',  accent: '#444444', state: { pattern:'noise',    bgColor:'#0a0a0a', patColor:'#ffffff', size:20, opacity:12, thickness:1, rotation:0 } },
  { name: 'blueprint',   accent: '#4488ff', state: { pattern:'grid',     bgColor:'#0d1b2a', patColor:'#4488ff', size:24, opacity:30, thickness:1, rotation:0 } },
  { name: 'graph paper', accent: '#aaaacc', state: { pattern:'grid',     bgColor:'#f5f5f0', patColor:'#aaaacc', size:20, opacity:60, thickness:1, rotation:0 } },
  { name: 'carbon',      accent: '#555555', state: { pattern:'carbon',   bgColor:'#111111', patColor:'#cccccc', size:8,  opacity:80, thickness:1, rotation:0 } },
  { name: 'neon dots',   accent: '#c8ff00', state: { pattern:'dots',     bgColor:'#0d0d0d', patColor:'#c8ff00', size:18, opacity:40, thickness:2, rotation:0 } },
  { name: 'hextech',     accent: '#00ccff', state: { pattern:'hex',      bgColor:'#050a10', patColor:'#00ccff', size:22, opacity:35, thickness:1, rotation:0 } },
  { name: 'terminal',    accent: '#00ff41', state: { pattern:'plus',     bgColor:'#0d1a0d', patColor:'#00ff41', size:20, opacity:30, thickness:1, rotation:0 } },
  { name: 'warm linen',  accent: '#c8a880', state: { pattern:'diagonal', bgColor:'#f0ebe1', patColor:'#c8a880', size:12, opacity:40, thickness:1, rotation:0 } },
  { name: 'halftone',    accent: '#888888', state: { pattern:'halftone', bgColor:'#1a1a1a', patColor:'#ffffff', size:16, opacity:60, thickness:4, rotation:0 } },
  { name: 'circuit',     accent: '#00ddaa', state: { pattern:'circuit',  bgColor:'#061010', patColor:'#00ddaa', size:24, opacity:50, thickness:1, rotation:0 } },
  { name: 'waves',       accent: '#8866ff', state: { pattern:'waves',    bgColor:'#08080f', patColor:'#8866ff', size:20, opacity:35, thickness:1, rotation:0 } },
  { name: 'crosshatch',  accent: '#555555', state: { pattern:'hatch',    bgColor:'#1a1a1a', patColor:'#ffffff', size:16, opacity:20, thickness:1, rotation:0 } },
];
