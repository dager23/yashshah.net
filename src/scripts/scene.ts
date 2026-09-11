/**
 * Stratosphere WebGL scene: Earth limb + atmosphere, stars, the flight plan
 * curve, the aircraft rig and its contrail. Loaded lazily after the hero paints.
 *
 * The aircraft is a HUD flight-path-marker stand-in until the sourced Concorde
 * GLB is placed in public/models/ — set MODEL_URL to wire it in.
 */
import {
  AdditiveBlending, BackSide, Box3, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, DirectionalLight,
  Float32BufferAttribute, Group, Line, LineBasicMaterial, LineDashedMaterial, Mesh, MeshStandardMaterial,
  PerspectiveCamera, PMREMGenerator, Points, Scene, ShaderMaterial, SphereGeometry, Sprite,
  SpriteMaterial, SRGBColorSpace, TextureLoader, Vector3, WebGLRenderer, ACESFilmicToneMapping,
} from 'three';
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

/** The aircraft: a Concorde-style delta, top-down, nose up — a cyan HUD rendering drawn once to a texture. */
function markerTexture(): CanvasTexture {
  const s = 160, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const cx = s / 2;
  // nose → fuselage flank → ogival leading edge → wingtip → straight trailing edge → tail, then mirrored
  g.beginPath();
  g.moveTo(cx, 8);
  g.lineTo(cx + 3, 28); g.lineTo(cx + 4.5, 58);
  g.quadraticCurveTo(cx + 18, 92, cx + 52, 128);
  g.lineTo(cx + 50, 134); g.lineTo(cx + 12, 133); g.lineTo(cx + 6, 146); g.lineTo(cx + 2.5, 152);
  g.lineTo(cx, 154);
  g.lineTo(cx - 2.5, 152); g.lineTo(cx - 6, 146); g.lineTo(cx - 12, 133); g.lineTo(cx - 50, 134); g.lineTo(cx - 52, 128);
  g.quadraticCurveTo(cx - 18, 92, cx - 4.5, 58);
  g.lineTo(cx - 3, 28);
  g.closePath();
  g.fillStyle = 'rgba(127,211,255,.3)';
  g.strokeStyle = '#7fd3ff';
  g.lineWidth = 3;
  g.lineJoin = 'round';
  g.shadowColor = 'rgba(127,211,255,.85)';
  g.shadowBlur = 12;
  g.fill();
  g.stroke();
  // engine nacelles under each wing, the fin as a spine along the tail
  g.shadowBlur = 0;
  g.fillStyle = 'rgba(232,237,245,.8)';
  g.fillRect(cx + 14, 108, 20, 24);
  g.fillRect(cx - 34, 108, 20, 24);
  g.fillRect(cx - 1, 96, 2, 50);
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

/** one soft puff of contrail */
function puffTexture(): CanvasTexture {
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, 'rgba(232,237,245,.9)');
  grad.addColorStop(0.5, 'rgba(232,237,245,.35)');
  grad.addColorStop(1, 'rgba(232,237,245,0)');
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
  // phones were capped at 1.5 and the Earth read as mush; the scene is one sphere and a few sprites
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 4000);
  camera.position.set(0, 0, 30);
  // environment map is built only when the model loads — nothing else needs it

  const sun = new DirectionalLight(0xffffff, 2.2);
  sun.position.set(-20, 30, 25);
  const rim = new DirectionalLight(INSTR, 1.2); // horizon rim light (for the model)
  rim.position.set(10, -6, -20);
  scene.add(sun, rim);

  /* ── Earth + atmosphere ── */
  const earth = new Group();
  const earthMat = new MeshStandardMaterial({ roughness: 0.95, metalness: 0, envMapIntensity: 0.15, color: 0x8a96a8 });
  new TextureLoader().load(mobile ? '/textures/earth-3k.webp' : '/textures/earth-4k.webp', (t) => {
    t.colorSpace = SRGBColorSpace;
    // the limb is always seen at a grazing angle; without anisotropy it blurs to mush
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    earthMat.map = t;
    earthMat.color.set(0xffffff);
    earthMat.needsUpdate = true;
    dirty = true;
  });
  const globe = new Mesh(new SphereGeometry(1, mobile ? 48 : 96, mobile ? 32 : 64), earthMat);
  globe.rotation.set(0.35, -1.75, 0); // Indian Ocean under the limb
  earth.add(globe);
  // fresnel atmosphere: the cyan rim that makes the limb read as a planet (lighter mesh on phones)
  const atmo = new Mesh(
    new SphereGeometry(1.035, mobile ? 48 : 96, mobile ? 32 : 64),
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
  const EARTH_R = 100;
  earth.scale.setScalar(EARTH_R);
  scene.add(earth);

  /* ── stars: a dome behind the Earth; each one twinkles on its own phase, the dome drifts with scroll ── */
  const STAR_N = mobile ? 500 : 1400;
  const pos: number[] = [], phase: number[] = [];
  for (let i = 0; i < STAR_N; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), r = 900;
    pos.push(r * Math.sin(ph) * Math.cos(th), Math.abs(r * Math.cos(ph)) * 0.8 + 40, -Math.abs(r * Math.sin(ph) * Math.sin(th)) - 200);
    phase.push(Math.random());
  }
  const starGeo = new BufferGeometry();
  starGeo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  starGeo.setAttribute('aPhase', new Float32BufferAttribute(phase, 1));
  const starMat = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uOpacity: { value: 0 }, uPR: { value: renderer.getPixelRatio() },
      uColor: { value: new Color('#e8edf5') },
    },
    vertexShader: `attribute float aPhase; uniform float uTime; uniform float uOpacity; uniform float uPR; varying float vA;
      void main(){
        vA = uOpacity * (0.55 + 0.45 * sin(uTime * (1.2 + aPhase * 1.6) + aPhase * 6.2832));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        gl_PointSize = (1.3 + 1.1 * step(0.85, aPhase)) * uPR;
      }`,
    fragmentShader: `uniform vec3 uColor; varying float vA;
      void main(){ vec2 c = gl_PointCoord - 0.5; if (dot(c, c) > 0.25) discard; gl_FragColor = vec4(uColor, vA); }`,
    transparent: true, depthWrite: false,
  });
  const stars = new Points(starGeo, starMat);
  scene.add(stars);

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
  /* ── contrail: soft puffs sampled behind the aircraft, widening and fading with distance ── */
  const PUFFS = mobile ? 14 : 26;
  const puffTex = puffTexture();
  const puffs = Array.from({ length: PUFFS }, () => {
    const s = new Sprite(new SpriteMaterial({ map: puffTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: AdditiveBlending }));
    s.renderOrder = 9;
    scene.add(s);
    return s;
  });
  // Sourced Concorde (see CREDITS.md). Loaded on demand so GLTFLoader costs nothing until the file exists.
  let model: Group | null = null;
  if (MODEL_URL) {
    const url = MODEL_URL;
    Promise.all([
      import('three/addons/loaders/GLTFLoader.js'),
      import('three/addons/libs/meshopt_decoder.module.js'),
      import('three/addons/environments/RoomEnvironment.js'),
    ])
      .then(([{ GLTFLoader }, { MeshoptDecoder }, { RoomEnvironment }]) => {
        // lights the satin white paint (stand-in for the declined Poly Haven HDRI)
        scene.environment = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
        return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
      })
      .then((gltf) => {
        const m = gltf.scene;
        const box = new Box3().setFromObject(m);
        const size = box.getSize(new Vector3());
        m.scale.setScalar(2.6 / Math.max(size.x, size.y, size.z)); // wingtip-to-nose fits ~2.6 units
        box.setFromObject(m);
        m.position.sub(box.getCenter(new Vector3()));
        const holder = new Group();
        holder.add(m);
        // Nose axis and the droop-nose mesh are calibrated once the real file is inspected.
        rig.add(holder);
        model = holder;
        marker.visible = false;
        dirty = true;
        kick();
      })
      .catch((e) => console.warn('Concorde model unavailable — keeping the flight-path marker', e));
  }

  /* ── state → scene ── */
  // declared before subscribe(): it fires immediately and kicks the loop
  let uTarget = getState().u, uNow = uTarget, bank = 0, ringT = -1, dirty = true, running = false, spin = 0;
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
    // the silhouette's nose follows the route; a sprite can't roll, so the wingspan foreshortens into the turn
    marker.material.rotation = heading - Math.PI / 2;
    const span = mobile ? 2.1 : 2.8;
    marker.scale.set(span * Math.cos(bank * 0.9), span, 1);
    if (model) model.rotation.set(bank, 0, heading); // nose along the route, rolled into the turn

    // flown leg behind the plane; only the next stretch of the plan ahead of it
    const idx = Math.round(u * 240);
    flownLine.geometry.setDrawRange(0, Math.max(2, idx + 1));
    planLine.geometry.setDrawRange(idx, Math.min(241 - idx, 70));
    (flownLine.material as LineBasicMaterial).opacity = 0.55 * (1 - 0.75 * smooth(0.88, 1, u)); // fades on final approach

    // altitude 0..1: nothing on the ground, everything at cruise
    const alt = smooth(0.06, 0.45, u) * (1 - smooth(0.84, 1, u));

    // contrail: only at altitude; the puffs sit on the curve just flown, growing and thinning behind the plane
    for (let k = 0; k < PUFFS; k++) {
      const s = puffs[k], uk = u - (k + 1) * 0.004;
      if (uk <= 0.02 || alt < 0.05) { s.material.opacity = 0; continue; }
      curve.getPointAt(uk, tmpB);
      s.position.copy(tmpB);
      s.scale.setScalar((mobile ? 0.5 : 0.7) + k * (mobile ? 0.08 : 0.1));
      s.material.opacity = 0.32 * (1 - k / PUFFS) * alt;
    }

    // Earth limb, placed by angular radius: ~72° near the runway reads as a flat horizon,
    // ~25° at cruise shows the curvature. Its top edge sits on the runway line, rising at altitude.
    const rho = ((72 - 47 * Math.pow(alt, 0.7)) * Math.PI) / 180;
    const thetaTop = Math.atan((-0.86 + 0.22 * alt) * Math.tan((camera.fov * Math.PI) / 360));
    const dist = EARTH_R / Math.sin(rho), thetaC = thetaTop - rho;
    earth.position.set(0, dist * Math.sin(thetaC), camera.position.z - dist * Math.cos(thetaC));
    // desktop, tab visible, Earth in view: the globe keeps turning (one turn ≈ 10 min) and the stars breathe
    const live = !mobile && !reduced && !document.hidden && u > 0.2 && u < 0.95;
    if (live) {
      spin += dt * 0.01;
      starMat.uniforms.uTime.value += dt;
      busy = true;
    }
    globe.rotation.y = -1.75 - u * 0.5 - spin;
    (atmo.material as ShaderMaterial).uniforms.uStrength.value = 0.35 + alt * 0.9;
    starMat.uniforms.uOpacity.value = smooth(0.25, 0.5, u) * (1 - smooth(0.86, 0.97, u));
    stars.rotation.set(0.04 * u, -0.12 * u, 0); // parallax: the dome slides slowly against the scroll

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
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  layout();
  kick();
  canvas.classList.add('is-live');
  return true;
}
