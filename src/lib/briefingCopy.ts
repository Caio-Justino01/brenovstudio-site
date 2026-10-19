type CopyCallbacks = { copied: () => void; manual: () => void };

/** Only the current briefing and latest copy attempt may update its result. */
export class BriefingCopy {
  private version = 0;
  private disposed = false;
  private write: (message: string) => Promise<void>;
  private callbacks: CopyCallbacks;

  constructor(write: (message: string) => Promise<void>, callbacks: CopyCallbacks) {
    this.write = write;
    this.callbacks = callbacks;
  }

  invalidate() { this.version++; }
  dispose() { this.disposed = true; this.invalidate(); }

  async copy(message: string) {
    if (this.disposed) return;
    const version = ++this.version;
    const current = () => !this.disposed && this.version === version;
    try {
      await this.write(message);
    } catch {
      if (current()) this.callbacks.manual();
      return;
    }
    if (current()) this.callbacks.copied();
  }
}
