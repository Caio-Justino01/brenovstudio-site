import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHoverTrail, MAX_HOVER_SEGMENTS } from '../src/lib/liquidHover.ts';

test('first hover stamps its point; fast motion keeps the entire segment', () => {
  const trail = createHoverTrail();
  trail.move(-.4, .2, true);
  trail.move(.4, -.2, true);
  assert.deepEqual(trail.take(), [
    { fromX: -.4, fromY: .2, toX: -.4, toY: .2 },
    { fromX: -.4, fromY: .2, toX: .4, toY: -.2 },
  ]);
  assert.deepEqual(trail.take(), []);
});
test('curves between frames keep their intermediate segments', () => {
  const trail = createHoverTrail();
  for (const [x, y] of [[0, 0], [.1, .2], [.2, -.2], [.3, 0]]) trail.move(x, y, true);
  const segments = trail.take();
  assert.equal(segments.length, 4);
  assert.deepEqual(segments[2], { fromX: .1, fromY: .2, toX: .2, toY: -.2 });
});
test('stopping does not repaint; leaving preserves queued stamps but breaks the next path', () => {
  const trail = createHoverTrail();
  trail.move(.1, .1, true);
  assert.equal(trail.move(.1, .1, true), false);
  assert.equal(trail.move(.10001, .1, true), false);
  trail.move(0, 0, false);
  trail.move(-.4, -.4, true);
  assert.deepEqual(trail.take(), [
    { fromX: .1, fromY: .1, toX: .1, toY: .1 },
    { fromX: -.4, fromY: -.4, toX: -.4, toY: -.4 },
  ]);
});
test('high input rates stay bounded and retain the latest endpoint', () => {
  const trail = createHoverTrail();
  for (let i = 0; i < 1000; i++) trail.move(i / 1000, 0, true);
  assert.equal(trail.pending, MAX_HOVER_SEGMENTS);
  const segments = trail.take();
  assert.equal(segments[0].fromX, 0);
  assert.equal(segments.at(-1)?.toX, .999);
});
test('restore discards pending motion; invalid input cannot bridge a new entry', () => {
  const trail = createHoverTrail();
  trail.move(0, 0, true); trail.reset();
  assert.equal(trail.pending, 0);
  trail.move(.1, .1, true); trail.move(NaN, 0, true); trail.take();
  trail.move(.3, .3, true);
  assert.deepEqual(trail.take(), [{ fromX: .3, fromY: .3, toX: .3, toY: .3 }]);
});
test('reentry stays disconnected even when the segment queue is full', () => {
  const trail = createHoverTrail();
  for (let i = 0; i < MAX_HOVER_SEGMENTS; i++) trail.move(i / 1000, 0, true);
  trail.move(0, 0, false);
  trail.move(-.4, .4, true);
  const segments = trail.take();
  assert.equal(segments.length, MAX_HOVER_SEGMENTS);
  assert.deepEqual(segments.at(-1), { fromX: -.4, fromY: .4, toX: -.4, toY: .4 });
  assert.ok(segments.slice(0, -1).every((segment) => segment.fromY === 0 && segment.toY === 0));
});
