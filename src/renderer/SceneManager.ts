/**
 * SceneManager — Vanilla Three.js scene, camera, renderer, lighting, and render loop.
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface SceneManagerOptions {
  container: HTMLElement;
  antialias?: boolean;
  shadowMapSize?: number;
  fogDensity?: number;
}

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;

  private clock = new THREE.Clock();
  private animationId: number | null = null;
  private updateCallbacks: Array<(dt: number) => void> = [];

  constructor(opts: SceneManagerOptions) {
    const { container, antialias = true, shadowMapSize = 512, fogDensity = 0.003 } = opts;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.FogExp2(0xC8D8E8, fogDensity);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.5, 2000);
    this.camera.position.set(50, 80, 100);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias, powerPreference: "high-performance" });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;
    this.controls.target.set(0, 0, 0);

    // Lighting
    this.setupLighting(shadowMapSize);

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    console.log("[SceneManager] Initialized");
  }

  private setupLighting(shadowMapSize: number) {
    // Directional sun
    const sun = new THREE.DirectionalLight(0xFFF4E0, 2.5);
    sun.position.set(80, 120, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    sun.shadow.camera.left = -150;
    sun.shadow.camera.right = 150;
    sun.shadow.camera.top = 150;
    sun.shadow.camera.bottom = -150;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 400;
    sun.shadow.bias = -0.001;
    this.scene.add(sun);

    // Ambient
    const ambient = new THREE.AmbientLight(0x8899BB, 0.4);
    this.scene.add(ambient);

    // Hemisphere for color grading
    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x556644, 0.5);
    this.scene.add(hemi);

    console.log("[SceneManager] Lighting configured");
  }

  /** Register an update callback for the render loop */
  onUpdate(cb: (dt: number) => void) {
    this.updateCallbacks.push(cb);
  }

  /** Start the render loop */
  start() {
    if (this.animationId !== null) return;
    console.log("[SceneManager] Render loop started");
    const loop = () => {
      this.animationId = requestAnimationFrame(loop);
      const dt = this.clock.getDelta();
      this.controls.update();
      for (const cb of this.updateCallbacks) cb(dt);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  /** Stop the render loop */
  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      console.log("[SceneManager] Render loop stopped");
    }
  }

  /** Clean up resources */
  dispose() {
    this.stop();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    console.log("[SceneManager] Disposed");
  }
}
