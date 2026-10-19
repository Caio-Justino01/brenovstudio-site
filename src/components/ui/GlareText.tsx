import { useEffect, useRef, useState } from 'react';
import { titleHighlights } from '../../config/site';
import './text-glare.css';

const words = titleHighlights.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const pattern = new RegExp(`(\\b(?:${words})\\b)`, 'giu');

/** A single text layer: selected words catch light without changing the heading's layout or semantics. */
export function GlareText({ text, active = true }: { text: string; active?: boolean }) {
  const root = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= .35), { threshold: [0, .35] });
    const visibility = () => setPageVisible(!document.hidden);
    observer.observe(element);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return <span ref={root} className="glare-text" data-playing={active && inView && pageVisible || undefined}>
    {text.split(pattern).map((part, index) => index % 2
      ? <span key={index} className="glare-word">{part}</span> : part)}
  </span>;
}
