import * as THREE from 'three';
import { useGameStore } from '../state/gameStore';
import { GAME_SETTINGS, DogState } from '../constants';
import gsap from 'gsap';

/**
 * DogEntity - Entità cane completa con animazioni fluide e comportamento realistico
 */
export class DogEntity {
  private mesh: THREE.Group;
  private targetPosition: THREE.Vector3 | null = null;
  
  // Animation state
  private walkCycle: number = 0;
  private breathCycle: number = 0;
  private tailWagSpeed: number = 0;
  private earTilt: number = 0;
  
  // Current animation
  public currentAnimation: string = 'idle';
  
  // Materials for state changes
  private toonMaterial: THREE.MeshToonMaterial;
  private darkMaterial: THREE.MeshToonMaterial;
  
  // References to animated parts
  private leftEar: THREE.Mesh | null = null;
  private rightEar: THREE.Mesh | null = null;
  private tailGroup: THREE.Group | null = null;

  constructor() {
    // Colore Lagotto Romagnolo - beige/cioccolato
    this.toonMaterial = this.createToonMaterial('#A67B5B');
    this.darkMaterial = this.createToonMaterial('#2C1810');
    
    this.mesh = this.createDetailedDog();
    this.setupInitialPose();
  }

  private createToonMaterial(color: string): THREE.MeshToonMaterial {
    const gradientTexture = this.createToonGradient();
    return new THREE.MeshToonMaterial({
      color,
      gradientMap: gradientTexture,
    });
  }

  private createToonGradient(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    
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

  private createDetailedDog(): THREE.Group {
    const group = new THREE.Group();
    
    // === CORPO ===
    // Forma più realistica con petto pronunciato
    const bodyGroup = new THREE.Group();
    
    // Torace (più grosso)
    const chestGeometry = new THREE.SphereGeometry(0.35, 16, 12);
    chestGeometry.scale(1.1, 0.9, 1);
    const chest = new THREE.Mesh(chestGeometry, this.toonMaterial);
    chest.position.set(0, 0.38, 0.15);
    chest.castShadow = true;
    bodyGroup.add(chest);
    
    // Addome (più snello)
    const abdomenGeometry = new THREE.SphereGeometry(0.28, 14, 10);
    abdomenGeometry.scale(0.9, 0.85, 1.2);
    const abdomen = new THREE.Mesh(abdomenGeometry, this.toonMaterial);
    abdomen.position.set(0, 0.35, -0.15);
    abdomen.castShadow = true;
    bodyGroup.add(abdomen);
    
    group.add(bodyGroup);
    
    // === TESTA ===
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.58, 0.5);
    
    // Cranio (rotondo tipico del Lagotto)
    const skullGeometry = new THREE.SphereGeometry(0.22, 16, 12);
    skullGeometry.scale(1, 0.95, 0.9);
    const skull = new THREE.Mesh(skullGeometry, this.toonMaterial);
    skull.castShadow = true;
    skull.name = 'head';
    headGroup.add(skull);
    
    // Muso (più pronunciato)
    const snoutGeometry = new THREE.SphereGeometry(0.12, 12, 8);
    snoutGeometry.scale(0.85, 0.75, 1.3);
    const snout = new THREE.Mesh(snoutGeometry, this.toonMaterial);
    snout.position.set(0, -0.05, 0.2);
    snout.name = 'snout';
    headGroup.add(snout);
    
    // Naso
    const noseGeometry = new THREE.SphereGeometry(0.04, 8, 6);
    const nose = new THREE.Mesh(noseGeometry, this.darkMaterial);
    nose.position.set(0, -0.03, 0.32);
    nose.name = 'nose';
    headGroup.add(nose);
    
    // Occhi
    const eyeGeometry = new THREE.SphereGeometry(0.035, 8, 6);
    const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
    const pupilGeometry = new THREE.SphereGeometry(0.02, 6, 4);
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: '#1A1A1A' });
    
    // Occhio sinistro
    const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    leftEyeWhite.position.set(-0.08, 0.05, 0.15);
    leftEyeWhite.name = 'leftEye';
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.08, 0.05, 0.18);
    leftEyeWhite.add(leftPupil);
    headGroup.add(leftEyeWhite);
    
    // Occhio destro
    const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    rightEyeWhite.position.set(0.08, 0.05, 0.15);
    rightEyeWhite.name = 'rightEye';
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.08, 0.05, 0.18);
    rightEyeWhite.add(rightPupil);
    headGroup.add(rightEyeWhite);
    
    // === ORECCHIE (tipiche del Lagotto - pendenti) ===
    const earGeometry = this.createEarGeometry();
    
    const leftEar = new THREE.Mesh(earGeometry, this.toonMaterial);
    leftEar.position.set(-0.18, 0.08, 0.05);
    leftEar.rotation.set(0.3, 0, -0.6);
    leftEar.castShadow = true;
    leftEar.name = 'leftEar';
    headGroup.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, this.toonMaterial);
    rightEar.position.set(0.18, 0.08, 0.05);
    rightEar.rotation.set(-0.3, 0, 0.6);
    rightEar.castShadow = true;
    rightEar.name = 'rightEar';
    headGroup.add(rightEar);
    
    group.add(headGroup);
    
    // === ZAMPE ===
    const legPositions = [
      { name: 'frontLeft', x: -0.15, z: 0.18 },
      { name: 'frontRight', x: 0.15, z: 0.18 },
      { name: 'backLeft', x: -0.15, z: -0.18 },
      { name: 'backRight', x: 0.15, z: -0.18 },
    ];
    
    legPositions.forEach((pos) => {
      const legGroup = this.createLeg();
      legGroup.position.set(pos.x, 0.18, pos.z);
      legGroup.name = pos.name;
      group.add(legGroup);
    });
    
    // === CODA (arricciata tipica del Lagotto) ===
    const tailGroup = this.createCurlyTail();
    tailGroup.position.set(0, 0.45, -0.35);
    tailGroup.name = 'tail';
    group.add(tailGroup);
    
    return group;
  }

  private createEarGeometry(): THREE.BufferGeometry {
    // Forma triangolare arrotondata
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.08, 0.15, 0, 0.22);
    shape.quadraticCurveTo(-0.08, 0.15, 0, 0);
    
    const extrudeSettings = {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  private createLeg(): THREE.Group {
    const legGroup = new THREE.Group();
    
    // Coscia
    const thighGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.12, 8);
    const thigh = new THREE.Mesh(thighGeometry, this.toonMaterial);
    thigh.position.y = 0.12;
    thigh.castShadow = true;
    legGroup.add(thigh);
    
    // Zampa
    const pawGeometry = new THREE.CylinderGeometry(0.045, 0.04, 0.12, 8);
    const paw = new THREE.Mesh(pawGeometry, this.toonMaterial);
    paw.position.y = 0.04;
    paw.castShadow = true;
    legGroup.add(paw);
    
    // Piede
    const footGeometry = new THREE.SphereGeometry(0.04, 6, 4);
    footGeometry.scale(1.2, 0.5, 1.4);
    const foot = new THREE.Mesh(footGeometry, this.toonMaterial);
    foot.position.set(0, 0, 0.02);
    legGroup.add(foot);
    
    return legGroup;
  }

  private createCurlyTail(): THREE.Group {
    const tailGroup = new THREE.Group();
    
    // Creiamo una coda arricciata usando segmenti
    const segments = 6;
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 1.5;
      const radius = 0.06 + t * 0.02;
      const height = t * 0.15;
      
      const segmentGeometry = new THREE.SphereGeometry(0.025 - t * 0.005, 6, 4);
      const segment = new THREE.Mesh(segmentGeometry, this.toonMaterial);
      segment.position.set(
        Math.sin(angle) * radius,
        height,
        -Math.cos(angle) * radius * 0.5
      );
      segment.castShadow = true;
      tailGroup.add(segment);
    }
    
    return tailGroup;
  }

  private setupInitialPose(): void {
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    
    // Find and store references to animated parts
    const headGroup = this.mesh.children[1] as THREE.Group;
    if (headGroup) {
      headGroup.children.forEach(child => {
        if (child.name === 'leftEar') this.leftEar = child as THREE.Mesh;
        if (child.name === 'rightEar') this.rightEar = child as THREE.Mesh;
      });
    }
    
    this.tailGroup = this.mesh.children.find(c => c.name === 'tail') as THREE.Group;
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public update(deltaTime: number): void {
    const store = useGameStore.getState();
    
    // Update target from store
    if (store.dogTarget) {
      this.targetPosition = new THREE.Vector3(
        store.dogTarget.x,
        0,
        store.dogTarget.z
      );
    } else {
      this.targetPosition = null;
    }

    // Movement and animation
    if (this.targetPosition) {
      this.handleMovement(deltaTime, store);
    } else if (!store.dogIsSniffing && !store.dogIsDigging) {
      this.playIdleAnimation(deltaTime);
    }

    // Update emotional state visuals
    this.updateEmotionalVisuals(store.dogEmotionalState, deltaTime);
    
    // Continuous animations
    this.updateBreathing(deltaTime);
    this.updateTailWag(deltaTime);
  }

  private handleMovement(deltaTime: number, store: ReturnType<typeof useGameStore.getState>): void {
    const direction = new THREE.Vector3()
      .subVectors(this.targetPosition!, this.mesh.position);
    direction.y = 0;

    const distance = direction.length();

    if (distance > GAME_SETTINGS.dog.targetReachedThreshold) {
      direction.normalize();
      const moveAmount = GAME_SETTINGS.dog.moveSpeed * deltaTime;
      
      this.mesh.position.add(direction.clone().multiplyScalar(Math.min(moveAmount, distance)));

      // Rotate to face direction (smooth)
      const targetRotation = Math.atan2(direction.x, direction.z);
      const rotationDiff = targetRotation - this.mesh.rotation.y;
      const normalizedDiff = Math.atan2(Math.sin(rotationDiff), Math.cos(rotationDiff));
      this.mesh.rotation.y += normalizedDiff * GAME_SETTINGS.dog.rotationSpeed * deltaTime;

      // Update store position
      store.setDogPosition({
        x: this.mesh.position.x,
        y: this.mesh.position.y,
        z: this.mesh.position.z,
      });
      store.setDogMoving(true);

      // Play walk animation
      this.playWalkAnimation(deltaTime);
    } else {
      // Reached target
      this.targetPosition = null;
      store.setDogTarget(null);
      store.setDogMoving(false);
    }
  }

  private playIdleAnimation(deltaTime: number): void {
    this.currentAnimation = 'idle';
    // Subtle weight shift
    this.breathCycle += deltaTime * 2;
  }

  private playWalkAnimation(deltaTime: number): void {
    this.currentAnimation = 'walk';
    this.walkCycle += deltaTime * 12; // Walk speed
    
    // Animate legs
    const amplitude = 0.08;
    
    this.mesh.children.forEach(child => {
      if (child.name === 'frontLeft' || child.name === 'backRight') {
        child.rotation.x = Math.sin(this.walkCycle) * amplitude;
      } else if (child.name === 'frontRight' || child.name === 'backLeft') {
        child.rotation.x = Math.sin(this.walkCycle + Math.PI) * amplitude;
      }
    });
    
    // Slight body bob
    this.mesh.position.y = Math.abs(Math.sin(this.walkCycle * 2)) * 0.02;
  }

  private updateBreathing(deltaTime: number): void {
    this.breathCycle += deltaTime * 1.5;
    const breathScale = 1 + Math.sin(this.breathCycle) * 0.015;
    
    // Apply to body
    const body = this.mesh.children[0];
    if (body) {
      body.scale.y = breathScale;
    }
  }

  private updateTailWag(deltaTime: number): void {
    const store = useGameStore.getState();
    const state = store.dogEmotionalState;
    
    // Adjust wag speed based on emotional state
    let targetWagSpeed = 0;
    switch (state) {
      case DogState.NEUTRAL:
        targetWagSpeed = 2;
        break;
      case DogState.CURIOUS:
        targetWagSpeed = 4;
        break;
      case DogState.CONVINCED:
        targetWagSpeed = 6;
        break;
      case DogState.ALMOST:
        targetWagSpeed = 10;
        break;
      case DogState.CONFUSED:
        targetWagSpeed = 1;
        break;
    }
    
    // Smoothly adjust wag speed
    this.tailWagSpeed += (targetWagSpeed - this.tailWagSpeed) * deltaTime * 5;
    
    // Apply to tail
    if (this.tailGroup) {
      this.tailGroup.rotation.y = Math.sin(Date.now() * 0.001 * this.tailWagSpeed) * 0.4;
      this.tailGroup.rotation.z = Math.sin(Date.now() * 0.001 * this.tailWagSpeed * 0.5) * 0.2;
    }
  }

  private updateEmotionalVisuals(state: DogState, deltaTime: number): void {
    // Adjust ear tilt based on state
    let targetEarTilt = 0;
    switch (state) {
      case DogState.CURIOUS:
        targetEarTilt = 0.15;
        break;
      case DogState.CONVINCED:
        targetEarTilt = 0.25;
        break;
      case DogState.ALMOST:
        targetEarTilt = 0.35;
        break;
      case DogState.CONFUSED:
        targetEarTilt = -0.1;
        break;
    }
    
    this.earTilt += (targetEarTilt - this.earTilt) * deltaTime * 3;
    
    if (this.leftEar) {
      this.leftEar.rotation.z = -0.6 + this.earTilt;
    }
    if (this.rightEar) {
      this.rightEar.rotation.z = 0.6 - this.earTilt;
    }
  }

  public playSniffAnimation(): void {
    this.currentAnimation = 'sniff';
    
    const headGroup = this.mesh.children[1] as THREE.Group;
    if (!headGroup) return;
    
    // Head bob sniffing animation
    gsap.to(headGroup.position, {
      z: headGroup.position.z + 0.08,
      y: headGroup.position.y - 0.03,
      duration: 0.15,
      ease: 'sine.inOut',
      repeat: 5,
      yoyo: true,
    });
    
    // Nose twitch
    const nose = headGroup.children.find(c => c.name === 'nose') as THREE.Mesh;
    if (nose) {
      gsap.to(nose.scale, {
        x: 1.2,
        y: 1.2,
        duration: 0.1,
        ease: 'sine.inOut',
        repeat: 10,
        yoyo: true,
      });
    }
  }

  public playDigAnimation(onComplete?: () => void): void {
    this.currentAnimation = 'dig';
    
    // Body bobbing
    gsap.to(this.mesh.position, {
      y: -0.08,
      duration: 0.12,
      ease: 'power2.inOut',
      repeat: 6,
      yoyo: true,
      onComplete: () => {
        this.mesh.position.y = 0;
        if (onComplete) onComplete();
      },
    });
    
    // Legs move like digging
    this.mesh.children.forEach(child => {
      if (child.name && (child.name.includes('front'))) {
        gsap.to(child.rotation, {
          x: 0.5,
          duration: 0.1,
          ease: 'power2.inOut',
          repeat: 11,
          yoyo: true,
        });
      }
    });
    
    // Dust particles effect (visual feedback)
    // Could be added here
  }

  public playExcitedAnimation(): void {
    this.currentAnimation = 'excited';
    
    // Jump!
    gsap.to(this.mesh.position, {
      y: 0.25,
      duration: 0.25,
      ease: 'power2.out',
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.mesh.position.y = 0;
        this.currentAnimation = 'idle';
      },
    });
    
    // Spin tail fast
    if (this.tailGroup) {
      gsap.to(this.tailGroup.rotation, {
        y: this.tailGroup.rotation.y + Math.PI * 4,
        duration: 1,
        ease: 'power2.inOut',
      });
    }
    
    // Bark effect (visual)
    this.showBarkEffect();
  }

  private showBarkEffect(): void {
    // Create a visual bark indicator
    const barkGeometry = new THREE.RingGeometry(0.05, 0.08, 16);
    const barkMaterial = new THREE.MeshBasicMaterial({
      color: '#FFD700',
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const bark = new THREE.Mesh(barkGeometry, barkMaterial);
    bark.position.copy(this.mesh.position);
    bark.position.y += 0.7;
    bark.rotation.x = -Math.PI / 2;
    this.mesh.parent?.add(bark);
    
    // Animate and remove
    gsap.to(bark.scale, {
      x: 3,
      y: 3,
      z: 3,
      duration: 0.5,
      ease: 'power2.out',
    });
    gsap.to(barkMaterial, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        this.mesh.parent?.remove(bark);
        barkGeometry.dispose();
        barkMaterial.dispose();
      },
    });
  }

  public playConfusedAnimation(): void {
    this.currentAnimation = 'confused';
    
    const headGroup = this.mesh.children[1] as THREE.Group;
    if (!headGroup) return;
    
    // Head tilt side to side
    gsap.to(headGroup.rotation, {
      z: 0.3,
      duration: 0.2,
      ease: 'sine.inOut',
      repeat: 5,
      yoyo: true,
      onComplete: () => {
        headGroup.rotation.z = 0;
        this.currentAnimation = 'idle';
      },
    });
  }

  public dispose(): void {
    gsap.killTweensOf(this.mesh);
    gsap.killTweensOf(this.mesh.position);
    gsap.killTweensOf(this.mesh.rotation);
    gsap.killTweensOf(this.mesh.scale);
    
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }
}
// Force rebuild
