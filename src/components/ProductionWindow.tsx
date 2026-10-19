import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { productionPreview as content, projects, services, type ServiceId } from '../config/site';
import { navigateToQuote } from '../lib/navigation';
import { createFrameResizeObserver } from '../lib/frameResizeObserver';
import { LiquidLink, LiquidSurface } from './ui/liquid-glass';
import './ProductionWindow.css';
import { StudioMark } from './ui/StudioMark';

const works = content.projectIds.map(id => projects.find(project => project.id === id)!);

function folderOutline(width: number, height: number) {
  const edge = 1, radius = 18, drop = width < 480 ? 42 : 48;
  const tab = Math.min(230, Math.max(180, width * .46), width - 64);
  return `M${radius} ${edge}H${tab}C${tab + 18} ${edge} ${tab + 18} ${drop} ${tab + 38} ${drop}` +
    `H${width - radius}Q${width - edge} ${drop} ${width - edge} ${drop + radius}` +
    `V${height - radius}Q${width - edge} ${height - edge} ${width - radius} ${height - edge}` +
    `H${radius}Q${edge} ${height - edge} ${edge} ${height - radius}` +
    `V${radius}Q${edge} ${edge} ${radius} ${edge}Z`;
}
type Props = { active: boolean; selectedServices: readonly ServiceId[]; onToggleService: (id: ServiceId) => void };

export function ProductionWindow({ active, selectedServices, onToggleService }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const rimId = `production-rim-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [visible, setVisible] = useState(false);
  const last = selectedServices.at(-1);
  const description = services.find(service => service.id === last)?.description ?? content.hint;
  const outline = size.width && size.height ? folderOutline(size.width, size.height) : undefined;
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => {
      const width = element.offsetWidth, height = element.offsetHeight;
      setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    };
    const observer = createFrameResizeObserver(measure);
    observer.observe(element); measure();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)), { threshold: .15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div className="production-window" ref={root} data-present={active && visible} role="group" aria-label={content.accessibleName}>
    <div className="production-window__material" aria-hidden="true" style={outline ? { clipPath: `path('${outline}')` } : undefined} />
    {outline && <svg className="production-window__rim" width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
      <defs><linearGradient id={rimId} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ECEFF1" stopOpacity=".6" />
        <stop offset=".45" stopColor="#ECEFF1" stopOpacity=".35" />
        <stop offset=".7" stopColor="#A5ABB2" stopOpacity=".35" />
        <stop offset="1" stopColor="#389DD3" stopOpacity=".85" />
      </linearGradient></defs>
      <path d={outline} fill="none" stroke={`url(#${rimId})`} strokeWidth="1.2" />
    </svg>}
    <div className="production-window__bar production-reveal">
      <StudioMark />
      <span>{content.brand}</span>
    </div>
    <div className="production-window__works production-reveal">
      {works.map(project => <figure key={project.id} data-source={project.sourceUrl}>
        <img src={project.cover.src} alt={project.cover.alt} width={project.cover.width} height={project.cover.height} loading="lazy" />
        <figcaption><span>{project.title}</span><span className="sr-only">. {project.credits}</span></figcaption>
      </figure>)}
    </div>
    <div className="production-window__brief">
      <fieldset className="production-reveal" aria-describedby="production-description">
        <legend>{content.question}</legend>
        <div className="service-choices production-window__choices">
          {content.choices.map(choice => <label key={choice.id}>
            <input type="checkbox" value={choice.id} checked={selectedServices.includes(choice.id)} onChange={() => onToggleService(choice.id)} />
            <LiquidSurface><span className="production-check" aria-hidden="true">{selectedServices.includes(choice.id) ? '✓' : '+'}</span>{choice.label}</LiquidSurface>
          </label>)}
        </div>
        <p id="production-description" className="production-window__description" aria-live="polite" aria-atomic="true">{description}</p>
      </fieldset>
      <div className="production-window__action production-reveal">
        <LiquidLink href="#orcamento" onClick={event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault(); navigateToQuote();
        }}>{content.cta}<span aria-hidden="true">↗</span></LiquidLink>
      </div>
    </div>
  </div>;
}
