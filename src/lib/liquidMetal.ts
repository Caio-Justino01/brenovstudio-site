import { ShaderMount, liquidMetalFragmentShader, LiquidMetalShapes } from '@paper-design/shaders';

export type MetalHandle = ReturnType<typeof mountLiquidMetal>;

/** Raw Paper API; no image processing, remote assets or React shader wrapper. */
export function mountLiquidMetal(host: HTMLElement, onLost: () => void) {
  let mount: ShaderMount;
  try {
    mount = new ShaderMount(host, liquidMetalFragmentShader, {
      u_colorBack: [165 / 255, 171 / 255, 178 / 255, 1],
      u_colorTint: [188 / 255, 232 / 255, 250 / 255, 1],
      u_shape: LiquidMetalShapes.none, u_isImage: false,
      u_repetition: 2.4, u_softness: .45, u_shiftRed: -.04, u_shiftBlue: .18,
      u_distortion: .12, u_contour: .35, u_angle: 65,
      u_fit: 0, u_scale: 1.1, u_rotation: 0, u_originX: .5, u_originY: .5,
      u_offsetX: 0, u_offsetY: 0, u_worldWidth: 0, u_worldHeight: 0,
    }, { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }, .12, 9000, 1, 64000);
  } catch (error) {
    // A constructor failure can leave a canvas/context before a mount object exists.
    for (const canvas of host.querySelectorAll('canvas')) {
      canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove();
    }
    throw error;
  }
  const canvas = mount.canvasElement;
  const gl = canvas.getContext('webgl2');
  let disposed = false, emphasized = false, paused = false;
  const lost = (event: Event) => { event.preventDefault(); onLost(); };
  canvas.addEventListener('webglcontextlost', lost);
  const speed = () => mount.setSpeed(paused ? 0 : emphasized ? .18 : .12);
  return {
    emphasize(value: boolean) {
      if (disposed || value === emphasized) return;
      emphasized = value;
      mount.setUniforms({ u_distortion: value ? .18 : .12 }); speed();
    },
    pause(value: boolean) { if (!disposed && value !== paused) { paused = value; speed(); } },
    dispose() {
      if (disposed) return;
      disposed = true; canvas.removeEventListener('webglcontextlost', lost);
      mount.dispose();
      // Paper removes the mount; explicitly relinquish the context before granting the next lease.
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
