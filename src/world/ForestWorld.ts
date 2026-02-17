import * as THREE from 'three';
import { LoadedAssets } from '../core/AssetLoader';
import { GAME_SETTINGS, COLORS } from '../constants';

export class ForestWorld {
  private scene: THREE.Scene;
  private assets: LoadedAssets;
  private trees: THREE.Group[] = [];
  private ground!: THREE.Mesh;
  private settings: typeof GAME_SETTINGS.lowEnd | typeof GAME_SETTINGS.highEnd;

  constructor(scene: THREE.Scene, assets: LoadedAssets, isLowEnd: boolean = false) {
    this.scene = scene;
    this.assets = assets;
    this.settings = isLowEnd ? GAME_SETTINGS.lowEnd : GAME_SETTINGS.highEnd;
    this.createWorld();
  }

  private createWorld(): void {
    this.createSky();
    this.createGround();
    this.createTrees();
    this.createLighting();
    this.createFog();
  }

  private createSky(): void {
    // Gradient sky using a large sphere
    const skyGeometry = new THREE.SphereGeometry(100, 32, 32);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(COLORS.sky.top) },
        horizonColor: { value: new THREE.Color(COLORS.sky.horizon) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          float t = max(0.0, h);
          gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
        }
      `,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);
  }

  private createGround(): void {
    const groundSize = 60;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);

    // Add subtle height variation
    const positions = groundGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const height = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.2;
      positions.setXYZ(i, x, y, z + height);
    }
    groundGeometry.computeVertexNormals();

    const groundMaterial = new THREE.MeshToonMaterial({
      color: COLORS.grass.dark,
      map: this.assets.textures.grass,
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  private createTrees(): void {
    const treeCount = this.settings.treeCount;
    const areaSize = 25;

    for (let i = 0; i < treeCount; i++) {
      const tree = this.assets.treeModels[0].clone();

      // Random position, but avoid center area
      let x: number, z: number;
      do {
        x = (Math.random() - 0.5) * areaSize * 2;
        z = (Math.random() - 0.5) * areaSize * 2;
      } while (Math.sqrt(x * x + z * z) < 5); // Keep center clear

      tree.position.set(x, 0, z);

      // Random scale variation
      const scale = 0.7 + Math.random() * 0.6;
      tree.scale.setScalar(scale);

      // Random rotation
      tree.rotation.y = Math.random() * Math.PI * 2;

      this.trees.push(tree);
      this.scene.add(tree);
    }
  }

  private createLighting(): void {
    // Warm hemisphere light for ambient
    const hemiLight = new THREE.HemisphereLight(
      COLORS.sky.top,
      COLORS.grass.dark,
      0.6
    );
    this.scene.add(hemiLight);

    // Soft directional light for shadows
    const dirLight = new THREE.DirectionalLight('#FFF5E1', 1.0);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = this.settings.shadowMapSize;
    dirLight.shadow.mapSize.height = this.settings.shadowMapSize;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.bias = -0.0001;
    this.scene.add(dirLight);
  }

  private createFog(): void {
    this.scene.fog = new THREE.Fog(
      COLORS.sky.horizon,
      this.settings.fogNear,
      this.settings.fogFar
    );
  }

  public getGround(): THREE.Mesh {
    return this.ground;
  }

  public getTrees(): THREE.Group[] {
    return this.trees;
  }

  public update(_deltaTime: number): void {
    // Could add wind animation for trees here
    // Or other environmental effects
  }

  public dispose(): void {
    this.trees.forEach((tree) => {
      tree.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
    });
    this.trees = [];
  }
}
