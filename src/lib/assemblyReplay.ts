import { HalfFloatType, NearestFilter, RGBAFormat, Vector2, WebGLRenderTarget, type WebGLRenderer } from 'three';
import type { GPUComputationRenderer, Variable } from 'three/addons/misc/GPUComputationRenderer.js';
import { assemblySamples, REPLAY_COLUMNS, REPLAY_ROWS } from './assemblyMotion';
import { LIQUID_STEP } from './liquidHover';
import { runCooperativeSteps } from './cooperativeWork';

/** A small temporary GPU atlas of the approved exit, replayed backwards for the opening. */
export async function bakeAssemblyReplay(renderer: WebGLRenderer, gpu: GPUComputationRenderer, variable: Variable,
  side: number, size: number, signal?: AbortSignal) {
  const atlas = new WebGLRenderTarget(side * REPLAY_COLUMNS, side * REPLAY_ROWS, {
    type: HalfFloatType, format: RGBAFormat, minFilter: NearestFilter, magFilter: NearestFilter,
    depthBuffer: false, stencilBuffer: false,
  });
  atlas.scissorTest = true;
  const copy = gpu.createShaderMaterial(/* glsl */ `
    uniform sampler2D uSnapshot;
    uniform vec2 uTile;
    uniform float uSide,uLogoSize;
    void main() {
      gl_FragColor=texture2D(uSnapshot,(gl_FragCoord.xy-uTile)/uSide)/uLogoSize;
    }
  `, { uSnapshot: { value: gpu.getCurrentRenderTarget(variable).texture }, uTile: { value: new Vector2() },
    uSide: { value: side }, uLogoSize: { value: size } });
  const uniforms = variable.material.uniforms;
  const names = ['uExit', 'uBurst', 'uLiquidTime'];
  const saved = names.map((name) => uniforms[name].value);
  const samples = assemblySamples();
  const total = samples[samples.length - 1];
  const capture = (frame: number) => {
    const x = frame % REPLAY_COLUMNS * side, y = Math.floor(frame / REPLAY_COLUMNS) * side;
    atlas.viewport.set(x, y, side, side); atlas.scissor.copy(atlas.viewport);
    copy.uniforms.uTile.value.set(x, y);
    copy.uniforms.uSnapshot.value = gpu.getCurrentRenderTarget(variable).texture;
    gpu.doRenderTarget(copy, atlas);
  };
  try {
    renderer.setRenderTarget(atlas);
    const gl = renderer.getContext();
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    renderer.setRenderTarget(null);
    if (!complete) throw new Error('Histórico GPU da abertura indisponível.');
    uniforms.uExit.value = 1;
    uniforms.uBurst.value = 0;
    uniforms.uLiquidTime.value = 0;
    capture(0);
    let frame = 1;
    await runCooperativeSteps(total, (step) => {
      uniforms.uBurst.value = step / total;
      uniforms.uLiquidTime.value += LIQUID_STEP;
      gpu.compute();
      if (step === samples[frame]) capture(frame++);
    }, { signal });
    return atlas;
  } catch (error) {
    atlas.dispose(); throw error;
  } finally {
    names.forEach((name, index) => { uniforms[name].value = saved[index]; });
    copy.dispose(); renderer.setRenderTarget(null);
  }
}
