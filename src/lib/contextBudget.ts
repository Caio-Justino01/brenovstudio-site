/** Reservations include pending imports, so concurrent initialization cannot exceed the GPU budget. */
export class ContextBudget {
  private active = 0;
  private draining = false;
  private queue: { start: () => void; live: boolean; active: boolean }[] = [];
  readonly limit: number;
  constructor(limit = 6) { this.limit = limit; }
  get activeCount() { return this.active; }
  get waitingCount() { return this.queue.filter(item => item.live).length; }
  request(start: () => void) {
    const item = { start, live: true, active: false };
    const release = () => {
      if (!item.live) return;
      item.live = false;
      if (item.active) { item.active = false; this.active--; }
      this.queue = this.queue.filter(entry => entry.live);
      this.drain();
    };
    this.queue.push(item);
    this.drain();
    return release;
  }
  private drain() {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.active < this.limit && this.queue.length) {
        const item = this.queue.shift()!;
        if (!item.live) continue;
        item.active = true; this.active++;
        try { item.start(); }
        catch { item.active = false; item.live = false; this.active--; }
      }
    } finally { this.draining = false; }
  }
}
