import { LIQUID_SPEED, MAX_HOVER_SEGMENTS } from './liquidHover';
import { dissolveGLSL, EXIT_DURATION, EXIT_LIFE_MIN, EXIT_LIFE_MAX } from './exitDissolve';
import { REPLAY_COLUMNS, REPLAY_ROWS, REPLAY_INTERVALS } from './assemblyMotion';

/* Liquid technique inspired by Sculpture Hero, supplied by the user,
 * by guglielmogiannattasio.it. Space direction: Halftone Nebula.
 * Adapted to Three.js, the local logo and a finite mouse wake.
 * No image UV lens and no radial hover repulsion.
 */
export const noise = /* glsl */ `
float hash(vec2 p) { p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*f*(f*(f*6.-15.)+10.);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
}
vec2 curl(vec2 p) {
  float e=.16;
  return vec2(noise(p+vec2(0.,e))-noise(p-vec2(0.,e)),
    noise(p-vec2(e,0.))-noise(p+vec2(e,0.)))/(2.*e);
}
`;
// Fixed to the clicked home coordinates. Advection cannot recruit distant grains.
const region = /* glsl */ `
uniform vec2 uOrigin;
uniform float uRadius;
uniform sampler2D uWake;
float regionAt(vec2 homePx) {
  return 1.-smoothstep(uRadius*.42,uRadius,length(homePx-uOrigin));
}
vec2 wakeAt(vec2 homePx,float size) {
  return texture2D(uWake,clamp(homePx/max(size,1.)+.5,0.,1.)).rg;
}
${dissolveGLSL}
`;
/** RG: excitation/material; B: bounded stamp strength; A: time since motion. */
export const hoverShader = /* glsl */ `
uniform float uDt, uSize, uRadius;
uniform int uSegmentCount;
uniform vec4 uSegments[${MAX_HOVER_SEGMENTS}];
float stampAt(vec2 p,vec4 line) {
  vec2 a=line.xy*uSize,b=line.zw*uSize;
  vec2 ab=b-a;
  float t=clamp(dot(p-a,ab)/max(dot(ab,ab),.000001),0.,1.);
  return 1.-smoothstep(uRadius*.42,uRadius,length(p-a-ab*t));
}
void main() {
  vec2 uv=gl_FragCoord.xy/resolution.xy;
  vec4 prev=texture2D(textureWake,uv);
  float paint=0.;
  for(int i=0;i<${MAX_HOVER_SEGMENTS};i++) {
    if(i>=uSegmentCount) break;
    paint=max(paint,stampAt((uv-.5)*uSize,uSegments[i]));
  }
  float age=min(prev.a+uDt,3.5);
  float weight=prev.b;
  if(paint>0.) { weight=max(age>=3.2 ? 0. : weight,paint); age=0.; }
  float excitation=weight*(1.-smoothstep(.15,1.,age));
  float material=weight*(1.-smoothstep(1.7,3.,age));
  float e=mix(prev.r,excitation,1.-exp(-uDt/(.45/3.)));
  float m=mix(prev.g,material,1.-exp(-uDt/.06));
  if(age>=3.2 && e<.001 && m<.001) { gl_FragColor=vec4(0.); return; }
  gl_FragColor=vec4(clamp(e,0.,1.),clamp(m,0.,1.),weight,age);
}
`;
export const simulationShader = /* glsl */ `
uniform sampler2D uHome;
uniform float uDt, uLiquidTime, uEnergy, uMaterial, uSize, uMaxSpeed, uExit, uBurst, uRoll;
uniform vec2 uGesture, uViewport, uCenter, uHover;
${noise}
${region}
void main() {
  vec2 uv=gl_FragCoord.xy/resolution.xy;
  vec4 home=texture2D(uHome,uv), state=texture2D(textureState,uv);
  if(home.w<.5) { gl_FragColor=vec4(0.); return; }
  float regionWeight=regionAt(home.xy*uSize);
  vec2 wake=wakeAt(home.xy*uSize,uSize);
  float activated=exitAt(home.xy*uSize,uSize,uBurst);
  float coverage=max(max(uMaterial*regionWeight,wake.g),activated*uExit);
  float energy=max(uEnergy*regionWeight,wake.r);
  if(coverage<=.0001 && energy<=.0001 && uExit<.5) { gl_FragColor=vec4(0.); return; }
  vec2 off=state.xy, vel=state.zw;
  float seed=home.z;
  vec2 p=home.xy*uSize+off;
  vec2 q=p/max(uSize,1.)*5.2+vec2(uLiquidTime*.38,-uLiquidTime*.22);
  vec2 flow=curl(q)+.30*curl(q*2.15+8.3);
  if(uExit>.5 && activated>0.) {
    float age=max(0.,exitAge(home.xy,uBurst));
    // Nearby material shares a current, rather than choosing unrelated screen targets.
    vec2 outward=home.xy/(length(home.xy)+.22);
    vec2 current=curl(p/max(uSize,1.)*2.8+vec2(age*.55,-age*.3)+4.2);
    vec2 direction=outward*.65+current*1.8+vec2(.24,.18);
    vec2 grainDrift=(vec2(hash(vec2(seed,17.)),hash(vec2(seed,39.)))-.5)*.42;
    vec2 desired=(direction/(length(direction)+.35)+grainDrift)
      *mix(3.,8.,smoothstep(0.,.7,age))*(.72+seed*.56);
    desired*=clamp(uSize/700.,.4,1.2);
    vel+=(desired-vel)*(1.-exp(-uDt*.12))*activated;
    vel/=sqrt(1.+pow(length(vel)/12.,2.));
    off+=vel*uDt;
    gl_FragColor=vec4(off,vel); return;
  }
  vec2 fromClick=(p-uOrigin)/max(uSize,1.);
  vec2 spin=vec2(-fromClick.y,fromClick.x);
  vec2 force=(flow*2.8+spin*2.1+uGesture*.32)*energy;
  force*=(.55+seed*.9)*clamp(uSize/700.,.4,1.);
  vel+=(force-off*mix(.029,.007,energy))*uDt;
  vel*=pow(mix(.89,.955,energy),uDt);
  // Asymptotic speed cap, then progressive resistance before the safety bound.
  float speed=length(vel);
  vel/=sqrt(1.+pow(speed/max(uMaxSpeed,.1),2.));
  float limit=max(.001,uRadius*.65*coverage), d=length(off);
  vec2 normal=off/max(d,.001);
  float resistance=smoothstep(limit*.55,limit*.95,d);
  vel-=normal*max(0.,dot(vel,normal))*resistance*(1.-exp(-uDt*.7));
  vel-=normal*max(0.,d-limit*.8)*.08*resistance*uDt;
  off+=vel*uDt;
  d=length(off);
  if(d>limit) { off*=limit/d; vel*=.65; }
  if(dot(off,off)<.0004 && dot(vel,vel)<.0004) { off=vec2(0.); vel=vec2(0.); }
  gl_FragColor=vec4(off,vel);
}
`;
export const particleVertex = /* glsl */ `
attribute vec2 aLookup;
attribute vec3 aColor;
uniform sampler2D uState, uHome, uIntroAtlas;
uniform float uTime, uSize, uDot, uBurst, uMaterial, uExit, uRoll, uFocusScale, uIntro, uIntroClock;
uniform vec2 uCenter, uHover, uViewport;
uniform vec3 uIntroFrames;
${noise}
${region}
varying vec2 vLocal;
varying float vLen, vRadius, vAlpha;
varying vec3 vColor;
vec4 introFrame(float frame) {
  vec2 tile=vec2(mod(frame,${REPLAY_COLUMNS}.),floor(frame/${REPLAY_COLUMNS}.));
  return texture2D(uIntroAtlas,(tile+aLookup)/vec2(${REPLAY_COLUMNS}.,${REPLAY_ROWS}.))*uSize;
}
void main() {
  vec4 home=texture2D(uHome,aLookup), state=texture2D(uState,aLookup);
  if(uIntro>.5) {
    float t=uIntroFrames.z;
    vec4 a=introFrame(uIntroFrames.x),b=introFrame(uIntroFrames.y);
    float t2=t*t,t3=t2*t;
    // Stored velocities are tangents, so the sparse history remains smooth at 60+ fps.
    float span=${EXIT_DURATION / REPLAY_INTERVALS * LIQUID_SPEED * 60};
    state.xy=(2.*t3-3.*t2+1.)*a.xy+(t3-2.*t2+t)*a.zw*span
      +(-2.*t3+3.*t2)*b.xy+(t3-t2)*b.zw*span;
    state.zw=-mix(a.zw,b.zw,t);
  }
  float localMaterial=max(max(uMaterial*regionAt(home.xy*uSize),wakeAt(home.xy*uSize,uSize).g),exitAt(home.xy*uSize,uSize,uBurst)*uExit);
  float progress=mix(uBurst,uIntroClock/${EXIT_DURATION},uIntro);
  localMaterial=mix(localMaterial,exitAt(home.xy*uSize,uSize,progress),uIntro);
  float seed=home.z;
  mat2 rotation=mat2(cos(uRoll),sin(uRoll),-sin(uRoll),cos(uRoll));
  vec2 base=rotation*(home.xy*uSize+state.xy)*uFocusScale+uCenter+uHover;
  float speed=length(state.zw);
  vec2 dir=speed>.001 ? rotation*state.zw/speed : vec2(1.,0.);
  float age=max(0.,exitAge(home.xy,progress));
  float life=mix(${EXIT_LIFE_MIN},${EXIT_LIFE_MAX},seed);
  float dissolve=max(uExit,uIntro);
  float dissipate=smoothstep(life*.45,life,age)*dissolve;
  float radius=uDot*(.8+seed*.35)*.5*mix(1.,.45,dissipate);
  float len=mix(min(speed*1.65,min(24.,uSize*.035))*.85,min(speed*.32,2.5),dissolve)*localMaterial;
  vec2 local=position.xy*vec2(radius+len*.5+1.,radius+1.);
  vec2 world=base-dir*len*.5+dir*local.x+vec2(-dir.y,dir.x)*local.y;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(world,0.,1.);
  vLocal=local; vLen=len*.5; vRadius=radius;
  float glint=smoothstep(2.,14.,speed)*.35;
  vColor=mix(aColor,min(aColor*1.12+vec3(.02,.035,.05),vec3(1.)),glint);
  vAlpha=localMaterial*(1.-dissipate);
}
`;
export const particleFragment = /* glsl */ `
uniform float uDpr;
varying vec2 vLocal;
varying float vLen, vRadius, vAlpha;
varying vec3 vColor;
void main() {
  vec2 q=vec2(max(abs(vLocal.x)-vLen,0.),vLocal.y);
  float alpha=clamp(.5-(length(q)-vRadius)*uDpr,0.,1.)*vAlpha;
  if(alpha<.004) discard;
  gl_FragColor=vec4(vColor,alpha);
  #include <colorspace_fragment>
}
`;
export const imageVertex = /* glsl */ `
uniform float uSize, uRoll, uFocusScale;
uniform vec2 uCenter, uHover;
varying vec2 vUv;
void main() {
  vUv=uv;
  mat2 rotation=mat2(cos(uRoll),sin(uRoll),-sin(uRoll),cos(uRoll));
  gl_Position=projectionMatrix*modelViewMatrix*vec4(rotation*(position.xy*uSize)*uFocusScale+uCenter+uHover,0.,1.);
}
`;
export const imageFragment = /* glsl */ `
uniform sampler2D uImage;
uniform float uMaterial, uBurst, uSize, uExit, uIntro, uIntroClock;
varying vec2 vUv;
${noise}
${region}
void main() {
  vec4 tex=texture2D(uImage,vUv);
  float key=smoothstep(.018,.075,max(tex.r,max(tex.g,tex.b)));
  float localMaterial=max(max(uMaterial*regionAt((vUv-.5)*uSize),wakeAt((vUv-.5)*uSize,uSize).g),exitAt((vUv-.5)*uSize,uSize,uBurst)*uExit);
  localMaterial=mix(localMaterial,exitAt((vUv-.5)*uSize,uSize,uIntroClock/${EXIT_DURATION}),uIntro);
  float alpha=key*(1.-localMaterial);
  gl_FragColor=vec4(tex.rgb,alpha);
  #include <colorspace_fragment>
}
`;
export const spaceVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv=uv; gl_Position=vec4(position.xy*2.,.99,1.); }
`;
export const spaceFragment = /* glsl */ `
uniform vec2 uViewport, uLook;
uniform float uAtmosphereTime, uEnergy, uBackgroundOpacity;
varying vec2 vUv;
${noise}
float fbm(vec2 p) {
  float s=0.,a=.5;
  for(int i=0;i<4;i++) { s+=noise(p)*a; p=mat2(.8,-.6,.6,.8)*p*2.03+17.1; a*=.5; }
  return s;
}
void main() {
  vec2 pixel=vUv*uViewport;
  vec2 uv=(pixel-uViewport*.5)/min(uViewport.x,uViewport.y);
  float uTime=uAtmosphereTime;
  vec2 cloud=uv*2.1+uLook*.012+vec2(uTime*.006,-uTime*.004);
  vec2 warp=vec2(fbm(cloud+3.1),fbm(cloud+8.5));
  float fog=fbm(cloud+warp*2.1);
  float river=exp(-pow((uv.y+uv.x*.48+.22+sin(uv.x*2.+fog)*.17)/.28,2.));
  float voidMask=smoothstep(.12,.75,length(uv-vec2(.18,.12)));
  float density=smoothstep(.2,.67,fog)*river*voidMask;
  vec2 cell=fract(pixel/3.)-.5;
  float dots=1.-smoothstep(.1,.46,length(cell));
  vec3 col=vec3(.0196)+vec3(.035,.11,.18)*density*(.7+dots*.3);
  for(int i=0;i<3;i++) {
    float layer=float(i), depth=.3+layer*.5;
    vec2 sp=pixel+uLook*depth*13.+vec2(uTime*(.3+layer*.16),uTime*.12);
    float grid=layer<1. ? 31. : (layer<2. ? 57. : 91.);
    vec2 id=floor(sp/grid), f=fract(sp/grid);
    float h=hash(id+layer*73.1);
    vec2 center=vec2(hash(id+1.7),hash(id+9.2))*.68+.16;
    float d=length((f-center)*grid);
    float star=1.-smoothstep(.2,layer<2. ? .85 : 1.3,d);
    float twinkle=.65+.35*sin(uTime*(.4+h)+h*80.);
    col+=vec3(.38,.65,.82)*star*step(.87+layer*.025,h)*twinkle*(.32+layer*.2);
  }
  col+=vec3(.015,.04,.06)*density*uEnergy;
  col=mix(vec3(.0196),col,smoothstep(.0,.27,vUv.y));
  gl_FragColor=vec4(col,uBackgroundOpacity);
}
`;
