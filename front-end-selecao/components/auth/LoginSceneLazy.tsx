'use client';

import dynamic from 'next/dynamic';

// Three.js só carrega no cliente.
const LoginScene = dynamic(() => import('./LoginScene'), { ssr: false });

export default function LoginSceneLazy() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.18),transparent_55%)]" aria-hidden="true" />
      <LoginScene />
    </>
  );
}
