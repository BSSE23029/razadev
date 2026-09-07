import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  FogExp2,
  Group,
  InstancedMesh,
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
  RingGeometry,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TextureLoader,
  Timer,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

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
};
const QUALITY = veryLowPower
  ? {
      name: 'low',
      pixelRatio: 1,
      stars: 240,
      spaceStars: 24,
      maxFps: 24,
      animate: true,
    }
  : lowPower || compact
  ? {
      name: 'medium',
      pixelRatio: compact ? 1.15 : 1.25,
      stars: lowPower ? 420 : 760,
      spaceStars: 48,
      maxFps: 30,
      animate: true,
    }
  : {
      name: 'high',
      pixelRatio: 1.5,
      stars: 900,
      spaceStars: 84,
      maxFps: 48,
      animate: true,
    };

if (qualityOverride === 'low') Object.assign(QUALITY, {
  name: 'low', pixelRatio: 1, stars: 240, spaceStars: 24,
  maxFps: 24, animate: true,
});
if (qualityOverride === 'medium') Object.assign(QUALITY, {
  name: 'medium', pixelRatio: 1.15, stars: 760, spaceStars: 48,
  maxFps: 30, animate: true,
});
if (qualityOverride === 'high') Object.assign(QUALITY, {
  name: 'high', pixelRatio: 1.5, stars: 900, spaceStars: 84,
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
    this.pathTarget = new Vector3();
    this.hidden = document.hidden;
    this.focused = true;
    this.paused = false;
    this.contextLost = false;
    this.lastAnimationRender = 0;
    this.scrollTick = false;
    this.scrollFrame = 0;
    this.renderRequest = false;
    this.renderFrameRequest = 0;
    this.animationLoopRunning = false;
    this.debugStats = { fps: 0, frameMs: 0 };
    this.materialCache = new Map();
    this.basicMaterialCache = new Map();
    this.portalTextureLoads = { requested: 0, loaded: 0, failed: 0 };
    this.quality = QUALITY;
    this.runtimePixelRatio = Infinity;
    this.frameBudget = { samples: 0, averageMs: 0, adjustments: 0 };
    this.motionReduced = reducedMotion;
    this.journey = null;
    this.progressIndicator = null;
    this.journeyStart = 0;
    this.scrollRange = 1;
    this.pathProgress = -1;
    this.baseTarget = new Vector3();
    this.chapterPulse = { active: false, startedAt: 0 };
    this.boundResize = () => this.resize();
    this.boundPointerMove = event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      this.pointer.set((event.clientX / innerWidth - 0.5) * 2, (event.clientY / innerHeight - 0.5) * -2);
      this._requestRender();
    };
    this.boundPointerLeave = () => {
      this.pointer.set(0, 0);
      this._requestRender();
    };
    this.boundVisibilityChange = () => {
      this.hidden = document.hidden;
      if (this.hidden) {
        this._setAnimationLoop(false);
        return;
      }
      this.clock.reset();
      this._setAnimationLoop(true);
      this.renderFrame();
    };
    this.boundWindowBlur = () => {
      this.focused = false;
      this._setAnimationLoop(false);
    };
    this.boundWindowFocus = () => {
      this.focused = true;
      this.clock.reset();
      this._setAnimationLoop(true);
      this.renderFrame();
    };
    this.boundScroll = () => {
      if (this.scrollTick || this.destroyed) return;
      this.scrollTick = true;
      this.scrollFrame = requestAnimationFrame(() => {
        this.scrollFrame = 0;
        this.scrollTick = false;
        if (!this.destroyed) this._syncScroll();
      });
    };
    this.boundPageHide = event => {
      if (!event.persisted) this.destroy();
    };
    this.boundPageShow = event => {
      if (!event.persisted || this.destroyed) return;
      this.hidden = document.hidden;
      this.clock.reset();
      this._setAnimationLoop(true);
      this.renderFrame();
    };
    this.boundChapterChange = () => {
      if (this.motionReduced || this.destroyed) return;
      this.chapterPulse.active = true;
      this.chapterPulse.startedAt = performance.now();
      this._setAnimationLoop(true);
      this._requestRender();
    };
    this.boundContextLost = event => {
      event.preventDefault();
      this.contextLost = true;
      this._setAnimationLoop(false);
      document.body.classList.add('no-webgl');
      this.sceneControl?.setAttribute('hidden', '');
    };
    this.boundContextRestored = () => {
      if (this.destroyed) return;
      this.contextLost = false;
      document.body.classList.remove('no-webgl');
      if (this.sceneControl) this.sceneControl.hidden = this.motionReduced || !this.quality.animate;
      this.clock.reset();
      this._setAnimationLoop(true);
      this.renderFrame();
    };
    this._buildRenderer();
    this._buildWorld();
    this._bind();
    this.resize();
    this.canvas.addEventListener('webglcontextlost', this.boundContextLost, { passive: false });
    this.canvas.addEventListener('webglcontextrestored', this.boundContextRestored);
    window.addEventListener('pagehide', this.boundPageHide);
    window.addEventListener('pageshow', this.boundPageShow);
    window.addEventListener('blur', this.boundWindowBlur);
    window.addEventListener('focus', this.boundWindowFocus);
    document.addEventListener('raza:chapterchange', this.boundChapterChange);
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
      spaceStars: 24,
      maxFps: 24,
      animate: true,
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
    // The portal is now the only 3D subject. Content chapters remain HTML/CSS
    // glass surfaces over the shared space so the visual language stays calm.
    this.spaceBackdrop = null;

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
    this.spaceBackdrop = this._createSpaceWorld();
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
    if (!this.quality.animate || this.motionReduced || this.paused || !this.focused) return false;
    return Boolean(this.spaceBackdrop?.visible);
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
    this.renderFrameRequest = requestAnimationFrame(time => {
      this.renderFrameRequest = 0;
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

    // A second, softer dust layer gives the whole journey a twilight depth
    // instead of confining the atmosphere to the final portal. It has a
    // separate parallax response so mouse movement feels spatial, while the
    // scene remains decorative and low-cost compared with post-processing.
    const twilightCount = Math.max(120, Math.floor(count * 0.3));
    const twilightPositions = new Float32Array(twilightCount * 3);
    const twilightColors = new Float32Array(twilightCount * 3);
    const twilightCool = new Color(COLORS.blue);
    const twilightIce = new Color(COLORS.ice);
    const twilightColor = new Color();
    for (let i = 0; i < twilightCount; i += 1) {
      const radius = 12 + Math.random() * 30;
      const angle = Math.random() * Math.PI * 2;
      twilightPositions[i * 3] = Math.cos(angle) * radius;
      twilightPositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      twilightPositions[i * 3 + 2] = 10 - Math.random() * 88;
      twilightColor.copy(twilightCool).lerp(twilightIce, Math.random() * 0.65);
      twilightColors[i * 3] = twilightColor.r;
      twilightColors[i * 3 + 1] = twilightColor.g;
      twilightColors[i * 3 + 2] = twilightColor.b;
    }
    const twilightGeometry = new BufferGeometry();
    twilightGeometry.setAttribute('position', new BufferAttribute(twilightPositions, 3));
    twilightGeometry.setAttribute('color', new BufferAttribute(twilightColors, 3));
    this.twilight = new Points(
      twilightGeometry,
      new PointsMaterial({
        size: compact ? 0.045 : 0.06,
        vertexColors: true,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    this.world.add(this.twilight);
  }

  _createPortalTextureLayer(group, url, count, radiusScale, zSpread, color, opacity, speed, seed = 0) {
    this.portalTextureLoads.requested += 1;
    const onLoad = texture => {
      this.portalTextureLoads.loaded += 1;
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
        // The procedural portal is already visible. Reveal decoded smoke
        // layers over time so a fast texture response never becomes a pop.
        opacity: 0,
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
      group.userData.portalLayers.push({
        layer,
        speed,
        material,
        baseOpacity: opacity,
        fadeStart: performance.now(),
        fadeDuration: this.quality.animate && !this.motionReduced ? 720 : 0,
      });
      group.userData.portalMaterials?.push(material);
      group.userData.portalMaterialOpacities?.push(opacity);
      this._requestRender();
    };
    const onError = () => {
      // A missing optional smoke layer must never blank the scene: the
      // procedural aperture, rings and dust are the guaranteed baseline.
      this.portalTextureLoads.failed += 1;
      this._requestRender();
    };
    new TextureLoader().load(url, onLoad, undefined, onError);
  }

  _createSpaceWorld() {
    const group = new Group();
    // Keep one shared portal in camera space so the journey feels like one
    // world from the opening chapter through contact.
    const persistent = true;
    group.position.set(0, 0, -11);
    group.scale.setScalar(compact ? 1 : 1.12);

    // The shared world follows the reference's texture-led sci-fi portal:
    // layered smoke spirals, a saturated blue centre and twilight dust. The
    // layers use shared instancing so the effect stays atmospheric without
    // turning every smoke card into a separate draw call.
    const portalBackdropGeometry = new CircleGeometry(7.4, compact ? 32 : 48);
    const portalBackdropMaterial = new ShaderMaterial({
      uniforms: {
        coreColor: { value: new Color(0x1b75c7) },
        edgeColor: { value: new Color(0x061426) },
        sceneOpacity: { value: 0.18 },
        time: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: `
        varying vec2 portalUv;
        void main() {
          portalUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 coreColor;
        uniform vec3 edgeColor;
        uniform float sceneOpacity;
        uniform float time;
        varying vec2 portalUv;
        void main() {
          vec2 centered = portalUv - vec2(0.5);
          float angle = atan(centered.y, centered.x);
          float radius = length(centered * vec2(1.0, 1.22)) * 2.0;
          float warp = sin(angle * 3.0 + time * 0.16 + radius * 7.0) * 0.018;
          radius += warp;
          float falloff = 1.0 - smoothstep(0.54, 1.0, radius);
          float core = 1.0 - smoothstep(0.0, 0.76, radius);
          float horizon = smoothstep(0.52, 0.76, radius) * (1.0 - smoothstep(0.76, 0.98, radius));
          vec3 color = mix(edgeColor, coreColor, core);
          float alpha = sceneOpacity * falloff * (0.26 + core * 0.56 + horizon * 0.18);
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    const portalBackdrop = new Mesh(
      portalBackdropGeometry,
      portalBackdropMaterial,
    );
    portalBackdrop.position.z = -3.4;
    portalBackdrop.renderOrder = -3;
    group.add(portalBackdrop);

    // Give the centre a real aperture instead of leaving the smoke over a
    // single bright disc. The halo sits behind a low-opacity dark lens; the
    // rim then catches the cool edge light and makes the portal feel deep.
    const apertureHaloMaterial = portalBackdropMaterial.clone();
    apertureHaloMaterial.uniforms.coreColor.value.set(0x236dce);
    apertureHaloMaterial.uniforms.edgeColor.value.set(0x091932);
    apertureHaloMaterial.uniforms.sceneOpacity.value = 0.16;
    const apertureHalo = new Mesh(
      new CircleGeometry(3.18, compact ? 32 : 48),
      apertureHaloMaterial,
    );
    apertureHalo.position.z = -0.72;
    apertureHalo.renderOrder = -0.72;
    group.add(apertureHalo);

    const aperture = new Mesh(
      new CircleGeometry(2.62, compact ? 32 : 48),
      new ShaderMaterial({
        uniforms: {
          sceneOpacity: { value: 0.58 },
          time: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        vertexShader: `
          varying vec2 apertureUv;
          void main() {
            apertureUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float sceneOpacity;
          uniform float time;
          varying vec2 apertureUv;
          void main() {
            vec2 centered = (apertureUv - vec2(0.5)) * 2.0;
            float radius = length(centered);
            float angle = atan(centered.y, centered.x);
            float wave = sin(angle * 2.0 + time * 0.12 + radius * 12.0) * 0.018;
            float horizon = 1.0 - smoothstep(0.02, 0.16, abs(radius - (0.72 + wave)));
            float edge = smoothstep(0.54, 0.96, radius);
            float shape = 1.0 - smoothstep(0.92, 1.02, radius);
            vec3 voidColor = mix(vec3(0.002, 0.006, 0.014), vec3(0.006, 0.025, 0.055), edge * 0.8);
            vec3 horizonColor = vec3(0.015, 0.11, 0.22) * horizon;
            gl_FragColor = vec4(voidColor + horizonColor, sceneOpacity * shape);
          }
        `,
      }),
    );
    aperture.position.z = -0.56;
    aperture.scale.y = 0.76;
    aperture.renderOrder = -0.56;
    group.add(aperture);

    const apertureRim = new Mesh(
      new RingGeometry(2.62, 2.69, compact ? 40 : 64),
      new MeshBasicMaterial({
        color: COLORS.ice,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    apertureRim.position.z = -0.44;
    apertureRim.scale.y = 0.76;
    apertureRim.renderOrder = -0.44;
    group.add(apertureRim);

    // A portal needs a hard visual grammar underneath the soft smoke. These
    // rings are deliberately simple geometry: they give the eye a stable
    // aperture, depth, and direction without adding a post-processing pass.
    const portalRings = [];
    const portalArcs = [];
    const addRing = (radius, thickness, color, opacity, z, speed, scaleY, phase = 0) => {
      const ring = new Mesh(
        new RingGeometry(radius - thickness, radius, compact ? 40 : 64),
        new MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
      );
      ring.position.z = z;
      ring.rotation.z = phase;
      ring.scale.y = scaleY;
      ring.renderOrder = -2;
      group.add(ring);
      portalRings.push({ ring, speed, phase, scaleY, baseOpacity: opacity });
    };
    addRing(6.85, 0.018, 0x89d9ff, 0.1, -2.72, 0.006, 0.72, 0.08);
    addRing(5.38, 0.028, COLORS.cyan, 0.14, -1.74, -0.012, 0.76, -0.2);
    addRing(3.76, 0.022, COLORS.ice, 0.17, -0.84, 0.018, 0.8, 0.32);
    if (this.quality.name !== 'low') addRing(2.18, 0.014, 0x5b9dff, 0.13, -0.28, -0.024, 0.84, -0.44);

    const arcCount = this.quality.name === 'low' ? 2 : 3;
    for (let index = 0; index < arcCount; index += 1) {
      const start = index * (Math.PI * 2 / arcCount) + 0.24;
      const arc = new Mesh(
        new RingGeometry(6.28, 6.34, compact ? 32 : 48, 1, start, Math.PI * 0.62),
        new MeshBasicMaterial({
          color: index === 1 ? COLORS.cyan : 0x8fbfff,
          transparent: true,
          opacity: 0.14,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
      );
      arc.position.z = -2.5;
      arc.scale.y = 0.72;
      arc.renderOrder = -1;
      group.add(arc);
      portalArcs.push({ arc, speed: index % 2 ? -0.018 : 0.014, baseOpacity: 0.14 });
    }

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
    if (this.quality.name === 'low') {
      // Keep the portal readable on software/low-power renderers without
      // uploading three separate smoke textures or paying for their draw calls.
      this._createPortalTextureLayer(group, '/scene/portal/colored-smoke.webp', layerCount, 0.72, 2.2, 0x6cb7ff, 0.38, 0.12, 2.2);
    } else {
      this._createPortalTextureLayer(group, '/scene/portal/dark-smoke.webp', layerCount, 1.06, 3.1, 0x39465d, 0.2, 0.08, 0.4);
      this._createPortalTextureLayer(group, '/scene/portal/smoke.webp', layerCount, 0.82, 2.3, 0xbac5d6, 0.24, 0.12, 1.8);
      this._createPortalTextureLayer(group, '/scene/portal/colored-smoke.webp', layerCount, 0.56, 1.7, 0x6cb7ff, 0.42, 0.16, 3.1);
    }

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
      persistent,
      galaxy,
      coreSignal,
      apertureHalo,
      aperture,
      apertureRim,
      portalSpiral,
      portalRings,
      portalArcs,
      portalLayers: [],
      portalMaterials: [
        portalBackdrop.material,
        apertureHalo.material,
        aperture.material,
        apertureRim.material,
        portalSpiral.material,
        galaxy.material,
        ...portalRings.map(({ ring }) => ring.material),
        ...portalArcs.map(({ arc }) => arc.material),
      ],
      portalMaterialOpacities: [
        0.18,
        0.16,
        0.58,
        0.28,
        0.48,
        0.68,
        ...portalRings.map(({ baseOpacity }) => baseOpacity),
        ...portalArcs.map(({ baseOpacity }) => baseOpacity),
      ],
      portalIntensity: null,
      portalTargetIntensity: null,
      portalShaderMaterials: [portalBackdrop.material, apertureHalo.material, aperture.material],
    };
    group.userData.basePosition = group.position.clone();
    group.userData.baseRotation = new Vector3(group.rotation.x, group.rotation.y, group.rotation.z);
    group.visible = true;
    this.camera.add(group);
    this.animated.push(group);
    return group;
  }



  _bind() {
    window.addEventListener('resize', this.boundResize, { passive: true });
    window.addEventListener('pointermove', this.boundPointerMove, { passive: true });
    window.addEventListener('pointerleave', this.boundPointerLeave, { passive: true });
    document.addEventListener('visibilitychange', this.boundVisibilityChange);
    const sceneControl = document.getElementById('sceneControl');
    if (sceneControl) {
      this.sceneControl = sceneControl;
      sceneControl.hidden = this.motionReduced || !this.quality.animate;
      this.onSceneControlClick = () => {
        this.paused = !this.paused;
        sceneControl.setAttribute('aria-pressed', String(this.paused));
        sceneControl.setAttribute('aria-label', this.paused ? 'Resume ambient scene' : 'Pause ambient scene');
        const label = sceneControl.querySelector('span:not(.scene-control__icon)');
        if (label) label.textContent = this.paused ? 'Resume scene' : 'Pause scene';
        this._setAnimationLoop(!this.paused);
        this.renderFrame();
      };
      sceneControl.addEventListener('click', this.onSceneControlClick);
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
      if (this.destroyed) return;
      this._cacheScrollMetrics();
      this._syncScroll(true);
    });
    this._cacheScrollMetrics();
    window.addEventListener('scroll', this.boundScroll, { passive: true });
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

  _updateAssetVisibility(progress, transitionPulse = 0) {
    this._updatePortalIntensity(progress, transitionPulse);
    this._setAnimationLoop(!this.paused);
  }

  _updatePortalIntensity(progress, transitionPulse = 0) {
    const portal = this.spaceBackdrop?.userData;
    if (!portal?.persistent || !portal.portalMaterials) return;
    // Let the shared world breathe: it leads the hero and contact chapters,
    // then recedes behind dense project/profile content without disappearing.
    const heroFocus = 1 - MathUtils.smoothstep(progress, 0.04, 0.22);
    const contactFocus = MathUtils.smoothstep(progress, 0.78, 0.96);
    const edgeFocus = Math.max(heroFocus, contactFocus);
    const targetIntensity = Math.min(1, 0.28 + edgeFocus * 0.72 + transitionPulse * 0.08);
    const intensity = portal.portalIntensity === null || this.motionReduced || this.paused
      ? targetIntensity
      : MathUtils.lerp(portal.portalIntensity, targetIntensity, 0.12);
    portal.portalTargetIntensity = targetIntensity;
    const intensityChanged = portal.portalIntensity === null || Math.abs(portal.portalIntensity - intensity) > 0.0001;
    const layersFading = portal.portalLayers?.some(layerRecord => layerRecord.fadeDuration > 0);
    if (!intensityChanged && !layersFading) return;
    portal.portalIntensity = intensity;
    const now = performance.now();
    if (intensityChanged) {
      portal.portalMaterials.forEach((material, index) => {
        const opacity = portal.portalMaterialOpacities[index] * intensity;
        if (material.uniforms?.sceneOpacity) material.uniforms.sceneOpacity.value = opacity;
        else material.opacity = opacity;
      });
    }
    portal.portalLayers?.forEach(layerRecord => {
      let reveal = 1;
      if (layerRecord.fadeDuration > 0) {
        reveal = MathUtils.smoothstep(
          MathUtils.clamp((now - layerRecord.fadeStart) / layerRecord.fadeDuration, 0, 1),
          0,
          1,
        );
        if (reveal >= 1) layerRecord.fadeDuration = 0;
      }
      layerRecord.material.opacity = layerRecord.baseOpacity * intensity * reveal;
    });
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
      renderMode: this.animationLoopRunning ? 'continuous' : 'on-demand',
      paused: this.paused,
      contextLost: this.contextLost,
      reducedMotion: this.motionReduced,
      assets: {
        space: Boolean(this.spaceBackdrop),
        persistentSpace: Boolean(this.spaceBackdrop),
        portalLayers: this.spaceBackdrop?.userData.portalLayers?.length || 0,
        portalTextures: { ...this.portalTextureLoads },
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
    if (this.scrollFrame) cancelAnimationFrame(this.scrollFrame);
    if (this.renderFrameRequest) cancelAnimationFrame(this.renderFrameRequest);
    this.scrollFrame = 0;
    this.renderFrameRequest = 0;
    this.scrollTick = false;
    this.renderRequest = false;
    this.renderer.setAnimationLoop(null);
    this.canvas.removeEventListener('webglcontextlost', this.boundContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.boundContextRestored);
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerleave', this.boundPointerLeave);
    window.removeEventListener('scroll', this.boundScroll);
    window.removeEventListener('pagehide', this.boundPageHide);
    window.removeEventListener('pageshow', this.boundPageShow);
    window.removeEventListener('blur', this.boundWindowBlur);
    window.removeEventListener('focus', this.boundWindowFocus);
    document.removeEventListener('raza:chapterchange', this.boundChapterChange);
    document.removeEventListener('visibilitychange', this.boundVisibilityChange);
    this.sceneControl?.removeEventListener('click', this.onSceneControlClick);
    this.motionPreference?.removeEventListener?.('change', this.onMotionPreferenceChange);
    this.journeyObserver?.disconnect();
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    this.scene.traverse(object => {
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
    this.clock.dispose();
    this.renderer.renderLists?.dispose();
    this.renderer.dispose();
    this.materialCache.clear();
    this.basicMaterialCache.clear();
    this.animated.length = 0;
    if (debug && window.__RAZA_SCENE__ === this) delete window.__RAZA_SCENE__;
  }

  renderFrame = (time = performance.now(), fromAnimationLoop = false) => {
    if (this.hidden || this.contextLost) return;
    if (fromAnimationLoop && this.quality.maxFps < 60 && time - this.lastAnimationRender < 1000 / this.quality.maxFps) return;
    if (fromAnimationLoop) this.lastAnimationRender = time;
    this.clock.update(time);
    const measureFrame = debug || (fromAnimationLoop && this.quality.animate);
    const frameStart = measureFrame ? performance.now() : 0;
    const elapsed = this.quality.animate && !this.motionReduced && !this.paused ? this.clock.getElapsed() : 0;
    const progress = MathUtils.clamp(this.scroll.progress, 0, 1);
    const chapterPulse = this.chapterPulse.active && !this.motionReduced && !this.paused
      ? Math.sin(Math.PI * MathUtils.clamp((time - this.chapterPulse.startedAt) / 720, 0, 1))
      : 0;
    if (this.chapterPulse.active && time - this.chapterPulse.startedAt >= 720) this.chapterPulse.active = false;
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
    this._updateAssetVisibility(progress, chapterPulse);
    if (pathChanged || pointerChanged) {
      this.pathTarget.copy(this.baseTarget);
      this.pathTarget.x += this.pointerEase.x * 0.22;
      this.pathTarget.y += this.pointerEase.y * 0.16;
      this.camera.lookAt(this.pathTarget);
    }
    this.stars.position.x = this.pointerEase.x * -0.35;
    this.stars.position.y = this.pointerEase.y * -0.12;
    this.stars.rotation.z = this.pointerEase.x * 0.004;
    if (this.twilight) {
      this.twilight.position.x = this.pointerEase.x * -0.7;
      this.twilight.position.y = this.pointerEase.y * -0.28;
      this.twilight.rotation.z = this.pointerEase.x * 0.008;
    }
    if (this.quality.animate && !this.motionReduced && !this.paused) {
      this.animated.forEach(object => {
        if (!object.visible) return;
        const { userData } = object;
        if (userData.portalSpiral) userData.portalSpiral.rotation.z = elapsed * 0.038;
        userData.portalShaderMaterials?.forEach(material => {
          if (material.uniforms?.time) material.uniforms.time.value = elapsed;
        });
        userData.portalRings?.forEach(({ ring, speed, phase, scaleY }) => {
          ring.rotation.z = phase + elapsed * speed;
          const breath = 1 + Math.sin(elapsed * 0.34 + phase) * 0.012;
          ring.scale.y = scaleY * breath;
        });
        userData.portalArcs?.forEach(({ arc, speed }) => {
          arc.rotation.z = elapsed * speed;
        });
        userData.portalLayers?.forEach(({ layer, speed }) => {
          layer.rotation.z = elapsed * speed;
        });
        if (userData.galaxy) userData.galaxy.rotation.z = elapsed * 0.012;
        if (userData.apertureHalo) {
          const haloBreath = 1 + Math.sin(elapsed * 0.42) * 0.018;
          userData.apertureHalo.scale.set(haloBreath, haloBreath * 0.76, 1);
          userData.apertureHalo.rotation.z = elapsed * -0.006;
        }
        if (userData.aperture) {
          const lensBreath = 1 + Math.sin(elapsed * 0.34 + 0.7) * 0.008;
          userData.aperture.scale.set(lensBreath, lensBreath * 0.76, 1);
        }
        if (userData.apertureRim) userData.apertureRim.rotation.z = elapsed * 0.01;
        if (userData.coreSignal) userData.coreSignal.rotation.y = elapsed * 0.018;
        if (userData.persistent) {
          const basePosition = userData.basePosition;
          const baseRotation = userData.baseRotation;
          object.position.x = basePosition.x + this.pointerEase.x * -0.18 + Math.sin(elapsed * 0.08) * 0.04;
          object.position.y = basePosition.y + this.pointerEase.y * -0.12 + Math.cos(elapsed * 0.1) * 0.03;
          object.position.z = basePosition.z;
          object.rotation.set(
            baseRotation.x + Math.sin(elapsed * 0.07) * 0.008,
            baseRotation.y + this.pointerEase.x * 0.012,
            baseRotation.z + this.pointerEase.y * 0.008,
          );
        }
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
