export function createShakeDust(compact: boolean) {
  let previous: { x: number; y: number } | undefined;
  let vx = 0, vy = 0, energy = 0, credit = 0, lastMotion = -100;
  let allowance = 0;
  let recent: number[] = [];
  const ceiling = compact ? 20 : 40;
  return {
    advance(dt: number, x: number, y: number, distance: number, time: number, disturbed: boolean) {
      dt = Math.max(.001, Math.min(.05, dt));
      const nx = previous ? (x - previous.x) / dt : 0, ny = previous ? (y - previous.y) / dt : 0;
      const factor = compact ? .5 : 1;
      const speed = Math.hypot(nx, ny) / (25 * factor);
      const acceleration = Math.hypot(nx - vx, ny - vy) / dt / (180 * factor);
      const target = disturbed ? Math.min(1, speed * .6 + acceleration * .4) : 0;
      energy += (target - energy) * (1 - Math.exp(-dt / (target > energy ? .15 : .6)));
      previous = { x, y }; vx = nx; vy = ny;
      if (distance > 0) lastMotion = time;
      allowance = Math.min(ceiling * .1, allowance + dt * ceiling);
      if (disturbed) {
        credit += Math.max(0, distance) * (.04 + .12 * energy);
        if (distance === 0 && time - lastMotion <= .6) credit += energy * (compact ? 6 : 12) * dt;
      }
      recent = recent.filter((stamp) => time - stamp < 1 - 1e-9);
      const demand = Math.floor(credit + 1e-9);
      const amount = Math.min(demand, Math.floor(allowance + 1e-9), ceiling - recent.length);
      // Drop excess demand instead of releasing a delayed pile of grains.
      credit = Math.max(0, credit - demand); allowance = Math.max(0, allowance - amount);
      for (let i = 0; i < amount; i++) recent.push(time);
      return { amount, energy };
    },
    reset() { previous = undefined; vx = vy = energy = credit = allowance = 0; lastMotion = -100; recent = []; },
  };
}
