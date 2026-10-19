import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { quoteContent, services, site, type ServiceId } from '../config/site';
import { buildBriefing, whatsappLink } from '../lib/briefing';
import { BriefingCopy } from '../lib/briefingCopy';
import { gsap, useGSAP } from '../lib/motion';
import { LiquidButton, LiquidLink, LiquidSurface } from './ui/liquid-glass';
import { GlareText } from './ui/GlareText';
import './Quote.css';

type Props = { selectedServices: readonly ServiceId[]; onToggleService: (id: ServiceId) => void };
export function Quote({ selectedServices, onToggleService }: Props) {
  const root = useRef<HTMLElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const messageBox = useRef<HTMLTextAreaElement>(null);
  const copying = useRef<BriefingCopy | null>(null);
  const [message, setMessage] = useState('');
  const [serviceError, setServiceError] = useState(false);
  const [copy, setCopy] = useState<'idle' | 'done' | 'manual'>('idle');
  const whatsapp = whatsappLink(site.whatsappNumber, message);

  useEffect(() => {
    const requests = new BriefingCopy(text => navigator.clipboard.writeText(text), {
      copied: () => setCopy('done'),
      manual: () => { messageBox.current?.focus(); messageBox.current?.select(); setCopy('manual'); },
    });
    copying.current = requests;
    return () => { requests.dispose(); if (copying.current === requests) copying.current = null; };
  }, []);

  useLayoutEffect(() => {
    copying.current?.invalidate();
    setMessage(''); setCopy('idle'); setServiceError(false);
  }, [selectedServices]);

  useEffect(() => {
    if (!message) return;
    const frame = requestAnimationFrame(() => {
      result.current?.focus({ preventScroll: true });
      result.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [message]);

  useGSAP(() => {
    const motion = gsap.matchMedia();
    motion.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('#contact-title', { opacity: 0, duration: .6, ease: 'power1.out',
        scrollTrigger: { trigger: '#contact-title', start: 'top 92%', once: true } });
    });
    return () => motion.revert();
  }, { scope: root });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const selected = fields.getAll('services').filter((value): value is ServiceId => services.some(service => service.id === value));
    if (!selected.length) {
      setServiceError(true);
      form.querySelector<HTMLInputElement>('input[name="services"]')?.focus();
      return;
    }
    for (const field of ['name', 'idea']) {
      const input = form.elements.namedItem(field) as HTMLInputElement | HTMLTextAreaElement;
      if (!input.value.trim()) {
        input.setCustomValidity(field === 'name' ? 'Informe seu nome.' : 'Conte um pouco da sua ideia.');
        input.reportValidity();
        return;
      }
    }
    setServiceError(false);
    copying.current?.invalidate();
    setCopy('idle');
    setMessage(buildBriefing({ name: String(fields.get('name')), services: selected,
      date: String(fields.get('date') || ''), place: String(fields.get('place') || ''), idea: String(fields.get('idea')) }));
  };

  const copyMessage = () => copying.current?.copy(message);

  return (
    <section id="orcamento" ref={root} className="contact section-space quote-section" aria-labelledby="contact-title" tabIndex={-1}>
      <header className="quote-heading">
        <h2 id="contact-title" className="section-title contact__heading"><GlareText text={quoteContent.title} /></h2>
        <p>{quoteContent.intro}</p>
      </header>
      <form className="studio-glass quote-form" onSubmit={submit} onChange={() => { copying.current?.invalidate(); setMessage(''); setCopy('idle'); setServiceError(false); }}
        onInput={(event) => { const input = event.target; if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) input.setCustomValidity(''); }}>
        <div className="quote-form__grid">
          <fieldset className="quote-services" aria-describedby={serviceError ? 'quote-services-hint service-error' : 'quote-services-hint'}>
            <legend>{quoteContent.servicesTitle}</legend>
            <p id="quote-services-hint" className="quote-services__hint">{quoteContent.servicesHint}</p>
            <div className="quote-choices">{services.map(service => <label key={service.id}>
              <input type="checkbox" name="services" value={service.id} checked={selectedServices.includes(service.id)}
                aria-invalid={serviceError || undefined} onChange={() => onToggleService(service.id)} />
              <LiquidSurface>
                <span className="quote-choice__name">{service.shortLabel}<span className="quote-choice__check" aria-hidden="true">✓</span></span>
                <span className="quote-choice__description">{service.description}</span>
              </LiquidSurface>
            </label>)}</div>
            {serviceError && <p id="service-error" className="quote-error" role="alert">Escolha pelo menos um serviço.</p>}
          </fieldset>
          <fieldset className="quote-details">
            <legend>{quoteContent.detailsTitle}</legend>
            <div className="quote-fields">
              <label><span>Seu nome</span><input id="briefing-name" name="name" autoComplete="name" maxLength={80} required /></label>
              <label><span>Data prevista <span className="quote-optional">(opcional)</span></span><input name="date" type="date" /></label>
              <label className="quote-fields__full"><span>Onde <span className="quote-optional">(opcional)</span></span><input name="place" placeholder="Cidade ou remoto" maxLength={140} /></label>
              <label className="quote-fields__full"><span>Conta sua ideia</span><textarea name="idea" required maxLength={1500} rows={4} /></label>
            </div>
          </fieldset>
        </div>
        <div className="quote-submit">
          <p>{quoteContent.submitHint}</p>
          <LiquidButton type="submit">{quoteContent.submit}</LiquidButton>
        </div>
        {message && <div ref={result} className="quote-result" tabIndex={-1} aria-labelledby="briefing-result-title">
          <h3 id="briefing-result-title">Seu briefing</h3>
          <textarea ref={messageBox} value={message} readOnly rows={10} aria-label="Mensagem do briefing" />
          <div className="quote-result__actions">
            <LiquidButton type="button" onClick={() => void copyMessage()}>{copy === 'done' ? 'Copiado' : 'Copiar briefing'}</LiquidButton>
            <LiquidLink href={whatsapp || site.instagram} target="_blank" rel="noreferrer">{whatsapp ? 'Continuar no WhatsApp' : 'Abrir Instagram'}</LiquidLink>
          </div>
          <p className="quote-result__hint" aria-live="polite">{copy === 'manual' ? 'O texto está selecionado. Copie e envie para Breno.' : whatsapp ? 'Revise a mensagem antes de enviar.' : 'Copie o briefing e envie para @brenobe.mov.'}</p>
        </div>}
      </form>
    </section>
  );
}
