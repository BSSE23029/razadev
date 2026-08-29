import './styles/cinematic.css';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { portfolio } from './data/portfolio.js';
import { PortfolioContent } from './components/cinematic/PortfolioContent.js';
import { ChapterController } from './components/cinematic/ChapterController.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const compact = window.matchMedia('(max-width: 800px)').matches;
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
    this._buildRenderer();
    this._buildWorld();
    this._bind();
    this.resize();
    this.render();
  }

  _buildRenderer() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02040b);
    this.scene.fog = new THREE.FogExp2(0x02040b, 0.024);
    this.camera = new THREE.PerspectiveCamera(compact ? 56 : 48, 1, 0.1, 120);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !compact, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, compact ? 1.25 : 1.7));

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    if (!compact && !reducedMotion) {
      this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.72, 0.7, 0.72);
      this.composer.addPass(this.bloom);
    }
    this.composer.addPass(new OutputPass());
  }

  _buildWorld() {
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.scene.add(new THREE.AmbientLight(0x637aa8, 0.65));
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
    return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, metalness: 0.58, roughness: 0.27 });
  }

  _glowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)'); gradient.addColorStop(.18, 'rgba(115,232,255,.95)'); gradient.addColorStop(1, 'rgba(50,90,255,0)');
    context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }

  _createStars() {
    const count = compact ? 1200 : 2600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cool = new THREE.Color(COLORS.cyan), warm = new THREE.Color(COLORS.violet);
    for (let i = 0; i < count; i += 1) {
      const radius = 9 + Math.random() * 25, angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius; positions[i * 3 + 1] = (Math.random() - .5) * 24; positions[i * 3 + 2] = 14 - Math.random() * 82;
      const color = cool.clone().lerp(warm, Math.random()); colors.set([color.r, color.g, color.b], i * 3);
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.stars = new THREE.Points(geometry, new THREE.PointsMaterial({ size: compact ? .035 : .045, vertexColors: true, transparent: true, opacity: .62, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.world.add(this.stars);
  }

  _createPortal(position, radius) {
    const group = new THREE.Group(); group.position.copy(position);
    const rings = [];
    for (let i = 0; i < 4; i += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * (1 - i * .14), .018 + i * .012, 12, 128), new THREE.MeshBasicMaterial({ color: i % 2 ? COLORS.violet : COLORS.cyan, transparent: true, opacity: .72 - i * .1, blending: THREE.AdditiveBlending }));
      ring.rotation.set(i * .18, i * .27, i * .46); group.add(ring); rings.push(ring);
    }
    const count = compact ? 600 : 1400, positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
    const c1 = new THREE.Color(COLORS.cyan), c2 = new THREE.Color(COLORS.violet);
    for (let i = 0; i < count; i += 1) {
      const t = (i / count) * Math.PI * 18 + Math.random() * .3;
      const r = radius * (.2 + .78 * (i / count)) + (Math.random() - .5) * .16;
      positions.set([Math.cos(t) * r, Math.sin(t) * r, (1 - i / count) * 2.3 + (Math.random() - .5) * .3], i * 3);
      const c = c1.clone().lerp(c2, i / count); colors.set([c.r, c.g, c.b], i * 3);
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const spiral = new THREE.Points(geometry, new THREE.PointsMaterial({ size: radius * .07, map: this._glowTexture(), vertexColors: true, transparent: true, opacity: .78, depthWrite: false, blending: THREE.AdditiveBlending }));
    group.add(spiral);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * .23, 2), this.material(0x172355, COLORS.violet, 2.5)); group.add(core);
    group.userData = { rings, spiral, core, speed: .11 + Math.random() * .04 };
    this.animated.push(group); this.world.add(group); return group;
  }

  _createMobileWorld() {
    const group = new THREE.Group(); group.position.set(3.8, -.1, -11.5); group.rotation.set(-.18, -.5, -.08);
    const body = new THREE.Mesh(new RoundedBoxGeometry(3.0, 5.7, .48, 6, .25), this.material(0x081426)); group.add(body);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.68, 5.25), new THREE.MeshStandardMaterial({ color: 0x030b18, emissive: 0x071b35, emissiveIntensity: .7, metalness: .25, roughness: .18 })); screen.position.z = .25; group.add(screen);
    const top = new THREE.Mesh(new RoundedBoxGeometry(1.55, .22, .05, 3, .05), this.material(COLORS.cyan, COLORS.cyan, 1.5)); top.position.set(-.35, 1.85, .29); group.add(top);
    for (let i = 0; i < 4; i += 1) { const card = new THREE.Mesh(new RoundedBoxGeometry(2.15, .65, .08, 3, .08), this.material(i === 0 ? 0x2e7cff : 0x10213c, i === 0 ? COLORS.blue : 0x000000, i === 0 ? .8 : 0)); card.position.set(0, .9 - i * .9, .3 + i * .008); group.add(card); }
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(3.2, .012, 8, 100), new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: .2 })); orbit.rotation.x = 1.2; group.add(orbit);
    this.animated.push(group); this.world.add(group); return group;
  }

  _createNetworkWorld() {
    const group = new THREE.Group(); group.position.set(-3, 0, -23);
    const nodes = [], nodeCount = compact ? 24 : 42;
    for (let i = 0; i < nodeCount; i += 1) { const a = i * 2.399, radius = 1.1 + Math.sqrt(i) * .46; const node = new THREE.Mesh(new THREE.IcosahedronGeometry(i % 9 === 0 ? .2 : .075, 1), this.material(i % 9 === 0 ? COLORS.violet : COLORS.cyan, i % 9 === 0 ? COLORS.violet : COLORS.cyan, 2.2)); node.position.set(Math.cos(a) * radius, Math.sin(a * 1.3) * 2.9, Math.sin(a) * 1.6); nodes.push(node); group.add(node); }
    const linePositions = [];
    for (let i = 1; i < nodes.length; i += 1) { const a = nodes[i - 1].position, b = nodes[i].position; linePositions.push(a.x,a.y,a.z,b.x,b.y,b.z); if (i > 5 && i % 3 === 0) { const c = nodes[i - 5].position; linePositions.push(a.x,a.y,a.z,c.x,c.y,c.z); } }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    group.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: COLORS.blue, transparent: true, opacity: .27, blending: THREE.AdditiveBlending })));
    const route = new THREE.CatmullRomCurve3(nodes.filter((_, i) => i % 5 === 0).map(node => node.position)); this._createPackets(group, route, 12);
    group.userData.nodes = nodes; this.animated.push(group); this.world.add(group); return group;
  }

  _createBackendWorld() {
    const group = new THREE.Group(); group.position.set(3.2, -.3, -35); group.rotation.y = -.35;
    const towers = [];
    for (let t = 0; t < 5; t += 1) { const tower = new THREE.Group(); tower.position.set((t - 2) * 1.15, Math.abs(t - 2) * -.2, (t % 2) * -.7); const units = 4 + (t % 3); for (let i = 0; i < units; i += 1) { const server = new THREE.Mesh(new RoundedBoxGeometry(.94,.56,.9,3,.07), this.material(0x0c1930)); server.position.y = i * .67 - 1.5; tower.add(server); const led = new THREE.Mesh(new THREE.SphereGeometry(.035,8,8), new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? COLORS.violet : COLORS.cyan })); led.position.set(.32,server.position.y,.46); tower.add(led); } towers.push(tower); group.add(tower); }
    const crown = new THREE.Mesh(new THREE.TorusKnotGeometry(1.25,.045,120,10,2,5), new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent:true,opacity:.42,blending:THREE.AdditiveBlending })); crown.position.y = 2.1; crown.rotation.x = 1; group.add(crown); group.userData.crown = crown; group.userData.towers = towers;
    this.animated.push(group); this.world.add(group); return group;
  }

  _createPackets(parent, curve, count) {
    const packets = [];
    for (let i = 0; i < count; i += 1) { const packet = new THREE.Mesh(new THREE.SphereGeometry(.055,8,8), new THREE.MeshBasicMaterial({ color: i % 3 ? COLORS.cyan : COLORS.violet })); packet.userData.offset = i / count; parent.add(packet); packets.push(packet); }
    this.packetStreams.push({ packets, curve, speed: .055 + Math.random() * .035 });
  }

  _createTransitField() {
    for (let stage = 0; stage < 4; stage += 1) { const z = -6 - stage * 12; const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-8,Math.sin(stage)*2,z),new THREE.Vector3(0,(stage%2?2:-2),z-4),new THREE.Vector3(8,Math.cos(stage)*2,z-8)]); const tube = new THREE.Mesh(new THREE.TubeGeometry(curve,80,.012,6,false),new THREE.MeshBasicMaterial({color:stage%2?COLORS.violet:COLORS.blue,transparent:true,opacity:.16,blending:THREE.AdditiveBlending})); this.world.add(tube); this._createPackets(this.world,curve,5); }
  }

  _bind() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('pointermove', event => { this.pointer.set((event.clientX / innerWidth - .5) * 2, (event.clientY / innerHeight - .5) * -2); }, { passive: true });
    document.addEventListener('visibilitychange', () => { this.hidden = document.hidden; if (!this.hidden) this.clock.getDelta(); });
    ScrollTrigger.create({ trigger: '.journey', start: 'top top', end: 'bottom bottom', scrub: reducedMotion ? false : 1.1, onUpdate: self => { this.scroll.progress = self.progress; document.getElementById('chapterProgress').style.height = `${self.progress * 100}%`; } });
  }

  resize() { const width = innerWidth, height = innerHeight; this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); this.renderer.setSize(width,height,false); this.composer.setSize(width,height); this.renderer.setPixelRatio(Math.min(devicePixelRatio, width < 800 ? 1.25 : 1.7)); }

  render = () => {
    requestAnimationFrame(this.render); if (this.hidden) return;
    const elapsed = this.clock.getElapsedTime(); this.pointerEase.lerp(this.pointer, .035);
    const p = THREE.MathUtils.clamp(this.scroll.progress,0,1); this.camera.position.copy(this.cameraPath.getPoint(p)); const target = this.targetPath.getPoint(p); target.x += this.pointerEase.x * .22; target.y += this.pointerEase.y * .16; this.camera.lookAt(target);
    this.stars.rotation.z = elapsed * .002; this.stars.position.x = this.pointerEase.x * -.35;
    this.animated.forEach((object,index) => { if (object.userData.rings) { object.userData.rings.forEach((ring,i)=>{ring.rotation.z=elapsed*(.08+i*.04)*(i%2?-1:1);ring.rotation.x+=.0005*(i+1)}); object.userData.spiral.rotation.z=-elapsed*object.userData.speed; object.userData.core.rotation.set(elapsed*.2,elapsed*.26,0); } else { object.rotation.z += Math.sin(elapsed*.3+index)*.00015; } });
    this.mobile.position.y = -.1 + Math.sin(elapsed*.65)*.12; this.network.rotation.y = elapsed*.035; this.network.userData.nodes.forEach((node,i)=>node.scale.setScalar(.78+Math.sin(elapsed*2+i)*.22)); this.backend.userData.crown.rotation.z=elapsed*.22; this.backend.userData.towers.forEach((tower,i)=>tower.position.y+=Math.sin(elapsed*.8+i)*.00055);
    this.packetStreams.forEach(stream=>stream.packets.forEach((packet,i)=>packet.position.copy(stream.curve.getPoint((elapsed*stream.speed+packet.userData.offset)%1))));
    this.composer.render();
  };
}

async function boot() {
  const percent = document.getElementById('loadPercent'); let value = 0;
  const progress = setInterval(()=>{value=Math.min(92,value+Math.ceil(Math.random()*11));percent.textContent=value;},90);
  new PortfolioContent(portfolio).render();
  new ChapterController({ reducedMotion });
  try { new ScrollWorld(document.getElementById('world')); await new Promise(resolve=>setTimeout(resolve,compact?700:1100)); value=100; percent.textContent=value; clearInterval(progress); document.getElementById('loader').classList.add('is-finished'); document.body.classList.add('is-ready'); ScrollTrigger.refresh(); }
  catch(error){ clearInterval(progress); document.getElementById('loader').classList.add('is-finished'); document.body.classList.add('no-webgl'); console.error('WebGL world could not initialize.',error); }
}

boot();
