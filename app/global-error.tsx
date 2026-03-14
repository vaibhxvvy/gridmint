'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Gridbox error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: '#0a0a0a', color: '#f0f0f0', fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px', textAlign: 'center', padding: '20px' }}>
        <div style={{ color: '#c8ff00', fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>gridbox</div>
        <div style={{ fontSize: '12px', color: '#606060', maxWidth: '400px', lineHeight: '1.6' }}>
          something went wrong loading the app.<br />
          {error?.message && <span style={{ color: '#ff5555' }}>{error.message}</span>}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={reset}
            style={{ fontFamily: 'monospace', fontSize: '10px', padding: '8px 16px', border: '1px solid #c8ff00', background: 'transparent', color: '#c8ff00', cursor: 'pointer', borderRadius: '4px', letterSpacing: '0.08em' }}
          >
            try again
          </button>
          <Link
            href="/"
            style={{ fontFamily: 'monospace', fontSize: '10px', padding: '8px 16px', border: '1px solid #2c2c2c', background: 'transparent', color: '#999', textDecoration: 'none', borderRadius: '4px', letterSpacing: '0.08em' }}
          >
            go home
          </Link>
        </div>
      </body>
    </html>
  );
}
