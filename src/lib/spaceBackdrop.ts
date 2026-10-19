import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer } from 'three';
import { atmosphereTime } from './atmosphere';
import { spaceFragment, spaceVertex } from './liquidShaders';
import { releaseRenderer, resizeDrawingBuffer } from './graphicsResources';
import { createFrameResizeObserver } from './frameResizeObserver';

export function createSpaceBackdrop(host: HTMLElement) {
  const renderer = new WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
  let shaderFailed = false;
  renderer.debug.onShaderError = () => { shaderFailed = true; };
  const uniforms = { uViewport: { value: new Vector2(1, 1) }, uLook: { value: new Vector2() },
    uAtmosphereTime: { value: atmosphereTime() }, uEnergy: { value: 0 }, uBackgroundOpacity: { value: 1 } };
  const geometry = new PlaneGeometry(1, 1);
  const material = new ShaderMaterial({ uniforms, vertexShader: spaceVertex, fragmentShader: spaceFragment, depthTest: false });
  const scene = new Scene(); scene.add(new Mesh(geometry, material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, .1, 10); camera.position.z = 2;
  renderer.domElement.setAttribute('aria-hidden', 'true'); host.append(renderer.domElement);
  let frame = 0, last = -1000, disposed = false;
  const paint = () => { uniforms.uAtmosphereTime.value = atmosphereTime(); renderer.render(scene, camera); };
  const loop = (now: number) => {
    frame = 0;
    if (document.hidden || disposed) return;
    if (now - last >= 1000 / 30) { last = now; paint(); }
    frame = requestAnimationFrame(loop);
  };
  const sync = () => {
    if (!document.hidden && !frame && !disposed) frame = requestAnimationFrame(loop);
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    resizeDrawingBuffer(renderer, Math.max(1, width), Math.max(1, height), Math.min(1, devicePixelRatio || 1));
    uniforms.uViewport.value.set(Math.max(1, width), Math.max(1, height)); paint();
  };
  const ro = createFrameResizeObserver(resize); ro.observe(host);
  const lost = (event: Event) => { event.preventDefault(); dispose(); };
  const dispose = () => {
    if (disposed) return; disposed = true; cancelAnimationFrame(frame); ro.disconnect();
    document.removeEventListener('visibilitychange', sync); renderer.domElement.removeEventListener('webglcontextlost', lost);
    geometry.dispose(); material.dispose(); releaseRenderer(renderer); renderer.domElement.remove();
  };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  document.addEventListener('visibilitychange', sync); resize(); sync();
  if (shaderFailed) { dispose(); throw new Error('Shader do fundo indisponível.'); }
  return dispose;
}
