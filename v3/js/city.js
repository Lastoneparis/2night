// =========================================================
// 2NIGHT V3 — cinematic night-city flythrough
//   A real 3D city you travel through as you scroll: neon
//   billboards, thousands of lit windows, moving car-light
//   trails, fog + UnrealBloom for a filmic look.
//   Scroll 0→1 = a camera journey down the avenue, then a
//   lift into a skyline reveal for the finale.
// =========================================================
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const FOG_COLOR = 0x0a0a18;
const FOG_NEAR = 38;
const FOG_FAR = 250;
const Z_START = 36;      // camera start (near the mouth of the avenue)
const Z_END = -340;      // camera end (deep in the city)

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

// neon palette — the 2NIGHT code couleur: GOLD · SILVER · PLATINUM on black
// (HDR-ish values so UnrealBloom catches them)
const NEON = [
  [3.8, 2.5, 0.5],   // gold
  [3.4, 2.0, 0.35],  // deep gold
  [4.0, 3.1, 1.0],   // gold-light
  [1.7, 2.1, 2.8],   // silver (cool)
  [2.4, 2.7, 3.2],   // bright silver
  [3.1, 3.2, 3.6],   // platinum (near-white)
];
// window tints — gold / silver / platinum, mostly warm gold for the brand key
const WIN_TINTS = [
  [1.0, 0.78, 0.34], [1.0, 0.82, 0.42], [1.0, 0.86, 0.52],  // gold family (×3 → dominant)
  [0.72, 0.80, 0.96], [0.82, 0.88, 1.0],                    // silver (cool)
  [0.95, 0.96, 1.0],                                        // platinum (near white)
];

// ------------------------------------------------------------------ buildings
function buildCity() {
  const geos = [];
  // rows of buildings flanking a central avenue (the camera flies down z)
  // x bands on each side of the avenue (avenue half-width ~12)
  const sideBands = [15, 26, 38, 52, 68, 86, 106];   // deeper skyline on each side
  for (let zi = 0; zi < 46; zi++) {
    const z = Z_START - 4 - zi * 11.0 + rand(-2, 2);
    for (const side of [-1, 1]) {
      for (let bi = 0; bi < sideBands.length; bi++) {
        if (Math.random() < 0.1) continue;           // occasional gap
        const base = sideBands[bi];
        const x = side * (base + rand(-3.5, 3.5));
        const front = bi === 0;
        const w = rand(6, 12);
        const d = rand(6, 12);
        // taller toward the back for a dramatic skyline; a few landmark towers
        const tower = Math.random() < 0.06 ? rand(95, 140) : 0;
        const h = tower || (front ? rand(16, 54) : rand(26, 92));
        const tint = pick(WIN_TINTS);
        const seed = Math.random() * 1000;

        const g = new THREE.BoxGeometry(w, h, d);
        const pos = g.attributes.position;
        const nor = g.attributes.normal;
        const n = pos.count;
        const aWin = new Float32Array(n * 2);
        const aFaceUp = new Float32Array(n);
        const aTint = new Float32Array(n * 3);
        const aSeed = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const lx = pos.getX(i), ly = pos.getY(i), lz = pos.getZ(i);
          const nx = nor.getX(i), ny = nor.getY(i), nz = nor.getZ(i);
          const vert = ly + h / 2;                    // 0..h
          const horiz = Math.abs(nx) > 0.5 ? (lz + d / 2) : (lx + w / 2);
          aWin[i * 2] = horiz; aWin[i * 2 + 1] = vert;
          aFaceUp[i] = Math.abs(ny) > 0.5 ? 1 : 0;
          aTint[i * 3] = tint[0]; aTint[i * 3 + 1] = tint[1]; aTint[i * 3 + 2] = tint[2];
          aSeed[i] = seed;
        }
        g.setAttribute("aWin", new THREE.BufferAttribute(aWin, 2));
        g.setAttribute("aFaceUp", new THREE.BufferAttribute(aFaceUp, 1));
        g.setAttribute("aTint", new THREE.BufferAttribute(aTint, 3));
        g.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
        g.deleteAttribute("uv");
        g.translate(x, h / 2, z);
        geos.push(g);
      }
    }
  }
  const merged = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFogColor: { value: new THREE.Color(FOG_COLOR) },
      uFogNear: { value: FOG_NEAR },
      uFogFar: { value: FOG_FAR },
      uMotion: { value: reduceMotion ? 0 : 1 },
    },
    vertexShader: /* glsl */`
      attribute vec2 aWin;
      attribute float aFaceUp;
      attribute vec3 aTint;
      attribute float aSeed;
      varying vec2 vWin;
      varying float vFaceUp;
      varying vec3 vTint;
      varying float vSeed;
      varying float vFogDepth;
      void main(){
        vWin = aWin; vFaceUp = aFaceUp; vTint = aTint; vSeed = aSeed;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFogDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform float uTime;
      uniform vec3 uFogColor;
      uniform float uFogNear, uFogFar, uMotion;
      varying vec2 vWin;
      varying float vFaceUp;
      varying vec3 vTint;
      varying float vSeed;
      varying float vFogDepth;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)) + vSeed) * 43758.5453); }
      void main(){
        vec3 facade = vec3(0.012, 0.014, 0.026);
        vec3 col = facade;
        if (vFaceUp < 0.5) {
          vec2 cell = vec2(2.7, 3.8);                 // window pitch (world units)
          vec2 id = floor(vWin / cell);
          vec2 f  = fract(vWin / cell);
          // small window pane in the centre of each cell → lots of dark facade
          float pane = step(0.30, f.x) * step(f.x, 0.70) * step(0.34, f.y) * step(f.y, 0.74);
          float lit = step(0.55, hash(id));           // ~45% of windows lit
          // a few windows gently flicker
          float fl = 0.78 + 0.22 * sin(uTime * 2.0 + hash(id + 7.0) * 40.0);
          fl = mix(1.0, fl, step(0.92, hash(id + 3.0)) * uMotion);
          float on = pane * lit;
          vec3 winCol = vTint * (0.85 + hash(id + 1.0) * 0.9) * fl;
          col = mix(facade, winCol, on);
        }
        // linear fog
        float fog = smoothstep(uFogNear, uFogFar, vFogDepth);
        col = mix(col, uFogColor, fog);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(merged, mat);
  mesh.frustumCulled = false;
  return { mesh, mat };
}

// ------------------------------------------------------------------ neon signs
function buildNeon() {
  const group = new THREE.Group();
  for (let i = 0; i < 46; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const c = pick(NEON);
    const w = rand(3, 9), h = rand(1.4, 5.5);
    const g = new THREE.PlaneGeometry(w, h);
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color(c[0], c[1], c[2]),
      fog: true, transparent: true, opacity: 0.95, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(side * rand(12, 26), rand(6, 40), rand(Z_START - 10, Z_END + 30));
    mesh.rotation.y = side > 0 ? -Math.PI / 2 + rand(-0.3, 0.3) : Math.PI / 2 + rand(-0.3, 0.3);
    group.add(mesh);
  }
  group.matrixAutoUpdate = false; group.updateMatrix();
  return group;
}

// ------------------------------------------------------------------ car trails
function buildCars() {
  const cars = [];
  const group = new THREE.Group();
  const g = new THREE.BoxGeometry(0.5, 0.18, 3.2);
  for (let i = 0; i < 50; i++) {
    const dir = Math.random() < 0.5 ? 1 : -1;        // up or down the avenue
    const head = dir < 0;                            // toward camera = white/amber
    const c = head ? new THREE.Color(3.2, 2.6, 1.6) : new THREE.Color(3.4, 0.25, 0.18);
    const m = new THREE.MeshBasicMaterial({ color: c, fog: true });
    const mesh = new THREE.Mesh(g, m);
    const lane = dir < 0 ? rand(2, 7) : rand(-7, -2);
    mesh.position.set(lane, 0.5, rand(Z_END, Z_START));
    group.add(mesh);
    cars.push({ mesh, dir, speed: rand(28, 60) });
  }
  return { group, cars };
}

// ------------------------------------------------------------------ ground + curbs
function buildGround() {
  const group = new THREE.Group();
  const gMat = new THREE.MeshBasicMaterial({ color: 0x05060c, fog: true });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 800), gMat);
  ground.rotation.x = -Math.PI / 2; ground.position.z = -150;
  group.add(ground);
  // glowing curb strips down the avenue
  for (const x of [-9, 9]) {
    const s = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 760),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.7, 0.6), fog: true })
    );
    s.rotation.x = -Math.PI / 2; s.position.set(x, 0.02, -150);
    group.add(s);
  }
  return group;
}

// ------------------------------------------------------------------ sky: stars + moon
function buildSky() {
  const group = new THREE.Group();
  const N = 700;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 360;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(rand(0.1, 1));               // upper hemisphere
    pos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    pos[i * 3 + 1] = Math.cos(ph) * r * 0.8 + 60;
    pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r - 120;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({
    color: 0x9fb4ff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.8, fog: false,
  }));
  stars.frustumCulled = false;
  group.add(stars);

  // moon glow
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({
    color: new THREE.Color(2.2, 2.0, 2.6), transparent: true, opacity: 0.9, fog: false,
  }));
  moon.scale.set(38, 38, 1);
  moon.position.set(-90, 140, -300);
  group.add(moon);
  return group;
}

// ------------------------------------------------------------------ atmosphere embers
function buildEmbers() {
  const N = 260;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = rand(-60, 60);
    pos[i * 3 + 1] = rand(1, 60);
    pos[i * 3 + 2] = rand(Z_END, Z_START);
    seed[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uMotion: { value: reduceMotion ? 0 : 1 } },
    vertexShader: /* glsl */`
      attribute float aSeed; uniform float uTime, uMotion; varying float vA;
      void main(){
        vec3 p = position;
        p.y += sin(uTime * 0.5 + aSeed * 30.0) * 2.5 * uMotion;
        p.x += cos(uTime * 0.4 + aSeed * 24.0) * 2.0 * uMotion;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (40.0 / -mv.z) * (0.6 + aSeed);
        gl_Position = projectionMatrix * mv;
        vA = 0.3 + 0.5 * aSeed;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float; varying float vA;
      void main(){
        vec2 c = gl_PointCoord - 0.5; float d = length(c);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d) * vA;
        gl_FragColor = vec4(1.0, 0.82, 0.45, a);
      }
    `,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  return { pts, mat };
}

// ------------------------------------------------------------------ public init
export function initCity(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) {
    console.warn("[2NIGHT] WebGL unavailable, city disabled.", e);
    canvas.style.display = "none";
    return { setProgress() {}, destroy() {} };
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07070f);
  scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

  const camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.1, 700);

  const { mesh: city, mat: cityMat } = buildCity();
  const neon = buildNeon();
  const { group: carGroup, cars } = buildCars();
  const ground = buildGround();
  const sky = buildSky();
  const { pts: embers, mat: emberMat } = buildEmbers();
  scene.add(city, neon, carGroup, ground, sky, embers);

  // ---- post-processing (bloom) ----
  let composer = null;
  try {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(dpr);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      reduceMotion ? 0.45 : 0.62,  // strength
      0.5,                          // radius
      0.62                          // threshold — only the brightest cores glow
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    composer.__bloom = bloom;
  } catch (e) {
    console.warn("[2NIGHT] bloom unavailable, rendering plain.", e);
    composer = null;
  }

  // ---- mouse parallax ----
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  function onPointer(e) {
    if (reduceMotion) return;
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }
  window.addEventListener("pointermove", onPointer, { passive: true });

  // ---- camera journey (eased scroll progress) ----
  let progress = 0, eased = 0;
  const tmpLook = new THREE.Vector3();
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function placeCamera(p) {
    const z = THREE.MathUtils.lerp(Z_START, Z_END, p);
    const weave = Math.sin(p * Math.PI * 2.4) * 5.5;       // gentle S down the avenue
    let y = 9 + Math.sin(p * Math.PI * 3.0) * 2.2;
    const lift = sstep(0.82, 1.0, p);                       // finale: rise over the skyline
    y = THREE.MathUtils.lerp(y, 78, lift);
    const px = weave + mouse.x * 3.0 * (1 - lift);
    camera.position.set(px, y, z);
    // look ahead, easing downward into the city for the finale
    const ahead = THREE.MathUtils.lerp(34, 150, lift);
    tmpLook.set(
      Math.sin((p + 0.06) * Math.PI * 2.4) * 5.5 + mouse.x * 4.0 * (1 - lift),
      THREE.MathUtils.lerp(y * 0.7 + 6, 6, lift) - mouse.y * 2.0 * (1 - lift),
      z - ahead
    );
    camera.lookAt(tmpLook);
    camera.rotation.z += Math.sin(p * Math.PI * 2.4) * 0.04 * (1 - lift); // subtle bank
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
  }
  window.addEventListener("resize", onResize);

  const clock = new THREE.Clock();
  let raf = 0;
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    eased += (progress - eased) * 0.08;                    // smooth follow
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    if (!reduceMotion) {
      const t = clock.elapsedTime;
      cityMat.uniforms.uTime.value = t;
      emberMat.uniforms.uTime.value = t;
      // move car-light trails along the avenue, loop within the corridor
      for (const c of cars) {
        c.mesh.position.z += c.dir * c.speed * dt;
        if (c.dir > 0 && c.mesh.position.z > Z_START) c.mesh.position.z = Z_END;
        if (c.dir < 0 && c.mesh.position.z < Z_END) c.mesh.position.z = Z_START;
      }
    }
    placeCamera(eased);
    if (composer) composer.render(); else renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    setProgress(p) { progress = p; },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      renderer.dispose();
      if (composer) composer.dispose && composer.dispose();
    },
  };
}
