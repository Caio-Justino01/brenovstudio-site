import { EXIT_DURATION } from './exitDissolve.ts';
import { LIQUID_SPEED, LIQUID_STEP } from './liquidHover.ts';

export const ASSEMBLY_DURATION = 3;
// Skip the empty tail of the exit, so the opening starts with visible grains.
export const ASSEMBLY_REVERSE_FROM = 2.2;
export const REPLAY_INTERVALS = 13;
export const REPLAY_COLUMNS = 4;
export const REPLAY_ROWS = Math.ceil((REPLAY_INTERVALS + 1) / REPLAY_COLUMNS);

export function assemblyClock(progress: number) {
  return (1 - Math.max(0, Math.min(1, progress))) * ASSEMBLY_REVERSE_FROM;
}

/** Capture the same fixed physical steps as the live exit; no CPU pixel readback. */
export function assemblySamples() {
  const steps = Math.round(EXIT_DURATION * LIQUID_SPEED / LIQUID_STEP);
  return Array.from({ length: REPLAY_INTERVALS + 1 }, (_, frame) => Math.round(frame * steps / REPLAY_INTERVALS));
}

export function replayFrame(seconds: number) {
  const frame = Math.max(0, Math.min(REPLAY_INTERVALS, seconds / EXIT_DURATION * REPLAY_INTERVALS));
  const from = Math.min(REPLAY_INTERVALS - 1, Math.floor(frame));
  return { from, to: from + 1, blend: frame - from };
}
