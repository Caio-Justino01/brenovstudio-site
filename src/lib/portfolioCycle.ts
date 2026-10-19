type Blocker = 'offscreen' | 'hidden' | 'reduced' | 'pointer' | 'focus' | 'dialog' | 'manual';
type Clock = { schedule: (callback: () => void, delay: number) => unknown; cancel: (handle: unknown) => void };

/** One timer, no queued transitions or catch-up after a hidden tab. */
export class PortfolioCycle {
  private blockers = new Set<Blocker>(['offscreen']);
  private timer: unknown = null;
  private index = 0;
  private disposed = false;
  private count: number;
  private interval: number;
  private resume: number;
  private change: (index: number) => void;
  private clock: Clock;

  constructor(count: number, interval: number, resume: number, change: (index: number) => void, clock: Clock) {
    this.count = count; this.interval = interval; this.resume = resume; this.change = change; this.clock = clock;
  }

  private clear() {
    if (this.timer !== null) this.clock.cancel(this.timer);
    this.timer = null;
  }

  private arm(delay: number) {
    this.clear();
    if (this.disposed || this.blockers.size || this.count < 2) return;
    this.timer = this.clock.schedule(() => {
      this.timer = null;
      if (this.disposed || this.blockers.size) return;
      this.index = (this.index + 1) % this.count;
      this.change(this.index);
      this.arm(this.interval);
    }, delay);
  }

  hold(reason: Blocker, held: boolean) {
    if (this.disposed || this.blockers.has(reason) === held) return;
    if (held) { this.blockers.add(reason); this.clear(); }
    else {
      this.blockers.delete(reason);
      this.arm(['pointer', 'focus', 'dialog', 'manual'].includes(reason) ? this.resume : this.interval);
    }
  }

  select(index: number) {
    if (this.disposed || !Number.isInteger(index) || index < 0 || index >= this.count) return;
    this.index = index;
    this.change(index);
    this.arm(this.resume);
  }

  destroy() { this.disposed = true; this.clear(); this.blockers.clear(); }
}
