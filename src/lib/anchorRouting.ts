/** Only a real, unhandled link requests alignment; browser traversal owns its saved scroll. */
export function createAnchorRouting(destinations: readonly string[]) {
  let explicit: string | null = null;
  return {
    link(hash: string) { explicit = destinations.includes(hash) ? hash : null; },
    traversal(hash: string) { if (explicit !== hash) explicit = null; },
    hashchange(hash: string) {
      const align = explicit === hash;
      explicit = null;
      return align;
    },
    cancel() { explicit = null; },
  };
}
