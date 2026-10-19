import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { portfolioShowcase, projects, services, type Project } from '../config/site';
import { gsap, ScrollTrigger, useGSAP } from '../lib/motion';
import { PortfolioCycle } from '../lib/portfolioCycle';
import { rebasePortfolioLayers } from '../lib/portfolioTransition';
import { ProjectImage } from './ProjectImage';
import { LiquidButton } from './ui/liquid-glass';
import { GlareText } from './ui/GlareText';
import './Portfolio.css';

const selection = portfolioShowcase.items.map(item => ({ ...item, project: projects.find(project => project.id === item.projectId)! }));
type ImageState = 'pending' | 'ready' | 'failed';

export function Portfolio() {
  const root = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cycle = useRef<PortfolioCycle | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const photographLayers = useRef<(HTMLDivElement | null)[]>([]);
  const photographOrder = useRef(selection.map((_, index) => index));
  const photographAnimation = useRef<Animation | null>(null);
  const photographGeneration = useRef(0);
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [images, setImages] = useState<ImageState[]>(() => selection.map(() => 'pending'));
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [selected, setSelected] = useState<Project | null>(null);
  const [index, setIndex] = useState(0);
  const media = selected?.media[index];

  useEffect(() => {
    const engine = new PortfolioCycle(selection.length, portfolioShowcase.intervalMs, portfolioShowcase.resumeMs, setActive, {
      schedule: (callback, delay) => window.setTimeout(callback, delay),
      cancel: handle => window.clearTimeout(handle as number),
    });
    cycle.current = engine;
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const preference = () => { setReduced(query.matches); engine.hold('reduced', query.matches); };
    const visibility = () => engine.hold('hidden', document.hidden);
    preference(); visibility();
    const observer = new IntersectionObserver(entries => {
      const onScreen = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .15);
      setVisible(onScreen); engine.hold('offscreen', !onScreen);
    }, { threshold: .15 });
    if (stage.current) observer.observe(stage.current);
    query.addEventListener('change', preference);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      engine.destroy(); cycle.current = null; observer.disconnect();
      query.removeEventListener('change', preference);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => { cycle.current?.hold('manual', paused); }, [paused]);
  useEffect(() => { cycle.current?.hold('dialog', selected !== null); }, [selected]);
  useEffect(() => { if (images[active] !== 'pending') setShown(active); }, [active, images]);

  useLayoutEffect(() => {
    const layers = photographLayers.current;
    const target = layers[shown];
    if (!target) return;
    const generation = ++photographGeneration.current;
    // Read the presented blend before cancelling an interrupted transition.
    const opacities = layers.map(layer => layer ? Number(getComputedStyle(layer).opacity) : 0);
    const rebased = rebasePortfolioLayers(photographOrder.current, opacities, shown);
    photographAnimation.current?.cancel(); photographAnimation.current = null;
    photographOrder.current = rebased.order;
    rebased.order.forEach((id, z) => {
      const layer = layers[id];
      if (layer) { layer.style.zIndex = String(z); layer.style.opacity = String(rebased.opacities[id]); }
    });
    const complete = () => {
      if (generation !== photographGeneration.current) return;
      layers.forEach((layer, i) => { if (layer) layer.style.opacity = i === shown ? '1' : '0'; });
      photographAnimation.current?.cancel(); photographAnimation.current = null;
    };
    if (reduced || rebased.opacities[shown] >= .9999 || typeof target.animate !== 'function') { complete(); return; }
    // Previous material remains underneath. Only the new top layer fades in.
    const animation = target.animate([{ opacity: rebased.opacities[shown] }, { opacity: 1 }], {
      duration: portfolioShowcase.transitionMs, easing: 'ease', fill: 'forwards',
    });
    photographAnimation.current = animation;
    animation.onfinish = complete;
  }, [shown, reduced]);
  useEffect(() => () => {
    photographGeneration.current++;
    photographAnimation.current?.cancel(); photographAnimation.current = null;
  }, []);

  const imageState = (item: number, status: ImageState) => setImages(previous => previous.map((value, i) => i === item ? status : value));
  const preview = (item: number) => cycle.current?.select(item);

  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
  }, [selected]);

  useGSAP(() => {
    const motion = gsap.matchMedia();
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('#portfolio-title', { opacity: 0, duration: .6, ease: 'power1.out',
        scrollTrigger: { trigger: '#portfolio-title', start: 'top 92%', once: true } });
      let active = true;
      void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh(); });
      return () => { active = false; };
    });
    return () => motion.revert();
  }, { scope: root });

  const close = () => dialog.current?.close();
  const open = (project: Project, button: HTMLButtonElement) => {
    opener.current = button; cycle.current?.hold('dialog', true); setIndex(0); setSelected(project);
  };
  const closed = () => {
    setSelected(null);
    opener.current?.focus({ preventScroll: true });
  };
  const keydown = (event: KeyboardEvent) => {
    if (!selected || event.target instanceof HTMLVideoElement) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); setIndex(i => Math.min(i + 1, selected.media.length - 1)); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
  };

  return (
    <section id="portfolio" ref={root} className="portfolio section-space" aria-labelledby="portfolio-title" tabIndex={-1}>
      <h2 id="portfolio-title" className="section-title"><GlareText text={portfolioShowcase.title} /></h2>
      <div ref={stage} className="portfolio-stage" data-reduced={reduced || undefined}
        style={{ '--portfolio-transition': `${portfolioShowcase.transitionMs}ms` } as CSSProperties}>
        <div className="portfolio-stage__photographs" aria-hidden="true">
          {selection.map((item, i) => <div key={item.projectId} ref={element => { photographLayers.current[i] = element; }}
            className="portfolio-stage__frame" data-active={shown === i || undefined}
            style={{ '--photo-position': item.position, '--photo-mobile-position': item.mobilePosition,
              opacity: i === 0 ? 1 : 0, zIndex: i } as CSSProperties}>
            <img src={item.project.cover.src} alt="" width={item.project.cover.width} height={item.project.cover.height}
              loading={visible ? 'eager' : 'lazy'} decoding="async" onLoad={() => imageState(i, 'ready')} onError={() => imageState(i, 'failed')}
              style={{ visibility: images[i] === 'ready' ? 'visible' : 'hidden' }} />
            {images[i] === 'failed' && <span className="portfolio-stage__unavailable">{portfolioShowcase.unavailableLabel}</span>}
          </div>)}
        </div>
        <div className="portfolio-stage__grain" aria-hidden="true" />
        <ul className="portfolio-list" aria-label="Projetos selecionados"
          onPointerLeave={() => cycle.current?.hold('pointer', false)}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) cycle.current?.hold('focus', false); }}>
          {selection.map(({ project }, i) => <li key={project.id}>
            <button className="portfolio-project" type="button" data-active={shown === i || undefined}
              aria-label={`Abrir projeto ${project.title}`} aria-haspopup="dialog"
              onPointerEnter={event => { if (event.pointerType !== 'touch') { cycle.current?.hold('pointer', true); preview(i); } }}
              onFocus={() => { cycle.current?.hold('focus', true); preview(i); }}
              onClick={event => { preview(i); open(project, event.currentTarget); }}>
              <span className="portfolio-project__thumbnail" aria-hidden="true"><ProjectImage media={project.cover} /></span>
              <span className="portfolio-project__name">{project.title}</span>
              <span className="portfolio-project__format">{project.format}</span>
              <span className="portfolio-project__action">{portfolioShowcase.openLabel}</span>
            </button>
          </li>)}
        </ul>
        {!reduced && <LiquidButton className="portfolio-playback" type="button" aria-pressed={paused}
          onClick={() => setPaused(value => !value)}>{paused ? portfolioShowcase.resumeLabel : portfolioShowcase.pauseLabel}</LiquidButton>}
      </div>

      <dialog ref={dialog} className="studio-glass project-dialog" aria-labelledby="project-dialog-title" onKeyDown={keydown}
        onClose={closed} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
        {selected && media && <div className="project-dialog__inner">
          <div className="project-dialog__top"><h2 id="project-dialog-title">{selected.title}</h2><LiquidButton type="button" onClick={close} autoFocus>Fechar projeto</LiquidButton></div>
          <figure className="project-dialog__figure">
            {media.kind === 'video' ? <video key={media.src} controls playsInline preload="metadata" poster={media.poster} aria-label={media.alt}>
              <source src={media.src} /><p>Veja o vídeo na publicação original.</p>
            </video> : <ProjectImage key={media.src} media={media} eager />}
          </figure>
          {selected.media.length > 1 && <div className="project-dialog__controls">
            <LiquidButton type="button" onClick={() => setIndex(i => i - 1)} disabled={index === 0}>Anterior</LiquidButton>
            <p aria-live="polite" aria-atomic="true">{index + 1} de {selected.media.length}</p>
            <LiquidButton type="button" onClick={() => setIndex(i => i + 1)} disabled={index === selected.media.length - 1}>Próxima</LiquidButton>
          </div>}
          <div className="project-dialog__details">
            <p>{selected.services.length ? selected.services.map(id => services.find(service => service.id === id)?.label).join(' / ') : selected.format}</p>
            <p>{selected.credits}</p>
            {selected.sourceUrl && <a className="text-link" href={selected.sourceUrl} target="_blank" rel="noreferrer">
              {selected.format === 'Vídeo' ? 'Ver vídeo no Instagram' : 'Ver publicação original'}
            </a>}
          </div>
        </div>}
      </dialog>
    </section>
  );
}
