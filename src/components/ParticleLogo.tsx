import { useEffect, useRef, type RefObject } from 'react';
import type { ParticleController } from '../lib/particleScene';
import { startSceneLoader } from '../lib/sceneLoader';
import { OPENING_WAIT_TIMEOUT } from '../lib/opening';

type Props = {
  host: RefObject<HTMLDivElement | null>;
  image: RefObject<HTMLImageElement | null>;
  controller: RefObject<ParticleController | null>;
  reducedMotion: boolean;
  opening: boolean;
  onStatus: (status: 'ready' | 'static') => void;
  onFormationComplete: () => void;
};

export function ParticleLogo({ host, image, controller, reducedMotion, opening, onStatus, onFormationComplete }: Props) {
  const openingRef = useRef(opening);
  openingRef.current = opening;
  useEffect(() => {
    if (!opening) controller.current?.restore();
  }, [opening, controller]);

  useEffect(() => {
    if (reducedMotion || !host.current || !image.current) {
      onStatus('static');
      return;
    }
    if (import.meta.env.DEV) {
      delete host.current.dataset.sceneFailure;
      delete host.current.dataset.sceneLoading;
    }
    const started = performance.now();
    const stop = startSceneLoader({
      load: async ({ signal, onFailure, onFormationComplete: complete }) => {
        const { createParticleScene } = await import('../lib/particleScene');
        if (signal.aborted) throw signal.reason;
        return createParticleScene({ host: host.current!, image: image.current!, onFailure, signal,
          onFormationComplete: complete,
          opening: () => openingRef.current && performance.now() - started < OPENING_WAIT_TIMEOUT });
      },
      shouldRestore: () => !openingRef.current,
      onReady: (created) => {
        controller.current = created;
        if (import.meta.env.DEV && host.current) host.current.dataset.sceneLoading = 'ready';
        onStatus('ready');
      },
      onOpeningTimeout: () => {
        if (import.meta.env.DEV && host.current) host.current.dataset.sceneLoading = 'background';
        onStatus('static');
      },
      onFallback: (reason) => {
        controller.current = null;
        if (import.meta.env.DEV) {
          if (host.current) host.current.dataset.sceneFailure = reason instanceof Error ? reason.message : String(reason);
          console.warn('[BEMOV] Cena de partículas indisponível:', reason);
        }
        onStatus('static');
      },
      onFormationComplete,
    });
    return () => {
      stop();
      controller.current = null;
    };
  }, [host, image, controller, reducedMotion, onStatus, onFormationComplete]);
  return null;
}
