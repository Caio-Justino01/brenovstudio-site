/** One monotonic clock for both scenes, independent of their render cadence. */
export const atmosphereTime = () => performance.now() / 1000;
