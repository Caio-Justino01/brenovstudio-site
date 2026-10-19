import {
  BufferAttribute, BufferGeometry, DataTexture, FloatType, HalfFloatType, NearestFilter,
  Points, RGBAFormat, ShaderMaterial, type IUniform, type Texture, type WebGLRenderer,
} from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import type { HoverSegment } from './liquidHover';

type Shared = Record<string, IUniform>;
const spawnHelpers = /* glsl */ `
uniform sampler2D uSpawn, uHome, uState, uWake;
uniform float uSize, uRoll, uDt;
uniform vec2 uCenter, uHover, uGesture;
bool fresh(vec4 event,vec4 velocity) { return event.z!=velocity.w && event.z>0.; }
mat2 rotation() { return mat2(cos(uRoll),sin(uRoll),-sin(uRoll),cos(uRoll)); }
`;
const positionShader = /* glsl */ `
${spawnHelpers}
void main() {
  vec2 uv=gl_FragCoord.xy/resolution.xy;
  vec4 event=texture2D(uSpawn,uv), velocity=texture2D(textureDustVelocity,uv);
  vec4 point=texture2D(textureDustPosition,uv);
  if(fresh(event,velocity)) {
    vec4 home=texture2D(uHome,event.xy), state=texture2D(uState,event.xy);
    float disturbed=texture2D(uWake,home.xy+.5).g;
    point=vec4(rotation()*(home.xy*uSize+state.xy)+uCenter+uHover,0.,disturbed>.02 ? 0. : 100.);
  } else {
    point.xyz+=velocity.xyz*uDt;
    point.w+=uDt;
  }
  gl_FragColor=point;
}
`;
const velocityShader = /* glsl */ `
${spawnHelpers}
void main() {
  vec2 uv=gl_FragCoord.xy/resolution.xy;
  vec4 event=texture2D(uSpawn,uv), velocity=texture2D(textureDustVelocity,uv);
  if(fresh(event,velocity)) {
    vec4 state=texture2D(uState,event.xy);
    vec2 inherited=rotation()*(state.zw*9.+uGesture*6.);
    velocity=vec4(inherited+vec2((event.w-.5)*9.,-4.-event.w*5.),.1+event.w*.15,event.z);
  } else {
    velocity.xy*=exp(-uDt*.22);
    velocity.y-=uDt*2.5;
  }
  gl_FragColor=velocity;
}
`;
const detachedVertex = /* glsl */ `
attribute vec2 aLookup;
uniform sampler2D uDustPosition, uSpawn, uHome, uImage;
uniform float uDpr;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec4 point=texture2D(uDustPosition,aLookup), event=texture2D(uSpawn,aLookup);
  float life=5.+event.w*3.;
  float recede=1./(1.+point.z*.55);
  vec2 home=texture2D(uHome,event.xy).xy;
  vColor=texture2D(uImage,home+.5).rgb;
  vAlpha=(1.-smoothstep(life*.55,life,point.w))*.7*recede;
  if(point.w>=life || event.z<=0.) vAlpha=0.;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(point.xy*recede,0.,1.);
  gl_PointSize=max(.6,(1.6+event.w)*recede)*uDpr;
}
`;
const dustFragment = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  float a=(1.-smoothstep(.15,.5,length(gl_PointCoord-.5)))*vAlpha;
  if(a<.003) discard;
  gl_FragColor=vec4(vColor,a);
  #include <colorspace_fragment>
}
`;
const ambientVertex = /* glsl */ `
attribute vec4 aDust;
uniform vec2 uViewport, uLook;
uniform float uAtmosphereTime, uDpr, uBackgroundOpacity;
varying float vAlpha;
varying vec3 vColor;
void main() {
  float depth=aDust.z, seed=aDust.w;
  float uTime=uAtmosphereTime;
  vec2 uv=fract(aDust.xy+vec2(uTime*.0008,-uTime*.00045)*( .25+depth));
  vec2 world=(uv-.5)*uViewport+uLook*(2.+depth*7.);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(world,0.,1.);
  gl_PointSize=(.6+depth*.85)*uDpr;
  vColor=mix(vec3(.18,.31,.4),vec3(.4,.62,.72),depth);
  vAlpha=(.07+depth*.18)*(.8+.2*sin(uTime*.3+seed*40.))*uBackgroundOpacity;
}
`;

/** Fixed GPU pool. A spawn captures the current material position and velocity on the GPU. */
export function createSpaceDust(renderer: WebGLRenderer, shared: Shared, compact: boolean,
  homes: Float32Array, sourceSide: number, count: number, random: () => number) {
  const side = compact ? 16 : 32, capacity = side * side;
  let nextSlot = 0;
  const events = new Float32Array(capacity * 4);
  const spawn = new DataTexture(events, side, side, RGBAFormat, FloatType);
  spawn.minFilter = spawn.magFilter = NearestFilter; spawn.needsUpdate = true;
  const gpu = new GPUComputationRenderer(side, side, renderer);
  gpu.setDataType(HalfFloatType);
  const initialPosition = gpu.createTexture(), initialVelocity = gpu.createTexture();
  const initialData = initialPosition.image.data as Float32Array;
  for (let i = 3; i < initialData.length; i += 4) initialData[i] = 100;
  const position = gpu.addVariable('textureDustPosition', positionShader, initialPosition);
  const velocity = gpu.addVariable('textureDustVelocity', velocityShader, initialVelocity);
  gpu.setVariableDependencies(position, [position, velocity]);
  gpu.setVariableDependencies(velocity, [velocity]);
  const dt = { value: 1 / 60 };
  const uniforms = { ...shared, uSpawn: { value: spawn }, uDt: dt };
  Object.assign(position.material.uniforms, uniforms);
  Object.assign(velocity.material.uniforms, uniforms);
  const lookups = new Float32Array(capacity * 2);
  for (let i = 0; i < capacity; i++) lookups.set([(i % side + .5) / side, (Math.floor(i / side) + .5) / side], i * 2);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(capacity * 3), 3));
  geometry.setAttribute('aLookup', new BufferAttribute(lookups, 2));
  const material = new ShaderMaterial({ uniforms: { ...uniforms, uDustPosition: { value: initialPosition as Texture } },
    vertexShader: detachedVertex, fragmentShader: dustFragment, transparent: true, depthWrite: false, depthTest: false });
  const detached = new Points(geometry, material);
  detached.frustumCulled = false; detached.renderOrder = 3;
  const ambientCount = compact ? 400 : 900;
  const ambientData = new Float32Array(ambientCount * 4);
  const cols = compact ? 20 : 36, rows = Math.ceil(ambientCount / cols);
  for (let i = 0; i < ambientCount; i++) ambientData.set([
    ((i % cols) + random()) / cols, (Math.floor(i / cols) + random()) / rows, random(), random(),
  ], i * 4);
  const ambientGeometry = new BufferGeometry();
  ambientGeometry.setAttribute('position', new BufferAttribute(new Float32Array(ambientCount * 3), 3));
  ambientGeometry.setAttribute('aDust', new BufferAttribute(ambientData, 4));
  const ambientMaterial = new ShaderMaterial({ uniforms: shared, vertexShader: ambientVertex, fragmentShader: dustFragment,
    transparent: true, depthWrite: false, depthTest: false });
  const ambient = new Points(ambientGeometry, ambientMaterial);
  ambient.frustumCulled = false; ambient.renderOrder = .5;
  const deaths = new Float64Array(capacity);
  let emitted = 0, ready = false;
  return {
    ambient, detached,
    init() { const error = gpu.init(); if (error) throw new Error(error); ready = true; },
    emit(segments: HoverSegment[], time: number, size: number, radius: number, amount: number) {
      let changed = false;
      if (!segments.length) return;
      const lengths = segments.map((s) => Math.hypot(s.toX - s.fromX, s.toY - s.fromY));
      const total = lengths.reduce((a, b) => a + b, 0);
      for (let grain = 0; grain < Math.min(amount, capacity); grain++) {
          const slot = nextSlot; nextSlot = (nextSlot + 1) % capacity;
          let pick = random() * total, chosen = 0;
          while (chosen < segments.length - 1 && pick > lengths[chosen]) { pick -= lengths[chosen]; chosen++; }
          const segment = segments[chosen];
          const t = random(), x = segment.fromX + (segment.toX - segment.fromX) * t;
          const y = segment.fromY + (segment.toY - segment.fromY) * t;
          // Pick actual bright material, not empty image pixels near the gesture.
          let selected = -1, best = radius * .7 / size;
          for (let attempt = 0; attempt < 160; attempt++) {
            const index = Math.floor(random() * count);
            const d = Math.hypot(homes[index * 4] - x, homes[index * 4 + 1] - y);
            if (d < best) { selected = index; best = d; }
          }
          if (selected < 0) continue;
          const grainSeed = random();
          events.set([(selected % sourceSide + .5) / sourceSide, (Math.floor(selected / sourceSide) + .5) / sourceSide,
            events[slot * 4 + 2] % 1024 + 1, grainSeed], slot * 4);
          deaths[slot] = time + 5 + grainSeed * 3;
          emitted++; changed = true;
      }
      if (changed) spawn.needsUpdate = true;
    },
    step(delta: number) {
      dt.value = delta; gpu.compute();
      material.uniforms.uDustPosition.value = gpu.getCurrentRenderTarget(position).texture;
    },
    clear() {
      nextSlot = 0; events.fill(0); deaths.fill(0); spawn.needsUpdate = true;
      if (ready) {
        for (const target of position.renderTargets) gpu.renderTexture(initialPosition, target);
        for (const target of velocity.renderTargets) gpu.renderTexture(initialVelocity, target);
      }
    },
    stats(time: number) { return { ambient: ambientCount, capacity, emitted, active: deaths.filter((death) => death > time).length }; },
    dispose() {
      gpu.dispose(); spawn.dispose(); geometry.dispose(); material.dispose();
      ambientGeometry.dispose(); ambientMaterial.dispose();
    },
  };
}
