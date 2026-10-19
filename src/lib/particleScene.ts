import {
  BufferAttribute, Color, DataTexture, FloatType, HalfFloatType, InstancedBufferAttribute,
  InstancedBufferGeometry, LinearFilter, Mesh, NearestFilter, OrthographicCamera, PlaneGeometry,
  RGBAFormat, Scene, ShaderMaterial, SRGBColorSpace, Texture, Vector2, Vector3, Vector4, WebGLRenderer,
} from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { gsap } from 'gsap';
import { createLiquidPulse } from './liquidMotion';
import { inverseLogoPoint, logoTransform, type LogoTransform } from './logoMotion';
import { EXIT_DURATION, EXIT_HANDOFF, exitFocus } from './exitDissolve';
import { ASSEMBLY_DURATION, ASSEMBLY_REVERSE_FROM, assemblyClock, replayFrame } from './assemblyMotion';
import { bakeAssemblyReplay } from './assemblyReplay';
import { releaseRenderer, resizeDrawingBuffer } from './graphicsResources';
import { createFrameResizeObserver } from './frameResizeObserver';
import { createSpaceDust } from './spaceDust';
import { atmosphereTime } from './atmosphere';
import { createShakeDust } from './shakeDust';
import { createExitClock, createExitTransition } from './exitTransition';
import { createHoverTrail, createLiquidClock, HOVER_FIELD_SIZE, HOVER_LIFETIME, LIQUID_STEP, MAX_HOVER_SEGMENTS } from './liquidHover';
import { hoverShader, imageFragment, imageVertex, particleFragment, particleVertex, simulationShader } from './liquidShaders';

export type ParticleController = {
  disturb: (x?: number, y?: number) => void;
  burst: (onCovered?: () => void) => Promise<void>;
  restore: () => void;
  pointer: (x: number, y: number, active: boolean) => void;
  dispose: () => void;
};
type SceneOptions = {
  host: HTMLElement; image: HTMLImageElement; onFailure: (reason?: unknown) => void;
  onFormationComplete: () => void; opening: () => boolean; signal?: AbortSignal;
};

function sampleLogo(image: HTMLImageElement, requested: number) {
  const size = 900;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Não foi possível ler a logo.');
  context.drawImage(image, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;
  const candidates: number[] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) > 32) candidates.push(i);
  }
  if (candidates.length < 100) throw new Error('A logo não contém pontos suficientes.');
  return { size, pixels, candidates, count: Math.min(requested, candidates.length) };
}

export async function createParticleScene({ host, image, onFailure, onFormationComplete, opening, signal }: SceneOptions): Promise<ParticleController> {
  await image.decode();
  if (signal?.aborted) throw new DOMException('Inicialização cancelada.', 'AbortError');
  const playOpening = opening();
  const compact = matchMedia('(pointer: coarse)').matches || host.clientWidth < 768;
  const samples = sampleLogo(image, compact ? 36000 : 100000);
  const side = Math.ceil(Math.sqrt(samples.count));
  const homeData = new Float32Array(side * side * 4);
  const lookups = new Float32Array(samples.count * 2);
  const colors = new Float32Array(samples.count * 3);
  const color = new Color();
  let seed = 317;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < samples.count; i++) {
    const index = samples.candidates[Math.floor((i + random()) * samples.candidates.length / samples.count)];
    const pixel = index / 4;
    homeData.set([((pixel % samples.size) + .5) / samples.size - .5,
      .5 - (Math.floor(pixel / samples.size) + .5) / samples.size, random(), 1], i * 4);
    lookups.set([(i % side + .5) / side, (Math.floor(i / side) + .5) / side], i * 2);
    color.setRGB(samples.pixels[index] / 255, samples.pixels[index + 1] / 255, samples.pixels[index + 2] / 255, SRGBColorSpace);
    color.toArray(colors, i * 3);
  }

  const renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x050505, 0);
  const gl = renderer.getContext();
  if (!gl.getExtension('EXT_color_buffer_float')) { releaseRenderer(renderer); throw new Error('A GPU não oferece renderização de partículas em ponto flutuante.'); }
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const home = new DataTexture(homeData, side, side, RGBAFormat, FloatType);
  home.minFilter = home.magFilter = NearestFilter;
  home.needsUpdate = true;
  const gpu = new GPUComputationRenderer(side, side, renderer);
  gpu.setDataType(HalfFloatType);
  const initial = gpu.createTexture();
  const variable = gpu.addVariable('textureState', simulationShader, initial);
  gpu.setVariableDependencies(variable, [variable]);
  const field = new GPUComputationRenderer(HOVER_FIELD_SIZE, HOVER_FIELD_SIZE, renderer);
  field.setDataType(HalfFloatType);
  const fieldInitial = field.createTexture();
  const wakeVariable = field.addVariable('textureWake', hoverShader, fieldInitial);
  wakeVariable.minFilter = wakeVariable.magFilter = LinearFilter;
  field.setVariableDependencies(wakeVariable, [wakeVariable]);
  const sim = {
    uHome: { value: home }, uDt: { value: LIQUID_STEP * 60 }, uTime: { value: 0 }, uLiquidTime: { value: 0 }, uEnergy: { value: 0 }, uMaterial: { value: 0 },
    uWake: { value: fieldInitial as Texture },
    uSize: { value: 1 }, uRadius: { value: 1 }, uMaxSpeed: { value: compact ? 3 : 5 },
    uOrigin: { value: new Vector2() }, uGesture: { value: new Vector2(1, .35) },
    uExit: { value: 0 }, uBurst: { value: 0 }, uRoll: { value: 0 },
    uViewport: { value: new Vector2(1, 1) }, uCenter: { value: new Vector2() }, uHover: { value: new Vector2() },
  };
  Object.assign(variable.material.uniforms, sim);
  const fieldUniforms = {
    uDt: { value: 1 / 60 }, uSize: sim.uSize, uRadius: sim.uRadius, uSegmentCount: { value: 0 },
    uSegments: { value: Array.from({ length: MAX_HOVER_SEGMENTS }, () => new Vector4()) },
  };
  Object.assign(wakeVariable.material.uniforms, fieldUniforms);
  const logoTexture = new Texture(image);
  logoTexture.colorSpace = SRGBColorSpace;
  logoTexture.needsUpdate = true;
  const firstIntroFrame = replayFrame(ASSEMBLY_REVERSE_FROM);
  const uniforms = {
    uState: { value: initial as Texture }, uHome: { value: home }, uImage: { value: logoTexture },
    uTime: sim.uTime, uEnergy: sim.uEnergy, uSize: sim.uSize, uOrigin: sim.uOrigin, uRadius: sim.uRadius, uWake: sim.uWake,
    uCenter: sim.uCenter, uHover: sim.uHover, uRoll: sim.uRoll, uLook: { value: new Vector2() },
    uViewport: sim.uViewport, uDot: { value: 1.8 }, uDpr: { value: 1 },
    uMorph: { value: playOpening ? 0 : 1 }, uBurst: sim.uBurst, uMaterial: sim.uMaterial, uExit: sim.uExit, uFocusScale: { value: 1 },
    uIntro: { value: playOpening ? 1 : 0 }, uIntroClock: { value: ASSEMBLY_REVERSE_FROM }, uIntroAtlas: { value: initial as Texture },
    uIntroFrames: { value: new Vector3(firstIntroFrame.from, firstIntroFrame.to, firstIntroFrame.blend) },
    uAtmosphereTime: { value: atmosphereTime() }, uBackgroundOpacity: { value: 1 },
  };
  const geometry = new InstancedBufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,-1,1,0,1,1,0]), 3));
  geometry.setIndex([0,1,2,2,1,3]);
  geometry.setAttribute('aLookup', new InstancedBufferAttribute(lookups, 2));
  geometry.setAttribute('aColor', new InstancedBufferAttribute(colors, 3));
  geometry.instanceCount = samples.count;
  const particleMaterial = new ShaderMaterial({ uniforms, vertexShader: particleVertex, fragmentShader: particleFragment,
    transparent: true, depthTest: false, depthWrite: false });
  const plane = new PlaneGeometry(1, 1);
  const imageMaterial = new ShaderMaterial({ uniforms, vertexShader: imageVertex, fragmentShader: imageFragment,
    transparent: true, depthTest: false, depthWrite: false });
  const scene = new Scene();
  const crisp = new Mesh(plane, imageMaterial);
  const particles = new Mesh(geometry, particleMaterial);
  crisp.renderOrder = 1; particles.renderOrder = 2;
  for (const mesh of [crisp, particles]) { mesh.frustumCulled = false; scene.add(mesh); }
  const camera = new OrthographicCamera(-1, 1, 1, -1, .1, 3000);
  camera.position.z = 1000;
  const dust = createSpaceDust(renderer, { ...uniforms, uGesture: sim.uGesture }, compact, homeData, side, samples.count, random);
  scene.add(dust.ambient, dust.detached);
  const trigger = host.parentElement?.querySelector<HTMLElement>('[data-logo-trigger]');
  let disposed = false, inView = true, frame = 0, lastTime = 0, elapsed = 0;
  let phase: 'assembling' | 'living' | 'liquid' | 'bursting' | 'exited' = 'assembling';
  let formationNotified = false;
  const exit = createExitTransition();
  const exitClock = createExitClock(EXIT_DURATION, EXIT_HANDOFF);
  const shake = createShakeDust(compact);
  let overlay: HTMLDivElement | undefined;
  const frozenCenter = new Vector2();
  const layoutCenter = new Vector2();
  let replay: Awaited<ReturnType<typeof bakeAssemblyReplay>> | undefined;
  let replayBakeMs = 0;
  let frozenTransform: LogoTransform = { x: 0, y: 0, angle: 0 };
  let tailSegments: ReturnType<ReturnType<typeof createHoverTrail>['take']> = [];
  const pulse = createLiquidPulse();
  const hoverTrail = createHoverTrail();
  const liquidClock = createLiquidClock();
  let hoverRemaining = 0, hoverStamps = 0;
  const lookTarget = new Vector2(), hoverTarget = new Vector2(), hoverCurrent = new Vector2(), previousPointer = new Vector2();
  const gestureTarget = new Vector2(1, .35), reactionDirection = new Vector2();
  let transform: LogoTransform = { x: 0, y: 0, angle: 0 };
  let lastStroke = -100, reactionStart = -100, reactionPending = false;
  const clickedHome = new Vector2();
  let pointerPresent = false;
  let dustStarted = false;
  const setPhase = (next: typeof phase) => {
    phase = next;
    // A living logo has already cleared its material and wake. Only the crisp image contributes.
    particles.visible = next !== 'living' && next !== 'exited';
    renderer.domElement.dataset.phase = next;
    if (next === 'living' && !formationNotified && !disposed) { formationNotified = true; onFormationComplete(); }
  };
  const clearReplay = () => {
    uniforms.uIntro.value = 0; uniforms.uIntroClock.value = 0; uniforms.uIntroAtlas.value = initial;
    replay?.dispose(); replay = undefined;
  };
  const assembly = gsap.to(uniforms.uMorph, { value: 1, duration: ASSEMBLY_DURATION, ease: 'none', paused: true,
    onComplete: () => {
      clearReplay(); uniforms.uFocusScale.value = 1; uniforms.uCenter.value.copy(layoutCenter); setPhase('living');
    } });
  const clearWake = () => {
    hoverTrail.reset(); hoverRemaining = 0;
    fieldUniforms.uSegmentCount.value = 0;
    for (const target of wakeVariable.renderTargets) field.renderTexture(fieldInitial, target);
    sim.uWake.value = field.getCurrentRenderTarget(wakeVariable).texture;
  };
  const clearState = () => {
    for (const target of variable.renderTargets) gpu.renderTexture(initial, target);
    pulse.reset(); sim.uEnergy.value = 0; uniforms.uMaterial.value = 0;
    liquidClock.reset();
    clearWake();
  };
  const detachOverlay = () => {
    if (!overlay) return;
    host.append(renderer.domElement); overlay.remove(); overlay = undefined;
    renderer.setClearAlpha(0); uniforms.uBackgroundOpacity.value = 1;
  };
  const cancelExit = () => { exitClock.reset(); exit.finish(); detachOverlay(); };
  const resize = () => {
    if (disposed) return;
    const bounds = (overlay ?? host).getBoundingClientRect(), logo = image.getBoundingClientRect();
    const width = Math.max(1, bounds.width), height = Math.max(1, bounds.height);
    const mobile = width < 768;
    const dpr = Math.min(devicePixelRatio || 1, mobile || compact ? 1.5 : 2, Math.sqrt(3000000 / (width * height)));
    resizeDrawingBuffer(renderer, width, height, dpr);
    camera.left = -width / 2; camera.right = width / 2; camera.top = height / 2; camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    uniforms.uViewport.value.set(width, height);
    sim.uSize.value = logo.width;
    sim.uMaxSpeed.value = mobile || compact ? 3 : 5;
    sim.uRadius.value = Math.min(mobile ? 88 : 150, Math.max(mobile ? 44 : 72, logo.width * .19));
    sim.uOrigin.value.copy(clickedHome).multiplyScalar(logo.width);
    uniforms.uCenter.value.set(logo.left + logo.width / 2 - bounds.left - width / 2,
      height / 2 - (logo.top + logo.height / 2 - bounds.top));
    layoutCenter.copy(uniforms.uCenter.value);
    if (overlay) uniforms.uCenter.value.copy(frozenCenter);
    uniforms.uDot.value = Math.max(.9, logo.width / samples.size * 1.7);
    uniforms.uDpr.value = dpr;
  };
  const render = (now: number) => {
    frame = 0;
    if (disposed || (!inView && phase !== 'bursting') || document.hidden) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 1 / 60;
    lastTime = now; elapsed += dt; sim.uTime.value = elapsed;
    const burstFrame = phase === 'bursting' ? exitClock.advance(dt) : undefined;
    if (burstFrame) {
      uniforms.uBurst.value = burstFrame.progress;
      uniforms.uBackgroundOpacity.value = 1 - Math.min(1, Math.max(0, (burstFrame.seconds - EXIT_HANDOFF) / .3));
    }
    uniforms.uAtmosphereTime.value = atmosphereTime();
    const amount = 1 - Math.exp(-dt * 5);
    uniforms.uLook.value.lerp(lookTarget, amount);
    hoverCurrent.lerp(hoverTarget, amount);
    sim.uGesture.value.lerp(gestureTarget, 1 - Math.exp(-dt / .18));
    if (reactionPending && elapsed - lastStroke > .18) {
      reactionStart = elapsed; reactionPending = false;
      reactionDirection.copy(sim.uGesture.value).normalize().multiplyScalar(-1);
    }
    if (phase !== 'bursting') {
      transform = logoTransform(elapsed, uniforms.uViewport.value.x < 768, hoverCurrent.x, hoverCurrent.y,
        elapsed - reactionStart, reactionDirection.x, reactionDirection.y);
      uniforms.uHover.value.set(transform.x, transform.y); uniforms.uRoll.value = transform.angle;
      if (phase === 'assembling' && uniforms.uIntro.value > .5) {
        uniforms.uIntroClock.value = assemblyClock(uniforms.uMorph.value);
        const sample = replayFrame(uniforms.uIntroClock.value);
        uniforms.uIntroFrames.value.set(sample.from, sample.to, sample.blend);
        const focus = exitFocus(uniforms.uIntroClock.value, sim.uSize.value,
          uniforms.uViewport.value.x, uniforms.uViewport.value.y);
        uniforms.uFocusScale.value = focus.scale;
        uniforms.uCenter.value.copy(layoutCenter).multiplyScalar(1 - focus.progress);
        uniforms.uHover.value.multiplyScalar(1 - focus.progress);
        uniforms.uRoll.value *= 1 - focus.progress;
      }
    } else {
      const focus = exitFocus(uniforms.uBurst.value * EXIT_DURATION, sim.uSize.value,
        uniforms.uViewport.value.x, uniforms.uViewport.value.y);
      uniforms.uFocusScale.value = focus.scale;
      uniforms.uCenter.value.copy(frozenCenter).multiplyScalar(1 - focus.progress);
      uniforms.uHover.value.set(frozenTransform.x, frozenTransform.y).multiplyScalar(1 - focus.progress);
      uniforms.uRoll.value = frozenTransform.angle * (1 - focus.progress);
    }
    if (trigger) trigger.style.transform = `translate(-50%, -50%) translate(${transform.x}px, ${-transform.y}px) rotate(${-transform.angle}rad)`;
    const state = pulse.advance(dt);
    const segments = hoverTrail.take();
    if (segments.length) { hoverRemaining = HOVER_LIFETIME; hoverStamps += segments.length; }
    if (hoverRemaining > 0) {
      hoverRemaining = Math.max(0, hoverRemaining - dt);
      fieldUniforms.uDt.value = dt;
      fieldUniforms.uSegmentCount.value = segments.length;
      segments.forEach((segment, i) => fieldUniforms.uSegments.value[i].set(segment.fromX, segment.fromY, segment.toX, segment.toY));
      field.compute();
      sim.uWake.value = field.getCurrentRenderTarget(wakeVariable).texture;
    }
    sim.uEnergy.value = phase === 'liquid' ? state.energy : 0;
    uniforms.uMaterial.value = phase === 'liquid' ? state.material : 0;
    if (phase === 'liquid' && !state.active && hoverRemaining === 0) { clearState(); setPhase('living'); }
    if (phase === 'liquid' || phase === 'bursting') {
      const steps = liquidClock.advance(dt);
      for (let i = 0; i < steps; i++) { sim.uLiquidTime.value += LIQUID_STEP; gpu.compute(); }
    }
    uniforms.uState.value = gpu.getCurrentRenderTarget(variable).texture;
    const idle = logoTransform(elapsed, uniforms.uViewport.value.x < 768, 0, 0, 3, 0, 0);
    const distance = segments.reduce((sum, segment) => sum + Math.hypot(segment.toX - segment.fromX, segment.toY - segment.fromY) * sim.uSize.value, 0);
    const shedding = shake.advance(dt, transform.x - idle.x, transform.y - idle.y, distance, elapsed, phase === 'liquid');
    if (segments.length) { const last = segments[segments.length - 1]; tailSegments = [{ fromX: last.toX, fromY: last.toY, toX: last.toX, toY: last.toY }]; }
    const dustSegments = segments.length ? segments : tailSegments;
    if (phase === 'liquid' && shedding.amount > 0 && dustSegments.length) {
      dust.emit(dustSegments, elapsed, sim.uSize.value, sim.uRadius.value, shedding.amount);
      dustStarted = true;
    }
    // Before the first emission (or after restore), every pool position is known to be inactive.
    // Once emitted, keep stepping through all settling/fades instead of guessing GPU half-float ages.
    if (dustStarted) dust.step(dt);
    renderer.render(scene, camera);
    if (import.meta.env.DEV) {
      host.dataset.liquidDebug = JSON.stringify({ phase, count: samples.count, age: state.age,
        energy: sim.uEnergy.value, material: uniforms.uMaterial.value, hover: uniforms.uHover.value.toArray(),
        origin: sim.uOrigin.value.toArray(), radiusPx: sim.uRadius.value,
        hoverRemaining, hoverStamps, segments: segments.length, clickActive: state.active,
        limitPx: sim.uRadius.value * .65, transform, gesture: sim.uGesture.value.toArray(),
        speedLimit: sim.uMaxSpeed.value, dust: dust.stats(elapsed), shake: shedding.energy, burst: uniforms.uBurst.value,
        morph: uniforms.uMorph.value, assemblyPaused: assembly.paused(), focusScale: uniforms.uFocusScale.value,
        introClock: uniforms.uIntroClock.value, replay: Boolean(replay), replayBakeMs });
    }
    if (burstFrame) {
      if (burstFrame.covered) exit.cover();
      if (disposed || phase !== 'bursting') return;
      if (burstFrame.complete) {
        crisp.visible = particles.visible = false; setPhase('exited');
        detachOverlay(); resize(); exit.finish(); syncPlayback();
        return;
      }
    }
    frame = requestAnimationFrame(render);
  };
  const syncPlayback = () => {
    const active = (inView || phase === 'bursting') && !document.hidden;
    if (!active) { hoverTrail.reset(); pointerPresent = false; hoverTarget.set(0, 0); lookTarget.set(0, 0); }
    assembly.paused(!active || phase !== 'assembling');
    if (active && !frame) { lastTime = 0; frame = requestAnimationFrame(render); }
    else if (!active && frame) { cancelAnimationFrame(frame); frame = 0; }
  };
  const restore = () => {
    if (disposed) return;
    assembly.kill(); clearReplay(); cancelExit(); clearState();
    dust.clear(); dustStarted = false; shake.reset(); tailSegments = []; reactionStart = -100; reactionPending = false; hoverTarget.set(0, 0); hoverCurrent.set(0, 0);
    pointerPresent = false;
    uniforms.uMorph.value = 1; uniforms.uBurst.value = 0; uniforms.uExit.value = 0; uniforms.uFocusScale.value = 1;
    crisp.visible = particles.visible = true;
    resize(); setPhase('living'); syncPlayback();
  };
  const observer = createFrameResizeObserver(resize);
  const visibility = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !inView && phase === 'exited') restore();
    inView = entry.isIntersecting; syncPlayback();
  });
  const contextLost = (event: Event) => { event.preventDefault(); onFailure(new Error('O contexto WebGL da cena foi perdido.')); };
  const dispose = () => {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frame); assembly.kill(); clearReplay(); cancelExit();
    observer.disconnect(); visibility.disconnect();
    document.removeEventListener('visibilitychange', syncPlayback);
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    dust.dispose(); gpu.dispose(); field.dispose(); home.dispose(); logoTexture.dispose(); geometry.dispose(); plane.dispose();
    particleMaterial.dispose(); imageMaterial.dispose(); releaseRenderer(renderer);
    renderer.domElement.remove();
    if (trigger) trigger.style.transform = '';
    if (import.meta.env.DEV) { delete host.dataset.liquidDebug; delete host.dataset.sandDebug; }
  };
  try {
    let shaderFailed = false;
    renderer.debug.onShaderError = () => { shaderFailed = true; };
    const error = field.init() ?? gpu.init();
    if (error) throw new Error(error);
    dust.init();
    for (const target of [gpu.getCurrentRenderTarget(variable), field.getCurrentRenderTarget(wakeVariable)]) {
      renderer.setRenderTarget(target);
      const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      renderer.setRenderTarget(null);
      if (!complete) throw new Error('Framebuffer da simulação incompleto.');
    }
    host.append(renderer.domElement);
    resize();
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    field.compute(); gpu.compute(); clearState();
    if (playOpening && opening()) {
      const started = performance.now();
      replay = await bakeAssemblyReplay(renderer, gpu, variable, side, sim.uSize.value, signal);
      replayBakeMs = performance.now() - started;
      uniforms.uIntroAtlas.value = replay.texture;
      clearState();
    } else { clearReplay(); uniforms.uMorph.value = 1; }
    renderer.render(scene, camera);
    if (shaderFailed) throw new Error('A GPU não conseguiu compilar a cena líquida.');
    if (signal?.aborted) throw new DOMException('Inicialização cancelada.', 'AbortError');
    observer.observe(host); visibility.observe(host); resize();
    document.addEventListener('visibilitychange', syncPlayback);
    setPhase('assembling'); assembly.play(); syncPlayback();
  } catch (error) { dispose(); throw error; }

  return {
    disturb(x, y) {
      if (disposed || phase === 'bursting' || phase === 'exited') return;
      assembly.kill(); uniforms.uMorph.value = 1;
      const bounds = image.getBoundingClientRect();
      const point = inverseLogoPoint(x === undefined ? transform.x : x - bounds.left - bounds.width / 2,
        y === undefined ? transform.y : bounds.height / 2 - (y - bounds.top), transform);
      clickedHome.set(point.x / bounds.width, point.y / bounds.width);
      sim.uOrigin.value.copy(clickedHome).multiplyScalar(sim.uSize.value);
      uniforms.uExit.value = 0;
      pulse.start(); setPhase('liquid'); syncPlayback();
    },
    burst(onCovered) {
      if (disposed) return Promise.resolve();
      if (exit.active) return exit.start();
      if (phase === 'exited') return Promise.resolve();
      assembly.kill(); clearReplay(); cancelExit(); pulse.reset(); hoverTrail.reset();
      pointerPresent = false; reactionPending = false; hoverTarget.set(0, 0);
      uniforms.uMorph.value = 1; uniforms.uExit.value = 1; uniforms.uBurst.value = 0;
      const logo = image.getBoundingClientRect();
      frozenTransform = { ...transform };
      frozenCenter.set(logo.left + logo.width / 2 - innerWidth / 2, innerHeight / 2 - logo.top - logo.height / 2);
      overlay = document.createElement('div'); overlay.className = 'experience-transition'; overlay.setAttribute('aria-hidden', 'true');
      document.body.append(overlay); overlay.append(renderer.domElement); renderer.setClearAlpha(0); resize();
      setPhase('bursting');
      const promise = exit.start(onCovered);
      exitClock.start();
      syncPlayback();
      return promise;
    },
    pointer(x, y, active) {
      if (disposed) return;
      const bounds = host.getBoundingClientRect(), logo = image.getBoundingClientRect();
      if (!active) {
        lookTarget.set(0, 0); hoverTarget.set(0, 0); pointerPresent = false;
        hoverTrail.move(0, 0, false);
        return;
      }
      lookTarget.set((x - bounds.left) / bounds.width * 2 - 1, 1 - (y - bounds.top) / bounds.height * 2);
      const point = inverseLogoPoint(x - logo.left - logo.width / 2, logo.height / 2 - (y - logo.top), transform);
      const nx = point.x / logo.width * 2, ny = point.y / logo.height * 2;
      const overLogo = Math.abs(nx) <= 1 && Math.abs(ny) <= 1;
      hoverTarget.set(overLogo ? nx : 0, overLogo ? ny : 0);
      const eligible = overLogo && (phase === 'living' || phase === 'liquid');
      if (hoverTrail.move(nx * .5, ny * .5, eligible)) {
        hoverRemaining = HOVER_LIFETIME;
        lastStroke = elapsed; reactionPending = true;
        if (phase === 'living') setPhase('liquid');
      }
      if (pointerPresent && phase === 'liquid') {
        const dx = x - previousPointer.x, dy = previousPointer.y - y;
        if (Math.hypot(dx, dy) > 1) gestureTarget.set(dx, dy).normalize();
      }
      previousPointer.set(x, y); pointerPresent = true;
    },
    restore, dispose,
  };
}
