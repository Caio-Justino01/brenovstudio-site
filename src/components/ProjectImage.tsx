import { useState } from 'react';
import type { ProjectMedia } from '../config/site';

export function ProjectImage({ media, eager = false }: { media: ProjectMedia; eager?: boolean }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return failedSource === media.src ? <span className="media-unavailable" role="img" aria-label={media.alt}>Imagem indisponível</span> : (
    <img src={media.src} alt={media.alt} width={media.width} height={media.height}
      loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedSource(media.src)} />
  );
}
