import { ContextBudget } from './contextBudget';
import { CONTROL_VISIBLE_RATIO, controlIntersectionVisible } from './controlVisibility';
import type { MetalHandle } from './liquidMetal';

const budget = new ContextBudget(6);
type Control = {
  root: HTMLElement; host: HTMLElement; inView: boolean; dead: boolean; failed: boolean;
  emphasis: boolean; generation: number; eligibleSince?: number; release?: () => void; metal?: MetalHandle;
};
const controls = new Set<Control>();
let observer: IntersectionObserver | undefined, mutations: MutationObserver | undefined;
let media: MediaQueryList | undefined, frame = 0, sweepTimer = 0, lastSweep = -Infinity;
let modulePromise: Promise<typeof import('./liquidMetal')> | undefined;

function visible(control: Control) {
  const { root } = control;
  if (control.dead || control.failed || !root.isConnected || !control.inView || media?.matches) return false;
  if (root.matches(':disabled,[aria-disabled="true"]') || root.closest('[inert],.intro[data-leaving="true"]')) return false;
  const modal = document.querySelector('dialog[open]');
  if (modal && !modal.contains(root)) return false;
  for (let node: HTMLElement | null = root; node; node = node.parentElement) {
    if (node instanceof HTMLDialogElement && !node.open) return false;
    const style = getComputedStyle(node);
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) <= .01) return false;
  }
  const box = root.getBoundingClientRect();
  const width = Math.max(0, Math.min(box.right, innerWidth) - Math.max(box.left, 0));
  const height = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0));
  return box.width > 0 && box.height > 0 && width * height >= box.width * box.height * CONTROL_VISIBLE_RATIO;
}

function discard(control: Control) {
  control.generation++;
  control.eligibleSince = undefined;
  control.metal?.dispose(); control.metal = undefined;
  const release = control.release; control.release = undefined; release?.();
  control.host.dataset.metal = 'static';
}

function sweep() {
  frame = 0;
  const now = performance.now(); lastSweep = now;
  // Read the ancestor styles once per control, rather than twice on every scrub frame.
  const eligibility = new Map([...controls].map(control => [control, visible(control)]));
  // Release first, then grant: invisible controls never retain a slot ahead of new ones.
  for (const control of controls) if (!eligibility.get(control)) discard(control);
  for (const control of controls) {
    if (!eligibility.get(control)) continue;
    if (document.hidden) {
      if (control.metal) control.metal.pause(true); else if (control.release) discard(control);
      continue;
    }
    if (control.metal) { control.metal.pause(false); continue; }
    if (control.release) continue;
    control.eligibleSince ??= now;
    // Fast scrolling keeps the static rim; do not compile a shader for a passing control.
    if (now - control.eligibleSince < 160) { schedule(); continue; }
    const generation = ++control.generation;
    control.host.dataset.metal = 'waiting';
    control.release = budget.request(() => {
      control.host.dataset.metal = 'loading';
      modulePromise ??= import('./liquidMetal');
      void modulePromise.then(({ mountLiquidMetal }) => {
        if (generation !== control.generation || !visible(control) || document.hidden) {
          if (generation === control.generation) discard(control);
          return;
        }
        try {
          control.metal = mountLiquidMetal(control.host, () => {
            control.failed = true; discard(control); schedule();
          });
          control.metal.emphasize(control.emphasis);
          control.host.dataset.metal = 'active';
        } catch {
          control.failed = true; discard(control); schedule();
        }
      }).catch(() => { if (generation === control.generation) { control.failed = true; discard(control); schedule(); } });
    });
  }
}
function schedule() {
  if (frame || sweepTimer) return;
  const delay = Math.max(0, 100 - (performance.now() - lastSweep));
  if (delay) sweepTimer = window.setTimeout(() => { sweepTimer = 0; frame = requestAnimationFrame(sweep); }, delay);
  else frame = requestAnimationFrame(sweep);
}
function connect() {
  media = matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) for (const control of controls) if (control.root === entry.target) control.inView = controlIntersectionVisible(entry);
    schedule();
  }, { threshold: [0, CONTROL_VISIBLE_RATIO] });
  mutations = new MutationObserver(records => {
    // Ignore the logo's per-frame transforms and shader decorations below the control root.
    if (records.some(record => record.target instanceof Element && [...controls].some(control => (record.target as Element).contains(control.root)))) schedule();
  });
  mutations.observe(document.body, { subtree: true, attributes: true,
    attributeFilter: ['class', 'style', 'open', 'inert', 'disabled', 'aria-disabled', 'data-intro-ui', 'data-exiting', 'data-leaving', 'data-entry', 'data-active'] });
}

export function registerLiquidControl(root: HTMLElement, host: HTMLElement) {
  if (!controls.size) connect();
  const control: Control = { root, host, inView: false, dead: false, failed: false, emphasis: false, generation: 0 };
  controls.add(control); observer?.observe(root); host.dataset.metal = 'static';
  return {
    emphasize(value: boolean) { control.emphasis = value; control.metal?.emphasize(value); },
    dispose() {
      control.dead = true; observer?.unobserve(root); controls.delete(control); discard(control);
      if (!controls.size) {
        cancelAnimationFrame(frame); clearTimeout(sweepTimer); frame = 0; sweepTimer = 0; lastSweep = -Infinity;
        observer?.disconnect(); mutations?.disconnect();
        media?.removeEventListener('change', schedule); document.removeEventListener('visibilitychange', schedule);
        observer = undefined; mutations = undefined; media = undefined;
      }
    },
  };
}
