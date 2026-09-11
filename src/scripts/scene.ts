/**
 * Stratosphere WebGL scene: Earth limb + atmosphere, stars, the flight plan
 * curve and the aircraft rig. Loaded lazily after the hero paints.
 *
 * The aircraft is a HUD flight-path-marker stand-in until the sourced Concorde
 * GLB is placed in public/models/ — set MODEL_URL to wire it in.
 */
import {
  AdditiveBlending, BackSide, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, DirectionalLight,
  Float32BufferAttribute, Group, Line, LineBasicMaterial, LineDashedMaterial, Mesh, MeshStandardMaterial,
  PerspectiveCamera, PMREMGenerator, Points, PointsMaterial, Scene, ShaderMaterial, SphereGeometry, Sprite,
  SpriteMaterial, SRGBColorSpace, TextureLoader, Vector3, WebGLRenderer, ACESFilmicToneMapping,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DESKTOP, MOBILE, isNarrow } from './path';
import { getState, subscribe } from './store';

const MODEL_URL: string | null = null; // e.g. '/models/concorde.glb' once processed

const INSTR = new Color('#7fd3ff');
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** HUD flight-path marker: circle, wings, fin — drawn once to a texture. */
function markerTexture(): CanvasTexture {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  g.strokeStyle = '#7fd3ff';
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.shadowColor = 'rgba(127,211,255,.8)';
  g.shadowBlur = 10;
  g.beginPath();
  g.arc(s / 2, s / 2, 16, 0, Math.PI * 2);
  g.moveTo(s / 2 - 16, s / 2); g.lineTo(s / 2 - 50, s / 2);
  g.moveTo(s / 2 + 16, s / 2); g.lineTo(s / 2 + 50, s / 2);
  g.moveTo(s / 2, s / 2 - 16); g.lineTo(s / 2, s / 2 - 36);
  g.stroke();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function ringTexture(): CanvasTexture {
  const s = 256, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s * 0.5);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.72, 'rgba(232,237,245,.85)');
  grad.addColorStop(0.8, 'rgba(127,211,255,.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return new CanvasTexture(c);
}

/** Returns false when WebGL is unavailable so the caller can use the 2D fallback. */
export function startScene(canvas: HTMLCanvasElement): boolean {
  if (!hasWebGL()) return false;
  const mobile = isNarrow();
  const reduced = getState().reduced;

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: !mobile, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 4000);
  camera.position.set(0, 0, 30);
  scene.environment = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

  const sun = new DirectionalLight(0xffffff, 2.2);
  sun.position.set(-20, 30, 25);
  const rim = new DirectionalLight(INSTR, 1.2); // horizon rim light (for the model)
  rim.position.set(10, -6, -20);
  scene.add(sun, rim);

  /* ── Earth + atmosphere ── */
  const earth = new Group();
  const earthMat = new MeshStandardMaterial({ roughness: 0.95, metalness: 0, envMapIntensity: 0.15, color: 0x8a96a8 });
  new TextureLoader().load(mobile ? '/textures/earth-1k.webp' : '/textures/earth-2k.webp', (t) => {
    t.colorSpace = SRGBColorSpace;
    earthMat.map = t;
    earthMat.color.set(0xffffff);
    earthMat.needsUpdate = true;
    dirty = true;
  });
  const globe = new Mesh(new SphereGeometry(1, mobile ? 48 : 96, mobile ? 32 : 64), earthMat);
  globe.rotation.set(0.35, -1.75, 0); // Indian Ocean under the limb
  earth.add(globe);
  let atmo: Mesh | null = null;
  if (!mobile) {
    atmo = new Mesh(
      new SphereGeometry(1.035, 96, 64),
      new ShaderMaterial({
        uniforms: { uColor: { value: INSTR }, uStrength: { value: 1 } },
        vertexShader: `varying vec3 vN; varying vec3 vV;
          void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `uniform vec3 uColor; uniform float uStrength; varying vec3 vN; varying vec3 vV;
          void main(){ float f = pow(1. - abs(dot(vN, vV)), 2.6); gl_FragColor = vec4(uColor * f * uStrength, f * uStrength); }`,
        side: BackSide, transparent: true, blending: AdditiveBlending, depthWrite: false,
      })
    );
    earth.add(atmo);
  }
  const EARTH_R = 100;
  earth.scale.setScalar(EARTH_R);
  scene.add(earth);

  /* ── stars (desktop only) ── */
  let stars: Points | null = null;
  if (!mobile) {
    const pos: number[] = [];
    for (let i = 0; i < 1400; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), r = 900;
      pos.push(r * Math.sin(ph) * Math.cos(th), Math.abs(r * Math.cos(ph)) * 0.8 + 40, -Math.abs(r * Math.sin(ph) * Math.sin(th)) - 200);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    stars = new Points(g, new PointsMaterial({ color: 0xe8edf5, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false }));
    scene.add(stars);
  }

  /* ── flight plan curve (screen-normalised control points) ── */
  let curve = new CatmullRomCurve3([new Vector3(), new Vector3(0, 1, 0)]);
  const planLine = new Line(new BufferGeometry(), new LineDashedMaterial({ color: INSTR, dashSize: 0.35, gapSize: 0.3, transparent: true, opacity: 0.35 }));
  const flownLine = new Line(new BufferGeometry(), new LineBasicMaterial({ color: INSTR, transparent: true, opacity: 0.55 }));
  if (!mobile) scene.add(planLine, flownLine);

  function layout(): void {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const halfW = halfH * camera.aspect;
    const pts = (mobile ? MOBILE : DESKTOP).map(([x, y]) => new Vector3(x * halfW, y * halfH, 0));
    curve = new CatmullRomCurve3(pts, false, 'centripetal');
    const spaced = curve.getSpacedPoints(240);
    planLine.geometry.setFromPoints(spaced);
    planLine.computeLineDistances();
    flownLine.geometry.setFromPoints(spaced); // drawn up to the plane via setDrawRange
    dirty = true;
  }

  /* ── aircraft rig ── */
  const rig = new Group();
  const marker = new Sprite(new SpriteMaterial({ map: markerTexture(), transparent: true, depthWrite: false }));
  marker.scale.setScalar(mobile ? 1.6 : 2.1);
  rig.add(marker);
  const ring = new Sprite(new SpriteMaterial({ map: ringTexture(), transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }));
  rig.add(ring);
  scene.add(rig);
  // HUD layer: route + aircraft draw over the globe, never clipped by it
  for (const o of [marker, ring, planLine, flownLine]) {
    (o.material as { depthTest: boolean }).depthTest = false;
    o.renderOrder = 10;
  }
  if (MODEL_URL) {
    // wired once the GLB exists: GLTFLoader + MeshoptDecoder, swap out `marker`
  }

  /* ── state → scene ── */
  // declared before subscribe(): it fires immediately and kicks the loop
  let uTarget = getState().u, uNow = uTarget, bank = 0, ringT = -1, dirty = true, running = false;
  let last = performance.now();
  const tmpA = new Vector3(), tmpB = new Vector3();

  subscribe((s) => {
    uTarget = s.u;
    if (s.machBurst && ringT < 0 && !reduced) ringT = 0;
    kick();
  });

  function frame(dt: number): boolean {
    let busy = false;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 2.6); // inertia: heavy and sure
    const du = uTarget - uNow;
    uNow += du * k;
    if (Math.abs(du) > 1e-4) busy = true;

    const u = Math.min(1, Math.max(0, uNow));
    curve.getPointAt(u, tmpA);
    curve.getPointAt(Math.min(1, u + 0.02), tmpB); // look-ahead
    rig.position.copy(tmpA);
    const heading = Math.atan2(tmpB.y - tmpA.y, tmpB.x - tmpA.x);
    const prev = rig.userData.heading ?? heading;
    let turn = heading - prev;
    if (turn > Math.PI) turn -= Math.PI * 2;
    if (turn < -Math.PI) turn += Math.PI * 2;
    rig.userData.heading = heading;
    const bankTarget = Math.max(-0.5, Math.min(0.5, (turn / Math.max(dt, 1e-3)) * 0.35));
    bank += (bankTarget - bank) * (1 - Math.exp(-dt * 3));
    marker.material.rotation = -bank;

    // flown leg behind the plane; only the next stretch of the plan ahead of it
    const idx = Math.round(u * 240);
    flownLine.geometry.setDrawRange(0, Math.max(2, idx + 1));
    planLine.geometry.setDrawRange(idx, Math.min(241 - idx, 70));
    (flownLine.material as LineBasicMaterial).opacity = 0.55 * (1 - 0.75 * smooth(0.88, 1, u)); // fades on final approach

    // Earth limb, placed by angular radius: ~72° near the runway reads as a flat horizon,
    // ~25° at cruise shows the curvature. Its top edge sits on the runway line, rising at altitude.
    const alt = smooth(0.06, 0.45, u) * (1 - smooth(0.84, 1, u));
    const rho = ((72 - 47 * Math.pow(alt, 0.7)) * Math.PI) / 180;
    const thetaTop = Math.atan((-0.86 + 0.22 * alt) * Math.tan((camera.fov * Math.PI) / 360));
    const dist = EARTH_R / Math.sin(rho), thetaC = thetaTop - rho;
    earth.position.set(0, dist * Math.sin(thetaC), camera.position.z - dist * Math.cos(thetaC));
    globe.rotation.y = -1.75 - u * 0.5;
    if (atmo) (atmo.material as ShaderMaterial).uniforms.uStrength.value = 0.35 + alt * 0.9;
    if (stars) (stars.material as PointsMaterial).opacity = smooth(0.25, 0.5, u) * (1 - smooth(0.86, 0.97, u));

    if (ringT >= 0) {
      ringT += dt;
      const t = ringT / 1.2;
      ring.scale.setScalar(1 + t * 5);
      ring.material.opacity = Math.max(0, 0.9 * (1 - t));
      if (t >= 1) { ringT = -2; ring.material.opacity = 0; } else busy = true;
    }
    return busy || dirty;
  }

  function loop(now: number): void {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const busy = frame(dt);
    renderer.render(scene, camera);
    dirty = false;
    if (busy) requestAnimationFrame(loop);
    else running = false;
  }
  function kick(): void {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  addEventListener('resize', () => { layout(); kick(); });
  layout();
  kick();
  canvas.classList.add('is-live');
  return true;
}
