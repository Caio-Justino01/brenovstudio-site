import { useId } from 'react';
import { site } from '../../config/site';
import { LOGO_KEY_SLOPE, LOGO_KEY_OFFSET } from '../../lib/logoMask';

/** Runtime alpha key only: original RGB and source file stay untouched. */
export function StudioMark({ className = '', decorative = false }: { className?: string; decorative?: boolean }) {
  const id = `studio-key-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return <svg className={`studio-mark ${className}`} viewBox="0 0 3000 3000" width="48" height="48"
    role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : 'Logo do Bemov Studio'} aria-hidden={decorative || undefined} focusable="false">
    <defs><filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  ${.2126 * LOGO_KEY_SLOPE} ${.7152 * LOGO_KEY_SLOPE} ${.0722 * LOGO_KEY_SLOPE} 0 ${LOGO_KEY_OFFSET}`} />
    </filter></defs>
    <image href={site.logo} width="3000" height="3000" filter={`url(#${id})`} />
  </svg>;
}
