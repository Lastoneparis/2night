// =========================================================
// 2NIGHT V3 — cinematic "night out" scroll scene
//   A neon club you travel through: a swaying crowd, raised
//   drinks, floating hearts and swipe cards, a glowing
//   dancefloor — everything a dating app night is made of.
//   Technique: instanced camera-facing billboards (crowd,
//   hearts, cards) + GPU particles (sparkles) + a grid
//   dancefloor + UnrealBloom. Asset-free, ~few draw calls.
//   Exposed as initCity() so it drops into the existing wiring.
// =========================================================
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FOG = 0x0a0712;
const NEAR = 26, FAR = 150;
const Z0 = 24, Z1 = -150;            // camera journey along the club
const rand = (a, b) => a + Math.random() * (b - a);

// gold / silver / platinum + romance pink — the 2NIGHT code couleur
const TINTS = [
  [1.0, 0.82, 0.42], [1.0, 0.86, 0.55], [1.0, 0.74, 0.34],   // gold ×3
  [1.0, 0.55, 0.7],  [1.0, 0.45, 0.62],                       // pink (romance)
  [0.82, 0.88, 1.0], [0.95, 0.96, 1.0],                       // silver / platinum
];

// ---------- canvas textures -------------------------------------------------
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.flipY = false; return t; }
function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function heartPath(x, cx, cy, s) { x.beginPath(); x.moveTo(cx, cy + 9 * s); x.bezierCurveTo(cx - 11 * s, cy - 1 * s, cx - 7 * s, cy - 13 * s, cx, cy - 6 * s); x.bezierCurveTo(cx + 7 * s, cy - 13 * s, cx + 11 * s, cy - 1 * s, cx, cy + 9 * s); x.closePath(); }

// crowd: 2×2 atlas of party silhouettes (dance, drink, dance-2, phone)
function peopleTexture() {
  // 3×2 atlas of lit silhouettes: dance · cheers(drink) · sway · phone · KISS couple · CHEERS couple
  const c = document.createElement("canvas"); c.width = 768; c.height = 512;
  const x = c.getContext("2d");
  // one filled, volumetrically-lit figure. arms = [{x,y}] endpoints from the shoulder.
  function body(cx, topY, s, arms, opts) {
    opts = opts || {};
    const grad = x.createLinearGradient(0, topY, 0, topY + 200 * s);
    grad.addColorStop(0, "#e6eaf4"); grad.addColorStop(.45, "#888c9f"); grad.addColorStop(1, "#1f1a2b");
    x.fillStyle = grad; x.strokeStyle = grad; x.lineCap = "round"; x.lineJoin = "round";
    x.shadowColor = "rgba(255,205,120,.6)"; x.shadowBlur = 11;
    const sh = topY + 30 * s, wa = topY + 100 * s;
    x.beginPath(); x.arc(cx, topY + 13 * s, 13.5 * s, 0, 7); x.fill();        // head
    x.beginPath();                                                           // torso (filled)
    x.moveTo(cx - 19 * s, sh);
    x.quadraticCurveTo(cx - 15 * s, (sh + wa) / 2, cx - 10 * s, wa);
    x.lineTo(cx + 10 * s, wa);
    x.quadraticCurveTo(cx + 15 * s, (sh + wa) / 2, cx + 19 * s, sh);
    x.quadraticCurveTo(cx, sh - 11 * s, cx - 19 * s, sh); x.closePath(); x.fill();
    x.lineWidth = 16 * s; x.beginPath();                                     // legs
    x.moveTo(cx - 6 * s, wa); x.lineTo(cx - 14 * s + (opts.legL || 0) * s, topY + 198 * s);
    x.moveTo(cx + 6 * s, wa); x.lineTo(cx + 14 * s + (opts.legR || 0) * s, topY + 198 * s); x.stroke();
    x.lineWidth = 13 * s; x.beginPath();                                     // arms
    for (const a of arms) { x.moveTo(cx, sh + 4 * s); x.lineTo(cx + a.x * s, sh + a.y * s); }
    x.stroke();
    if (opts.drink != null) {                                               // martini glass
      const a = arms[opts.drink], gx = cx + a.x * s, gy = sh + a.y * s;
      x.save(); x.shadowColor = "rgba(150,235,255,.95)"; x.shadowBlur = 11; x.strokeStyle = "rgba(205,245,255,.98)"; x.lineWidth = 3.2 * s;
      x.beginPath(); x.moveTo(gx - 9 * s, gy - 12 * s); x.lineTo(gx + 9 * s, gy - 12 * s); x.lineTo(gx, gy - 1 * s); x.closePath(); x.stroke();
      x.beginPath(); x.moveTo(gx, gy - 1 * s); x.lineTo(gx, gy + 7 * s); x.stroke(); x.restore();
    }
    if (opts.phone != null) {                                               // glowing phone
      const a = arms[opts.phone], px = cx + a.x * s, py = sh + a.y * s;
      x.save(); x.shadowColor = "rgba(140,210,255,.97)"; x.shadowBlur = 13; x.fillStyle = "rgba(175,222,255,.98)";
      x.fillRect(px - 6 * s, py - 12 * s, 11 * s, 18 * s); x.restore();
    }
  }
  function spark(cx, cy, col, r) { x.save(); x.shadowColor = col; x.shadowBlur = 15; x.fillStyle = col; heartPath(x, cx, cy, r || 2.4); x.fill(); x.restore(); }
  // top row
  body(128, 24, 1, [{ x: -36, y: -46 }, { x: 36, y: -48 }], { legR: 8 });           // 0 dance
  body(384, 24, 1, [{ x: 44, y: -50 }, { x: -30, y: 40 }], { drink: 0 });           // 1 cheers solo
  body(640, 24, 1, [{ x: -48, y: -10 }, { x: 46, y: -26 }], { legL: -6 });          // 2 sway
  // bottom row
  body(128, 282, 1, [{ x: -22, y: 46 }, { x: 18, y: 34 }], { phone: 1 });           // 3 phone
  body(356, 290, .82, [{ x: 30, y: 16 }, { x: -24, y: 32 }]);                       // 4 kiss (left)
  body(412, 290, .82, [{ x: -30, y: 16 }, { x: 24, y: 32 }]);                       //   kiss (right)
  spark(384, 286, "#ff90b0", 2.6);                                                  //   heart between
  body(610, 290, .82, [{ x: 34, y: -30 }, { x: -22, y: 36 }], { drink: 0 });        // 5 cheers (left)
  body(670, 290, .82, [{ x: -34, y: -30 }, { x: 22, y: 36 }], { drink: 0 });        //   cheers (right)
  spark(640, 262, "#fff2c0", 1.6);                                                  //   clink spark
  return tex(c);
}

function heartTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d"); x.translate(64, 64);
  const g = x.createRadialGradient(0, 0, 2, 0, 0, 60);
  g.addColorStop(0, "rgba(255,225,170,.95)"); g.addColorStop(.5, "rgba(255,150,170,.5)"); g.addColorStop(1, "rgba(255,120,160,0)");
  x.fillStyle = g; x.fillRect(-64, -64, 128, 128);
  x.fillStyle = "#fff"; heartPath(x, 0, -2, 3.0); x.fill();
  return tex(c);
}

function cardTexture() {
  const c = document.createElement("canvas"); c.width = 256; c.height = 340;
  const x = c.getContext("2d");
  roundRect(x, 6, 6, 244, 328, 24);
  const g = x.createLinearGradient(0, 0, 0, 340); g.addColorStop(0, "#312338"); g.addColorStop(1, "#0e0a12");
  x.fillStyle = g; x.fill();
  x.save(); roundRect(x, 6, 6, 244, 328, 24); x.clip();
  const pg = x.createLinearGradient(0, 0, 0, 250); pg.addColorStop(0, "#7a4f86"); pg.addColorStop(1, "#241733");
  x.fillStyle = pg; x.fillRect(6, 6, 244, 210);
  // shoulders silhouette in the portrait
  x.fillStyle = "rgba(15,8,20,.55)"; x.beginPath(); x.arc(128, 150, 42, 0, 7); x.fill();
  x.beginPath(); x.moveTo(60, 216); x.quadraticCurveTo(128, 150, 196, 216); x.lineTo(196, 220); x.lineTo(60, 220); x.fill();
  x.restore();
  x.fillStyle = "rgba(255,255,255,.9)"; roundRect(x, 24, 252, 120, 16, 8); x.fill();
  x.fillStyle = "rgba(255,255,255,.4)"; roundRect(x, 24, 280, 84, 12, 6); x.fill();
  x.shadowColor = "rgba(255,210,120,.9)"; x.shadowBlur = 16; x.fillStyle = "#ffd27a"; heartPath(x, 210, 285, 3.4); x.fill();
  x.shadowBlur = 0; x.strokeStyle = "rgba(255,215,0,.5)"; x.lineWidth = 2; roundRect(x, 6, 6, 244, 328, 24); x.stroke();
  return tex(c);
}

// ---------- generic instanced billboard system -----------------------------
const VERT = /* glsl */`
  attribute vec3 aOffset; attribute vec2 aScale; attribute float aPhase; attribute float aCell; attribute vec3 aTint;
  uniform float uTime, uMode, uReflect; uniform vec2 uAtlas;
  varying vec2 vUv; varying vec3 vTint; varying float vFog; varying float vY;
  void main(){
    vec3 off = aOffset; float t = uTime;
    if (uMode < 0.5) {                    // crowd sway / bounce
      off.x += sin(t*1.5 + aPhase)*0.22;
      off.y += abs(sin(t*3.0 + aPhase))*0.12;
    } else if (uMode < 1.5) {             // hearts rise + drift
      off.y += mod(t*0.9 + aPhase*6.0, 30.0);
      off.x += sin(t*1.1 + aPhase)*0.9;
      off.z += cos(t*0.9 + aPhase)*0.6;
    } else {                              // cards float
      off.y += sin(t*0.5 + aPhase)*0.7;
      off.x += cos(t*0.4 + aPhase)*0.7;
    }
    float flip = 1.0;
    if (uReflect > 0.5) { off.y = -off.y; flip = -1.0; }   // mirror under the floor
    float ang = (uMode > 1.5) ? sin(t*0.4 + aPhase)*0.45 : 0.0;
    vec2 p = position.xy; float cs = cos(ang), sn = sin(ang);
    p = vec2(p.x*cs - p.y*sn, p.x*sn + p.y*cs);
    vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 camUp    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]) * flip;
    vec3 world = off + camRight * p.x * aScale.x + camUp * p.y * aScale.y;
    vY = world.y;
    vec4 mv = viewMatrix * vec4(world, 1.0);
    vFog = -mv.z;
    float cols = uAtlas.x, rows = uAtlas.y;
    float ci = mod(aCell, cols), ri = floor(aCell / cols);
    vUv = vec2((uv.x + ci) / cols, (1.0 - uv.y + ri) / rows);
    vTint = aTint;
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */`
  precision highp float;
  uniform sampler2D uTex; uniform vec3 uFogColor; uniform float uFogNear, uFogFar, uAlpha, uMode, uReflect;
  varying vec2 vUv; varying vec3 vTint; varying float vFog; varying float vY;
  void main(){
    vec4 t = texture2D(uTex, vUv);
    if (t.a < 0.02) discard;
    vec3 col = t.rgb * vTint;
    float fog = smoothstep(uFogNear, uFogFar, vFog);
    float a = t.a * uAlpha * (1.0 - fog * 0.92);
    if (uReflect > 0.5) a *= 0.30 * smoothstep(-11.0, 0.0, vY);  // glossy floor reflection, fading down
    gl_FragColor = vec4(col, a);
  }
`;

function billboards({ texture, count, atlas, mode, blending, alpha, place, reflect }) {
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute("position", base.attributes.position);
  geo.setAttribute("uv", base.attributes.uv);
  const off = new Float32Array(count * 3), sc = new Float32Array(count * 2),
    ph = new Float32Array(count), ce = new Float32Array(count), ti = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const d = place(i);
    off[i * 3] = d.pos[0]; off[i * 3 + 1] = d.pos[1]; off[i * 3 + 2] = d.pos[2];
    sc[i * 2] = d.scale[0]; sc[i * 2 + 1] = d.scale[1];
    ph[i] = d.phase; ce[i] = d.cell || 0;
    ti[i * 3] = d.tint[0]; ti[i * 3 + 1] = d.tint[1]; ti[i * 3 + 2] = d.tint[2];
  }
  geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(off, 3));
  geo.setAttribute("aScale", new THREE.InstancedBufferAttribute(sc, 2));
  geo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(ph, 1));
  geo.setAttribute("aCell", new THREE.InstancedBufferAttribute(ce, 1));
  geo.setAttribute("aTint", new THREE.InstancedBufferAttribute(ti, 3));
  geo.instanceCount = count;
  const mk = (refl) => new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: texture }, uTime: { value: 0 }, uMode: { value: mode }, uReflect: { value: refl ? 1 : 0 },
      uAtlas: { value: new THREE.Vector2(atlas[0], atlas[1]) },
      uFogColor: { value: new THREE.Color(FOG) }, uFogNear: { value: NEAR }, uFogFar: { value: FAR },
      uAlpha: { value: alpha },
    },
    vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, depthWrite: false, depthTest: true, blending,
  });
  const mat = mk(false);
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  let reflMesh = null, reflMat = null;
  if (reflect) { reflMat = mk(true); reflMesh = new THREE.Mesh(geo, reflMat); reflMesh.frustumCulled = false; }
  return { mesh, mat, reflMesh, reflMat };
}

// ---------- dancefloor + sparkles + backdrop -------------------------------
function buildFloor() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uFogColor: { value: new THREE.Color(FOG) }, uFogNear: { value: NEAR }, uFogFar: { value: FAR } },
    transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vP; varying float vFog; void main(){ vP = position.xy; vec4 mv = modelViewMatrix*vec4(position,1.0); vFog=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `precision highp float; uniform float uTime; uniform vec3 uFogColor; uniform float uFogNear,uFogFar; varying vec2 vP; varying float vFog;
      void main(){
        vec2 g = abs(fract(vP*0.14)-0.5);
        float line = smoothstep(0.46,0.5,max(g.x,g.y));
        vec2 cell = floor(vP*0.14);
        float pulse = 0.5 + 0.5*sin(uTime*2.0 + cell.x*1.3 + cell.y*0.7);
        vec3 gold = vec3(1.0,0.78,0.32), cyan = vec3(0.3,0.8,1.0);
        vec3 col = mix(gold, cyan, step(0.5, fract((cell.x+cell.y)*0.5)));
        float glow = line * (0.25 + 0.75*pulse);
        float fog = smoothstep(uFogNear,uFogFar,vFog);
        gl_FragColor = vec4(col*glow*1.6, glow*(1.0-fog)*0.9);
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(260, 320), mat);
  m.rotation.x = -Math.PI / 2; m.position.set(0, -0.2, -60);
  return { mesh: m, mat };
}

function buildSparkles(N) {
  N = N || 320; const pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i*3]=rand(-50,50); pos[i*3+1]=rand(1,40); pos[i*3+2]=rand(Z1,Z0); seed[i]=Math.random(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `attribute float aSeed; uniform float uTime; varying float vA;
      void main(){ vec3 p=position; p.y+=sin(uTime*0.6+aSeed*30.0)*2.0; p.x+=cos(uTime*0.5+aSeed*22.0)*1.6;
        vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=(50.0/-mv.z)*(0.5+aSeed); gl_Position=projectionMatrix*mv; vA=0.3+0.6*aSeed; }`,
    fragmentShader: `precision highp float; varying float vA; void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c); if(d>0.5)discard; gl_FragColor=vec4(1.0,0.85,0.5,smoothstep(0.5,0.0,d)*vA); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; return { pts, mat };
}

function buildSkyline() {
  // faint distant city glow for depth
  const N = 500, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i*3]=rand(-160,160); pos[i*3+1]=rand(4,90); pos[i*3+2]=rand(-180,-130); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffcf8a, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.5, fog: false }));
  pts.frustumCulled = false; return pts;
}

// ---------- public init ----------------------------------------------------
export function initCity(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" }); }
  catch (e) { console.warn("[2NIGHT] WebGL unavailable", e); canvas.style.display = "none"; return { setProgress() {}, destroy() {} }; }

  // quality scales down on phones / low-core devices so the scene still ANIMATES smoothly there
  const small = window.innerWidth < 860 || (navigator.hardwareConcurrency || 8) <= 4;
  const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.3 : 1.6);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07060e);
  scene.fog = new THREE.Fog(FOG, NEAR, FAR);
  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 400);

  // crowd — clusters around the dancefloor along the path
  const pTex = peopleTexture();
  const crowd = billboards({
    texture: pTex, count: small ? 72 : 150, atlas: [3, 2], mode: 0, blending: THREE.NormalBlending, alpha: 1.0, reflect: !small,
    place: () => {
      const z = rand(Z1 + 10, Z0 - 2);
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = side * rand(7, 48) + rand(-3, 3);
      const h = rand(8, 11.5);
      const r = Math.random();
      const cell = r < 0.1 ? 4 : r < 0.2 ? 5 : (Math.random() * 4) | 0;   // ~20% couples (kiss/cheers)
      return { pos: [x, h / 2 - 0.2, z], scale: [h * 0.62, h], phase: Math.random() * 6.28, cell, tint: [1, 1, 1] };
    },
  });
  // hearts
  const hTex = heartTexture();
  const hearts = billboards({
    texture: hTex, count: small ? 120 : 240, atlas: [1, 1], mode: 1, blending: THREE.AdditiveBlending, alpha: 1.0,
    place: () => {
      const s = rand(1.1, 3.4);
      return { pos: [rand(-46, 46), rand(0, 26), rand(Z1, Z0)], scale: [s, s], phase: Math.random(), cell: 0, tint: TINTS[(Math.random() * TINTS.length) | 0] };
    },
  });
  // swipe cards
  const cTex = cardTexture();
  const cards = billboards({
    texture: cTex, count: small ? 16 : 26, atlas: [1, 1], mode: 2, blending: THREE.NormalBlending, alpha: 0.96,
    place: () => {
      const s = rand(2.4, 4.0);
      return { pos: [rand(-30, 30), rand(5, 22), rand(Z1 + 10, Z0 - 4)], scale: [s * 0.74, s], phase: Math.random() * 6.28, cell: 0, tint: [1, 1, 1] };
    },
  });

  const floor = buildFloor();
  const { pts: sparkles, mat: sparkMat } = buildSparkles(small ? 150 : 320);
  const skyline = buildSkyline();
  scene.add(skyline, floor.mesh, crowd.mesh, cards.mesh, hearts.mesh, sparkles);
  if (crowd.reflMesh) scene.add(crowd.reflMesh);

  // bloom
  let composer = null;
  try {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(dpr); composer.setSize(innerWidth, innerHeight);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), reduceMotion ? 0.5 : (small ? 0.66 : 0.85), 0.6, 0.5));
    composer.addPass(new OutputPass());
  } catch (e) { console.warn("[2NIGHT] bloom off", e); composer = null; }

  // mouse parallax
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  function onPointer(e) { if (reduceMotion) return; mouse.tx = (e.clientX / innerWidth) * 2 - 1; mouse.ty = (e.clientY / innerHeight) * 2 - 1; }
  window.addEventListener("pointermove", onPointer, { passive: true });

  let progress = 0, eased = 0;
  const look = new THREE.Vector3();
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function placeCamera(p) {
    const z = THREE.MathUtils.lerp(Z0, Z1, p);
    const weave = Math.sin(p * Math.PI * 2.2) * 7;
    let y = 8 + Math.sin(p * Math.PI * 2.6) * 2;
    const lift = sstep(0.82, 1.0, p); y = THREE.MathUtils.lerp(y, 46, lift);
    camera.position.set(weave + mouse.x * 4 * (1 - lift), y, z);
    look.set(Math.sin((p + 0.05) * Math.PI * 2.2) * 7 + mouse.x * 5 * (1 - lift),
      THREE.MathUtils.lerp(7, 4, lift) - mouse.y * 2.5 * (1 - lift), z - 34);
    camera.lookAt(look);
    camera.rotation.z += Math.sin(p * Math.PI * 2.2) * 0.035 * (1 - lift);
  }

  function onResize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); if (composer) composer.setSize(innerWidth, innerHeight); }
  window.addEventListener("resize", onResize);

  const clock = new THREE.Clock(); let raf = 0;
  function frame() {
    const t = clock.getElapsedTime();
    eased += (progress - eased) * 0.08;
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    if (!reduceMotion) {
      crowd.mat.uniforms.uTime.value = t; if (crowd.reflMat) crowd.reflMat.uniforms.uTime.value = t;
      hearts.mat.uniforms.uTime.value = t;
      cards.mat.uniforms.uTime.value = t; floor.mat.uniforms.uTime.value = t; sparkMat.uniforms.uTime.value = t;
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
      renderer.dispose(); if (composer && composer.dispose) composer.dispose();
    },
  };
}
