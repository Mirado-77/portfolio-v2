import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { Motif } from "../data";
import { shape } from "./shapes";

export type CoreTarget = {
  motif: Motif;
  primary: string;
  secondary: string;
  /** where the form sits on screen, in NDC (-1..1) */
  anchor: [number, number];
  /** 0..1 brightness of the form */
  intensity: number;
  scale: number;
};

const VERT = /* glsl */ `
attribute vec3 aFrom;
attribute vec3 aTo;
attribute vec4 aRand;
uniform float uMix;
uniform float uTime;
uniform float uSize;
uniform float uPR;
uniform float uGlitch;
varying float vTone;
varying float vFade;

float ease(float t) { return t < .5 ? 4. * t * t * t : 1. - pow(-2. * t + 2., 3.) / 2.; }

void main() {
  float local = ease(clamp(uMix * 1.7 - aRand.x * .7, 0., 1.));
  vec3 p = mix(aFrom, aTo, local);
  // mid-morph the points burst outward and swirl
  float burst = sin(local * 3.14159);
  p += normalize(p + 1e-4) * burst * (0.4 + aRand.y * 1.1);
  float a = burst * (aRand.z - .5) * 1.4;
  p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
  // idle shimmer
  p += vec3(sin(uTime * 1.3 + aRand.y * 40.), cos(uTime * 1.1 + aRand.z * 40.), sin(uTime * .9 + aRand.w * 40.)) * .018;
  // glitch scatter on fast scroll
  p += (aRand.xyz - .5) * uGlitch * step(.7, aRand.w) * 1.4;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPR * (.6 + aRand.w * .9) * (9. / -mv.z);
  vTone = aRand.z;
  vFade = clamp(1.2 - (-mv.z - 6.) / 14., 0.15, 1.);
}`;

const FRAG = /* glsl */ `
uniform vec3 uP;
uniform vec3 uS;
uniform float uAlpha;
varying float vTone;
varying float vFade;
void main() {
  vec2 c = gl_PointCoord - .5;
  float d = length(c);
  if (d > .5) discard;
  float core = smoothstep(.5, .0, d);
  vec3 col = vTone > .84 ? uS : uP;
  col = mix(col, vec3(1.), smoothstep(.18, .0, d) * .55);
  gl_FragColor = vec4(col * core, core * uAlpha * vFade);
}`;

function hudRing(radius: number, ticks: number, majorEvery: number, gap = 0): THREE.BufferGeometry {
  const pts: number[] = [];
  const seg = 160;
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    if (gap && (i % 40) < gap) continue;
    pts.push(Math.cos(a0) * radius, 0, Math.sin(a0) * radius, Math.cos(a1) * radius, 0, Math.sin(a1) * radius);
  }
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2, len = i % majorEvery === 0 ? 0.22 : 0.08;
    pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius, Math.cos(a) * (radius + len), 0, Math.sin(a) * (radius + len));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

export class HoloCore {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  private group = new THREE.Group();
  private points: THREE.Points;
  private mat: THREE.ShaderMaterial;
  private from: THREE.BufferAttribute;
  private to: THREE.BufferAttribute;
  private rand: Float32Array;
  private rings: THREE.LineSegments[] = [];
  private ringMats: THREE.LineBasicMaterial[] = [];
  private grid: THREE.GridHelper;
  private dust: THREE.Points;
  private n: number;
  private target: CoreTarget | null = null;
  private colP = new THREE.Color("#2de2ff");
  private colS = new THREE.Color("#ff7a1a");
  private goalP = new THREE.Color("#2de2ff");
  private goalS = new THREE.Color("#ff7a1a");
  private goalPos = new THREE.Vector3();
  private goalScale = 1;
  private alpha = 0;
  private goalAlpha = 1;
  private mix = 1;
  private glitch = 0;
  private pointer = new THREE.Vector2();
  private pointerSmooth = new THREE.Vector2();
  private scrollY = window.scrollY;
  private raf = 0;
  private clock = new THREE.Clock();
  private animated = true;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    const small = window.innerWidth < 768;
    this.n = small ? 3600 : 6500;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    this.renderer.setClearColor("#010203");
    this.scene.fog = new THREE.Fog("#010203", 8, 30);
    this.camera.position.set(0, 0.4, 9);
    this.scene.add(this.group);

    // the morphing point cloud
    const geo = new THREE.BufferGeometry();
    const start = shape("core", this.n);
    this.from = new THREE.BufferAttribute(start.slice(), 3);
    this.to = new THREE.BufferAttribute(start.slice(), 3);
    this.rand = new Float32Array(this.n * 4).map(() => Math.random());
    geo.setAttribute("position", new THREE.BufferAttribute(start.slice(), 3));
    geo.setAttribute("aFrom", this.from);
    geo.setAttribute("aTo", this.to);
    geo.setAttribute("aRand", new THREE.BufferAttribute(this.rand, 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uMix: { value: 1 }, uTime: { value: 0 }, uSize: { value: small ? 2.4 : 2.1 }, uPR: { value: 1 },
        uGlitch: { value: 0 }, uP: { value: this.colP }, uS: { value: this.colS }, uAlpha: { value: 0 },
      },
    });
    this.points = new THREE.Points(geo, this.mat);
    this.group.add(this.points);

    // HUD rings around the form
    const ringDefs: [number, number, number, number, number][] = [
      [3.4, 72, 6, 0, 0.42],
      [3.9, 120, 10, 6, -0.25],
      [4.5, 36, 3, 14, 0.15],
    ];
    ringDefs.forEach(([rad, ticks, major, gap, tilt], i) => {
      const m = new THREE.LineBasicMaterial({ color: i === 1 ? this.colS : this.colP, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
      const ring = new THREE.LineSegments(hudRing(rad, ticks, major, gap), m);
      ring.rotation.x = tilt;
      this.rings.push(ring);
      this.ringMats.push(m);
      this.group.add(ring);
    });

    // floor grid flying under the camera
    this.grid = new THREE.GridHelper(60, 40, 0x2de2ff, 0x2de2ff);
    const gm = this.grid.material as THREE.LineBasicMaterial;
    gm.transparent = true;
    gm.opacity = 0.06;
    gm.depthWrite = false;
    this.grid.position.y = -4.6;
    this.scene.add(this.grid);

    // ambient dust
    const dn = small ? 400 : 900;
    const dpos = new Float32Array(dn * 3).map((_, i) => (i % 3 === 0 ? (Math.random() - 0.5) * 44 : i % 3 === 1 ? (Math.random() - 0.5) * 22 : -Math.random() * 30 + 6));
    const dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
    this.dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ color: 0x7fdfff, size: 0.04, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.scene.add(this.dust);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.1, 0.25);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    window.addEventListener("resize", this.resize);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("scroll", this.onScroll, { passive: true });
    document.addEventListener("visibilitychange", this.onVisibility);
    this.resize();
    this.raf = requestAnimationFrame(this.frame);
  }

  setAnimated(on: boolean) {
    this.animated = on;
    if (!on) this.renderStill();
    else if (!this.raf) this.raf = requestAnimationFrame(this.frame);
  }

  setTarget(t: CoreTarget) {
    const first = !this.target;
    const changed = !this.target || this.target.motif !== t.motif;
    this.target = t;
    this.goalP.set(t.primary);
    this.goalS.set(t.secondary);
    this.goalAlpha = t.intensity;
    this.goalScale = t.scale;
    this.placeGoal();
    if (changed) {
      // freeze the in-between positions as the new start, then morph to the new form
      const from = this.from.array as Float32Array, to = this.to.array as Float32Array, rnd = this.rand;
      const m = this.mix;
      for (let i = 0; i < this.n; i++) {
        let l = Math.min(1, Math.max(0, m * 1.7 - rnd[i * 4] * 0.7));
        l = l < 0.5 ? 4 * l * l * l : 1 - Math.pow(-2 * l + 2, 3) / 2;
        for (let k = 0; k < 3; k++) from[i * 3 + k] = from[i * 3 + k] + (to[i * 3 + k] - from[i * 3 + k]) * l;
      }
      to.set(shape(t.motif, this.n));
      this.from.needsUpdate = true;
      this.to.needsUpdate = true;
      this.mix = 0;
      if (first) this.group.position.copy(this.goalPos);
    }
    if (!this.animated) this.renderStill();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("scroll", this.onScroll);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x?.dispose());
    });
    this.composer.dispose();
    this.renderer.dispose();
  }

  private placeGoal() {
    if (!this.target) return;
    const h = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z;
    const w = h * this.camera.aspect;
    this.goalPos.set(this.target.anchor[0] * w, this.target.anchor[1] * h + this.camera.position.y, 0);
  }

  private resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w / 2, h / 2);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.mat.uniforms.uPR.value = pr;
    this.placeGoal();
    if (!this.animated) this.renderStill();
  };

  private onPointer = (e: PointerEvent) => {
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };

  private onScroll = () => {
    const dy = Math.abs(window.scrollY - this.scrollY);
    this.scrollY = window.scrollY;
    this.glitch = Math.min(1, this.glitch + dy / 900);
  };

  private onVisibility = () => {
    if (document.hidden) { cancelAnimationFrame(this.raf); this.raf = 0; }
    else if (this.animated && !this.raf) { this.clock.getDelta(); this.raf = requestAnimationFrame(this.frame); }
  };

  private renderStill() {
    this.mix = 1;
    this.alpha = this.goalAlpha;
    this.colP.copy(this.goalP);
    this.colS.copy(this.goalS);
    this.group.position.copy(this.goalPos);
    this.group.scale.setScalar(this.goalScale);
    this.sync(0);
    this.composer.render();
  }

  private sync(t: number) {
    const u = this.mat.uniforms;
    u.uMix.value = this.mix;
    u.uTime.value = t;
    u.uAlpha.value = this.alpha;
    u.uGlitch.value = this.glitch;
    this.ringMats.forEach((m, i) => {
      m.color.copy(i === 1 ? this.colS : this.colP);
      m.opacity = 0.32 * this.alpha;
    });
    (this.grid.material as THREE.LineBasicMaterial).color.copy(this.colP);
  }

  private frame = () => {
    this.raf = 0;
    if (this.disposed || !this.animated) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 3);

    this.mix = Math.min(1, this.mix + dt / 1.8);
    this.alpha += (this.goalAlpha - this.alpha) * k;
    this.colP.lerp(this.goalP, k);
    this.colS.lerp(this.goalS, k);
    this.group.position.lerp(this.goalPos, 1 - Math.exp(-dt * 2.2));
    const s = this.group.scale.x + (this.goalScale - this.group.scale.x) * k;
    this.group.scale.setScalar(s);
    this.glitch *= Math.exp(-dt * 5);

    this.pointerSmooth.lerp(this.pointer, 1 - Math.exp(-dt * 2.5));
    this.group.rotation.y = t * 0.09 + this.pointerSmooth.x * 0.35;
    this.group.rotation.x = 0.12 + this.pointerSmooth.y * 0.18;
    this.rings[0].rotation.y = t * 0.25;
    this.rings[1].rotation.y = -t * 0.14;
    this.rings[2].rotation.y = t * 0.07;
    this.rings[2].rotation.z = Math.sin(t * 0.3) * 0.1;
    this.grid.position.z = (t * 0.6) % 1;
    this.dust.rotation.y = t * 0.01;
    this.dust.position.y = Math.sin(t * 0.2) * 0.3;
    this.camera.position.x = this.pointerSmooth.x * 0.4;
    this.camera.lookAt(0, this.camera.position.y * 0.5, 0);

    this.sync(t);
    this.composer.render();
    this.raf = requestAnimationFrame(this.frame);
  };
}
