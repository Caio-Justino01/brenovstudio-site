import { footerContent, navigationItems, site } from '../config/site';
import { StudioMark } from './ui/StudioMark';
import './SiteFooter.css';

export function SiteFooter() {
  return <footer className="site-footer" aria-label={site.studioName}>

    <div className="footer-content">
      <div className="footer-brand">
        <div className="footer-brand__signature"><StudioMark /><span>{site.studioName}</span></div>
        <p className="footer-brand__tagline">{site.tagline}</p>
        <p className="footer-location">{site.location}</p>
      </div>
      <nav className="footer-navigation" aria-labelledby="footer-navigation-title">
        <h2 id="footer-navigation-title">{footerContent.navigationTitle}</h2>
        <ul>{navigationItems.filter(item => item.id !== 'indice').map(item => <li key={item.id}><a href={`#${item.id}`}>{item.label}</a></li>)}</ul>
      </nav>
      <div className="footer-contact" aria-labelledby="footer-contact-title">
        <h2 id="footer-contact-title">{footerContent.contactTitle}</h2>
        <ul>{footerContent.contacts.map(contact => <li key={contact.href}>
          <a href={contact.href} target="_blank" rel="noreferrer"><span>{contact.label}</span><span className="footer-contact__detail">{contact.handle}</span></a>
        </li>)}</ul>
      </div>
    </div>
    <div className="footer-credit">
      <a href={footerContent.credit.href} target="_blank" rel="noreferrer">
        {footerContent.credit.prefix} <span>{footerContent.credit.name}</span>
      </a>
    </div>
  </footer>;
}
