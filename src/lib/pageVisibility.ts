export type PageVisibility = { isHidden: () => boolean; subscribe: (callback: () => void) => () => void };

export function getPageVisibility(): PageVisibility | undefined {
  if (typeof document === 'undefined') return undefined;
  return {
    isHidden: () => document.hidden,
    subscribe(callback) {
      document.addEventListener('visibilitychange', callback);
      return () => document.removeEventListener('visibilitychange', callback);
    },
  };
}
