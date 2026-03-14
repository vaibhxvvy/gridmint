import type { PatternState } from '@/types/pattern';
import { getCSS } from './patterns/engine';

export type OutputFormat = 'css' | 'scss' | 'tailwind' | 'react' | 'nextjs' | 'tsx';

export function generateCode(state: PatternState, format: OutputFormat): string {
  const css = getCSS(state);
  const lines = css.split('\n');

  const bgColor  = lines.find(l => l.startsWith('background-color'))?.trim().replace(/;$/, '').split(': ')[1] ?? state.bgColor;
  const bgImage  = lines.find(l => l.startsWith('background-image'))?.trim() ?? '';
  const bgSize   = lines.find(l => l.startsWith('background-size'))?.trim() ?? '';
  const bgPos    = lines.find(l => l.startsWith('background-position'))?.trim() ?? '';
  const bgRepeat = lines.find(l => l.startsWith('background-repeat'))?.trim() ?? '';
  const transform = lines.find(l => l.startsWith('transform'))?.trim() ?? '';

  switch (format) {
    case 'css':
      return `.bg-pattern {\n  ${css.split('\n').join('\n  ')}\n}`;

    case 'scss':
      return `.bg-pattern {\n  ${css.split('\n').join('\n  ')}\n\n  // Nested usage\n  &.overlay {\n    position: relative;\n    z-index: 0;\n  }\n}`;

    case 'tailwind': {
      // Tailwind arbitrary value classes
      const parts: string[] = [`bg-[${state.bgColor}]`];
      if (bgImage) {
        const imgVal = bgImage.replace('background-image: ', '').replace(/;$/, '');
        parts.push(`bg-[image:${imgVal}]`);
      }
      if (bgSize) {
        const szVal = bgSize.replace('background-size: ', '').replace(/;$/, '');
        parts.push(`bg-[size:${szVal}]`);
      }
      return `{/* Tailwind arbitrary values */}\n<div\n  className="${parts.join(' ')}"\n/>\n\n{/* Or in tailwind.config.js extend.backgroundImage: */}\n// 'gridbox-pattern': \`${bgImage.replace('background-image: ', '').replace(/;$/, '')}\``;
    }

    case 'react': {
      const styleObj: Record<string, string> = {
        backgroundColor: state.bgColor,
      };
      if (bgImage) styleObj.backgroundImage = bgImage.replace('background-image: ', '').replace(/;$/, '');
      if (bgSize)  styleObj.backgroundSize  = bgSize.replace('background-size: ', '').replace(/;$/, '');
      if (bgPos)   styleObj.backgroundPosition = bgPos.replace('background-position: ', '').replace(/;$/, '');
      if (bgRepeat) styleObj.backgroundRepeat = bgRepeat.replace('background-repeat: ', '').replace(/;$/, '');
      if (transform) styleObj.transform = transform.replace('transform: ', '').replace(/;$/, '');

      const styleStr = Object.entries(styleObj)
        .map(([k, v]) => `    ${k}: '${v}',`)
        .join('\n');

      return `const bgStyle = {\n${styleStr}\n};\n\nexport function Background({ children }) {\n  return (\n    <div style={bgStyle}>\n      {children}\n    </div>\n  );\n}`;
    }

    case 'nextjs':
      return `// app/components/GridboxBackground.jsx\nimport styles from './GridboxBackground.module.css';\n\nexport default function GridboxBackground({ children, className = '' }) {\n  return (\n    <div className={\`\${styles.pattern} \${className}\`}>\n      {children}\n    </div>\n  );\n}\n\n// GridboxBackground.module.css\n.pattern {\n  ${css.split('\n').join('\n  ')}\n}`;

    case 'tsx': {
      const styleObj: Record<string, string> = {
        backgroundColor: state.bgColor,
      };
      if (bgImage) styleObj.backgroundImage = bgImage.replace('background-image: ', '').replace(/;$/, '');
      if (bgSize)  styleObj.backgroundSize  = bgSize.replace('background-size: ', '').replace(/;$/, '');
      if (bgPos)   styleObj.backgroundPosition = bgPos.replace('background-position: ', '').replace(/;$/, '');
      if (bgRepeat) styleObj.backgroundRepeat = bgRepeat.replace('background-repeat: ', '').replace(/;$/, '');
      if (transform) styleObj.transform = transform.replace('transform: ', '').replace(/;$/, '');

      const styleStr = Object.entries(styleObj)
        .map(([k, v]) => `    ${k}: '${v}',`)
        .join('\n');

      return `import React, { CSSProperties } from 'react';\n\nconst patternStyle: CSSProperties = {\n${styleStr}\n};\n\ninterface Props {\n  children?: React.ReactNode;\n  className?: string;\n  style?: CSSProperties;\n}\n\nexport const GridboxPattern: React.FC<Props> = ({ children, className, style }) => (\n  <div\n    style={{ ...patternStyle, ...style }}\n    className={className}\n  >\n    {children}\n  </div>\n);\n\nexport default GridboxPattern;`;
    }

    default:
      return css;
  }
}
