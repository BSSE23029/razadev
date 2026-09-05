import './styles/cinematic.css';
import { portfolio } from './data/portfolio.js';
import { PortfolioContent } from './components/cinematic/PortfolioContent.js';
import { ChapterController } from './components/cinematic/ChapterController.js';

let THREE;
let RoundedBoxGeometry;
let EffectComposer;
let RenderPass;
let UnrealBloomPass;
let OutputPass;
let ScrollTrigger;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const compact = window.matchMedia('(max-width: 800px)').matches;
const saveData = Boolean(navigator.connection?.saveData);
const lowPower = saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
const COLORS = { cyan: 0x5ce7ff, blue: 0x3977ff, violet: 0x8b5cff, ink: 0x050b18, steel: 0x13213a, white: 0xf0f7ff };

class ScrollWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.pointer = new THREE.Vector2();
    this.pointerEase = new THREE.Vector2();
    this.scroll = { progress: 0 };
    this.animated = [];
    this.packetStreams = [];
    this.pathTarget = new THREE.Vector3();
    this.hidden = document.hidden;
    this.paused = false;
    this.materialCache = new Map();
    this._buildRenderer();
    this._buildWorld();
    this._bind();
    this.resize();
    this.renderFrame();
    if (!reducedMotion && !this.hidden) this.renderer.setAnimationLoop(this.render);
  }

  _buildRenderer() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02040b);
    this.scene.fog = new THREE.FogExp2(0x02040b, 0.024);
    this.camera = new THREE.PerspectiveCamera(compact ? 56 : 48, 1, 0.1, 120);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !compact, powerPreference: lowPower ? 'low-power' : 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(this._pixelRatio());

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    if (!compact && !reducedMotion && !lowPower) {
      this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.72, 0.7, 0.72);
      this.composer.addPass(this.bloom);
    }
    this.composer.addPass(new OutputPass());
  }

  _buildWorld() {
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.scene.add(new THREE.AmbientLight(0x637aa8, 0.65));
    const fill = new THREE.DirectionalLight(0x234b88, .72); fill.position.set(-5, 4, 6); this.scene.add(fill);
    this.key = new THREE.PointLight(COLORS.cyan, 48, 28, 1.8);
    this.key.position.set(1, 3, 4);
    this.camera.add(this.key);
    this.scene.add(this.camera);

    this._createStars();
    this.originPortal = this._createPortal(new THREE.Vector3(4.4, 0.3, 0), 1.65);
    this.mobile = this._createMobileWorld();
    this.network = this._createNetworkWorld();
    this.backend = this._createBackendWorld();
    this.returnPortal = this._createPortal(new THREE.Vector3(0, 0, -52), 2.8);
    this.returnPortal.rotation.y = Math.PI;
    this._createTransitField();

    this.cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.4, 10), new THREE.Vector3(1.0, 0.8, 5),
      new THREE.Vector3(-1.6, 0.2, -5), new THREE.Vector3(0.6, 0.7, -16),
      new THREE.Vector3(1.5, 0.4, -28), new THREE.Vector3(-.8, 0.8, -40),
      new THREE.Vector3(0, 0.1, -46.5),
    ], false, 'catmullrom', 0.45);
    this.targetPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(4.4, 0.3, 0), new THREE.Vector3(3.5, 0, -4),
      new THREE.Vector3(3.8, 0, -11.5), new THREE.Vector3(-3, 0, -23),
      new THREE.Vector3(3.2, -.2, -35), new THREE.Vector3(0, 0, -47),
      new THREE.Vector3(0, 0, -52),
    ], false, 'catmullrom', 0.45);
    this.camera.position.copy(this.cameraPath.getPoint(0));
    this.camera.lookAt(this.targetPath.getPoint(0));
  }

  material(color, emissive = 0x000000, emissiveIntensity = 0) {
    const key = `${color}:${emissive}:${emissiveIntensity}`;
    if (!this.materialCache.has(key)) {
      this.materialCache.set(key, new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, metalness: 0.58, roughness: 0.27 }));
    }
    return this.materialCache.get(key);
  }

  _glowTexture() {
    if (this.glowTexture) return this.glowTexture;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)'); gradient.addColorStop(.18, 'rgba(115,232,255,.95)'); gradient.addColorStop(1, 'rgba(50,90,255,0)');
    context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
    this.glowTexture = new THREE.CanvasTexture(canvas); this.glowTexture.colorSpace = THREE.SRGBColorSpace; return this.glowTexture;
  }

  _logoTexture() {
    if (this.logoTexture) return this.logoTexture;
    this.logoTexture = new THREE.TextureLoader().load('/logos/dark/raza_logo_no_bg.png');
    this.logoTexture.colorSpace = THREE.SRGBColorSpace;
    this.logoTexture.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 4);
    return this.logoTexture;
  }

  _createLogoObject(radius) {
    const logo = new THREE.Group();
    const medallionRadius = radius * .58;
    const medallion = new THREE.Mesh(new THREE.CylinderGeometry(medallionRadius, medallionRadius, .08, 64), this.material(0x03070e));
    medallion.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(medallionRadius * 1.02, .014, 8, 64), new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: .42, blending: THREE.AdditiveBlending }));
    const size = radius * 2.15;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: this._logoTexture(), transparent: true, alphaTest: .02, depthWrite: false }));
    face.position.z = .08;
    logo.add(medallion, rim, face);
    logo.position.z = .12;
    logo.rotation.y = -.08;
    return logo;
  }

  _pixelRatio() {
    const cap = lowPower ? 1.1 : compact ? 1.25 : 1.5;
    return Math.min(window.devicePixelRatio || 1, cap);
  }

  _createStars() {
    const count = lowPower ? 640 : compact ? 1200 : 2600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cool = new THREE.Color(COLORS.cyan), warm = new THREE.Color(COLORS.violet);
    const color = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const radius = 9 + Math.random() * 25, angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius; positions[i * 3 + 1] = (Math.random() - .5) * 24; positions[i * 3 + 2] = 14 - Math.random() * 82;
      color.copy(cool).lerp(warm, Math.random()); colors.set([color.r, color.g, color.b], i * 3);
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.stars = new THREE.Points(geometry, new THREE.PointsMaterial({ size: compact ? .035 : .045, vertexColors: true, transparent: true, opacity: .62, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.world.add(this.stars);
  }

  _createPortal(position, radius) {
    const group = new THREE.Group(); group.position.copy(position);
    const rings = [];
    for (let i = 0; i < 2; i += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * (1 - i * .18), .012 + i * .008, 8, 64), new THREE.MeshBasicMaterial({ color: i ? COLORS.blue : COLORS.cyan, transparent: true, opacity: i ? .26 : .44, blending: THREE.AdditiveBlending }));
      ring.rotation.set(i * .18, i * .27, i * .46); group.add(ring); rings.push(ring);
    }
    const count = lowPower ? 120 : compact ? 180 : 360, positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
    const c1 = new THREE.Color(COLORS.cyan), c2 = new THREE.Color(COLORS.violet), color = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const t = Math.random() * Math.PI * 2, r = radius * Math.sqrt(Math.random()) * .82;
      positions.set([Math.cos(t) * r, Math.sin(t) * r, (Math.random() - .5) * .24], i * 3);
      color.copy(c1).lerp(c2, Math.random() * .35); colors.set([color.r, color.g, color.b], i * 3);
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const spiral = new THREE.Points(geometry, new THREE.PointsMaterial({ size: radius * .022, map: this._glowTexture(), vertexColors: true, transparent: true, opacity: .36, depthWrite: false, blending: THREE.AdditiveBlending }));
    group.add(spiral);
    const core = new THREE.Mesh(new THREE.CircleGeometry(radius * .72, 64), new THREE.MeshBasicMaterial({ color: 0x01030a, transparent: true, opacity: .72 })); core.position.z = -.08; group.add(core);
    const logo = this._createLogoObject(radius); group.add(logo);
    group.userData = { rings, spiral, core, logo, speed: .11 + Math.random() * .04 };
    this.animated.push(group); this.world.add(group); return group;
  }

  _createMobileWorld() {
    const group = new THREE.Group(); group.position.set(3.8, -.1, -11.5); group.rotation.set(-.18, -.5, -.08);
    const body = new THREE.Mesh(new RoundedBoxGeometry(3.0, 5.7, .48, 6, .25), this.material(0x050a13)); group.add(body);
    const frame = new THREE.Mesh(new RoundedBoxGeometry(2.78, 5.46, .08, 6, .2), this.material(0x101d31)); frame.position.z = .25; group.add(frame);
    const screen = new THREE.Mesh(new RoundedBoxGeometry(2.62, 5.28, .045, 6, .17), new THREE.MeshStandardMaterial({ color: 0x02050b, emissive: 0x06152a, emissiveIntensity: .42, metalness: .35, roughness: .16 })); screen.position.z = .31; group.add(screen);
    const cameraIsland = new THREE.Mesh(new RoundedBoxGeometry(.54, .2, .06, 4, .08), this.material(0x050a13)); cameraIsland.position.set(.27, 2.24, .36); group.add(cameraIsland);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(.042, 8, 8), new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: .8 })); lens.position.set(.27, 2.24, .4); group.add(lens);
    const sideButton = new THREE.Mesh(new RoundedBoxGeometry(.08, .62, .12, 3, .04), this.material(0x17243a)); sideButton.position.set(-1.54, .78, .02); group.add(sideButton);
    const top = new THREE.Mesh(new RoundedBoxGeometry(1.28, .12, .025, 3, .04), this.material(0x1a5e9f)); top.position.set(-.5, 1.87, .36); group.add(top);
    const progress = new THREE.Mesh(new RoundedBoxGeometry(1.7, .055, .025, 3, .02), this.material(0x1b4774)); progress.position.set(-.32, 1.55, .36); group.add(progress);
    for (let i = 0; i < 3; i += 1) {
      const card = new THREE.Mesh(new RoundedBoxGeometry(2.18, .62, .045, 4, .08), this.material(i === 0 ? 0x12335c : 0x0b1729, i === 0 ? COLORS.blue : 0x000000, i === 0 ? .46 : 0));
      card.position.set(0, .92 - i * .82, .36); group.add(card);
      const cardLine = new THREE.Mesh(new RoundedBoxGeometry(1.12 - i * .14, .045, .025, 3, .02), this.material(i === 0 ? 0x67d9f3 : 0x253a56));
      cardLine.position.set(-.38, .92 - i * .82, .4); group.add(cardLine);
    }
    const navLine = new THREE.Mesh(new RoundedBoxGeometry(1.22, .055, .025, 3, .02), this.material(0x28517b)); navLine.position.set(0, -1.7, .36); group.add(navLine);
    const homeIndicator = new THREE.Mesh(new RoundedBoxGeometry(.72, .045, .04, 3, .02), this.material(0x7cdfff, COLORS.cyan, .7)); homeIndicator.position.set(0, -2.23, .38); group.add(homeIndicator);
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(3.05, .008, 6, 64), new THREE.MeshBasicMaterial({ color: COLORS.blue, transparent: true, opacity: .1 })); orbit.rotation.x = 1.2; group.add(orbit);
    this.animated.push(group); this.world.add(group); return group;
  }

  _createNetworkWorld() {
    const group = new THREE.Group(); group.position.set(-3, 0, -23);
    const nodes = [], nodeCount = lowPower ? 12 : compact ? 18 : 32;
    const nodeGeometry = new THREE.IcosahedronGeometry(.075, 1);
    const hubGeometry = new THREE.IcosahedronGeometry(.2, 1);
    for (let i = 0; i < nodeCount; i += 1) {
      const isHub = i % 7 === 0;
      const a = i * 2.399, radius = 1.1 + Math.sqrt(i) * .46;
      const node = new THREE.Mesh(isHub ? hubGeometry : nodeGeometry, this.material(isHub ? COLORS.violet : COLORS.cyan, isHub ? COLORS.violet : COLORS.cyan, 2.2));
      node.position.set(Math.cos(a) * radius, Math.sin(a * 1.3) * 2.9, Math.sin(a) * 1.6);
      node.userData.baseScale = isHub ? 1 : .8;
      nodes.push(node); group.add(node);
    }
    const linePositions = [];
    for (let i = 1; i < nodes.length; i += 1) { const a = nodes[i - 1].position, b = nodes[i].position; linePositions.push(a.x,a.y,a.z,b.x,b.y,b.z); if (i > 5 && i % 3 === 0) { const c = nodes[i - 5].position; linePositions.push(a.x,a.y,a.z,c.x,c.y,c.z); } }
    for (let i = 0; i < nodes.length; i += 4) { const node = nodes[i].position; linePositions.push(0, 0, 0, node.x, node.y, node.z); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    group.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: COLORS.blue, transparent: true, opacity: .27, blending: THREE.AdditiveBlending })));
    const hub = new THREE.Group();
    const hubCore = new THREE.Mesh(new THREE.OctahedronGeometry(.52, 1), this.material(0x071225, COLORS.violet, 1.6));
    const hubRing = new THREE.Mesh(new THREE.TorusGeometry(.86, .018, 8, 48), new THREE.MeshBasicMaterial({ color: COLORS.violet, transparent: true, opacity: .58, blending: THREE.AdditiveBlending }));
    hubRing.rotation.x = Math.PI / 2;
    hub.add(hubCore, hubRing); group.add(hub);
    const route = new THREE.CatmullRomCurve3(nodes.filter((_, i) => i % 5 === 0).map(node => node.position)); this._createPackets(group, route, 12);
    group.userData.nodes = nodes; group.userData.hub = hub; this.animated.push(group); this.world.add(group); return group;
  }

  _createBackendWorld() {
    const group = new THREE.Group(); group.position.set(3.2, -.3, -35); group.rotation.y = -.28;
    const rack = new THREE.Mesh(new RoundedBoxGeometry(3.7, 4.35, 1.02, 6, .14), this.material(0x050a13));
    group.add(rack);
    const inset = new THREE.Mesh(new RoundedBoxGeometry(3.36, 4.02, .06, 5, .08), this.material(0x0b1526));
    inset.position.z = .54; group.add(inset);
    const sideRail = this.material(0x17243a);
    [-1.42, 1.42].forEach(x => { const rail = new THREE.Mesh(new RoundedBoxGeometry(.055, 3.72, .04, 2, .02), sideRail); rail.position.set(x, 0, .59); group.add(rail); });
    const rows = [], ledGeometry = new THREE.SphereGeometry(.032, 8, 8);
    for (let i = 0; i < 5; i += 1) {
      const row = new THREE.Group();
      const chassis = new THREE.Mesh(new RoundedBoxGeometry(2.72, .52, .08, 3, .05), this.material(i === 2 ? 0x102947 : 0x0d1c31)); chassis.position.z = .58; row.add(chassis);
      const vent = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .05), this.material(0x243b59)); vent.position.set(-.55, 0, .63); row.add(vent);
      for (let j = 0; j < 3; j += 1) { const led = new THREE.Mesh(ledGeometry, new THREE.MeshBasicMaterial({ color: j === 1 && i === 2 ? COLORS.violet : COLORS.cyan })); led.position.set(.65 + j * .18, 0, .64); row.add(led); }
      row.position.y = 1.48 - i * .72; rows.push(row); group.add(row);
    }
    const accent = new THREE.Mesh(new THREE.TorusGeometry(1.02, .01, 6, 64), new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: .22, blending: THREE.AdditiveBlending }));
    accent.position.set(0, 2.45, .1); accent.rotation.x = Math.PI / 2; group.add(accent);
    group.userData.accent = accent; group.userData.rows = rows;
    this.animated.push(group); this.world.add(group); return group;
  }

  _createPackets(parent, curve, count) {
    const packets = [];
    for (let i = 0; i < count; i += 1) { const packet = new THREE.Mesh(new THREE.SphereGeometry(.055,8,8), new THREE.MeshBasicMaterial({ color: i % 3 ? COLORS.cyan : COLORS.violet })); packet.userData.offset = i / count; parent.add(packet); packets.push(packet); }
    this.packetStreams.push({ parent, packets, curve, speed: .055 + Math.random() * .035, point: new THREE.Vector3() });
  }

  _createTransitField() {
    for (let stage = 0; stage < 4; stage += 1) { const z = -6 - stage * 12; const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-8,Math.sin(stage)*2,z),new THREE.Vector3(0,(stage%2?2:-2),z-4),new THREE.Vector3(8,Math.cos(stage)*2,z-8)]); const tube = new THREE.Mesh(new THREE.TubeGeometry(curve,48,.012,6,false),new THREE.MeshBasicMaterial({color:stage%2?COLORS.violet:COLORS.blue,transparent:true,opacity:.16,blending:THREE.AdditiveBlending})); this.world.add(tube); this._createPackets(this.world,curve,5); }
  }

  _bind() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('pointermove', event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      this.pointer.set((event.clientX / innerWidth - .5) * 2, (event.clientY / innerHeight - .5) * -2);
    }, { passive: true });
    window.addEventListener('pointerleave', () => this.pointer.set(0, 0), { passive: true });
    document.addEventListener('visibilitychange', () => {
      this.hidden = document.hidden;
      if (this.hidden) {
        this.renderer.setAnimationLoop(null);
        return;
      }
      this.clock.start();
      if (!reducedMotion && !this.paused) this.renderer.setAnimationLoop(this.render);
      this.renderFrame();
    });
    const sceneControl = document.getElementById('sceneControl');
    if (sceneControl) {
      sceneControl.hidden = reducedMotion;
      sceneControl.addEventListener('click', () => {
        this.paused = !this.paused;
        sceneControl.setAttribute('aria-pressed', String(this.paused));
        sceneControl.setAttribute('aria-label', this.paused ? 'Resume ambient scene' : 'Pause ambient scene');
        const label = sceneControl.querySelector('span:not(.scene-control__icon)');
        if (label) label.textContent = this.paused ? 'Resume scene' : 'Pause scene';
        if (this.paused) this.renderer.setAnimationLoop(null);
        else if (!this.hidden && !reducedMotion) this.renderer.setAnimationLoop(this.render);
      });
    }
    ScrollTrigger.create({ trigger: '.journey', start: 'top top', end: 'bottom bottom', scrub: reducedMotion ? false : 1.1, onUpdate: self => { this.scroll.progress = self.progress; document.getElementById('chapterProgress').style.height = `${self.progress * 100}%`; this.renderFrame(); } });
  }

  resize() {
    const width = innerWidth, height = innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this._pixelRatio());
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.renderFrame();
  }

  _updateAssetVisibility(progress) {
    [
      [this.originPortal, 0, .24],
      [this.mobile, .12, .5],
      [this.network, .34, .7],
      [this.backend, .54, .9],
      [this.returnPortal, .78, 1],
    ].forEach(([asset, start, end]) => { asset.visible = progress >= start && progress <= end; });
  }

  renderFrame = () => {
    if (this.hidden) return;
    const elapsed = reducedMotion ? 0 : this.clock.getElapsedTime();
    this.pointerEase.lerp(this.pointer, .035);
    const p = THREE.MathUtils.clamp(this.scroll.progress, 0, 1);
    this._updateAssetVisibility(p);
    this.cameraPath.getPoint(p, this.camera.position);
    this.targetPath.getPoint(p, this.pathTarget);
    const target = this.pathTarget;
    target.x += this.pointerEase.x * .22; target.y += this.pointerEase.y * .16;
    this.camera.lookAt(target);
    this.stars.rotation.z = elapsed * .002; this.stars.position.x = this.pointerEase.x * -.35;
    if (!reducedMotion) {
      this.animated.forEach((object,index) => { if (!object.visible) return; if (object.userData.rings) { object.userData.rings.forEach((ring,i)=>{ring.rotation.z=elapsed*(.08+i*.04)*(i%2?-1:1);ring.rotation.x=elapsed*.012*(i+1)}); object.userData.spiral.rotation.z=-elapsed*object.userData.speed; object.userData.core.rotation.z=elapsed*.03; object.userData.logo.rotation.y = -.08 + Math.sin(elapsed*.28)*.1; object.userData.logo.position.y = Math.sin(elapsed*.5)*.04; } else { object.rotation.z = Math.sin(elapsed*.3+index)*.002; } });
      if (this.mobile.visible) this.mobile.position.y = -.1 + Math.sin(elapsed*.65)*.12;
      if (this.network.visible) {
        this.network.rotation.y = elapsed*.035;
        this.network.userData.nodes.forEach((node,i)=>node.scale.setScalar(node.userData.baseScale * (.78+Math.sin(elapsed*2+i)*.22)));
        this.network.userData.hub.rotation.z = elapsed*.08;
        this.network.userData.hub.rotation.y = elapsed*.12;
      }
      if (this.backend.visible) {
        this.backend.userData.accent.rotation.z = elapsed*.16;
        this.backend.userData.rows.forEach((row,i)=>{ row.position.x = Math.sin(elapsed*.7+i)*.012; });
      }
      this.packetStreams.forEach(stream=>{
        if (!stream.parent.visible) return;
        stream.packets.forEach(packet=>{
          stream.curve.getPoint((elapsed*stream.speed+packet.userData.offset)%1, stream.point);
          packet.position.copy(stream.point);
        });
      });
    }
    this.composer.render();
  };

  render = () => this.renderFrame();
}

async function boot() {
  new PortfolioContent(portfolio).render();
  new ChapterController({ reducedMotion });

  requestAnimationFrame(() => {
    document.getElementById('loader').classList.add('is-finished');
    document.body.classList.add('is-ready');
  });

  try {
    const idle = 'requestIdleCallback' in window
      ? new Promise(resolve => window.requestIdleCallback(resolve, { timeout: 220 }))
      : new Promise(resolve => window.setTimeout(resolve, 0));
    await idle;
    const [threeModule, roundedModule, composerModule, renderModule, bloomModule, outputModule, gsapModule, scrollModule] = await Promise.all([
      import('three'),
      import('three/addons/geometries/RoundedBoxGeometry.js'),
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/OutputPass.js'),
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    THREE = threeModule;
    RoundedBoxGeometry = roundedModule.RoundedBoxGeometry;
    EffectComposer = composerModule.EffectComposer;
    RenderPass = renderModule.RenderPass;
    UnrealBloomPass = bloomModule.UnrealBloomPass;
    OutputPass = outputModule.OutputPass;
    ScrollTrigger = scrollModule.ScrollTrigger;
    gsapModule.gsap.registerPlugin(ScrollTrigger);
    new ScrollWorld(document.getElementById('world'));
    ScrollTrigger.refresh();
  } catch(error) {
    document.body.classList.add('no-webgl');
    document.getElementById('sceneControl').hidden = true;
    console.error('WebGL world could not initialize.',error);
  }
}

boot();
