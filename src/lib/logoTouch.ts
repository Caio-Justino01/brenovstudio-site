type Contact = { id: number; x: number; y: number; started: number; dragged: boolean };
export const LOGO_TOUCH_SLOP = 8;
export const LOGO_TAP_DURATION = 500;
const COMPATIBILITY_CLICK_WINDOW = 800;

/** Pointer contact bookkeeping only: scrolling remains entirely native. */
export function createLogoTouch() {
  let contact: Contact | undefined, suppressUntil = -Infinity;
  const move = (id: number, x: number, y: number) => {
    if (!contact || contact.id !== id) return false;
    if (Math.hypot(x - contact.x, y - contact.y) > LOGO_TOUCH_SLOP) contact.dragged = true;
    return true;
  };
  return {
    start(id: number, x: number, y: number, now: number) {
      contact = { id, x, y, started: now, dragged: false }; suppressUntil = -Infinity;
    },
    move,
    finish(id: number, x: number, y: number, now: number, cancelled = false) {
      if (!move(id, x, y) || !contact) return false;
      suppressUntil = cancelled || contact.dragged || now - contact.started > LOGO_TAP_DURATION
        ? now + COMPATIBILITY_CLICK_WINDOW : -Infinity;
      contact = undefined;
      return true;
    },
    suppressClick(detail: number, now: number, pointerType?: string) {
      // A native keyboard activation has detail=0 and must never inherit touch suppression.
      return (detail > 0 || pointerType === 'touch' || pointerType === 'pen') && now <= suppressUntil;
    },
    reset() { contact = undefined; suppressUntil = -Infinity; },
  };
}
