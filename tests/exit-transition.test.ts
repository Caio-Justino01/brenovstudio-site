import test from 'node:test';
import assert from 'node:assert/strict';
import { createExitClock, createExitTransition, runIndexExit } from '../src/lib/exitTransition.ts';
import { createLiquidClock, LIQUID_SPEED, LIQUID_STEP } from '../src/lib/liquidHover.ts';
import { EXIT_DURATION, EXIT_HANDOFF } from '../src/lib/exitDissolve.ts';
import { restoreBypassedOpening } from '../src/lib/opening.ts';

test('acionamentos duplicados compartilham Promise e a passagem ocorre uma vez', async () => {
  const exit = createExitTransition(); let covers = 0;
  const promise = exit.start(() => covers++);
  assert.equal(exit.start(() => { covers += 100; }), promise);
  exit.cover(); exit.cover(); assert.equal(covers, 1);
  exit.finish(); await promise; assert.equal(exit.active, false);
});

test('falha ou movimento reduzido antes do midpoint ainda entrega o índice', async () => {
  const steps: string[] = [];
  await runIndexExit(async () => {}, () => true, () => steps.push('index'), () => steps.push('reveal'));
  assert.deepEqual(steps, ['index', 'reveal']);
});
test('cancelamento não força o destino, e callback repetido não duplica a navegação', async () => {
  let active = true; const steps: string[] = [];
  await runIndexExit(async () => { active = false; }, () => active, () => steps.push('index'), () => steps.push('reveal'));
  assert.deepEqual(steps, []);
  active = true;
  await runIndexExit(async (cover) => { cover(); cover(); }, () => active, () => steps.push('index'), () => steps.push('reveal'));
  assert.deepEqual(steps, ['index', 'reveal']);
});
test('interrupção ou descarte resolve sem navegar e não deixa callback para o próximo ciclo', async () => {
  const exit = createExitTransition(); let covers = 0;
  const cancelled = exit.start(() => covers++);
  exit.finish(); exit.cover(); await cancelled; assert.equal(covers, 0);
  const next = exit.start(() => covers++); exit.cover(); exit.finish(); await next;
  assert.equal(covers, 1);
});

test('desprendimento acompanha o tempo físico em cadências de 16, 50 e 200 ms', () => {
  for (const delta of [.016, .05, .2]) {
    const clock = createExitClock(EXIT_DURATION, EXIT_HANDOFF);
    const physics = createLiquidClock();
    clock.start();
    let steps = 0, previous = 0, handoff = false;
    for (let frame = 0; frame < 300; frame++) {
      const state = clock.advance(delta);
      steps += physics.advance(delta);
      assert.ok(state.seconds - previous <= .05 + 1e-9, `sem salto com delta de ${delta}s`);
      assert.ok(state.seconds * LIQUID_SPEED <= steps * LIQUID_STEP + LIQUID_STEP + 1e-9,
        'idade não ultrapassa a integração além do resto de um passo');
      if (state.covered && !handoff) {
        assert.ok(state.seconds >= EXIT_HANDOFF && state.seconds <= EXIT_HANDOFF + .05 + 1e-9);
        handoff = true;
      }
      previous = state.seconds;
      if (state.complete) { assert.equal(state.seconds, EXIT_DURATION); break; }
    }
    assert.equal(handoff, true);
    assert.equal(clock.advance(0).complete, true);
  }
});

test('pausa não acumula tempo e cancelamento reinicia a saída sem handoff pendente', () => {
  const clock = createExitClock(EXIT_DURATION, EXIT_HANDOFF);
  clock.start();
  for (let i = 0; i < 20; i++) clock.advance(.05);
  const beforePause = clock.advance(0);
  // Aba oculta não chama advance; a retomada rejeita o intervalo suspenso.
  assert.equal(clock.advance(.2).seconds, beforePause.seconds + .05);
  clock.reset();
  assert.deepEqual(clock.advance(.2), { seconds: 0, progress: 0, covered: false, complete: false });
  clock.start();
  assert.equal(clock.advance(.016).seconds, .016);
});

test('cadência baixa preserva callback único, Promise e conclusão após tempo integrado', async () => {
  const clock = createExitClock(EXIT_DURATION, EXIT_HANDOFF), exit = createExitTransition();
  let covered = 0, finished = false;
  clock.start();
  const promise = exit.start(() => { covered++; });
  void promise.then(() => { finished = true; });
  assert.equal(exit.start(), promise);
  for (let i = 0; i < 13; i++) {
    const state = clock.advance(.2);
    if (state.covered) exit.cover();
    if (state.complete) exit.finish();
  }
  await Promise.resolve();
  assert.equal(finished, false, '2,6 segundos de parede não encerram uma simulação de apenas 650 ms');
  assert.equal(covered, 0);
  for (let i = 0; i < 40; i++) {
    const state = clock.advance(.2);
    if (state.covered) exit.cover();
    if (state.complete) exit.finish();
  }
  await promise;
  assert.equal(covered, 1);
  assert.equal(finished, true);
  assert.equal(exit.active, false);
});

test('CTA durante formação tardia mantém a dissolução ativa após consumir a abertura no handoff', async () => {
  const exit = createExitTransition();
  const clock = createExitClock(EXIT_DURATION, EXIT_HANDOFF);
  let openingPending = true, exiting = true, restored = 0, settled = false;
  const scene = { restore() { restored++; exit.finish(); } };
  const steps: string[] = [];
  const run = runIndexExit((covered) => { clock.start(); return exit.start(covered); }, () => exiting,
    () => {
      steps.push('index'); openingPending = false;
      restoreBypassedOpening(scene, openingPending, exiting);
    }, () => steps.push('reveal'));
  void run.then(() => { settled = true; });
  for (let i = 0; i < 39; i++) {
    const state = clock.advance(.05);
    if (state.covered) exit.cover();
  }
  await Promise.resolve();
  assert.equal(openingPending, false);
  assert.equal(restored, 0, 'troca do fundo não restaura a cena durante a saída');
  assert.equal(exit.active, true);
  assert.equal(settled, false, 'handoff não corta a dissipação final');
  assert.deepEqual(steps, ['index']);
  for (let i = 0; i < 12; i++) {
    const state = clock.advance(.05);
    if (state.covered) exit.cover();
    if (state.complete) exit.finish();
  }
  await run;
  assert.deepEqual(steps, ['index', 'reveal']);
  assert.equal(restored, 0);
  exiting = false;
  // An explicit cancellation/return still restores normally once exit ownership is released.
  restoreBypassedOpening(scene, openingPending, exiting);
  assert.equal(restored, 1);
});
