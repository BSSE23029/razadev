import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DynamicDrawUsage,
  Float32BufferAttribute,
  FogExp2,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NormalBlending,
  Object3D,
  OctahedronGeometry,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  TextureLoader,
  Timer,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const compact = window.matchMedia('(max-width: 800px)').matches;
const saveData = Boolean(navigator.connection?.saveData);
const deviceMemory = navigator.deviceMemory || 8;
const hardwareConcurrency = navigator.hardwareConcurrency || 8;
const veryLowPower = saveData || hardwareConcurrency <= 2 || deviceMemory <= 2;
const lowPower = saveData || hardwareConcurrency <= 4 || deviceMemory <= 4;
const debug = import.meta.env.DEV && new URLSearchParams(window.location.search).has('sceneDebug');
const qualityOverride = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('quality') : null;

const COLORS = { cyan: 0x5ce7ff, blue: 0x3977ff, violet: 0x8b5cff, ink: 0x050b18, steel: 0x13213a, white: 0xf0f7ff };
const QUALITY = veryLowPower
  ? {
      name: 'low',
      pixelRatio: 1,
      stars: 240,
      nodes: 6,
      transitStages: 1,
      transitPackets: 1,
      curveSegments: 18,
      roundedSegments: 2,
      maxFps: 24,
      animate: false,
    }
  : lowPower || compact
  ? {
      name: 'medium',
      pixelRatio: compact ? 1.15 : 1.25,
      stars: lowPower ? 420 : 760,
      nodes: lowPower ? 8 : 12,
      transitStages: lowPower ? 1 : 2,
      transitPackets: 1,
      curveSegments: 24,
      roundedSegments: 3,
      maxFps: 30,
      animate: true,
    }
  : {
      name: 'high',
      pixelRatio: 1.5,
      stars: 900,
      nodes: 12,
      transitStages: 2,
      transitPackets: 1,
      curveSegments: 36,
      roundedSegments: 4,
      maxFps: 60,
      animate: true,
    };

if (qualityOverride === 'low') Object.assign(QUALITY, {
  name: 'low', pixelRatio: 1, stars: 240, nodes: 6, transitStages: 1, transitPackets: 1,
  curveSegments: 18, roundedSegments: 2, maxFps: 24, animate: false,
});
if (qualityOverride === 'medium') Object.assign(QUALITY, {
  name: 'medium', pixelRatio: 1.15, stars: 760, nodes: 12, transitStages: 2, transitPackets: 1,
  curveSegments: 24, roundedSegments: 3, maxFps: 30, animate: true,
});
if (qualityOverride === 'high') Object.assign(QUALITY, {
  name: 'high', pixelRatio: 1.5, stars: 900, nodes: 12, transitStages: 2, transitPackets: 1,
  curveSegments: 36, roundedSegments: 4, maxFps: 60, animate: true,
});

class ScrollWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new Timer();
    this.clock.connect(document);
    this.pointer = new Vector2();
    this.pointerEase = new Vector2();
    this.scroll = { progress: 0 };
    this.animated = [];
    this.packetStreams = [];
    this.pathTarget = new Vector3();
    this.hidden = document.hidden;
    this.paused = false;
    this.lastAnimationRender = 0;
    this.scrollTick = false;
    this.materialCache = new Map();
    this.basicMaterialCache = new Map();
    this.quality = QUALITY;
    this.motionReduced = reducedMotion;
    this.journey = null;
    this.progressIndicator = null;
    this.journeyStart = 0;
    this.scrollRange = 1;
    this.pathProgress = -1;
    this.visibilityProgress = -1;
    this.baseTarget = new Vector3();
    this._buildRenderer();
    this._buildWorld();
    this._bind();
    this.resize();
    this.renderFrame();
    window.addEventListener('pagehide', () => this.destroy(), { once: true });
    if (this.quality.animate && !this.motionReduced && !this.hidden) this.renderer.setAnimationLoop(this.render);
    if (debug) {
      window.__RAZA_SCENE__ = this;
      console.info(`[ScrollWorld] ${this.quality.name} tier`, this.renderer.info.render);
    }
  }

  _buildRenderer() {
    this.scene = new Scene();
    this.scene.background = new Color(0x010208);
    this.scene.fog = new FogExp2(0x010208, 0.008);
    this.camera = new PerspectiveCamera(compact ? 56 : 48, 1, 0.1, 120);
    this.renderer = new WebGLRenderer({ canvas: this.canvas, antialias: !compact, powerPreference: lowPower ? 'low-power' : 'high-performance' });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;
    this.renderer.setPixelRatio(this._pixelRatio());

  }

  _buildWorld() {
    this.world = new Group();
    this.scene.add(this.world);
    this.scene.add(new AmbientLight(0x91a6cf, 0.78));
    const fill = new DirectionalLight(0x3f70b5, 0.88);
    fill.position.set(-5, 4, 6);
    this.scene.add(fill);
    const front = new DirectionalLight(0xa9caff, 0.72);
    front.position.set(0, 1, 10);
    this.scene.add(front);
    const rim = new DirectionalLight(0x79a2ff, 1.15);
    rim.position.set(6, 2, -8);
    this.scene.add(rim);
    this.key = new PointLight(COLORS.cyan, 40, 34, 1.8);
    this.key.position.set(1, 3, 4);
    this.camera.add(this.key);
    this.scene.add(this.camera);

    this._createStars();
    // Keep the brand mark in the open right third so it supports the headline
    // instead of sitting underneath and competing with the opening copy.
    const originPosition = compact ? new Vector3(5.7, 0.45, -1.2) : new Vector3(11.3, 1.85, -0.8);
    this.originPortal = this._createPortal(originPosition, compact ? 1.28 : 1.65, true);
    this.mobile = this._createMobileWorld();
    this.network = this._createNetworkWorld();
    this.backend = this._createBackendWorld();
    this.returnPortal = this._createPortal(new Vector3(0, 0, -52), 2.8, false);
    this.returnPortal.rotation.y = Math.PI;
    this._createTransitField();

    this.cameraPath = new CatmullRomCurve3([
      new Vector3(0, 0.4, 10), new Vector3(1.0, 0.8, 5),
      new Vector3(-1.6, 0.2, -5), new Vector3(0.6, 0.7, -16),
      new Vector3(1.5, 0.4, -28), new Vector3(-0.8, 0.8, -40),
      new Vector3(0, 0.1, -46.5),
    ], false, 'catmullrom', 0.45);
    this.targetPath = new CatmullRomCurve3([
      new Vector3(4.4, 0.3, 0), new Vector3(3.5, 0, -4),
      new Vector3(3.8, 0, -11.5), new Vector3(-3, 0, -23),
      new Vector3(3.2, -0.2, -35), new Vector3(0, 0, -47),
      new Vector3(0, 0, -52),
    ], false, 'catmullrom', 0.45);
    this.camera.position.copy(this.cameraPath.getPoint(0));
    this.camera.lookAt(this.targetPath.getPoint(0));
  }

  material(color, emissive = 0x000000, emissiveIntensity = 0, metalness = 0.58, roughness = 0.27) {
    const key = `${color}:${emissive}:${emissiveIntensity}:${metalness}:${roughness}`;
    if (!this.materialCache.has(key)) {
      this.materialCache.set(key, new MeshStandardMaterial({ color, emissive, emissiveIntensity, metalness, roughness }));
    }
    return this.materialCache.get(key);
  }

  basicMaterial(color, opacity = 1, blending = NormalBlending, depthWrite = true) {
    const key = `${color}:${opacity}:${blending}:${depthWrite}`;
    if (!this.basicMaterialCache.has(key)) {
      this.basicMaterialCache.set(key, new MeshBasicMaterial({ color, transparent: opacity < 1, opacity, blending, depthWrite }));
    }
    return this.basicMaterialCache.get(key);
  }

  _logoTexture() {
    if (this.logoTexture) return this.logoTexture;
    this.logoTexture = new TextureLoader().load('/logos/dark/raza_logo_ui.webp');
    this.logoTexture.colorSpace = SRGBColorSpace;
    this.logoTexture.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 2);
    return this.logoTexture;
  }

  _createLogoObject(radius) {
    const logo = new Group();
    // The supplied mark has transparent breathing room around its circular face.
    // Keep the physical puck aligned to that face instead of the full texture plane.
    const medallionRadius = radius * 0.58;
    const medallion = new Mesh(
      new CylinderGeometry(medallionRadius, medallionRadius, 0.1, 48),
      this.material(0x142a43, 0x041522, 0.24, 0.58, 0.3),
    );
    medallion.rotation.x = Math.PI / 2;
    const topPlate = new Mesh(
      new CylinderGeometry(medallionRadius * 0.96, medallionRadius * 0.96, 0.035, 48),
      this.material(0x2f4d6b, 0x000000, 0, 0.52, 0.3),
    );
    topPlate.rotation.x = Math.PI / 2;
    topPlate.position.z = 0.055;
    // The supplied Raza mark already contains its circular border; one face keeps it crisp.
    const face = new Mesh(
      new PlaneGeometry(radius * 2.15, radius * 2.15),
      new MeshBasicMaterial({ map: this._logoTexture(), transparent: true, alphaTest: 0.02, depthWrite: false }),
    );
    face.position.z = 0.08;
    logo.add(medallion, topPlate, face);
    logo.position.z = 0.12;
    logo.rotation.y = -0.08;
    return logo;
  }

  _pixelRatio() {
    return Math.min(window.devicePixelRatio || 1, this.quality.pixelRatio);
  }

  _createStars() {
    const count = this.quality.stars;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cool = new Color(COLORS.cyan);
    const warm = new Color(COLORS.violet);
    const color = new Color();
    for (let i = 0; i < count; i += 1) {
      const radius = 9 + Math.random() * 25;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 2] = 14 - Math.random() * 82;
      color.copy(cool).lerp(warm, Math.random() * 0.7);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    this.stars = new Points(geometry, new PointsMaterial({ size: compact ? 0.03 : 0.04, vertexColors: true, transparent: true, opacity: 0.22, depthWrite: false, blending: AdditiveBlending }));
    this.world.add(this.stars);
  }

  _createPortal(position, radius, withLogo) {
    const group = new Group();
    group.position.copy(position);
    const ring = withLogo ? null : new Mesh(
      new TorusGeometry(radius, 0.009, 6, 48),
      this.basicMaterial(COLORS.cyan, 0.18, AdditiveBlending, false),
    );
    if (ring) {
      ring.rotation.set(0.12, 0.16, 0.04);
      group.add(ring);
    }
    const core = new Mesh(new CircleGeometry(radius * 0.72, 48), this.basicMaterial(0x071321, 0.94));
    core.position.z = -0.08;
    group.add(core);
    if (withLogo) {
      const edge = new Mesh(
        new TorusGeometry(radius * 0.72, 0.014, 6, 64),
        this.basicMaterial(COLORS.cyan, 0.38, AdditiveBlending, false),
      );
      edge.position.z = -0.035;
      group.add(edge);
    }
    const logo = withLogo ? this._createLogoObject(radius) : null;
    if (logo) group.add(logo);
    group.userData = { ring, core, logo, speed: 0.07 + Math.random() * 0.02 };
    this.animated.push(group);
    this.world.add(group);
    return group;
  }

  _rounded(width, height, depth, radius) {
    return new RoundedBoxGeometry(width, height, depth, this.quality.roundedSegments, radius);
  }

  _createMobileWorld() {
    const group = new Group();
    group.position.set(3.8, -0.1, -11.5);
    group.rotation.set(-0.18, -0.5, -0.08);
    group.userData.baseY = -0.1;
    group.userData.baseX = 3.8;
    group.userData.baseZ = -11.5;
    group.userData.baseRotationZ = -0.08;
    group.userData.revealY = -0.1;
    group.add(new Mesh(this._rounded(3, 5.7, 0.48, 0.25), this.material(0x17314d, 0x041522, 0.2, 0.5, 0.31)));
    const frame = new Mesh(this._rounded(2.78, 5.46, 0.08, 0.2), this.material(0x345574, 0x000000, 0, 0.48, 0.3));
    frame.position.z = 0.25;
    group.add(frame);
    const screen = new Mesh(this._rounded(2.62, 5.28, 0.045, 0.17), this.material(0x0d3150, 0x0f5f8f, 0.38, 0.25, 0.22));
    screen.position.z = 0.31;
    group.add(screen);
    const cameraIsland = new Mesh(this._rounded(0.54, 0.2, 0.06, 0.08), this.material(0x050a13));
    cameraIsland.position.set(0.27, 2.24, 0.36);
    group.add(cameraIsland);
    const lens = new Mesh(new SphereGeometry(0.042, 6, 6), this.basicMaterial(COLORS.cyan, 0.68));
    lens.position.set(0.27, 2.24, 0.4);
    group.add(lens);
    const sideButton = new Mesh(this._rounded(0.08, 0.62, 0.12, 0.04), this.material(0x35506a));
    sideButton.position.set(-1.54, 0.78, 0.02);
    group.add(sideButton);
    const top = new Mesh(this._rounded(1.28, 0.12, 0.025, 0.04), this.material(0x123253, COLORS.blue, 0.22));
    top.position.set(-0.5, 1.87, 0.36);
    group.add(top);
    const progress = new Mesh(this._rounded(1.7, 0.055, 0.025, 0.02), this.material(0x122944));
    progress.position.set(-0.32, 1.55, 0.36);
    group.add(progress);
    for (let i = 0; i < 2; i += 1) {
      const card = new Mesh(this._rounded(2.18, 0.66, 0.045, 0.08), this.material(i === 0 ? 0x10233d : 0x0a1424, i === 0 ? COLORS.blue : 0x000000, i === 0 ? 0.22 : 0));
      card.position.set(0, 0.86 - i * 0.86, 0.36);
      group.add(card);
      const cardLine = new Mesh(this._rounded(1.12 - i * 0.16, 0.045, 0.025, 0.02), this.material(i === 0 ? 0x4eb6d0 : 0x1e3049));
      cardLine.position.set(-0.38, 0.86 - i * 0.86, 0.4);
      group.add(cardLine);
    }
    const navLine = new Mesh(this._rounded(1.22, 0.055, 0.025, 0.02), this.material(0x203e5d));
    navLine.position.set(0, -1.68, 0.36);
    group.add(navLine);
    const homeIndicator = new Mesh(this._rounded(0.72, 0.045, 0.04, 0.02), this.material(0x6ac5db, COLORS.cyan, 0.36));
    homeIndicator.position.set(0, -2.23, 0.38);
    group.add(homeIndicator);
    this.animated.push(group);
    this.world.add(group);
    return group;
  }

  _createNetworkWorld() {
    const group = new Group();
    group.position.set(-3, 0, -23);
    const nodes = [];
    const nodeCount = this.quality.nodes;
    const nodeGeometry = new IcosahedronGeometry(0.105, 0);
    const hubGeometry = new IcosahedronGeometry(0.22, 0);
    const nodeMesh = new InstancedMesh(nodeGeometry, this.material(COLORS.cyan, COLORS.cyan, 1.8, 0.35, 0.32), nodeCount);
    const hubMesh = new InstancedMesh(hubGeometry, this.material(COLORS.violet, COLORS.violet, 1.8, 0.35, 0.32), 2);
    nodeMesh.instanceMatrix.setUsage(DynamicDrawUsage);
    hubMesh.instanceMatrix.setUsage(DynamicDrawUsage);
    const dummy = new Object3D();
    let nodeIndex = 0;
    let hubIndex = 0;
    for (let i = 0; i < nodeCount; i += 1) {
      const isHub = i === 0 || i === Math.floor(nodeCount * 0.58);
      const angle = i * 2.399;
      const radius = 1.1 + Math.sqrt(i) * 0.64;
      const position = new Vector3(Math.cos(angle) * radius, Math.sin(angle * 1.3) * 2.35, Math.sin(angle) * 1.45);
      const node = { position, isHub, baseScale: isHub ? 1 : 0.82, instanceIndex: isHub ? hubIndex : nodeIndex };
      nodes.push(node);
      dummy.position.copy(position);
      dummy.scale.setScalar(node.baseScale);
      dummy.updateMatrix();
      if (isHub) {
        hubMesh.setMatrixAt(hubIndex, dummy.matrix);
        hubIndex += 1;
      } else {
        nodeMesh.setMatrixAt(nodeIndex, dummy.matrix);
        nodeIndex += 1;
      }
    }
    nodeMesh.count = nodeIndex;
    hubMesh.count = hubIndex;
    nodeMesh.instanceMatrix.needsUpdate = true;
    hubMesh.instanceMatrix.needsUpdate = true;
    group.add(nodeMesh, hubMesh);

    const linePositions = [];
    for (let i = 1; i < nodes.length; i += 1) {
      const a = nodes[i - 1].position;
      const b = nodes[i].position;
      linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(linePositions, 3));
    group.add(new LineSegments(geometry, this.basicMaterial(COLORS.blue, 0.3, AdditiveBlending, false)));

    const hub = new Group();
    const hubCore = new Mesh(new OctahedronGeometry(0.58, 0), this.material(0x10214a, COLORS.violet, 1.08, 0.72, 0.24));
    hub.add(hubCore);
    group.add(hub);
    const route = new CatmullRomCurve3(nodes.filter((_, i) => i % 3 === 0).map(node => node.position));
    this._createPackets(group, route, 1);
    group.userData = { nodes, nodeMesh, hubMesh, dummy, hub };
    this.animated.push(group);
    this.world.add(group);
    return group;
  }

  _createBackendWorld() {
    const group = new Group();
    group.position.set(3.2, -0.3, -35);
    group.rotation.y = -0.28;
    const rack = new Mesh(this._rounded(3.7, 4.35, 1.02, 0.14), this.material(0x17324e, 0x041522, 0.18, 0.52, 0.3));
    group.add(rack);
    const inset = new Mesh(this._rounded(3.36, 4.02, 0.06, 0.08), this.material(0x365a79, 0x03101b, 0.16, 0.46, 0.3));
    inset.position.z = 0.54;
    group.add(inset);
    const sideRail = this.material(0x17243a);
    [-1.42, 1.42].forEach(x => {
      const rail = new Mesh(this._rounded(0.055, 3.72, 0.04, 0.02), sideRail);
      rail.position.set(x, 0, 0.59);
      group.add(rail);
    });
    const ledGeometry = new SphereGeometry(0.032, 6, 6);
    const ledMaterial = this.basicMaterial(COLORS.cyan, 0.92);
    const violetMaterial = this.basicMaterial(COLORS.violet, 0.96);
    const dummy = new Object3D();
    for (let i = 0; i < 5; i += 1) {
      const row = new Group();
      const chassis = new Mesh(this._rounded(2.72, 0.52, 0.08, 0.05), this.material(i === 2 ? 0x3c79a3 : 0x315775, 0x06172a, i === 2 ? 0.12 : 0, 0.42, 0.32));
      chassis.position.z = 0.58;
      row.add(chassis);
      const vent = new Mesh(new PlaneGeometry(1.1, 0.05), this.material(0x46637e));
      vent.position.set(-0.55, 0, 0.63);
      row.add(vent);
      const leds = new InstancedMesh(ledGeometry, ledMaterial, 3);
      for (let j = 0; j < 3; j += 1) {
        dummy.position.set(0.65 + j * 0.18, 0, 0.64);
        dummy.updateMatrix();
        leds.setMatrixAt(j, dummy.matrix);
      }
      row.add(leds);
      if (i === 2) {
        const researchLed = new InstancedMesh(ledGeometry, violetMaterial, 1);
        dummy.position.set(0.83, 0, 0.645);
        dummy.updateMatrix();
        researchLed.setMatrixAt(0, dummy.matrix);
        row.add(researchLed);
      }
      row.position.y = 1.48 - i * 0.72;
      group.add(row);
    }
    this.world.add(group);
    return group;
  }

  _createPackets(parent, curve, count) {
    if (!this.quality.animate || count <= 0) return;
    const geometry = this.packetGeometry || (this.packetGeometry = new SphereGeometry(0.045, 6, 6));
    if (!this.packetMaterial) {
      this.packetMaterial = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72, blending: AdditiveBlending, depthWrite: false, vertexColors: true });
    }
    const mesh = new InstancedMesh(geometry, this.packetMaterial, count);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    const offsets = [];
    const color = new Color();
    const dummy = new Object3D();
    for (let i = 0; i < count; i += 1) {
      offsets.push(i / count);
      dummy.position.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.set(i % 3 ? COLORS.cyan : COLORS.violet);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    parent.add(mesh);
    this.packetStreams.push({ parent, mesh, offsets, curve, speed: 0.045 + Math.random() * 0.025, point: new Vector3(), dummy });
  }

  _createTransitField() {
    this.transit = new Group();
    for (let stage = 0; stage < this.quality.transitStages; stage += 1) {
      const z = -6 - stage * 12;
      const curve = new CatmullRomCurve3([
        new Vector3(-8, Math.sin(stage) * 2, z),
        new Vector3(0, stage % 2 ? 2 : -2, z - 4),
        new Vector3(8, Math.cos(stage) * 2, z - 8),
      ]);
      const tube = new Mesh(
        new TubeGeometry(curve, this.quality.curveSegments, 0.009, 5, false),
        this.basicMaterial(stage % 2 ? COLORS.violet : COLORS.blue, 0.22, AdditiveBlending, false),
      );
      this.transit.add(tube);
      this._createPackets(this.transit, curve, this.quality.transitPackets);
    }
    this.world.add(this.transit);
  }

  _bind() {
    window.addEventListener('resize', () => this.resize(), { passive: true });
    window.addEventListener('pointermove', event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      this.pointer.set((event.clientX / innerWidth - 0.5) * 2, (event.clientY / innerHeight - 0.5) * -2);
    }, { passive: true });
    window.addEventListener('pointerleave', () => this.pointer.set(0, 0), { passive: true });
    document.addEventListener('visibilitychange', () => {
      this.hidden = document.hidden;
      if (this.hidden) {
        this.renderer.setAnimationLoop(null);
        return;
      }
      this.clock.reset();
      if (this.quality.animate && !this.motionReduced && !this.paused) this.renderer.setAnimationLoop(this.render);
      this.renderFrame();
    });
    const sceneControl = document.getElementById('sceneControl');
    if (sceneControl) {
      sceneControl.hidden = this.motionReduced || !this.quality.animate;
      sceneControl.addEventListener('click', () => {
        this.paused = !this.paused;
        sceneControl.setAttribute('aria-pressed', String(this.paused));
        sceneControl.setAttribute('aria-label', this.paused ? 'Resume ambient scene' : 'Pause ambient scene');
        const label = sceneControl.querySelector('span:not(.scene-control__icon)');
        if (label) label.textContent = this.paused ? 'Resume scene' : 'Pause scene';
        if (this.paused) this.renderer.setAnimationLoop(null);
        else if (!this.hidden && this.quality.animate && !this.motionReduced) this.renderer.setAnimationLoop(this.render);
        this.renderFrame();
      });
    }
    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotionPreferenceChange = event => {
      this.motionReduced = event.matches;
      const control = document.getElementById('sceneControl');
      if (control) control.hidden = this.motionReduced || !this.quality.animate;
      if (this.motionReduced || this.paused) this.renderer.setAnimationLoop(null);
      else if (!this.hidden && this.quality.animate) this.renderer.setAnimationLoop(this.render);
      this.renderFrame();
    };
    this.motionPreference.addEventListener?.('change', this.onMotionPreferenceChange);
    this.journey = document.querySelector('.journey');
    this.progressIndicator = document.getElementById('chapterProgress');
    if (this.journey && 'ResizeObserver' in window) {
      this.journeyObserver = new ResizeObserver(() => this._cacheScrollMetrics());
      this.journeyObserver.observe(this.journey);
    }
    document.fonts?.ready?.then(() => this._cacheScrollMetrics());
    this._cacheScrollMetrics();
    this._syncScroll();
    window.addEventListener('scroll', () => {
      if (this.scrollTick) return;
      this.scrollTick = true;
      requestAnimationFrame(() => {
        this.scrollTick = false;
        this._syncScroll();
      });
    }, { passive: true });
  }

  _syncScroll() {
    if (!this.journey) return;
    this.scroll.progress = MathUtils.clamp((window.scrollY - this.journeyStart) / this.scrollRange, 0, 1);
    if (this.progressIndicator) this.progressIndicator.style.height = `${this.scroll.progress * 100}%`;
    this.renderFrame();
  }

  _cacheScrollMetrics() {
    if (!this.journey) return;
    this.journeyStart = this.journey.getBoundingClientRect().top + window.scrollY;
    this.scrollRange = Math.max(this.journey.offsetHeight - innerHeight, 1);
  }

  resize() {
    const width = innerWidth;
    const height = innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this._pixelRatio());
    this.renderer.setSize(width, height, false);
    this._cacheScrollMetrics();
    this._syncScroll();
    this.renderFrame();
  }

  _updateAssetVisibility(progress) {
    if (progress === this.visibilityProgress) return;
    this.visibilityProgress = progress;
    [
      [this.originPortal, 0, 0.24],
      [this.network, 0.34, 0.7],
      [this.backend, 0.54, 0.9],
      [this.returnPortal, 0.78, 1],
    ].forEach(([asset, start, end]) => { asset.visible = progress >= start && progress <= end; });
    const mobileReveal = MathUtils.smoothstep(progress, 0.04, 0.2);
    this.mobile.visible = progress <= 0.56;
    this.mobile.position.x = this.mobile.userData.baseX + (1 - mobileReveal) * 2.7;
    this.mobile.position.z = this.mobile.userData.baseZ - (1 - mobileReveal) * 7;
    this.mobile.userData.revealY = this.mobile.userData.baseY + (1 - mobileReveal) * 1.5;
    this.mobile.scale.setScalar(0.78 + mobileReveal * 0.22);
    this.mobile.rotation.z = this.mobile.userData.baseRotationZ + (1 - mobileReveal) * 0.18;
    this.transit.visible = progress >= 0.08 && progress <= 0.92;
  }

  _updateDebug(now, frameMs = 0) {
    if (!debug) return;
    this.debugFrames = (this.debugFrames || 0) + 1;
    this.debugFrameTime = (this.debugFrameTime || 0) + frameMs;
    this.debugLast = this.debugLast || now;
    if (now - this.debugLast < 2000) return;
    const info = this.renderer.info;
    console.info('[ScrollWorld] frame sample', {
      fps: Math.round(this.debugFrames / ((now - this.debugLast) / 1000)),
      frameMs: Number((this.debugFrameTime / this.debugFrames).toFixed(2)),
      calls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      quality: this.quality.name,
    });
    this.debugFrames = 0;
    this.debugFrameTime = 0;
    this.debugLast = now;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.renderer.setAnimationLoop(null);
    this.motionPreference?.removeEventListener?.('change', this.onMotionPreferenceChange);
    this.journeyObserver?.disconnect();
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    this.world.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.filter(Boolean).forEach(material => {
        materials.add(material);
        if (material.map) textures.add(material.map);
      });
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
    this.logoTexture?.dispose();
    this.clock.dispose();
    this.renderer.renderLists?.dispose();
    this.renderer.dispose();
    if (debug && window.__RAZA_SCENE__ === this) delete window.__RAZA_SCENE__;
  }

  renderFrame = (time = performance.now(), fromAnimationLoop = false) => {
    if (this.hidden) return;
    if (fromAnimationLoop && this.quality.maxFps < 60 && time - this.lastAnimationRender < 1000 / this.quality.maxFps) return;
    if (fromAnimationLoop) this.lastAnimationRender = time;
    this.clock.update(time);
    const frameStart = debug ? performance.now() : 0;
    const elapsed = this.quality.animate && !this.motionReduced ? this.clock.getElapsed() : 0;
    const progress = MathUtils.clamp(this.scroll.progress, 0, 1);
    const pathChanged = progress !== this.pathProgress;
    if (pathChanged) {
      this.pathProgress = progress;
      this.cameraPath.getPoint(progress, this.camera.position);
      this.targetPath.getPoint(progress, this.baseTarget);
    }
    const previousPointerX = this.pointerEase.x;
    const previousPointerY = this.pointerEase.y;
    this.pointerEase.lerp(this.pointer, 0.035);
    const pointerChanged = Math.abs(previousPointerX - this.pointerEase.x) > 0.0001 || Math.abs(previousPointerY - this.pointerEase.y) > 0.0001;
    this._updateAssetVisibility(progress);
    if (pathChanged || pointerChanged) {
      this.pathTarget.copy(this.baseTarget);
      this.pathTarget.x += this.pointerEase.x * 0.22;
      this.pathTarget.y += this.pointerEase.y * 0.16;
      this.camera.lookAt(this.pathTarget);
    }
    this.stars.rotation.z = elapsed * 0.0014;
    this.stars.position.x = this.pointerEase.x * -0.35;
    if (this.quality.animate && !this.motionReduced) {
      this.animated.forEach((object, index) => {
        if (!object.visible) return;
        if (object.userData.ring) {
          object.userData.ring.rotation.z = elapsed * object.userData.speed;
          object.userData.ring.rotation.x = 0.12 + Math.sin(elapsed * 0.12) * 0.012;
          object.userData.core.rotation.z = elapsed * 0.02;
        } else if (object.userData.logo) {
          object.userData.logo.rotation.y = -0.08 + Math.sin(elapsed * 0.2) * 0.06;
          object.userData.logo.position.y = Math.sin(elapsed * 0.38) * 0.025;
          object.userData.core.rotation.z = elapsed * 0.02;
        } else {
          object.rotation.z = Math.sin(elapsed * 0.22 + index) * 0.0015;
        }
      });
      if (this.mobile.visible) this.mobile.position.y = this.mobile.userData.revealY + Math.sin(elapsed * 0.48) * 0.07;
      if (this.network.visible) {
        this.network.rotation.y = elapsed * 0.022;
        const { nodes, nodeMesh, hubMesh, dummy } = this.network.userData;
        nodes.forEach(node => {
          dummy.position.copy(node.position);
          dummy.scale.setScalar(node.baseScale * (0.88 + Math.sin(elapsed * 1.5 + node.instanceIndex) * 0.12));
          dummy.updateMatrix();
          if (node.isHub) hubMesh.setMatrixAt(node.instanceIndex, dummy.matrix);
          else nodeMesh.setMatrixAt(node.instanceIndex, dummy.matrix);
        });
        nodeMesh.instanceMatrix.needsUpdate = true;
        hubMesh.instanceMatrix.needsUpdate = true;
        this.network.userData.hub.rotation.z = elapsed * 0.05;
        this.network.userData.hub.rotation.y = elapsed * 0.08;
      }
      this.packetStreams.forEach(stream => {
        if (!stream.parent.visible) return;
        stream.offsets.forEach((offset, index) => {
          stream.curve.getPoint((elapsed * stream.speed + offset) % 1, stream.point);
          stream.dummy.position.copy(stream.point);
          stream.dummy.updateMatrix();
          stream.mesh.setMatrixAt(index, stream.dummy.matrix);
        });
        stream.mesh.instanceMatrix.needsUpdate = true;
      });
    }
    this.renderer.render(this.scene, this.camera);
    this._updateDebug(time, debug ? performance.now() - frameStart : 0);
  };

  render = time => this.renderFrame(time, true);
}

export { ScrollWorld };
