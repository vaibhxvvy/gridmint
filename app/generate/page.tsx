'use client';

import dynamic from 'next/dynamic';

const GeneratorApp = dynamic(() => import('./GeneratorApp'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace', fontSize: '11px',
      color: '#606060', letterSpacing: '0.15em',
    }}>
      loading gridbox...
    </div>
  ),
});

export default function GeneratorPage() {
  return <GeneratorApp />;
}
