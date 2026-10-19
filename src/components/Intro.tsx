import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { services, site } from '../config/site';
import { ParticleLogo } from './ParticleLogo';
import { LiquidLink } from './ui/liquid-glass';
import { GlareText } from './ui/GlareText';
import type { ParticleController } from '../lib/particleScene';
import type { OpeningMode } from '../lib/opening';
import type { IndexEntry } from '../lib/indexMotion';
import { runIndexExit } from '../lib/exitTransition';

type Props = {
  openingMode: OpeningMode;
  onFormationComplete: () => void;
  onBypass: () => void;
  onEnterIndex: (focus?: boolean) => void;
  onIndexTransition: (entry: IndexEntry) => void;
};

export function Intro({ openingMode, onFormationComplete, onBypass, onEnterIndex, onIndexTransition }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const controller = useRef<ParticleController | null>(null);
  const entering = useRef(false);
  const mounted = useRef(true);
  const pointerProbe = useRef({ events: 0, hover: 0, pressed: 0 });
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [status, setStatus] = useState<'loading' | 'ready' | 'static'>(() => reducedMotion ? 'static' : 'loading');
  const [leaving, setLeaving] = useState(false);
  const onStatus = useCallback((next: 'ready' | 'static') => {
    setStatus(next);
    if (next === 'static') onBypass();
  }, [onBypass]);

  useEffect(() => {
    if (!leaving) return;
    const cancel = () => {
      entering.current = false; setLeaving(false); onIndexTransition('idle'); controller.current?.restore();
    };
    const key = (event: KeyboardEvent) => { if (['Escape', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Tab'].includes(event.key)) cancel(); };
    const anchor = (event: globalThis.MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a[href]') && !event.target.closest('.experience-link')) cancel();
    };
    window.addEventListener('wheel', cancel, { passive: true }); window.addEventListener('touchmove', cancel, { passive: true });
    window.addEventListener('keydown', key); window.addEventListener('hashchange', cancel); window.addEventListener('popstate', cancel);
    document.addEventListener('click', anchor, true);
    return () => {
      window.removeEventListener('wheel', cancel); window.removeEventListener('touchmove', cancel); window.removeEventListener('keydown', key);
      window.removeEventListener('hashchange', cancel); window.removeEventListener('popstate', cancel); document.removeEventListener('click', anchor, true);
    };
  }, [leaving, onIndexTransition]);

  useEffect(() => {
    mounted.current = true;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { setReducedMotion(media.matches); setStatus(media.matches ? 'static' : 'loading'); };
    const returnToIntro = () => {
      if (window.location.hash && window.location.hash !== '#inicio') return;
      entering.current = false;
      setLeaving(false);
      onBypass();
      controller.current?.restore();
    };
    media.addEventListener('change', change);
    window.addEventListener('hashchange', returnToIntro);
    return () => {
      mounted.current = false;
      media.removeEventListener('change', change);
      window.removeEventListener('hashchange', returnToIntro);
    };
  }, [onBypass]);

  const isControl = (target: EventTarget) => target instanceof Element && Boolean(target.closest('a, button:not([data-logo-trigger])'));
  const enter = async (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (entering.current) return;
    entering.current = true;
    if (controller.current && !reducedMotion) {
      setLeaving(true);
      onIndexTransition('hold');
      await runIndexExit(controller.current.burst, () => mounted.current && entering.current,
        () => onEnterIndex(false), () => onIndexTransition('reveal'));
    } else {
      onEnterIndex();
    }
    if (!mounted.current || !entering.current) return;
    entering.current = false;
    setLeaving(false);
  };

  return (
    <section id="inicio" className="intro" aria-label="Apresentação" data-scene={status} data-leaving={leaving || undefined}
      onPointerUp={(event) => { if (event.pointerType !== 'mouse') controller.current?.pointer(event.clientX, event.clientY, false); }}
      onPointerCancel={(event) => controller.current?.pointer(event.clientX, event.clientY, false)}
      onPointerMove={(event) => {
        if (import.meta.env.DEV && host.current) {
          const probe = pointerProbe.current;
          probe.events++;
          if (event.buttons === 0) probe.hover++; else probe.pressed++;
          host.current.dataset.pointerInput = JSON.stringify({ ...probe, x: event.clientX, y: event.clientY,
            buttons: event.buttons, type: event.pointerType, primary: event.isPrimary, trusted: event.isTrusted,
            control: isControl(event.target), controller: Boolean(controller.current), entering: entering.current });
        }
        if (!event.isPrimary || entering.current) return;
        controller.current?.pointer(event.clientX, event.clientY, event.pointerType === 'mouse' && !isControl(event.target));
      }}
      onPointerLeave={(event) => controller.current?.pointer(event.clientX, event.clientY, false)}>
      <div className="intro__particles" ref={host} aria-hidden="true" />
      <ParticleLogo host={host} image={image} controller={controller} reducedMotion={reducedMotion} opening={openingMode === 'hidden'}
        onStatus={onStatus} onFormationComplete={onFormationComplete} />
      <img
        ref={image}
        className="intro__logo"
        src={site.logo}
        alt="Logo do estúdio de Breno em textura azul gelo"
        width="3000"
        height="3000"
        fetchPriority="high"
      />
      <button type="button" className="intro__logo-trigger" data-logo-trigger aria-label="Iniciar experiência pela logo"
        disabled={leaving} data-intro-ui={openingMode} aria-busy={leaving || undefined} onClick={enter} />
      <div className="intro__bottom" data-intro-ui={openingMode} inert={openingMode === 'hidden'} aria-hidden={openingMode === 'hidden' || undefined}>
        <div className="intro__identity">
          <h1 className="intro__name"><span><GlareText text={site.name} active={openingMode !== 'hidden' && !leaving} /></span></h1>
          <div className="intro__services" aria-label="Serviços de Breno">
            <p className="intro__services-title">Serviços</p>
            <ul>{services.map((service) => <li key={service.id}>{service.shortLabel}</li>)}</ul>
          </div>
        </div>
        <LiquidLink className="experience-link" href="#indice" onClick={enter} aria-busy={leaving || undefined} aria-disabled={leaving || undefined}>
          <span>Iniciar experiência</span>
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 5v22M6 17l10 10 10-10" stroke="currentColor" strokeWidth="1.8" /></svg>
        </LiquidLink>
      </div>
    </section>
  );
}
