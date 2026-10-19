import { useCallback, useEffect, useRef, useState } from 'react';
import { sections, type ServiceId } from '../config/site';
import { gsap, ScrollTrigger, useGSAP } from '../lib/motion';
import { captureIndexProgress, indexLayout, previewAt, previewStops, restoreIndexPosition, sameIndexMetrics, stableIndexMetrics, type IndexEntry, type IndexMetrics, type IndexProgress } from '../lib/indexMotion';
import { alignIndex } from '../lib/navigation';
import { GlassFolder } from './GlassFolder';
import { LiquidButton } from './ui/liquid-glass';
import { ProductionWindow } from './ProductionWindow';
import { GlareText } from './ui/GlareText';
import { syncScrollProgress } from '../lib/scrollSync';
import { sceneViewportHeight } from '../lib/sceneViewport';

type Props = { entry: IndexEntry; onEntryComplete: () => void; selectedServices: readonly ServiceId[]; onToggleService: (id: ServiceId) => void; alignInitialSection: boolean };
export function Contents({ entry, onEntryComplete, selectedServices, onToggleService, alignInitialSection }: Props) {
  const root = useRef<HTMLElement>(null), stage = useRef<HTMLDivElement>(null);
  const scroll = useRef<ScrollTrigger | null>(null);
  const activeRef = useRef(0);
  const initialAligned = useRef(false);
  const rebuilding = useRef(false), revision = useRef(0), navigationUntil = useRef(0);
  const transfer = useRef<(IndexProgress & { revision: number }) | null>(null);
  const [active, setActive] = useState(0);
  const [titlesReady, setTitlesReady] = useState(entry === 'idle');
  const [viewport, setViewport] = useState<IndexMetrics>({ width: innerWidth, height: innerHeight, header: 76, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, contentHeight: 560 });
  const measured = useRef(viewport);
  const layout = indexLayout(viewport.width, viewport.height, viewport.header, viewport.reduced, viewport.contentHeight);
  const activate = useCallback((index: number) => {
    if (activeRef.current !== index) { activeRef.current = index; setActive(index); }
  }, []);
  const capture = useCallback(() => {
    const trigger = scroll.current;
    if (!trigger || performance.now() < navigationUntil.current) return null;
    const progress = captureIndexProgress(trigger.start, trigger.end, scrollY, trigger.animation?.progress() ?? trigger.progress);
    return progress ? { ...progress, revision: revision.current } : null;
  }, []);
  const restore = useCallback((saved: (IndexProgress & { revision: number }) | null) => {
    const trigger = scroll.current;
    if (!saved || !trigger || saved.revision !== revision.current || performance.now() < navigationUntil.current) return;
    const wasRebuilding = rebuilding.current; rebuilding.current = true;
    window.scrollTo({ top: restoreIndexPosition(saved, trigger.start, trigger.end), behavior: 'instant' });
    syncScrollProgress(trigger, () => ScrollTrigger.update());
    trigger.animation?.progress(saved.visualProgress, true);
    // Resume any scrub from the preserved image instead of its newly constructed first frame.
    trigger.getTween()?.invalidate().restart();
    rebuilding.current = wasRebuilding;
    activate(previewAt(saved.visualProgress));
  }, [activate]);
  useEffect(() => {
    if (entry === 'hold') setTitlesReady(false);
    if (entry === 'idle') setTitlesReady(true);
  }, [entry]);
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const top = root.current?.querySelector<HTMLElement>('.index-top');
    const card = root.current?.querySelector<HTMLElement>('.production-window');
    const copy = root.current?.querySelector<HTMLElement>('.index-preview--production .index-copy');
    const entryElement = root.current?.querySelector<HTMLElement>('.index-entry');
    const preview = copy?.parentElement;
    const header = document.querySelector('.site-header');
    let alive = true, measureFrame = 0, fontFrame = 0;
    const measure = () => {
      measureFrame = 0;
      if (!alive) return;
      let contentHeight = measured.current.contentHeight;
      if (top && card && copy && entryElement && preview) {
        const gap = parseFloat(getComputedStyle(entryElement).rowGap) || 0;
        const content = innerWidth >= 1024 ? Math.max(card.offsetHeight, copy.offsetHeight)
          : card.offsetHeight + copy.offsetHeight + (parseFloat(getComputedStyle(preview).rowGap) || 0);
        contentHeight = top.offsetHeight + gap + content + 8;
      }
      const previous = measured.current;
      const next = stableIndexMetrics({ width: innerWidth, height: sceneViewportHeight(root.current, innerHeight), header: header?.getBoundingClientRect().bottom ?? 76, reduced: mq.matches, contentHeight }, previous);
      if (sameIndexMetrics(previous, next)) return;
      const nextLayout = indexLayout(next.width, next.height, next.header, next.reduced, next.contentHeight);
      const oldLayout = indexLayout(previous.width, previous.height, previous.header, previous.reduced, previous.contentHeight);
      const changesPin = previous.width !== next.width || previous.height !== next.height || previous.header !== next.header || previous.reduced !== next.reduced || oldLayout.pinned !== nextLayout.pinned;
      transfer.current = changesPin && oldLayout.pinned && nextLayout.pinned ? capture() : null;
      measured.current = next;
      setViewport(next);
    };
    const scheduleMeasure = () => { if (!measureFrame) measureFrame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(scheduleMeasure);
    [header, top, card, copy, root.current?.querySelector('.scene-viewport-measure')].forEach(element => { if (element) observer.observe(element); });
    const interacted = () => { initialAligned.current = true; revision.current++; transfer.current = null; navigationUntil.current = 0; };
    const navigation = () => { interacted(); navigationUntil.current = performance.now() + 1500; };
    const anchor = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a[href^="#"]') && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) navigation();
    };
    addEventListener('resize', scheduleMeasure); mq.addEventListener('change', scheduleMeasure); scheduleMeasure();
    for (const event of ['wheel', 'touchmove', 'pointerdown', 'keydown']) addEventListener(event, interacted, { passive: true });
    addEventListener('hashchange', navigation); addEventListener('popstate', navigation);
    document.addEventListener('click', anchor, true);
    // Register once per mount. Font completion must never replay a late initial navigation.
    void document.fonts.ready.then(() => {
      if (!alive) return;
      scheduleMeasure();
      fontFrame = requestAnimationFrame(() => {
        fontFrame = requestAnimationFrame(() => {
          if (!alive) return;
          const saved = capture();
          rebuilding.current = true; ScrollTrigger.sort(); ScrollTrigger.refresh(); restore(saved); rebuilding.current = false;
          if (!initialAligned.current) { initialAligned.current = true; if (alignInitialSection && location.hash === '#indice') alignIndex(); }
        });
      });
    });
    return () => {
      alive = false; cancelAnimationFrame(measureFrame); cancelAnimationFrame(fontFrame);
      observer.disconnect(); removeEventListener('resize', scheduleMeasure); mq.removeEventListener('change', scheduleMeasure);
      for (const event of ['wheel', 'touchmove', 'pointerdown', 'keydown']) removeEventListener(event, interacted);
      removeEventListener('hashchange', navigation); removeEventListener('popstate', navigation);
      document.removeEventListener('click', anchor, true);
    };
  }, [capture, restore, alignInitialSection]);

  useGSAP((context) => {
    if (!root.current || !stage.current) return;
    if (!layout.pinned) {
      scroll.current = null; transfer.current = null; delete root.current.dataset.indexStart;
      // Clear outside the new context: reverting flow later must not restore stale pin dimensions.
      context.ignore(() => {
        gsap.set(stage.current, { clearProps: 'height,minHeight' });
        gsap.set(root.current!.querySelectorAll('.index-folder-motion, .index-title, .index-detail'), { clearProps: 'transform,opacity,visibility' });
      });
      return;
    }
    const saved = transfer.current; transfer.current = null;
    rebuilding.current = true;
    // Let the GSAP context own pin sizing too, so its revert cannot restore a stale React height after resize.
    gsap.set(stage.current, { height: layout.available, minHeight: layout.available });
    const photos = gsap.utils.toArray<HTMLElement>('.index-folder-motion', root.current);
    const titles = gsap.utils.toArray<HTMLElement>('.index-title', root.current);
    const details = gsap.utils.toArray<HTMLElement>('.index-detail', root.current);
    gsap.set(photos, { yPercent: 0, scale: 1, autoAlpha: 1 });
    gsap.set([...titles, ...details], { autoAlpha: 1 });
    gsap.set(photos.slice(1), { yPercent: 35, scale: .94, autoAlpha: 0 });
    gsap.set(titles.slice(1), { autoAlpha: 0 });
    gsap.set(details.slice(1), { autoAlpha: 0 });
    const timeline = gsap.timeline({ onUpdate: () => { if (!rebuilding.current) activate(previewAt(timeline.progress())); }, scrollTrigger: {
      trigger: stage.current, start: () => `top ${viewport.header + 24}px`, end: () => `+=${layout.distance}`,
      pin: stage.current, pinSpacing: true, scrub: .45, invalidateOnRefresh: true, refreshPriority: 1,
      onRefresh: (trigger) => { if (root.current) root.current.dataset.indexStart = String(trigger.start); },
    } });
    timeline.to({}, { duration: 1 });
    for (let i = 0; i < 2; i++) {
      const at = i === 0 ? .20 : .68;
      timeline.to(photos[i], { yPercent: -35, scale: .94, autoAlpha: 0, duration: .22, ease: 'none' }, at)
        .to(photos[i + 1], { yPercent: 0, scale: 1, autoAlpha: 1, duration: .22, ease: 'none' }, at)
        .to(titles[i], { autoAlpha: 0, duration: .1 }, at)
        .to(titles[i + 1], { autoAlpha: 1, duration: .12 }, at + .1)
        .to(details[i], { autoAlpha: 0, duration: .1 }, at)
        .to(details[i + 1], { autoAlpha: 1, duration: .12 }, at + .1);
    }
    scroll.current = timeline.scrollTrigger!;
    ScrollTrigger.sort(); ScrollTrigger.refresh(); restore(saved);
    rebuilding.current = false; activate(previewAt(timeline.progress()));
    return () => { scroll.current = null; if (root.current) delete root.current.dataset.indexStart; };
  }, { scope: root, dependencies: [viewport.width, viewport.height, viewport.header, viewport.reduced, layout.pinned], revertOnUpdate: true });

  useGSAP(() => {
    if (entry !== 'reveal') return;
    if (viewport.reduced) { setTitlesReady(true); onEntryComplete(); return; }
    const timeline = gsap.timeline({ onComplete: onEntryComplete });
    timeline.fromTo('.index-caption, .index-controls', { autoAlpha: 0 }, { autoAlpha: 1, duration: .2 }, 0)
      .fromTo('.index-folder-inner', { autoAlpha: 0 }, { autoAlpha: 1, duration: .24 }, .12)
      .call(() => setTitlesReady(true), [], .24)
      .fromTo('.index-title-inner, .index-detail-inner', { opacity: 0 }, { opacity: 1, duration: .26 }, .24);
    return () => { timeline.kill(); gsap.set('.index-caption, .index-controls, .index-folder-inner, .index-title-inner, .index-detail-inner', { clearProps: 'opacity,visibility' }); };
  }, { scope: root, dependencies: [entry, viewport.reduced], revertOnUpdate: true });

  const select = (index: number) => {
    const trigger = scroll.current;
    if (trigger) window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * previewStops[index], behavior: 'smooth' });
    else {
      activate(index);
      document.getElementById(`preview-${sections[index].id}`)?.scrollIntoView({ behavior: viewport.reduced ? 'instant' : 'smooth', block: 'center' });
    }
  };
  return (
    <section id="indice" ref={root} className="site-contents" aria-labelledby="contents-title" tabIndex={-1}
      style={{ paddingTop: viewport.header + 24 }}
      onKeyDownCapture={(event) => {
        if (event.key !== 'Tab' || !layout.pinned || !scroll.current) return;
        const trigger = scroll.current, top = window.scrollY;
        if (top < trigger.start || top > trigger.end + 1) return;
        // Native focus scrolling at the pin boundary must not move the selected preview halfway back.
        requestAnimationFrame(() => {
          if (root.current?.contains(document.activeElement)) window.scrollTo({ top, behavior: 'instant' });
        });
      }}
      data-layout={layout.pinned ? 'pinned' : 'flow'} data-entry={entry} data-active={active} data-title-ready={titlesReady || undefined}>
      <span className="scene-viewport-measure" aria-hidden="true" />
      <div className="index-stage" ref={stage}>
        <div className="index-entry">
          <div className="index-top">
          <h2 id="contents-title" className="section-caption index-caption">Por onde você quer começar?</h2>
          <nav className="index-controls" aria-label="Prévias do índice">
            {sections.map((section, index) => <LiquidButton type="button" key={section.id} aria-label={`Prévia de ${section.title}`}
              aria-pressed={active === index} onClick={() => select(index)}>{section.title}</LiquidButton>)}
          </nav>
          </div>
          <div className="index-deck">
            {sections.map((section, index) => section.variant === 'production' ? <article id={`preview-${section.id}`} className="index-preview index-preview--production" key={section.id}
              aria-labelledby="production-preview-title" aria-hidden={layout.pinned && active !== index || undefined}
              inert={layout.pinned && active !== index} data-active={active === index}>
              <div className="index-copy">
                <h3 id="production-preview-title" className="index-title"><span className="index-title-inner"><GlareText text={section.label} active={titlesReady && entry !== 'hold' && (!layout.pinned || active === index)} /></span></h3>
                <div className="index-detail"><div className="index-detail-inner"><p>{section.preview.detail}</p></div></div>
              </div>
              <div className="index-folder-motion"><div className="index-folder-inner">
                <ProductionWindow active={entry !== 'hold' && (!layout.pinned || active === index)} selectedServices={selectedServices} onToggleService={onToggleService} />
              </div></div>
            </article> : <a id={`preview-${section.id}`} className="index-preview" key={section.id}
              href={`#${section.id}`} aria-label={section.label} aria-hidden={layout.pinned && active !== index || undefined}
              inert={layout.pinned && active !== index} data-active={active === index}>
              <div className="index-folder-motion"><div className="index-folder-inner">
                <GlassFolder items={section.preview.items} active={!layout.pinned || active === index} trackVisibility={!layout.pinned} />
              </div></div>
              <div className="index-copy">
                <h3 className="index-title"><span className="index-title-inner"><GlareText text={section.label} active={titlesReady && entry !== 'hold' && (!layout.pinned || active === index)} /></span></h3>
                <div className="index-detail"><div className="index-detail-inner">
                  <p>{section.preview.detail}</p>
                  {section.preview.note && <p className="index-note">{section.preview.note}</p>}
                </div></div>
              </div>
            </a>)}
          </div>
        </div>
      </div>
    </section>
  );
}
