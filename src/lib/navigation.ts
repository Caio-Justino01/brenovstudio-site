export function alignIndex(focus = true) {
  const section = document.getElementById('indice');
  const title = document.getElementById('contents-title');
  if (!section || !title) return;
  const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
  const pinStart = section.dataset?.indexStart;
  const top = pinStart ? Number(pinStart) : Math.max(0, window.scrollY + title.getBoundingClientRect().top - headerBottom - 24);
  if (focus) section.focus({ preventScroll: true });
  window.scrollTo({ top, behavior: 'instant' });
}

export function navigateToIndex(focus = true) {
  if (window.location.hash !== '#indice') window.history.pushState(window.history.state, '', '#indice');
  alignIndex(focus);
}

/** Align content headings, rather than the section's decorative top spacing. */
export function alignContentSection(id: 'historia' | 'portfolio' | 'orcamento', focus = false) {
  const section = document.getElementById(id);
  const title = document.getElementById(id === 'historia' ? 'story-title' : id === 'portfolio' ? 'portfolio-title' : 'contact-title');
  if (!section || !title) return;
  const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
  const storyStart = id === 'historia' ? section.dataset.storyStart : undefined;
  const top = storyStart !== undefined && Number.isFinite(Number(storyStart)) ? Number(storyStart)
    : Math.max(0, window.scrollY + title.getBoundingClientRect().top - headerBottom - 24);
  if (focus) section.focus({ preventScroll: true });
  window.scrollTo({ top, behavior: 'instant' });
  if (id === 'historia') section.dispatchEvent(new Event('story:align'));
}

export function navigateToQuote() {
  const section = document.getElementById('orcamento');
  const name = document.getElementById('briefing-name');
  if (!section || !name) return;
  if (window.location.hash !== '#orcamento') window.history.pushState(window.history.state, '', '#orcamento');
  const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
  const title = document.getElementById('contact-title') ?? section;
  const top = Math.max(0, window.scrollY + title.getBoundingClientRect().top - headerBottom - 24);
  name.focus({ preventScroll: true });
  window.scrollTo({ top, behavior: 'instant' });
}
