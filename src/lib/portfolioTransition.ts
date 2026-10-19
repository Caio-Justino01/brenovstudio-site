/** Reorder a crossfade without changing the composite already on screen. */
export function rebasePortfolioLayers(order: readonly number[], opacities: readonly number[], target: number) {
  const weights = new Array<number>(opacities.length).fill(0);
  let remaining = 1;
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i], alpha = Math.max(0, Math.min(1, opacities[id]));
    weights[id] = alpha * remaining;
    remaining *= 1 - alpha;
  }
  const nextOrder = [...order.filter(id => id !== target), target];
  const nextOpacities = new Array<number>(opacities.length).fill(0);
  remaining = 1;
  for (let i = nextOrder.length - 1; i >= 0; i--) {
    const id = nextOrder[i];
    nextOpacities[id] = remaining > 1e-9 ? Math.max(0, Math.min(1, weights[id] / remaining)) : 0;
    remaining = Math.max(0, remaining - weights[id]);
  }
  return { order: nextOrder, opacities: nextOpacities };
}
