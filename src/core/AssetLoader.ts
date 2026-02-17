import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface LoadedAssets {
  dog: THREE.Group | null;
  truffleCommon: THREE.Group | null;
  truffleRare: THREE.Group | null;
  treeModels: THREE.Group[];
  textures: {
    grass: THREE.Texture | null;
    dirt: THREE.Texture | null;
    bark: THREE.Texture | null;
  };
}

export class AssetLoader {
  private gltfLoader: GLTFLoader;
  private textureLoader: THREE.TextureLoader;
  private loadingManager: THREE.LoadingManager;

  public onProgress: ((progress: number) => void) | null = null;

  constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);

    this.loadingManager.onProgress = (_url, loaded, total) => {
      if (this.onProgress) {
        this.onProgress(loaded / total);
      }
    };
  }

  async loadAll(): Promise<LoadedAssets> {
    const assets: LoadedAssets = {
      dog: null,
      truffleCommon: null,
      truffleRare: null,
      treeModels: [],
      textures: {
        grass: null,
        dirt: null,
        bark: null,
      },
    };

    // For now, we'll create procedural assets
    // Later these will be replaced with actual loaded assets

    // Create procedural textures
    assets.textures.grass = this.createProceduralGrassTexture();
    assets.textures.dirt = this.createProceduralDirtTexture();
    assets.textures.bark = this.createProceduralBarkTexture();

    // Create procedural models
    assets.dog = this.createProceduralDog();
    assets.truffleCommon = this.createProceduralTruffle(false);
    assets.truffleRare = this.createProceduralTruffle(true);
    assets.treeModels.push(this.createProceduralTree());

    return assets;
  }

  private createProceduralGrassTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Base color
    ctx.fillStyle = '#558B2F';
    ctx.fillRect(0, 0, 256, 256);

    // Add noise variation
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const shade = Math.random() * 40 - 20;
      const r = 85 + shade;
      const g = 139 + shade;
      const b = 47 + shade / 2;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 2, 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  }

  private createProceduralDirtTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Base color
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(0, 0, 256, 256);

    // Add noise
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const shade = Math.random() * 30 - 15;
      const r = 93 + shade;
      const g = 64 + shade;
      const b = 55 + shade;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createProceduralBarkTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base color
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(0, 0, 256, 512);

    // Vertical bark lines
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 256;
      const shade = Math.random() * 40 - 20;
      ctx.strokeStyle = `rgb(${65 + shade},${43 + shade},${35 + shade})`;
      ctx.lineWidth = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.random() - 0.5) * 10, 512);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createProceduralDog(): THREE.Group {
    const group = new THREE.Group();

    // Toon material gradient
    const gradientTexture = this.createToonGradient();
    const toonMaterial = new THREE.MeshToonMaterial({
      color: '#C9A66B',
      gradientMap: gradientTexture,
    });

    const darkMaterial = new THREE.MeshToonMaterial({
      color: '#3E2723',
      gradientMap: gradientTexture,
    });

    // Body (ellipsoid)
    const bodyGeometry = new THREE.SphereGeometry(0.4, 16, 12);
    bodyGeometry.scale(1, 0.8, 1.3);
    const body = new THREE.Mesh(bodyGeometry, toonMaterial);
    body.position.y = 0.4;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 12);
    headGeometry.scale(1, 0.9, 1);
    const head = new THREE.Mesh(headGeometry, toonMaterial);
    head.position.set(0, 0.65, 0.45);
    head.castShadow = true;
    group.add(head);

    // Snout
    const snoutGeometry = new THREE.SphereGeometry(0.15, 12, 8);
    snoutGeometry.scale(0.8, 0.7, 1.2);
    const snout = new THREE.Mesh(snoutGeometry, toonMaterial);
    snout.position.set(0, 0.55, 0.7);
    group.add(snout);

    // Nose
    const noseGeometry = new THREE.SphereGeometry(0.05, 8, 6);
    const nose = new THREE.Mesh(noseGeometry, darkMaterial);
    nose.position.set(0, 0.55, 0.85);
    group.add(nose);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 6);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#1A1A1A' });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 0.72, 0.68);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 0.72, 0.68);
    group.add(rightEye);

    // Ears (floppy)
    const earGeometry = new THREE.SphereGeometry(0.12, 12, 8);
    earGeometry.scale(0.7, 1.2, 0.5);

    const leftEar = new THREE.Mesh(earGeometry, toonMaterial);
    leftEar.position.set(-0.22, 0.75, 0.35);
    leftEar.rotation.z = 0.3;
    leftEar.castShadow = true;
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, toonMaterial);
    rightEar.position.set(0.22, 0.75, 0.35);
    rightEar.rotation.z = -0.3;
    rightEar.castShadow = true;
    group.add(rightEar);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.35, 8);
    const legPositions = [
      [-0.2, 0.175, 0.2],   // front left
      [0.2, 0.175, 0.2],    // front right
      [-0.2, 0.175, -0.2],  // back left
      [0.2, 0.175, -0.2],   // back right
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeometry, toonMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      group.add(leg);
    });

    // Tail (curly for Lagotto)
    const tailGeometry = new THREE.TorusGeometry(0.1, 0.04, 8, 16, Math.PI * 1.5);
    const tail = new THREE.Mesh(tailGeometry, toonMaterial);
    tail.position.set(0, 0.5, -0.5);
    tail.rotation.x = Math.PI / 4;
    tail.castShadow = true;
    group.add(tail);

    return group;
  }

  private createProceduralTruffle(isRare: boolean): THREE.Group {
    const group = new THREE.Group();

    const gradientTexture = this.createToonGradient();
    const material = new THREE.MeshToonMaterial({
      color: isRare ? '#4DB6AC' : '#5D4037',
      gradientMap: gradientTexture,
    });

    // Truffle shape (bumpy sphere)
    const geometry = new THREE.IcosahedronGeometry(0.15, 1);

    // Add some random displacement for bumpy look
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const noise = (Math.random() - 0.5) * 0.03;
      positions.setXYZ(i, x + noise, y + noise, z + noise);
    }
    geometry.computeVertexNormals();

    const truffle = new THREE.Mesh(geometry, material);
    truffle.castShadow = true;
    group.add(truffle);

    return group;
  }

  private createProceduralTree(): THREE.Group {
    const group = new THREE.Group();

    const gradientTexture = this.createToonGradient();

    // Trunk
    const trunkMaterial = new THREE.MeshToonMaterial({
      color: '#5D4037',
      gradientMap: gradientTexture,
    });
    const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.25, 2, 8);
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    trunk.castShadow = true;
    group.add(trunk);

    // Foliage (multiple stacked spheres for cartoon look)
    const foliageMaterial = new THREE.MeshToonMaterial({
      color: '#558B2F',
      gradientMap: gradientTexture,
    });

    const foliagePositions = [
      { y: 2.5, scale: 1.2 },
      { y: 3.2, scale: 1 },
      { y: 3.8, scale: 0.8 },
    ];

    foliagePositions.forEach((pos) => {
      const foliageGeometry = new THREE.IcosahedronGeometry(0.8 * pos.scale, 1);
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = pos.y;
      foliage.position.x = (Math.random() - 0.5) * 0.2;
      foliage.position.z = (Math.random() - 0.5) * 0.2;
      foliage.castShadow = true;
      group.add(foliage);
    });

    return group;
  }

  private createToonGradient(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;

    // 4-step gradient for cartoon look
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = '#666666';
    ctx.fillRect(1, 0, 1, 1);
    ctx.fillStyle = '#999999';
    ctx.fillRect(2, 0, 1, 1);
    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(3, 0, 1, 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }

  public async loadGLTF(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        reject
      );
    });
  }

  public async loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(url, resolve, undefined, reject);
    });
  }
}
