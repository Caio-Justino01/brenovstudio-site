import { useEffect, useRef, useState } from 'react';

export function SpaceBackdrop() {
  const host = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(mq.matches);
    mq.addEventListener('change', change); return () => mq.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (reduced) return;
    let cancelled = false, dispose: (() => void) | undefined;
    void import('../lib/spaceBackdrop').then(({ createSpaceBackdrop }) => {
      if (!cancelled && host.current) dispose = createSpaceBackdrop(host.current);
    }).catch((error) => { if (import.meta.env.DEV) console.warn('[BEMOV] Fundo estático:', error); });
    return () => { cancelled = true; dispose?.(); };
  }, [reduced]);
  return <div className="site-atmosphere" ref={host} aria-hidden="true" />;
}
