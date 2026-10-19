import { useEffect, useRef, useState } from 'react';
import { navigationItems, site } from '../config/site';
import type { OpeningMode } from '../lib/opening';
import { LiquidButton, LiquidLink } from './ui/liquid-glass';
import { navigateToIndex } from '../lib/navigation';
import { createFrameResizeObserver } from '../lib/frameResizeObserver';

export function SiteNavigation({ openingMode, exiting = false }: { openingMode: OpeningMode; exiting?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const header = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('inicio');

  useEffect(() => {
    const element = header.current;
    if (!element) return;
    const style = document.documentElement.style, previous = style.getPropertyValue('--anchor-offset');
    const resize = () => {
      const offset = `${Math.ceil(element.getBoundingClientRect().bottom + 24)}px`;
      if (style.getPropertyValue('--anchor-offset') !== offset) style.setProperty('--anchor-offset', offset);
    };
    const observer = createFrameResizeObserver(resize); observer.observe(element); resize();
    return () => { observer.disconnect(); if (previous) style.setProperty('--anchor-offset', previous); else style.removeProperty('--anchor-offset'); };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      }
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('.intro, main > section[id]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const close = () => dialog.current?.close();

  return (
    <>
      <header ref={header} className="site-header" data-intro-ui={openingMode} data-exiting={exiting || undefined}
        inert={openingMode === 'hidden' || exiting} aria-hidden={openingMode === 'hidden' || exiting || undefined}>
        <a className="site-header__brand" href="#inicio" aria-label="Breno, início">{site.name}</a>
        <nav className="site-header__links" aria-label="Links rápidos">
          {navigationItems.filter(item => item.header).map(item => <a key={item.id} href={`#${item.id}`}
            aria-current={current === item.id ? 'location' : undefined}>{item.headerLabel}</a>)}
        </nav>
        <LiquidButton className="site-menu" type="button" aria-haspopup="dialog" aria-controls="navigation-dialog" aria-expanded={open}
          onClick={() => { dialog.current?.showModal(); setOpen(true); }}>
          <span className="site-menu__icon" aria-hidden="true"><i /><i /><i /></span>
          <span>Índice</span>
        </LiquidButton>
      </header>
      <dialog id="navigation-dialog" ref={dialog} className="studio-glass navigation-dialog" aria-labelledby="navigation-title"
        onClose={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
        <div className="navigation-dialog__inner">
          <div className="navigation-dialog__top">
            <h2 id="navigation-title">Por onde você quer começar?</h2>
            <LiquidButton type="button" onClick={close} autoFocus>Fechar índice</LiquidButton>
          </div>
          <nav aria-label="Navegar pelo site" className="contents__links">
            {navigationItems.map(item => <LiquidLink key={item.id} href={`#${item.id}`}
              aria-current={current === item.id ? 'location' : undefined} onClick={event => {
                close();
                if (item.id !== 'indice' || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                navigateToIndex();
              }}>{item.menuLabel}</LiquidLink>)}
          </nav>
        </div>
      </dialog>
    </>
  );
}
