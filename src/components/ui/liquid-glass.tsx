import { forwardRef, useEffect, useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import { registerLiquidControl } from '../../lib/liquidControls';
import './liquid-glass.css';

function Material({ interactive = true }: { interactive?: boolean } = {}) {
  const shader = useRef<HTMLSpanElement>(null), wave = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const host = shader.current, ripple = wave.current;
    const root = host?.closest<HTMLElement>('.liquid-control');
    if (!host || !root || !ripple) return;
    const control = registerLiquidControl(root, host);
    if (!interactive) return () => control.dispose();
    // A visual finish follows its enclosing real link/label, without creating another control.
    const target = root.dataset.visual ? root.closest('a,button,label') ?? root : root;
    const animations = new Set<Animation>();
    const emphasize = () => {
      const on = target.matches(':hover,:focus-visible,:focus-within');
      root.dataset.emphasis = String(on); control.emphasize(on);
    };
    const click = (event: Event) => {
      if (root.matches(':disabled,[aria-disabled="true"]') || matchMedia('(prefers-reduced-motion: reduce)').matches || typeof ripple.animate !== 'function') return;
      const mouse = event as MouseEvent;
      // Labels forward a second pointer click to the checkbox; keyboard activation still gets one wave.
      if (target instanceof HTMLLabelElement && event.target instanceof HTMLInputElement && mouse.detail > 0) return;
      const box = root.getBoundingClientRect();
      const x = mouse.detail ? Math.max(0, Math.min(box.width, mouse.clientX - box.left)) : box.width / 2;
      const y = mouse.detail ? Math.max(0, Math.min(box.height, mouse.clientY - box.top)) : box.height / 2;
      ripple.style.left = `${x}px`; ripple.style.top = `${y}px`;
      const size = Math.hypot(box.width, box.height) * 2;
      const animation = ripple.animate([
        { width: '0px', height: '0px', opacity: .5 },
        { width: `${size}px`, height: `${size}px`, opacity: 0 },
      ], { duration: 600, easing: 'cubic-bezier(.16,.65,.35,1)' });
      animations.add(animation);
      animation.onfinish = () => { animations.delete(animation); animation.cancel(); };
    };
    for (const event of ['pointerenter', 'pointerleave', 'focusin', 'focusout']) target.addEventListener(event, emphasize);
    target.addEventListener('click', click);
    emphasize();
    return () => {
      control.dispose(); animations.forEach(animation => animation.cancel());
      for (const event of ['pointerenter', 'pointerleave', 'focusin', 'focusout']) target.removeEventListener(event, emphasize);
      target.removeEventListener('click', click);
    };
  }, [interactive]);
  return <><span className="liquid-rim" aria-hidden="true"><span className="liquid-shader" ref={shader} /></span>
    <span className="liquid-wave-clip" aria-hidden="true"><span className="liquid-wave" ref={wave} /></span></>;
}

export const LiquidButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function LiquidButton({ children, className = '', type = 'button', ...props }, ref) {
    return <button {...props} ref={ref} type={type} className={`liquid-control ${className}`}><Material /><span className="liquid-content">{children}</span></button>;
  },
);
export const LiquidLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  function LiquidLink({ children, className = '', ...props }, ref) {
    return <a {...props} ref={ref} className={`liquid-control ${className}`}><Material /><span className="liquid-content">{children}</span></a>;
  },
);
export const LiquidSurface = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  function LiquidSurface({ children, className = '', ...props }, ref) {
    return <span {...props} ref={ref} data-visual="true" className={`liquid-control ${className}`}><Material /><span className="liquid-content">{children}</span></span>;
  },
);
export const LiquidPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function LiquidPanel({ children, className = '', ...props }, ref) {
    return <div {...props} ref={ref} data-visual="true" className={`liquid-control liquid-panel ${className}`}>
      <Material interactive={false} /><div className="liquid-content">{children}</div>
    </div>;
  },
);
