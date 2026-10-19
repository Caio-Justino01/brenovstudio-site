import { useEffect, useRef, type RefObject } from 'react';
import type { ParticleController } from '../lib/particleScene';
import { startSceneLoader } from '../lib/sceneLoader';
import { restoreBypassedOpening } from '../lib/opening';

type Props = {
  host: RefObject<HTMLDivElement | null>;
  image: RefObject<HTMLImageElement | null>;
  controller: RefObject<ParticleController | null>;
  reducedMotion: boolean;
  opening: boolean;
  exiting: RefObject<boolean>;
  onStatus: (status: 'ready' | 'static') => void;
  onOpeningTimeout: () => void;
  onFormationComplete: () => void;
};

export function ParticleLogo({ host, image, controller, reducedMotion, opening, exiting, onStatus, onOpeningTimeout, onFormationComplete }: Props) {
  const openingRef = useRef(opening);
  openingRef.current = opening;
  useEffect(() => {
    restoreBypassedOpening(controller.current, opening, exiting.current);
  }, [opening, controller, exiting]);

  useEffect(() => {
    if (reducedMotion || !host.current || !image.current) {
      onStatus('static');
      return;
    }
    if (import.meta.env.DEV) {
      delete host.current.dataset.sceneFailure;
      delete host.current.dataset.sceneLoading;
    }
    const stop = startSceneLoader({
      load: async ({ signal, onFailure, onFormationComplete: complete }) => {
        const { createParticleScene } = await import('../lib/particleScene');
        if (signal.aborted) throw signal.reason;
        return createParticleScene({ host: host.current!, image: image.current!, onFailure, signal,
          onFormationComplete: complete,
          opening: () => openingRef.current });
      },
      shouldRestore: () => !openingRef.current && !exiting.current,
      onReady: (created) => {
        controller.current = created;
        if (import.meta.env.DEV && host.current) host.current.dataset.sceneLoading = 'ready';
        onStatus('ready');
      },
      onOpeningTimeout: () => {
        if (import.meta.env.DEV && host.current) host.current.dataset.sceneLoading = controller.current ? 'ready' : 'background';
        onOpeningTimeout();
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
  }, [host, image, controller, exiting, reducedMotion, onStatus, onOpeningTimeout, onFormationComplete]);
  return null;
}
