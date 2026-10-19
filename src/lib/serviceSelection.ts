import type { ServiceId } from '../config/site';

/** Selection order also determines which service is explained in the preview. */
export function toggleService(selected: readonly ServiceId[], id: ServiceId): ServiceId[] {
  return selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id];
}
