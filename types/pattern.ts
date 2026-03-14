export interface PatternState {
  pattern:   string;
  bgColor:   string;
  patColor:  string;
  size:      number;
  opacity:   number;
  thickness: number;
  rotation:  number;
}

export interface Pattern {
  id:   string;
  name: string;
  /** extMult: 5 for full preview, 2 for thumbnails (less work = no lag) */
  draw: (ctx: CanvasRenderingContext2D, s: PatternState, extMult?: number) => void;
  css:  (s: PatternState) => string;
}

export interface Preset {
  name:   string;
  accent: string;
  state:  PatternState;
}
