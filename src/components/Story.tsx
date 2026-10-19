import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { about, site } from '../config/site';
import { useStoryScroll } from '../lib/useStoryScroll';
import { LiquidLink } from './ui/liquid-glass';
import { navigateToQuote } from '../lib/navigation';
import { ArtistFacts } from './ArtistFacts';
import { GlareText } from './ui/GlareText';
import './Story.css';

type ImageState = 'loading' | 'ready' | 'failed';

export function Story() {
  const root = useRef<HTMLElement>(null), track = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null);
  const [openImage, setOpenImage] = useState<ImageState>('loading');
  const [closedImage, setClosedImage] = useState<ImageState>('loading');
  const imagesSettled = openImage !== 'loading' && closedImage !== 'loading';
  const staticPortrait = openImage === 'failed' || closedImage === 'failed';
  const imageReady = imagesSettled && (openImage === 'ready' || closedImage === 'ready');
  const { layout, metrics } = useStoryScroll(root, track, stage, staticPortrait);

  useEffect(() => {
    const open = root.current?.querySelector<HTMLImageElement>('.artist-eyes-open');
    const closed = root.current?.querySelector<HTMLImageElement>('.artist-eyes-closed');
    if (open?.complete) setOpenImage(open.naturalWidth > 0 ? 'ready' : 'failed');
    if (closed?.complete) setClosedImage(closed.naturalWidth > 0 ? 'ready' : 'failed');
    // This deadline releases a failed portrait; it never advances the presentation.
    const deadline = window.setTimeout(() => {
      setOpenImage(value => value === 'loading' ? 'failed' : value);
      setClosedImage(value => value === 'loading' ? 'failed' : value);
    }, 5000);
    return () => window.clearTimeout(deadline);
  }, []);

  return <section ref={root} id="historia" className="artist-story" aria-labelledby="story-title" tabIndex={-1}
    data-layout={layout.pinned ? 'pinned' : 'flow'} data-reduced={metrics.reduced || undefined}
    style={{ '--story-top': `${layout.top}px`, '--story-travel': `${layout.distance}px` } as CSSProperties}>
    <div className="artist-track" ref={track}>
      <div className="artist-stage" ref={stage}>
        <h2 id="story-title" className="section-caption artist-caption"><GlareText text="História" /></h2>
        <div className="artist-scene">
          <div className="artist-portrait" aria-hidden="true" data-static-closed={openImage === 'failed' || undefined}>
            <div className="artist-portrait__frame">
              <div className="artist-breath" data-ready={imageReady || undefined}>
                <img className="artist-eyes-open" src={about.scene.open} width={about.scene.width} height={about.scene.height}
                  alt="" decoding="async" data-failed={openImage === 'failed' || undefined}
                  onLoad={() => setOpenImage('ready')} onError={() => setOpenImage('failed')} />
                <img className="artist-eyes-closed" src={about.scene.closed} width={about.scene.width} height={about.scene.height}
                  alt="" decoding="async" data-failed={closedImage === 'failed' || undefined}
                  onLoad={() => setClosedImage('ready')} onError={() => setClosedImage('failed')} />
                <div className="artist-eye-light" aria-hidden="true">
                  {about.scene.eyeLights.map((eye, index) => <span key={index} className="artist-eye-light__source" style={{ left: `${eye.x}%`, top: `${eye.y}%` }}>
                    <span className="artist-eye-light__halo" />
                  </span>)}
                </div>
              </div>
            </div>
          </div>
          <div className="artist-copy">
            <h3 className="sr-only">{about.firstName} {about.lastName}</h3>
            <div className="artist-chapters" aria-hidden="true">
              <div className="artist-chapter artist-invitation"><p className="artist-heading"><GlareText text={about.presentation.invitation} /></p></div>
              <div className="artist-chapter artist-introduction"><p className="artist-name"><GlareText text={`${about.firstName} ${about.lastName}`} /></p></div>
            </div>
            <div className="artist-information">
              <p className="artist-description">{about.lines.join(' ')}</p>
              <div className="artist-contact">
                <LiquidLink href="#orcamento" onClick={event => {
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                  event.preventDefault(); navigateToQuote();
                }}>{about.contact.quote}</LiquidLink>
              </div>
              <div className="artist-socials">
                <a href={site.instagram} target="_blank" rel="noreferrer">{about.contact.profiles[0]} <span aria-hidden="true">↗</span></a>
                <a href={site.studioInstagram} target="_blank" rel="noreferrer">{about.contact.profiles[1]} <span aria-hidden="true">↗</span></a>
              </div>
            </div>
          </div>
        </div>
        <ArtistFacts />
      </div>
    </div>
  </section>;
}
