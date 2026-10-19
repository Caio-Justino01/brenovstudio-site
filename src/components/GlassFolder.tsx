import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { PreviewMedia } from '../config/site';
import { createFrameResizeObserver } from '../lib/frameResizeObserver';
import { LiquidSurface } from './ui/liquid-glass';
import './glass-folder.css';

// Panel geometry adapted from Glass Folder Cards, supplied by the user.
const BACK = 'M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z';
const FRONT = 'M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 176A22 22 0 0 1 318 198L22 198A22 22 0 0 1 0 176Z';

export function GlassFolder({ items, active, trackVisibility }: { items: readonly PreviewMedia[]; active: boolean; trackVisibility: boolean }) {
  const fit = useRef<HTMLDivElement>(null), object = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const uid = useId().replace(/:/g, '');
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!active) { setEntered(false); return; }
    if (!trackVisibility) { setEntered(true); return; }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setEntered(true); }, { threshold: .2 });
    if (object.current) observer.observe(object.current);
    return () => observer.disconnect();
  }, [active, trackVisibility]);
  useLayoutEffect(() => {
    const measure = () => {
      if (!fit.current || !object.current) return;
      const width = Math.max(1, Math.min(500, fit.current.clientWidth * (items.length > 1 ? .72 : .8), fit.current.clientHeight * .9));
      const scale = String(width / 340);
      if (object.current.style.getPropertyValue('--folder-scale') !== scale) object.current.style.setProperty('--folder-scale', scale);
    };
    const observer = createFrameResizeObserver(measure);
    if (fit.current) observer.observe(fit.current);
    measure(); return () => observer.disconnect();
  }, [items.length]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return (
    <div className="glass-folder-fit" ref={fit} aria-hidden={items.some(item => item.logo) ? undefined : true}>
      <div className="glass-folder" ref={object} data-entered={entered && active || undefined}
        onPointerMove={(event) => {
          if (event.pointerType !== 'mouse') return;
          const box = event.currentTarget.getBoundingClientRect();
          const x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
          const y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
          cancelAnimationFrame(frame.current);
          frame.current = requestAnimationFrame(() => {
            object.current?.style.setProperty('--folder-x', String(x));
            object.current?.style.setProperty('--folder-y', String(y));
          });
        }}
        onPointerLeave={() => {
          cancelAnimationFrame(frame.current);
          object.current?.style.setProperty('--folder-x', '0'); object.current?.style.setProperty('--folder-y', '0');
        }}>
        <div className="folder-model"><div className="folder-tilt">
          <div className="folder-ground" aria-hidden="true" />
          <div className="folder-back-wrap">
            <div className="folder-back" style={{ clipPath: `path('${BACK}')` }} />
            <svg className="folder-back-rim" viewBox="0 0 340 272" aria-hidden="true"><path d={BACK} /></svg>
          </div>
          <div className="folder-files">
            {items.slice(0, 4).map((item, index, visible) => <figure className="folder-photo" key={item.media.src}
              data-portrait={item.portrait || undefined}
              data-logo={item.logo || undefined}
              style={{ '--file-slot': visible.length <= 1 ? 0 : index / (visible.length - 1) * 2 - 1,
                '--file-depth': visible.length - 1 - index, zIndex: index + 1 } as CSSProperties}>
              <img src={item.closedSrc ?? item.media.src} alt={item.logo ? item.media.alt : ''} width={item.media.width} height={item.media.height} draggable={false} decoding="async" />
              {!item.portrait && !item.logo && <figcaption>{item.title}</figcaption>}
            </figure>)}
          </div>
          <div className="folder-front-wrap"><div className="folder-front" style={{ clipPath: `path('${FRONT}')` }}>
            <div className="folder-shine" />
            <svg className="folder-front-rim" viewBox="0 0 340 198" aria-hidden="true"><defs>
              <linearGradient id={`folder-rim-${uid}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#eceff1" stopOpacity=".6" />
                <stop offset=".45" stopColor="#eceff1" stopOpacity=".35" />
                <stop offset=".7" stopColor="#a5abb2" stopOpacity=".35" />
                <stop offset="1" stopColor="#389dd3" stopOpacity=".85" />
              </linearGradient>
            </defs><path d={FRONT} stroke={`url(#folder-rim-${uid})`} /></svg>
            <LiquidSurface className="folder-open" aria-hidden="true">Abrir</LiquidSurface>
          </div></div>
        </div></div>
      </div>
    </div>
  );
}
