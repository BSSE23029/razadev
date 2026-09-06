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
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  TextureLoader,
  Timer,
  Texture,
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

const COLORS = {
  cyan: 0x5ce7ff,
  blue: 0x3977ff,
  ice: 0xa9ddff,
  violet: 0x7abfff,
  ink: 0x050b18,
  steel: 0x13213a,
  white: 0xf0f7ff,
};
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
      spaceStars: 24,
      spaceSegments: 32,
      backendRows: 3,
      phoneDetails: false,
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
      spaceStars: 48,
      spaceSegments: 48,
      backendRows: 4,
      phoneDetails: true,
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
      spaceStars: 84,
      spaceSegments: 64,
      backendRows: 4,
      phoneDetails: true,
      maxFps: 48,
      animate: true,
    };

if (qualityOverride === 'low') Object.assign(QUALITY, {
  name: 'low', pixelRatio: 1, stars: 240, nodes: 6, transitStages: 1, transitPackets: 1,
  curveSegments: 18, roundedSegments: 2, spaceStars: 24, spaceSegments: 32, backendRows: 3, phoneDetails: false,
  maxFps: 24, animate: false,
});
if (qualityOverride === 'medium') Object.assign(QUALITY, {
  name: 'medium', pixelRatio: 1.15, stars: 760, nodes: 12, transitStages: 2, transitPackets: 1,
  curveSegments: 24, roundedSegments: 3, spaceStars: 48, spaceSegments: 48, backendRows: 4, phoneDetails: true,
  maxFps: 30, animate: true,
});
if (qualityOverride === 'high') Object.assign(QUALITY, {
  name: 'high', pixelRatio: 1.5, stars: 900, nodes: 12, transitStages: 2, transitPackets: 1,
  curveSegments: 36, roundedSegments: 4, spaceStars: 84, spaceSegments: 64, backendRows: 4, phoneDetails: true,
  maxFps: 48, animate: true,
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
    this.renderRequest = false;
    this.animationLoopRunning = false;
    this.debugStats = { fps: 0, frameMs: 0 };
    this.materialCache = new Map();
    this.basicMaterialCache = new Map();
    this.geometryCache = new Map();
    this.quality = QUALITY;
    this.runtimePixelRatio = Infinity;
    this.frameBudget = { samples: 0, averageMs: 0, adjustments: 0 };
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
    window.addEventListener('pagehide', event => {
      if (!event.persisted) this.destroy();
    });
    window.addEventListener('pageshow', event => {
      if (!event.persisted || this.destroyed) return;
      this.hidden = document.hidden;
      this.clock.reset();
      this._setAnimationLoop(true);
      this.renderFrame();
    });
    this._setAnimationLoop(true);
    if (debug) {
      window.__RAZA_SCENE__ = this;
      console.info(`[ScrollWorld] ${this.quality.name} tier`, this.diagnostics());
    }
  }

  _buildRenderer() {
    this.scene = new Scene();
    this.scene.background = new Color(0x010208);
    this.scene.fog = null;
    this.camera = new PerspectiveCamera(compact ? 56 : 48, 1, 0.1, 120);
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: QUALITY.name === 'high' && !compact && !lowPower,
      powerPreference: lowPower ? 'low-power' : 'high-performance',
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;
    this._adaptQualityToRenderer();
    this.scene.fog = this.quality.name === 'low' ? null : new FogExp2(0x010208, 0.008);
    this.renderer.setPixelRatio(this._pixelRatio());

  }

  _adaptQualityToRenderer() {
    const context = this.renderer.getContext();
    const rendererInfo = context.getExtension('WEBGL_debug_renderer_info');
    this.rendererName = rendererInfo
      ? context.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL)
      : 'unknown';
    const software = /swiftshader|llvmpipe|softpipe|software rasterizer/i.test(this.rendererName);
    this.softwareRenderer = software;
    if (!software || qualityOverride || this.quality.name !== 'high') return;

    // Software WebGL can create a context successfully while still making
    // the ambient loop too expensive. Keep the 3D scene present, but use the
    // same intentionally quiet profile as a genuinely low-power device.
    Object.assign(this.quality, {
      name: 'low',
      pixelRatio: 1,
      stars: 240,
      nodes: 6,
      transitStages: 1,
      transitPackets: 1,
      curveSegments: 18,
      roundedSegments: 2,
      spaceStars: 24,
      spaceSegments: 32,
      backendRows: 3,
      phoneDetails: false,
      maxFps: 24,
      animate: false,
    });
  }

  _buildWorld() {
    this.world = new Group();
    this.scene.add(this.world);
    this.scene.add(new AmbientLight(0x6e83a4, 0.38));
    const key = new DirectionalLight(0xd7e8ff, 1.08);
    key.position.set(-3, 4, 8);
    this.scene.add(key);
    const rim = new DirectionalLight(0x3977ff, 1.2);
    rim.position.set(6, 2, -8);
    this.scene.add(rim);
    this.scene.add(this.camera);

    this._createStars();
    // Keep the brand mark in the open right third so it supports the headline
    // instead of sitting underneath and competing with the opening copy.
    const originPosition = compact ? new Vector3(5.7, 0.45, -1.2) : new Vector3(11.3, 1.85, -0.8);
    this.originPortal = this._createPortal(originPosition, compact ? 1.28 : 1.65, true);
    this.mobile = this._createMobileWorld();
    // Keep later chapters out of the initial GPU upload. They are created just
    // before their camera chapter becomes visible, including when a deep hash
    // link opens the page directly at a later section.
    this.network = null;
    this.backend = null;
    this.transit = null;
    this.returnPortal = null;

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
    const domLogo = document.querySelector('.wordmark img.theme-logo');
    if (domLogo?.complete && domLogo.naturalWidth > 0) {
      this.logoTexture = new Texture(domLogo);
      this.logoTexture.needsUpdate = true;
    } else {
      this.logoTexture = new TextureLoader().load('/logos/dark/raza_logo_ui_small.webp');
    }
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
      this.material(0x070d15, 0x020810, 0.2, 0.68, 0.26),
    );
    medallion.rotation.x = Math.PI / 2;
    const topPlate = new Mesh(
      new CylinderGeometry(medallionRadius * 0.96, medallionRadius * 0.96, 0.035, 48),
      this.material(0x142231, COLORS.cyan, 0.06, 0.58, 0.27),
    );
    topPlate.rotation.x = Math.PI / 2;
    topPlate.position.z = 0.055;
    const smoke = new Mesh(
      new CircleGeometry(medallionRadius * 0.98, 48),
      this.basicMaterial(0x02060d, 0.34, NormalBlending, false),
    );
    smoke.position.z = 0.073;
    // The supplied Raza mark already contains its circular border; one face keeps it crisp.
    const face = new Mesh(
      new PlaneGeometry(radius * 2.15, radius * 2.15),
      new MeshBasicMaterial({ map: this._logoTexture(), transparent: true, alphaTest: 0.02, depthWrite: false }),
    );
    face.position.z = 0.08;
    logo.add(medallion, topPlate, smoke, face);
    logo.position.z = 0.12;
    logo.rotation.y = -0.08;
    return logo;
  }

  _pixelRatio() {
    return Math.min(window.devicePixelRatio || 1, this.quality.pixelRatio, this.runtimePixelRatio);
  }

  _adaptRenderBudget(frameMs) {
    if (qualityOverride || !this.quality.animate || this.quality.name === 'low' || frameMs <= 0) return;
    const budget = this.frameBudget;
    budget.samples += 1;
    budget.averageMs = budget.samples === 1
      ? frameMs
      : budget.averageMs * 0.9 + frameMs * 0.1;
    const currentPixelRatio = this._pixelRatio();
    if (budget.samples < 30 || budget.averageMs < 28 || currentPixelRatio <= 0.75) return;

    this.runtimePixelRatio = Math.max(0.75, currentPixelRatio * 0.8);
    this.renderer.setPixelRatio(this._pixelRatio());
    this.renderer.setSize(innerWidth, innerHeight, false);
    budget.adjustments += 1;
    budget.samples = 0;
    budget.averageMs = 0;
    if (debug) console.info('[ScrollWorld] reduced pixel ratio after slow frames', this._pixelRatio());
  }

  _hasVisibleMotion() {
    if (!this.quality.animate || this.motionReduced || this.paused) return false;
    return Boolean(
      this.originPortal?.visible
      || this.mobile?.visible
      || this.network?.visible
      || this.transit?.visible
      || this.returnPortal?.visible
    );
  }

  _setAnimationLoop(active) {
    const shouldRun = Boolean(active && this._hasVisibleMotion() && !this.hidden && !this.destroyed);
    if (shouldRun === this.animationLoopRunning) return;
    this.animationLoopRunning = shouldRun;
    this.renderer.setAnimationLoop(shouldRun ? this.render : null);
  }

  _requestRender() {
    if (this.renderRequest || this.hidden || this.destroyed || this.animationLoopRunning) return;
    this.renderRequest = true;
    requestAnimationFrame(time => {
      this.renderRequest = false;
      if (this.hidden || this.destroyed) return;
      this.renderFrame(time);
      const pointerDistance = this.pointer.distanceTo(this.pointerEase);
      if (!this.animationLoopRunning && pointerDistance > 0.001) this._requestRender();
    });
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
    const logo = withLogo ? this._createLogoObject(radius) : null;
    if (logo) group.add(logo);
    group.userData = { ring, core, logo, speed: 0.07 + Math.random() * 0.02 };
    this.animated.push(group);
    this.world.add(group);
    return group;
  }

  _createPortalTextureLayer(group, url, count, radiusScale, zSpread, color, opacity, speed, seed = 0) {
    new TextureLoader().load(url, texture => {
      // The reference effect is texture-led. Keep the files lazy and let the
      // procedural portal render immediately underneath while they decode.
      if (this.destroyed || !group.parent) {
        texture.dispose();
        return;
      }
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 1;
      const geometry = new PlaneGeometry(0.92, 0.92);
      const material = new MeshBasicMaterial({
        map: texture,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: NormalBlending,
      });
      const layer = new InstancedMesh(geometry, material, count);
      layer.instanceMatrix.setUsage(DynamicDrawUsage);
      const dummy = new Object3D();
      for (let index = 0; index < count; index += 1) {
        const progress = (index + 0.5) / count;
        const angle = seed + progress * Math.PI * 8.2 + Math.sin(index * 1.7 + seed) * 0.05;
        const radius = (0.28 + Math.pow(progress, 0.72) * 4.4) * radiusScale;
        dummy.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.72,
          -0.35 - progress * zSpread,
        );
        dummy.rotation.set(0, 0, seed + index * 0.41);
        const size = 0.55 + progress * 0.62 + ((index * 17) % 7) * 0.025;
        dummy.scale.set(size, size * (0.82 + ((index * 11) % 5) * 0.04), 1);
        dummy.updateMatrix();
        layer.setMatrixAt(index, dummy.matrix);
      }
      layer.instanceMatrix.needsUpdate = true;
      layer.renderOrder = -1;
      group.add(layer);
      group.userData.portalLayers.push({ layer, speed });
      this._requestRender();
    });
  }

  _createSpaceWorld() {
    const group = new Group();
    group.position.set(0, 0, -52);
    group.scale.setScalar(compact ? 0.9 : 1.08);

    // The final chapter follows the reference's texture-led sci-fi portal:
    // layered smoke spirals, a saturated blue centre and twilight dust. The
    // layers still use shared instancing so the effect can stay atmospheric
    // without turning every smoke card into a separate draw call.
    const portalBackdrop = new Mesh(
      new CircleGeometry(7.4, compact ? 32 : 48),
      this.basicMaterial(0x020a16, 0.78, NormalBlending, false),
    );
    portalBackdrop.position.z = -3.4;
    portalBackdrop.renderOrder = -3;
    group.add(portalBackdrop);

    const spiralCount = compact ? 52 : this.quality.name === 'low' ? 72 : this.quality.spaceStars * 2;
    const spiralPositions = new Float32Array(spiralCount * 3);
    const spiralColors = new Float32Array(spiralCount * 3);
    const portalCyan = new Color(COLORS.cyan);
    const portalIce = new Color(COLORS.ice);
    const portalColor = new Color();
    for (let i = 0; i < spiralCount; i += 1) {
      const t = (i + 0.5) / spiralCount;
      const arm = i % 3;
      const radius = 0.72 + Math.pow(t, 0.78) * 5.6;
      const angle = arm * (Math.PI * 2 / 3) + t * Math.PI * 4.6;
      const offset = i * 3;
      spiralPositions[offset] = Math.cos(angle) * radius;
      spiralPositions[offset + 1] = Math.sin(angle) * radius * 0.72;
      spiralPositions[offset + 2] = -0.45 - t * 2.75;
      portalColor.copy(portalCyan).lerp(portalIce, 0.18 + t * 0.72);
      spiralColors.set([portalColor.r, portalColor.g, portalColor.b], offset);
    }
    const spiralGeometry = new BufferGeometry();
    spiralGeometry.setAttribute('position', new BufferAttribute(spiralPositions, 3));
    spiralGeometry.setAttribute('color', new BufferAttribute(spiralColors, 3));
    const portalSpiral = new Points(
      spiralGeometry,
      new PointsMaterial({
        size: compact ? 0.055 : 0.072,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    portalSpiral.renderOrder = -1;
    group.add(portalSpiral);

    const layerCount = compact ? 80 : this.quality.name === 'low' ? 96 : this.quality.name === 'medium' ? 140 : 190;
    this._createPortalTextureLayer(group, '/scene/portal/dark-smoke.png', layerCount, 1.06, 3.1, 0x39465d, 0.2, 0.08, 0.4);
    this._createPortalTextureLayer(group, '/scene/portal/smoke.png', layerCount, 0.82, 2.3, 0xbac5d6, 0.24, 0.12, 1.8);
    this._createPortalTextureLayer(group, '/scene/portal/colored-smoke.png', layerCount, 0.56, 1.7, 0x6cb7ff, 0.42, 0.16, 3.1);

    const coreSignal = new Mesh(
      new SphereGeometry(compact ? 0.1 : 0.14, 12, 8),
      this.material(0x2f8fff, 0x147cff, 1.8, 0.26, 0.16),
    );
    coreSignal.position.z = 0.18;
    coreSignal.renderOrder = 2;
    group.add(coreSignal);

    const count = compact ? Math.min(this.quality.spaceStars, 36) : this.quality.spaceStars;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cyan = new Color(COLORS.cyan);
    const violet = new Color(COLORS.violet);
    const color = new Color();
    for (let i = 0; i < count; i += 1) {
      // Two deterministic spiral arms keep the galaxy recognisable at 24
      // points on low power devices and still give high tier a soft dust read.
      const progress = (i + 0.5) / count;
      const arm = i % 2;
      const radius = 0.22 + Math.sqrt(progress) * 1.7;
      const angle = arm * Math.PI + progress * Math.PI * 5.4 + Math.sin(i * 4.7) * 0.08;
      const jitter = ((i * 19) % 11 - 5) * 0.018;
      positions[i * 3] = Math.cos(angle) * radius + jitter;
      positions[i * 3 + 1] = (Math.sin(angle) * radius * 0.34) + (((i * 13) % 7) - 3) * 0.026;
      positions[i * 3 + 2] = Math.sin(angle) * radius * 0.22 + jitter;
      color.copy(cyan).lerp(violet, 0.12 + progress * 0.78);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    const galaxyGeometry = new BufferGeometry();
    galaxyGeometry.setAttribute('position', new BufferAttribute(positions, 3));
    galaxyGeometry.setAttribute('color', new BufferAttribute(colors, 3));
    const galaxy = new Points(
      galaxyGeometry,
      new PointsMaterial({ size: compact ? 0.035 : 0.045, vertexColors: true, transparent: true, opacity: 0.68, depthWrite: false, blending: AdditiveBlending }),
    );
    galaxy.rotation.x = 0.35;
    group.add(galaxy);

    group.userData = {
      space: true,
      ring: null,
      orbit: null,
      galaxy,
      coreSignal,
      portalSpiral,
      portalLayers: [],
      speed: 0.018,
    };
    this.animated.push(group);
    this.world.add(group);
    return group;
  }

  _rounded(width, height, depth, radius) {
    const key = `${width}:${height}:${depth}:${radius}:${this.quality.roundedSegments}`;
    if (!this.geometryCache.has(key)) {
      this.geometryCache.set(key, new RoundedBoxGeometry(width, height, depth, this.quality.roundedSegments, radius));
    }
    return this.geometryCache.get(key);
  }

  _sphere(radius, widthSegments = 8, heightSegments = 6) {
    const key = `sphere:${radius}:${widthSegments}:${heightSegments}`;
    if (!this.geometryCache.has(key)) {
      this.geometryCache.set(key, new SphereGeometry(radius, widthSegments, heightSegments));
    }
    return this.geometryCache.get(key);
  }

  _createMobileWorld() {
    const group = new Group();
    // Surface owns the right-hand copy, so the device sits in the open left
    // field and presents its viewport instead of turning edge-on behind text.
    group.position.set(1.65, -0.1, -11.5);
    group.rotation.set(-0.12, -0.28, -0.06);
    group.userData.baseY = -0.1;
    group.userData.baseX = 1.65;
    group.userData.baseZ = -11.5;
    group.userData.baseRotationZ = -0.06;
    group.userData.revealY = -0.1;
    const add = (geometry, material, x = 0, y = 0, z = 0.36, rotationZ = 0) => {
      const mesh = new Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.rotation.z = rotationZ;
      group.add(mesh);
      return mesh;
    };
    const line = (width, height, material, x, y, z = 0.42, rotationZ = 0) => add(this._rounded(width, height, 0.025, Math.min(height * 0.48, 0.025)), material, x, y, z, rotationZ);

    // A quiet black-glass product silhouette with a few recognizable frontend
    // primitives: browser chrome, a component layout, and a code inspector.
    const body = this.material(0x03070d, 0x020711, 0.16, 0.78, 0.2);
    const frame = this.material(0x0f2433, 0x041b2d, 0.18, 0.68, 0.24);
    const glass = this.material(0x091b2a, 0x083952, 0.22, 0.36, 0.18);
    const chrome = this.material(0x0a1623, 0x052238, 0.14, 0.52, 0.24);
    const panel = this.material(0x10283c, 0x064768, 0.24, 0.48, 0.24);
    const darkPanel = this.material(0x050c14, 0x02101b, 0.08, 0.58, 0.3);
    const dim = this.material(0x456579, 0x082238, 0.1, 0.42, 0.3);
    const cyan = this.material(COLORS.cyan, 0x06627d, 0.28, 0.28, 0.2);
    const ice = this.material(COLORS.ice, 0x17456a, 0.16, 0.3, 0.22);
    const selected = this.material(0x1d63ae, 0x0b5e9e, 0.34, 0.3, 0.22);
    const edge = this.material(0x1e4d68, 0x094c68, 0.24, 0.34, 0.2);

    add(this._rounded(3, 5.7, 0.48, 0.25), body, 0, 0, 0);
    add(this._rounded(2.8, 5.5, 0.08, 0.2), frame, 0, 0, 0.25);
    add(this._rounded(2.64, 5.34, 0.045, 0.17), glass, 0, 0, 0.31);
    line(2.42, 0.024, edge, 0, 2.48, 0.37);
    line(0.065, 4.78, edge, -1.29, 0, 0.37);

    add(this._rounded(0.54, 0.18, 0.06, 0.08), this.material(0x02050a), 0.27, 2.24, 0.36);
    add(this._sphere(0.038, 6, 6), this.basicMaterial(COLORS.cyan, 0.72, AdditiveBlending, false), 0.27, 2.24, 0.4);
    add(this._rounded(0.08, 0.62, 0.12, 0.04), frame, -1.54, 0.78, 0.02);

    // Browser chrome and a restrained app header.
    add(this._rounded(2.34, 0.27, 0.04, 0.07), chrome, 0, 2.03, 0.37);
    [-0.88, -0.72, -0.56].forEach((x, index) => {
      add(this._sphere(0.035, 6, 6), this.basicMaterial([dim.color.getHex(), ice.color.getHex(), cyan.color.getHex()][index], 0.78, AdditiveBlending, false), x, 2.03, 0.405);
    });
    line(0.8, 0.028, dim, 0.26, 2.03, 0.405);
    line(0.26, 0.028, cyan, 0.84, 2.03, 0.405);
    add(this._rounded(2.34, 0.24, 0.04, 0.06), darkPanel, 0, 1.7, 0.37);
    line(0.36, 0.035, cyan, -0.73, 1.7, 0.405);
    line(0.72, 0.028, dim, -0.12, 1.7, 0.405);
    line(0.22, 0.028, ice, 0.83, 1.7, 0.405);
    // A compact address field plus responsive viewport marks make the object
    // read as a browser surface before the viewer notices the phone chassis.
    add(this._rounded(1.08, 0.08, 0.025, 0.025), chrome, 0.05, 1.7, 0.435);
    line(0.56, 0.018, ice, 0.03, 1.7, 0.455);
    [-0.3, -0.12, 0.06].forEach((x, index) => {
      line(index === 1 ? 0.08 : 0.05, 0.018, index === 1 ? cyan : dim, x, 1.49, 0.405);
    });

    // Component hero with one selected action, not a full blue panel.
    add(this._rounded(2.34, 0.72, 0.045, 0.1), panel, 0, 1.12, 0.375);
    line(0.42, 0.04, cyan, -0.78, 1.34);
    line(0.82, 0.07, ice, -0.63, 1.15);
    line(0.58, 0.04, dim, -0.73, 0.98);
    add(this._rounded(0.46, 0.14, 0.025, 0.04), selected, 0.7, 1.08, 0.43);
    line(0.22, 0.022, cyan, 0.7, 1.08, 0.455);

    if (this.quality.phoneDetails) {
      // Selection bounds are intentionally thin: they suggest a live DOM
      // inspector and add frontend meaning without becoming a neon frame.
      line(1.96, 0.018, edge, 0, 1.48, 0.455);
      line(1.96, 0.018, edge, 0, 0.76, 0.455);
      line(0.018, 0.7, edge, -0.98, 1.12, 0.455);
      line(0.018, 0.7, edge, 0.98, 1.12, 0.455);
      [[-0.98, 1.48], [0.98, 1.48], [-0.98, 0.76], [0.98, 0.76]].forEach(([x, y]) => {
        add(this._rounded(0.07, 0.07, 0.028, 0.018), cyan, x, y, 0.47);
      });

      // Responsive component cards.
      [-0.58, 0.58].forEach((x, index) => {
        add(this._rounded(1.08, 0.5, 0.04, 0.08), index === 0 ? panel : darkPanel, x, 0.48, 0.375);
        line(0.24, 0.03, index === 0 ? cyan : ice, x - 0.3, 0.61);
        line(0.55, 0.04, dim, x - 0.14, 0.43);
        line(0.3, 0.025, index === 0 ? ice : dim, x - 0.25, 0.29);
      });

      // Code/component inspector: the clearest frontend cue in the model.
      add(this._rounded(2.34, 0.96, 0.045, 0.1), darkPanel, 0, -0.5, 0.375);
      line(0.018, 0.7, edge, -0.92, -0.5, 0.455);
      line(0.2, 0.035, cyan, -0.83, -0.1, 0.455, 0.72);
      line(0.2, 0.035, cyan, -0.83, -0.1, 0.455, -0.72);
      line(0.22, 0.035, ice, -0.53, -0.1, 0.455, 0.72);
      line(0.22, 0.035, ice, -0.53, -0.1, 0.455, -0.72);
      line(0.46, 0.028, cyan, -0.68, -0.17);
      line(0.34, 0.028, dim, 0.6, -0.17);
      line(0.72, 0.028, ice, -0.54, -0.38);
      line(0.46, 0.028, dim, -0.4, -0.56);
      line(0.32, 0.028, cyan, -0.24, -0.74);
    }

    // Small action rail and bottom navigation.
    add(this._rounded(0.72, 0.14, 0.025, 0.04), selected, -0.5, -1.2, 0.43);
    line(0.3, 0.022, cyan, -0.5, -1.2, 0.455);
    add(this._rounded(0.7, 0.14, 0.025, 0.04), panel, 0.48, -1.2, 0.43);
    line(0.3, 0.022, dim, 0.48, -1.2, 0.455);
    add(this._rounded(2.28, 0.24, 0.035, 0.06), chrome, 0, -1.67, 0.37);
    [-0.67, -0.22, 0.23, 0.68].forEach((x, index) => line(index === 1 ? 0.26 : 0.18, 0.028, index === 1 ? cyan : dim, x, -1.67, 0.415));
    add(this._rounded(0.72, 0.045, 0.04, 0.02), ice, 0, -2.23, 0.38);
    this.animated.push(group);
    this.world.add(group);
    return group;
  }

  _createNetworkWorld() {
    const group = new Group();
    // Keep the API topology in the open right half while the case-study copy
    // owns the left. This makes the network legible without turning it into a
    // decorative overlay behind the cards.
    group.position.set(compact ? 0.9 : 1.6, compact ? -0.6 : 0.55, -23.5);
    group.scale.setScalar(compact ? 0.86 : 1.05);
    group.rotation.y = -0.08;
    const positions = [
      [-3.8, 1.2, 0], [-3.8, 0, 0], [-3.8, -1.2, 0],
      [-1.7, 0, 0.04], [-0.4, 0.9, 0.08], [-0.4, -0.9, 0.08],
      [0.8, 0.9, 0.12], [0.8, -0.9, 0.12], [2, 0, 0.16], [2.7, 0, 0.2],
    ].map(([x, y, z]) => new Vector3(x, y, z));
    const nodeCount = Math.min(this.quality.nodes, positions.length);
    const activeIndices = nodeCount <= 6
      ? [0, 1, 2, 3, 6, 9]
      : nodeCount <= 8
      ? [0, 1, 2, 3, 4, 6, 8, 9]
      : positions.map((_, index) => index);
    const activeSet = new Set(activeIndices);
    const nodes = [];
    const nodeGeometry = new IcosahedronGeometry(0.13, 0);
    const hubGeometry = new IcosahedronGeometry(0.3, 0);
    const nodeMesh = new InstancedMesh(nodeGeometry, this.material(COLORS.cyan, COLORS.cyan, 1.8, 0.35, 0.32), activeIndices.length);
    const hubMesh = new InstancedMesh(hubGeometry, this.material(COLORS.ice, COLORS.blue, 1.25, 0.35, 0.32), 2);
    nodeMesh.instanceMatrix.setUsage(DynamicDrawUsage);
    hubMesh.instanceMatrix.setUsage(DynamicDrawUsage);
    const dummy = new Object3D();
    let nodeIndex = 0;
    let hubIndex = 0;
    activeIndices.forEach(index => {
      const position = positions[index];
      const isHub = index === 3 || index === 9;
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
    });
    nodeMesh.count = nodeIndex;
    hubMesh.count = hubIndex;
    nodeMesh.instanceMatrix.needsUpdate = true;
    hubMesh.instanceMatrix.needsUpdate = true;
    group.add(nodeMesh, hubMesh);

    const gateway = new Mesh(
      this._rounded(1.3, 1.86, 0.3, 0.1),
      this.material(0x060c15, 0x041b2b, 0.16, 0.68, 0.3),
    );
    gateway.position.set(-1.7, 0, 0.34);
    group.add(gateway);
    const gatewayFace = new Mesh(
      this._rounded(1.08, 1.52, 0.035, 0.055),
      this.material(0x0d1b29, 0x06334b, 0.2, 0.42, 0.26),
    );
    gatewayFace.position.set(-1.7, 0, 0.51);
    group.add(gatewayFace);
    const apiLine = this.material(COLORS.cyan, COLORS.cyan, 1.4, 0.24, 0.2);
    const protocolLine = this.material(COLORS.ice, COLORS.blue, 0.55, 0.28, 0.22);
    const darkLine = this.material(0x1d4966, 0x06263d, 0.14, 0.32, 0.3);
    const bar = (width, height, material, x, y, z = 0.55) => {
      const mesh = new Mesh(this._rounded(width, height, 0.025, Math.min(height * 0.45, 0.025)), material);
      mesh.position.set(x, y, z);
      group.add(mesh);
      return mesh;
    };
    bar(0.42, 0.06, apiLine, -1.97, 0.48);
    bar(0.25, 0.035, protocolLine, -1.79, 0.31);
    bar(0.54, 0.035, darkLine, -1.88, 0.17);
    bar(0.35, 0.035, apiLine, -1.99, 0.03);
    bar(0.48, 0.035, protocolLine, -1.91, -0.14);
    bar(0.65, 0.035, darkLine, -1.84, -0.3);
    bar(0.28, 0.035, apiLine, -1.98, -0.47);
    bar(0.19, 0.035, protocolLine, -1.81, -0.65);

    const serviceMaterial = this.material(0x08131f, 0x05273c, 0.18, 0.56, 0.3);
    const serviceFaceMaterial = this.material(0x122638, 0x07506c, 0.24, 0.38, 0.26);
    [0.9, -0.9].forEach((y, index) => {
      const service = new Mesh(this._rounded(1.24, 0.7, 0.2, 0.08), serviceMaterial);
      service.position.set(0.8, y, 0.35);
      group.add(service);
      const face = new Mesh(this._rounded(1.02, 0.44, 0.025, 0.04), serviceFaceMaterial);
      face.position.set(0.8, y, 0.47);
      group.add(face);
      bar(0.3, 0.045, index ? protocolLine : apiLine, 0.46, y + 0.1, 0.5);
      bar(0.55, 0.035, darkLine, 0.78, y - 0.1, 0.5);
    });

    const bufferMaterial = this.material(0x070f1a, 0x041d31, 0.14, 0.52, 0.32);
    [-0.28, 0, 0.28].forEach((x, index) => {
      const slot = new Mesh(this._rounded(0.2, 0.54, 0.1, 0.04), bufferMaterial);
      slot.position.set(x - 0.4, 0, 0.36);
      group.add(slot);
      const fill = new Mesh(this._rounded(0.08, 0.32, 0.025, 0.02), index === 1 ? apiLine : protocolLine);
      fill.position.set(x - 0.4, index === 1 ? 0.04 : -0.05, 0.43);
      group.add(fill);
    });

    const database = new Group();
    database.position.set(2.25, 0, 0.35);
    const databaseBody = new Mesh(
      new CylinderGeometry(0.46, 0.46, 0.62, 16),
      this.material(0x07111d, 0x052840, 0.18, 0.6, 0.3),
    );
    databaseBody.rotation.x = Math.PI / 2;
    database.add(databaseBody);
    const databaseFace = new Mesh(new CircleGeometry(0.39, 16), this.basicMaterial(COLORS.ice, 0.64, NormalBlending, false));
    databaseFace.position.z = 0.33;
    database.add(databaseFace);
    const databaseCore = new Mesh(new CircleGeometry(0.27, 16), this.basicMaterial(0x071c2e, 0.96));
    databaseCore.position.z = 0.345;
    database.add(databaseCore);
    [0.13, 0, -0.13].forEach(y => {
      const mark = new Mesh(this._rounded(0.32, 0.018, 0.018, 0.008), apiLine);
      mark.position.set(0, y, 0.36);
      database.add(mark);
    });
    group.add(database);

    const linePositions = [];
    [[0, 3], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 7], [6, 8], [7, 8], [8, 9]]
      .filter(([a, b]) => activeSet.has(a) && activeSet.has(b))
      .forEach(([a, b]) => linePositions.push(...positions[a].toArray(), ...positions[b].toArray()));
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(linePositions, 3));
    group.add(new LineSegments(geometry, this.basicMaterial(COLORS.blue, 0.55, AdditiveBlending, false)));

    const routeIndices = [0, 3, 4, 6, 8, 9].filter(index => activeSet.has(index));
    const route = new CatmullRomCurve3(routeIndices.map(index => positions[index]));
    this._createPackets(group, route, 1, COLORS.cyan);
    group.userData = { nodes, nodeMesh, hubMesh, dummy };
    this.animated.push(group);
    this.world.add(group);
    return group;
  }

  _createBackendWorld() {
    const group = new Group();
    // The core copy sits right, so the rack owns the open left side of the
    // frame. Its silhouette stays graphite; the edge work carries the read.
    group.position.set(-2.9, 0.05, -35);
    group.rotation.y = 0.16;
    group.scale.setScalar(compact ? 0.82 : 1.02);
    const rack = new Mesh(this._rounded(3.45, 3.95, 1.02, 0.14), this.material(0x060d16, 0x061d30, 0.2, 0.72, 0.28));
    group.add(rack);
    const inset = new Mesh(this._rounded(3.14, 3.64, 0.06, 0.08), this.material(0x102536, 0x041a2b, 0.14, 0.52, 0.28));
    inset.position.z = 0.54;
    group.add(inset);
    const sideRail = this.material(0x35536b, 0x0b2941, 0.2, 0.48, 0.28);
    [-1.42, 1.42].forEach(x => {
      const rail = new Mesh(this._rounded(0.055, 3.4, 0.04, 0.02), sideRail);
      rail.position.set(x, 0, 0.59);
      group.add(rail);
    });
    const rackEdge = new Mesh(this._rounded(0.025, 3.42, 0.025, 0.01), this.basicMaterial(COLORS.cyan, 0.42, AdditiveBlending, false));
    rackEdge.position.set(-1.46, 0, 0.64);
    group.add(rackEdge);
    const cyan = this.material(COLORS.cyan, COLORS.cyan, 1.45, 0.24, 0.2);
    const ice = this.material(COLORS.ice, COLORS.blue, 0.72, 0.28, 0.22);
    const dark = this.material(0x183149, 0x052238, 0.14, 0.38, 0.3);
    const ingress = new Mesh(this._rounded(2.62, 0.2, 0.08, 0.05), dark);
    ingress.position.set(-0.08, 1.62, 0.62);
    group.add(ingress);
    const ingressPulse = new Mesh(this._rounded(0.84, 0.035, 0.025, 0.014), cyan);
    ingressPulse.position.set(-0.72, 1.62, 0.68);
    group.add(ingressPulse);
    const ingressPort = new Mesh(this._rounded(0.22, 0.08, 0.035, 0.025), ice);
    ingressPort.position.set(1.07, 1.62, 0.67);
    group.add(ingressPort);
    const ledGeometry = this._sphere(0.032, 6, 6);
    const ledMaterial = this.basicMaterial(COLORS.cyan, 0.94, AdditiveBlending, false);
    const dummy = new Object3D();
    const ledPositions = [];
    const rowCount = this.quality.backendRows;
    for (let i = 0; i < rowCount; i += 1) {
      const row = new Group();
      const rowY = rowCount === 3 ? 0.82 - i * 0.82 : 1.05 - i * 0.75;
      const chassis = new Mesh(this._rounded(2.62, 0.5, 0.08, 0.05), this.material(i === 2 ? 0x12364e : 0x0b1a29, 0x05304a, i === 2 ? 0.22 : 0.1, 0.52, 0.28));
      chassis.position.z = 0.58;
      row.add(chassis);
      [-0.8, -0.28, 0.24].forEach((x, index) => {
        const vent = new Mesh(this._rounded(index === 1 ? 0.36 : 0.24, 0.035, 0.025, 0.014), index === 1 ? ice : dark);
        vent.position.set(x, 0, 0.64);
        row.add(vent);
      });
      [0.65, 0.83, 1.01].forEach(x => ledPositions.push([x, rowY, 0.67]));
      row.position.y = rowY;
      group.add(row);
    }
    const leds = new InstancedMesh(ledGeometry, ledMaterial, ledPositions.length);
    ledPositions.forEach(([x, y, z], index) => {
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      leds.setMatrixAt(index, dummy.matrix);
    });
    leds.instanceMatrix.needsUpdate = true;
    group.add(leds);

    const database = new Group();
    database.position.set(2.12, -1.25, 0.34);
    const databaseBody = new Mesh(new CylinderGeometry(0.5, 0.5, 0.7, 16), this.material(0x0a1828, 0x06304a, 0.26, 0.54, 0.28));
    databaseBody.rotation.x = Math.PI / 2;
    database.add(databaseBody);
    const databaseFace = new Mesh(new CircleGeometry(0.42, 16), this.basicMaterial(COLORS.ice, 0.58, NormalBlending, false));
    databaseFace.position.z = 0.37;
    database.add(databaseFace);
    const databaseCore = new Mesh(new CircleGeometry(0.3, 16), this.basicMaterial(0x0b2b49, 0.96));
    databaseCore.position.z = 0.385;
    database.add(databaseCore);
    [-0.12, 0, 0.12].forEach(y => {
      const mark = new Mesh(this._rounded(0.34, 0.018, 0.018, 0.008), cyan);
      mark.position.set(0, y, 0.4);
      database.add(mark);
    });
    group.add(database);
    const connectorGeometry = new BufferGeometry();
    connectorGeometry.setAttribute('position', new Float32BufferAttribute([
      1.32, 0.3, 0.62, 1.68, -0.42, 0.56,
      1.32, -0.42, 0.62, 1.68, -0.9, 0.56,
      1.68, -0.9, 0.56, 1.68, -1.25, 0.56,
    ], 3));
    group.add(new LineSegments(connectorGeometry, this.basicMaterial(COLORS.cyan, 0.34, AdditiveBlending, false)));
    this.world.add(group);
    return group;
  }

  _createPackets(parent, curve, count, signalColor = COLORS.violet) {
    if (!this.quality.animate || count <= 0) return;
    const geometry = this.packetGeometry || (this.packetGeometry = this._sphere(0.065, 6, 6));
    if (!this.packetMaterial) {
      this.packetMaterial = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false, vertexColors: true });
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
      color.set(signalColor);
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
      this._createPackets(this.transit, curve, this.quality.transitPackets, stage % 2 ? COLORS.violet : COLORS.blue);
    }
    this.world.add(this.transit);
  }

  _bind() {
    window.addEventListener('resize', () => this.resize(), { passive: true });
    window.addEventListener('pointermove', event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      this.pointer.set((event.clientX / innerWidth - 0.5) * 2, (event.clientY / innerHeight - 0.5) * -2);
      this._requestRender();
    }, { passive: true });
    window.addEventListener('pointerleave', () => {
      this.pointer.set(0, 0);
      this._requestRender();
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      this.hidden = document.hidden;
      if (this.hidden) {
        this._setAnimationLoop(false);
        return;
      }
      this.clock.reset();
      this._setAnimationLoop(true);
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
        this._setAnimationLoop(!this.paused);
        this.renderFrame();
      });
    }
    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotionPreferenceChange = event => {
      this.motionReduced = event.matches;
      const control = document.getElementById('sceneControl');
      if (control) control.hidden = this.motionReduced || !this.quality.animate;
      this._setAnimationLoop(!this.motionReduced && !this.paused);
      this.renderFrame();
    };
    this.motionPreference.addEventListener?.('change', this.onMotionPreferenceChange);
    this.journey = document.querySelector('.journey');
    this.progressIndicator = document.getElementById('chapterProgress');
    if (this.journey && 'ResizeObserver' in window) {
      this.journeyObserver = new ResizeObserver(() => {
        this._cacheScrollMetrics();
        this._syncScroll(true);
      });
      this.journeyObserver.observe(this.journey);
    }
    document.fonts?.ready?.then(() => {
      this._cacheScrollMetrics();
      this._syncScroll(true);
    });
    this._cacheScrollMetrics();
    window.addEventListener('scroll', () => {
      if (this.scrollTick) return;
      this.scrollTick = true;
      requestAnimationFrame(() => {
        this.scrollTick = false;
        this._syncScroll();
      });
    }, { passive: true });
  }

  _syncScroll(force = false) {
    if (!this.journey) return;
    const nextProgress = MathUtils.clamp((window.scrollY - this.journeyStart) / this.scrollRange, 0, 1);
    const changed = nextProgress !== this.scroll.progress;
    this.scroll.progress = nextProgress;
    if (this.progressIndicator) this.progressIndicator.style.height = `${this.scroll.progress * 100}%`;
    if (force || changed || this.pathProgress < 0) this.renderFrame();
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
    this._syncScroll(true);
  }

  _updateAssetVisibility(progress) {
    const changed = progress !== this.visibilityProgress;
    if (!changed) return;
    this._disposeDistantAssets(progress);
    this._ensureAssets(progress);
    this.visibilityProgress = progress;
    [
      [this.originPortal, 0, 0.24],
      [this.network, compact ? 0.24 : 0.34, compact ? 0.56 : 0.58],
      [this.backend, 0.54, 0.74],
      [this.returnPortal, 0.72, 1],
    ].filter(([asset]) => asset).forEach(([asset, start, end]) => { asset.visible = progress >= start && progress <= end; });
    const mobileReveal = MathUtils.smoothstep(progress, 0.04, 0.2);
    // Let the frontend object own Surface, then clear the frame before the
    // API topology takes over. Keeping the phone into Signal makes the scene
    // read as another product mockup instead of connectivity infrastructure.
    this.mobile.visible = progress <= (compact ? 0.23 : 0.33);
    this.mobile.position.x = this.mobile.userData.baseX + (1 - mobileReveal) * 2.7;
    this.mobile.position.z = this.mobile.userData.baseZ - (1 - mobileReveal) * 7;
    this.mobile.userData.revealY = this.mobile.userData.baseY + (1 - mobileReveal) * 1.5;
    this.mobile.scale.setScalar(0.9 + mobileReveal * 0.18);
    this.mobile.rotation.z = this.mobile.userData.baseRotationZ + (1 - mobileReveal) * 0.18;
    if (this.transit) this.transit.visible = progress >= 0.08 && progress <= 0.32;
    this._setAnimationLoop(!this.paused);
  }

  _ensureAssets(progress) {
    // Creation and teardown windows intentionally do not touch at the same
    // boundary. The gap prevents an asset disposed while travelling forward
    // from being recreated on that same frame.
    if (progress >= 0.04 && progress <= 0.34 && !this.transit) this._createTransitField();
    if (progress >= 0.22 && progress <= 0.6 && !this.network) this.network = this._createNetworkWorld();
    if (progress >= 0.5 && progress <= 0.72 && !this.backend) this.backend = this._createBackendWorld();
    if (progress >= 0.7 && !this.returnPortal) this.returnPortal = this._createSpaceWorld();
  }

  _disposeDistantAssets(progress) {
    // Keep a little hysteresis between creation and teardown thresholds. This
    // prevents assets from being destroyed/rebuilt while a user is nudging the
    // scroll position around a chapter boundary.
    if (progress < 0.01 || progress > 0.38) this._disposeAsset(this.transit);
    if (progress < 0.18 || progress > 0.62) this._disposeAsset(this.network);
    if (progress < 0.5 || progress > 0.74) this._disposeAsset(this.backend);
    if (progress < 0.66) this._disposeAsset(this.returnPortal);
  }

  _disposeAsset(asset) {
    if (!asset) return;
    asset.parent?.remove(asset);
    this.animated = this.animated.filter(object => object !== asset);
    this.packetStreams = this.packetStreams.filter(stream => stream.parent !== asset);

    const detachedGeometries = new Set();
    const detachedMaterials = new Set();
    const detachedTextures = new Set();
    asset.traverse(object => {
      if (object.geometry) detachedGeometries.add(object.geometry);
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.filter(Boolean).forEach(material => {
        detachedMaterials.add(material);
        if (material.map) detachedTextures.add(material.map);
      });
    });

    const activeGeometries = new Set();
    const activeMaterials = new Set();
    const activeTextures = new Set();
    this.world.traverse(object => {
      if (object.geometry) activeGeometries.add(object.geometry);
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.filter(Boolean).forEach(material => {
        activeMaterials.add(material);
        if (material.map) activeTextures.add(material.map);
      });
    });

    detachedGeometries.forEach(geometry => {
      if (!activeGeometries.has(geometry)) geometry.dispose();
    });
    detachedMaterials.forEach(material => {
      if (!activeMaterials.has(material)) material.dispose();
    });
    detachedTextures.forEach(texture => {
      if (!activeTextures.has(texture)) texture.dispose();
    });
    for (const [key, geometry] of this.geometryCache) {
      if (!activeGeometries.has(geometry)) this.geometryCache.delete(key);
    }
    for (const [key, material] of this.materialCache) {
      if (!activeMaterials.has(material)) this.materialCache.delete(key);
    }
    for (const [key, material] of this.basicMaterialCache) {
      if (!activeMaterials.has(material)) this.basicMaterialCache.delete(key);
    }
    if (this.packetGeometry && !activeGeometries.has(this.packetGeometry)) this.packetGeometry = null;
    if (this.packetMaterial && !activeMaterials.has(this.packetMaterial)) this.packetMaterial = null;

    if (this.transit === asset) this.transit = null;
    if (this.network === asset) this.network = null;
    if (this.backend === asset) this.backend = null;
    if (this.returnPortal === asset) this.returnPortal = null;
  }

  _updateDebug(now, frameMs = 0) {
    if (!debug) return;
    this.debugFrames = (this.debugFrames || 0) + 1;
    this.debugFrameTime = (this.debugFrameTime || 0) + frameMs;
    this.debugLast = this.debugLast || now;
    if (now - this.debugLast < 2000) return;
    const info = this.renderer.info;
    const fps = Math.round(this.debugFrames / ((now - this.debugLast) / 1000));
    const averageFrameMs = Number((this.debugFrameTime / this.debugFrames).toFixed(2));
    this.debugStats = { fps, frameMs: averageFrameMs };
    console.info('[ScrollWorld] frame sample', {
      ...this.diagnostics(),
      fps,
      frameMs: averageFrameMs,
      calls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
    });
    this.debugFrames = 0;
    this.debugFrameTime = 0;
    this.debugLast = now;
  }

  diagnostics() {
    const info = this.renderer.info;
    return {
      quality: this.quality.name,
      ...(debug ? { renderer: this.rendererName, softwareRenderer: this.softwareRenderer } : {}),
      pixelRatio: this._pixelRatio(),
      progress: Number(this.scroll.progress.toFixed(3)),
      animationLoop: this.animationLoopRunning,
      paused: this.paused,
      reducedMotion: this.motionReduced,
      assets: {
        transit: Boolean(this.transit),
        network: Boolean(this.network),
        backend: Boolean(this.backend),
        space: Boolean(this.returnPortal),
      },
      render: {
        calls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      },
      ...(debug ? { runtimePixelRatio: this._pixelRatio(), budgetAdjustments: this.frameBudget.adjustments } : {}),
      ...(debug ? { performance: this.debugStats } : {}),
    };
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
    this.geometryCache.clear();
    this.materialCache.clear();
    this.basicMaterialCache.clear();
    this.animated.length = 0;
    this.packetStreams.length = 0;
    if (debug && window.__RAZA_SCENE__ === this) delete window.__RAZA_SCENE__;
  }

  renderFrame = (time = performance.now(), fromAnimationLoop = false) => {
    if (this.hidden) return;
    if (fromAnimationLoop && this.quality.maxFps < 60 && time - this.lastAnimationRender < 1000 / this.quality.maxFps) return;
    if (fromAnimationLoop) this.lastAnimationRender = time;
    this.clock.update(time);
    const measureFrame = debug || (fromAnimationLoop && this.quality.animate);
    const frameStart = measureFrame ? performance.now() : 0;
    const elapsed = this.quality.animate && !this.motionReduced && !this.paused ? this.clock.getElapsed() : 0;
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
    this.stars.position.x = this.pointerEase.x * -0.35;
    if (this.quality.animate && !this.motionReduced && !this.paused) {
      this.animated.forEach((object, index) => {
        if (!object.visible) return;
        if (object.userData.space) {
          if (object.userData.ring) object.userData.ring.rotation.z = elapsed * object.userData.speed;
          if (object.userData.orbit) object.userData.orbit.rotation.z = -elapsed * object.userData.speed * 0.7;
          if (object.userData.galaxy) object.userData.galaxy.rotation.z = elapsed * 0.012;
          if (object.userData.coreSignal) object.userData.coreSignal.rotation.y = elapsed * 0.018;
          if (object.userData.portalSpiral) object.userData.portalSpiral.rotation.z = elapsed * 0.038;
          object.userData.portalLayers?.forEach(({ layer, speed }) => {
            layer.rotation.z = elapsed * speed;
          });
        } else if (object.userData.ring) {
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
      if (this.network?.visible) {
        this.network.rotation.y = elapsed * 0.022;
        const { nodes, hubMesh, dummy } = this.network.userData;
        nodes.filter(node => node.isHub).forEach(node => {
          dummy.position.copy(node.position);
          dummy.scale.setScalar(node.baseScale * (0.94 + Math.sin(elapsed * 1.5 + node.instanceIndex) * 0.06));
          dummy.updateMatrix();
          hubMesh.setMatrixAt(node.instanceIndex, dummy.matrix);
        });
        hubMesh.instanceMatrix.needsUpdate = true;
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
    const frameMs = measureFrame ? performance.now() - frameStart : 0;
    this._adaptRenderBudget(frameMs);
    this._updateDebug(time, debug ? frameMs : 0);
  };

  render = time => this.renderFrame(time, true);
}

export { ScrollWorld };
