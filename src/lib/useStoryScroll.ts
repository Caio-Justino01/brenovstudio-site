import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { about } from '../config/site';
import { gsap, ScrollTrigger, useGSAP } from './motion';
import { alignContentSection } from './navigation';
import { canRestoreStory, captureStoryProgress, restoreStoryFlowPosition, restoreStoryPosition, sameStoryMetrics, stableStoryMetrics, storyEyeLight, storyFrame, storyLayout, type StoryMetrics, type StoryProgress } from './storyMotion';
import { syncScrollProgress } from './scrollSync';
import { sceneViewportHeight } from './sceneViewport';

type ElementRef = RefObject<HTMLElement | null>;
type Reading = ({ kind: 'progress'; progress: StoryProgress } | { kind: 'flow'; top: number } | { kind: 'marker'; element: HTMLElement; top: number }) & { revision: number };
const settings = about.presentation.scroll;

export function useStoryScroll(root: ElementRef, track: ElementRef, stage: ElementRef, failed: boolean, alignInitialSection: boolean) {
  const trigger = useRef<ScrollTrigger | null>(null);
  const revision = useRef(0), navigationUntil = useRef(0), building = useRef(false), restoring = useRef(false);
  const transfer = useRef<Reading | null>(null), refreshFrame = useRef(0), initialAligned = useRef(false);
  const [metrics, setMetrics] = useState<StoryMetrics>(() => ({ width: innerWidth, height: innerHeight, header: 68, stageHeight: 0,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, failed }));
  const measured = useRef(metrics);
  const layout = storyLayout(metrics, settings);

  const capture = (nextPinned: boolean): Reading | null => {
    if (!measured.current.stageHeight || performance.now() < navigationUntil.current || restoring.current) return null;
    const current = trigger.current;
    const element = stage.current;
    if (!element) return null;
    const progress = current && captureStoryProgress(current.start, current.end, scrollY, current.animation?.progress() ?? current.progress);
    if (progress && nextPinned) return { kind: 'progress', progress, revision: revision.current };
    if (progress) return { kind: 'marker', element, top: element.getBoundingClientRect().top, revision: revision.current };
    const rect = element.getBoundingClientRect();
    const top = measured.current.header + settings.inset;
    // In flow the reader has already seen the identity. Do not turn it back into the invitation on resize.
    if (!current && nextPinned && rect.top <= top + 1 && rect.bottom > top) {
      return { kind: 'flow', top: rect.top, revision: revision.current };
    }
    if ((current && scrollY > current.end) || (!current && rect.bottom <= top)) {
      const facts = root.current?.querySelector<HTMLElement>('.artist-facts');
      if (facts) return { kind: 'marker', element: facts, top: facts.getBoundingClientRect().top, revision: revision.current };
    }
    return null;
  };
  const restore = (saved: Reading | null) => {
    if (!saved || !canRestoreStory(saved.revision, revision.current, navigationUntil.current, performance.now()) || document.querySelector('dialog[open]')) return;
    restoring.current = true;
    const current = trigger.current;
    if (saved.kind === 'progress' && current) {
      window.scrollTo({ top: restoreStoryPosition(saved.progress, current.start, current.end), behavior: 'instant' });
      syncScrollProgress(current, () => ScrollTrigger.update());
      current.animation?.progress(saved.progress.visualProgress);
      current.getTween()?.invalidate().restart();
    } else if (saved.kind === 'flow' && current) {
      window.scrollTo({ top: restoreStoryFlowPosition(saved.top, layout.top, current.end), behavior: 'instant' });
      syncScrollProgress(current, () => ScrollTrigger.update());
      current.getTween()?.pause(); current.animation?.progress(1);
    } else if (saved.kind === 'marker' && saved.element.isConnected) {
      const delta = saved.element.getBoundingClientRect().top - saved.top;
      if (Math.abs(delta) >= 1) window.scrollTo({ top: scrollY + delta, behavior: 'instant' });
      ScrollTrigger.update();
    }
    restoring.current = false;
  };
  // Stable callbacks let observers read current geometry without reattaching on each render.
  const callbacks = useRef({ capture, restore });
  callbacks.current = { capture, restore };

  useLayoutEffect(() => {
    const element = stage.current;
    if (!element) return;
    const header = document.querySelector<HTMLElement>('.site-header');
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    let alive = true, frame = 0, fontFrame = 0;
    const measure = () => {
      frame = 0;
      if (!alive) return;
      const previous = measured.current;
      const facts = element.querySelector<HTMLElement>('.artist-facts');
      const overview = element.querySelector<HTMLElement>('.artist-facts__overview');
      // On shorter phones the eyes, biography and panel controls stay in view; results continue naturally below.
      const readingHeight = innerWidth < 768 && facts && overview && !facts.hasAttribute('data-expanded')
        ? facts.offsetTop + overview.offsetHeight : element.offsetHeight;
      const next = stableStoryMetrics({ width: innerWidth, height: sceneViewportHeight(root.current, innerHeight), header: header?.offsetHeight ?? 68,
        stageHeight: element.offsetHeight, pinHeight: readingHeight, reduced: query.matches, failed }, previous);
      if (sameStoryMetrics(previous, next)) return;
      transfer.current = callbacks.current.capture(storyLayout(next, settings).pinned);
      measured.current = next;
      setMetrics(next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(element); if (header) observer.observe(header);
    const viewportProbe = root.current?.querySelector('.scene-viewport-measure'); if (viewportProbe) observer.observe(viewportProbe);
    const interaction = () => {
      revision.current++; transfer.current = null; initialAligned.current = true;
      // A fresh gesture ends the anchor guard; subsequent content resize must preserve the reading position.
      navigationUntil.current = 0;
    };
    const navigation = () => { interaction(); navigationUntil.current = performance.now() + 1500; };
    const anchor = (event: MouseEvent) => {
      if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey &&
        event.target instanceof Element && event.target.closest('a[href^="#"]')) navigation();
    };
    const focus = () => { revision.current++; transfer.current = null; };
    addEventListener('resize', schedule); query.addEventListener('change', schedule);
    for (const name of ['wheel', 'touchmove', 'pointerdown', 'keydown']) addEventListener(name, interaction, { passive: true });
    addEventListener('hashchange', navigation); addEventListener('popstate', navigation);
    document.addEventListener('click', anchor, true); document.addEventListener('focusin', focus);
    measure();
    void document.fonts.ready.then(() => {
      if (!alive) return;
      schedule();
      fontFrame = requestAnimationFrame(() => {
        if (!alive) return;
        ScrollTrigger.sort(); ScrollTrigger.refresh();
      });
    });
    return () => {
      alive = false; observer.disconnect(); cancelAnimationFrame(frame); cancelAnimationFrame(fontFrame);
      removeEventListener('resize', schedule); query.removeEventListener('change', schedule);
      for (const name of ['wheel', 'touchmove', 'pointerdown', 'keydown']) removeEventListener(name, interaction);
      removeEventListener('hashchange', navigation); removeEventListener('popstate', navigation);
      document.removeEventListener('click', anchor, true); document.removeEventListener('focusin', focus);
    };
  }, [failed, root, stage]);

  useGSAP(() => {
    const section = root.current, surface = track.current;
    if (!section || !surface || !metrics.stageHeight) return;
    cancelAnimationFrame(refreshFrame.current);
    const saved = transfer.current; transfer.current = null;
    if (!layout.pinned) {
      trigger.current = null;
      delete section.dataset.storyStart;
      section.dataset.storyPhase = 'identity';
      // Removing the extra track height must not move the content being read below it.
      building.current = true; ScrollTrigger.sort(); ScrollTrigger.refresh();
      callbacks.current.restore(saved); building.current = false;
      return;
    }
    const closed = section.querySelector<HTMLElement>('.artist-eyes-closed');
    const invitation = section.querySelector<HTMLElement>('.artist-invitation');
    const identity = section.querySelector<HTMLElement>('.artist-introduction');
    const information = section.querySelector<HTMLElement>('.artist-information');
    const eyeLight = section.querySelector<HTMLElement>('.artist-eye-light');
    const facts = section.querySelector<HTMLElement>('.artist-facts');
    if (!closed || !invitation || !identity || !information || !eyeLight || !facts) return;
    const setClosed = gsap.quickSetter(closed, 'opacity');
    const setInvitation = gsap.quickSetter(invitation, 'opacity');
    const setIdentity = gsap.quickSetter(identity, 'opacity');
    const setInformation = gsap.quickSetter(information, 'opacity');
    const setFacts = gsap.quickSetter(facts, 'opacity');
    const position = { value: 0 };
    const paint = () => {
      const frame = storyFrame(position.value, settings);
      setClosed(frame.closed); setInvitation(frame.invitation); setIdentity(frame.identity);
      setInformation(frame.identity);
      eyeLight.style.setProperty('--eye-light', String(storyEyeLight(position.value, settings)));
      setFacts(frame.identity);
      for (const content of [information, facts]) {
        content.style.visibility = frame.identity > 0 ? 'visible' : 'hidden';
        content.inert = frame.identity < .99;
      }
      section.dataset.storyPhase = frame.phase;
    };
    let refreshSaved: Reading | null = null;
    building.current = true;
    const timeline = gsap.timeline({ scrollTrigger: {
      trigger: surface, start: () => `top ${layout.top}px`, end: () => `+=${layout.distance}`,
      scrub: settings.scrub, invalidateOnRefresh: true,
      onRefreshInit: () => { if (!building.current) refreshSaved = callbacks.current.capture(true); },
      onRefresh: current => {
        section.dataset.storyStart = String(current.start);
        if (!building.current && refreshSaved) {
          const reading = refreshSaved; refreshSaved = null;
          cancelAnimationFrame(refreshFrame.current);
          refreshFrame.current = requestAnimationFrame(() => callbacks.current.restore(reading));
        }
      },
    } });
    timeline.fromTo(position, { value: 0 }, { value: 1, duration: 1, ease: 'none', onUpdate: paint });
    trigger.current = timeline.scrollTrigger!;
    ScrollTrigger.sort(); ScrollTrigger.refresh();
    callbacks.current.restore(saved); paint(); building.current = false;
    const align = () => {
      const current = trigger.current;
      if (!current) return;
      const progress = syncScrollProgress(current, () => ScrollTrigger.update());
      current.getTween()?.pause(); timeline.progress(progress); paint();
    };
    const visibility = () => { if (document.hidden) trigger.current?.getTween()?.pause(); else align(); };
    section.addEventListener('story:align', align);
    document.addEventListener('visibilitychange', visibility);
    if (!initialAligned.current) {
      initialAligned.current = true;
      if (alignInitialSection && location.hash === '#historia') alignContentSection('historia');
    }
    return () => {
      trigger.current = null; cancelAnimationFrame(refreshFrame.current);
      section.removeEventListener('story:align', align); document.removeEventListener('visibilitychange', visibility);
      delete section.dataset.storyStart;
      for (const element of [closed, invitation, identity, information, facts]) element.style.removeProperty('opacity');
      for (const content of [information, facts]) { content.style.removeProperty('visibility'); content.inert = false; }
      eyeLight.style.removeProperty('--eye-light');
    };
  }, { scope: root, dependencies: [layout.pinned, layout.distance, layout.top, metrics.width, metrics.stageHeight, metrics.pinHeight], revertOnUpdate: true });

  return { layout, metrics };
}
