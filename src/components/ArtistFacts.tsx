import { useId, useState } from 'react';
import { about, services } from '../config/site';
import { LiquidButton, LiquidPanel } from './ui/liquid-glass';
import './ui/text-glare.css';
import './ArtistFacts.css';

export function ArtistFacts() {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  return <LiquidPanel className="artist-facts" role="group" aria-label={about.facts.label} data-expanded={expanded || undefined}>
    <div className="artist-facts__overview">
      <div className="artist-facts__base">
        <p className="artist-facts__label">{about.facts.label}</p>
        <p className="artist-facts__summary"><span>{about.facts.base}</span><span>{about.facts.reach}</span></p>
      </div>
      <LiquidButton type="button" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(value => !value)}>
        {expanded ? about.facts.less : about.facts.more}<span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </LiquidButton>
    </div>
    <dl className="artist-facts__metrics" aria-label={about.facts.resultsLabel}>
      {about.results.map(result => <div key={result.label}>
          <dt>{result.label}</dt>
          <dd>{result.value}</dd>
      </div>)}
    </dl>
    <dl className="artist-facts__services" id={detailsId} aria-label={about.facts.servicesLabel}>
      {services.map(service => <div key={service.id}>
        <dt>{service.label}</dt><dd hidden={!expanded}>{service.description}</dd>
      </div>)}
    </dl>
  </LiquidPanel>;
}
