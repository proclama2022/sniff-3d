import * as THREE from 'three';
import { AssetLoader, LoadedAssets } from './AssetLoader';
import { InputManager } from './InputManager';
import { ForestWorld } from '../world/ForestWorld';
import { Dog } from '../entities/Dog';
import { ScentSystem } from '../systems/ScentSystem';
import { HUD } from '../ui/HUD';
import { HomeScreen } from '../ui/HomeScreen';
import { ResultModal } from '../ui/ResultModal';
import { useGameStore } from '../state/gameStore';
import { GAME_SETTINGS, TruffleType } from '../constants';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  private assetLoader!: AssetLoader;
  private assets!: LoadedAssets;
  private inputManager!: InputManager;

  private world!: ForestWorld;
  private dog!: Dog;
  private scentSystem!: ScentSystem;

  private hud!: HUD;
  private homeScreen!: HomeScreen;
  private resultModal!: ResultModal;

  private clock: THREE.Clock;
  private isRunning: boolean = false;
  private isLowEnd: boolean = false;

  private gameTimer: number = 0;
  private gameDuration: number = 120; // 2 minutes per game

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.detectDeviceCapabilities();
  }

  private detectDeviceCapabilities(): void {
    // Simple detection for mobile/low-end devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const pixelRatio = window.devicePixelRatio;
    this.isLowEnd = isMobile || pixelRatio < 2;
  }

  async init(): Promise<void> {
    // Setup renderer
    this.setupRenderer();

    // Setup scene
    this.scene = new THREE.Scene();

    // Setup camera
    this.setupCamera();

    // Load assets
    this.assetLoader = new AssetLoader();
    this.assetLoader.onProgress = (progress) => {
      console.log(`Loading: ${Math.round(progress * 100)}%`);
    };
    this.assets = await this.assetLoader.loadAll();

    // Create world
    this.world = new ForestWorld(this.scene, this.assets, this.isLowEnd);

    // Create dog
    this.dog = new Dog(this.assets.dog!);
    this.scene.add(this.dog.getMesh());

    // Create scent system
    this.scentSystem = new ScentSystem(this.scene, this.assets);

    // Setup input
    this.inputManager = new InputManager(this.canvas, this.camera);

    // Setup UI
    this.hud = new HUD();
    this.homeScreen = new HomeScreen();
    this.resultModal = new ResultModal();

    // Subscribe to store
    this.setupStoreSubscriptions();

    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.opacity = '0';
      setTimeout(() => loading.remove(), 500);
    }

    // Mark as loaded
    useGameStore.getState().setLoading(false);

    // Start render loop
    this.isRunning = true;
    this.animate();
  }

  private setupRenderer(): void {
    const settings = this.isLowEnd ? GAME_SETTINGS.lowEnd : GAME_SETTINGS.highEnd;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: settings.antialias,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatio));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private setupCamera(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 200);

    // Initial camera position (will follow dog)
    const settings = GAME_SETTINGS.camera;
    this.camera.position.set(0, settings.height, -settings.distance);
    this.camera.lookAt(0, 0, 0);
  }

  private setupStoreSubscriptions(): void {
    useGameStore.subscribe((state, prevState) => {
      // Initialize scent spots when game starts
      if (state.phase === 'playing' && prevState.phase !== 'playing') {
        this.scentSystem.initializeScentSpots(state.scentSpots);
        this.gameTimer = 0;
        this.dog.getMesh().position.set(0, 0, 0);
      }

      // Handle scent activation
      if (state.isScentActive && !prevState.isScentActive) {
        this.handleScentActivation();
      }

      // Handle dig action
      if (state.dogIsDigging && !prevState.dogIsDigging) {
        this.handleDigAction();
      }
    });
  }

  private handleScentActivation(): void {
    const store = useGameStore.getState();
    const nearestSpot = store.nearestScentSpot;

    if (nearestSpot) {
      this.scentSystem.activateScentVisualization(nearestSpot.id);
      this.dog.playSniffAnimation();

      // Deactivate after a moment
      setTimeout(() => {
        store.setScentActive(false);
        store.setDogSniffing(false);
        // Keep visualization active while in range
      }, 1000);
    }
  }

  private handleDigAction(): void {
    const store = useGameStore.getState();
    const nearestSpot = store.nearestScentSpot;

    if (nearestSpot && !nearestSpot.dug) {
      this.dog.playDigAnimation(() => {
        const result = store.digAtNearestSpot();

        if (result) {
          if (result === TruffleType.NOTHING) {
            this.scentSystem.showNothingFound(nearestSpot.id, nearestSpot);
          } else {
            this.scentSystem.showTruffle(nearestSpot.id, nearestSpot);
            this.dog.playExcitedAnimation();
          }
        }

        this.scentSystem.deactivateScentVisualization();
        store.setDogDigging(false);
      });
    } else {
      store.setDogDigging(false);
    }
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  private animate(): void {
    if (!this.isRunning) return;

    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();
    const state = useGameStore.getState();

    // Update game timer
    if (state.phase === 'playing') {
      this.gameTimer += deltaTime;

      // Check if all spots dug or time's up
      const dugCount = state.scentSpots.filter((s) => s.dug).length;
      const allDug = dugCount >= state.scentSpots.length;
      const timeUp = this.gameTimer >= this.gameDuration;

      if (allDug || timeUp) {
        useGameStore.getState().endGame();
      }
    }

    // Update dog
    if (state.phase === 'playing') {
      this.dog.update(deltaTime);
      this.updateCamera(deltaTime);
    }

    // Update world
    this.world.update(deltaTime);

    // Update scent intensity visualization
    if (state.isScentActive && state.nearestScentSpot) {
      this.scentSystem.updateIntensity(state.scentIntensity);
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  private updateCamera(_deltaTime: number): void {
    const settings = GAME_SETTINGS.camera;
    const dogPos = this.dog.getMesh().position;

    // Target camera position (behind and above dog)
    const targetX = dogPos.x;
    const targetY = settings.height;
    const targetZ = dogPos.z - settings.distance;

    // Smooth lerp
    this.camera.position.x = THREE.MathUtils.lerp(
      this.camera.position.x,
      targetX,
      settings.lerpSpeed
    );
    this.camera.position.y = THREE.MathUtils.lerp(
      this.camera.position.y,
      targetY,
      settings.lerpSpeed
    );
    this.camera.position.z = THREE.MathUtils.lerp(
      this.camera.position.z,
      targetZ,
      settings.lerpSpeed
    );

    // Look at dog
    this.camera.lookAt(dogPos.x, dogPos.y + 0.5, dogPos.z);
  }

  public dispose(): void {
    this.isRunning = false;

    this.world.dispose();
    this.scentSystem.dispose();
    this.dog.dispose();
    this.inputManager.dispose();
    this.hud.dispose();
    this.homeScreen.dispose();
    this.resultModal.dispose();

    this.renderer.dispose();

    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}
