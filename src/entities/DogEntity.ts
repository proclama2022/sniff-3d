import * as THREE from 'three';
import { useGameStore } from '../state/gameStore';
import { GAME_SETTINGS, DogState } from '../constants';
import gsap from 'gsap';

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
  
  // References to animated parts
  private leftEar: THREE.Mesh | null = null;
  private rightEar: THREE.Mesh | null = null;
  private tailGroup: THREE.Group | null = null;
  
  // Shared gradient texture
  private gradientTexture: THREE.Texture;

  constructor() {
    this.gradientTexture = this.createToonGradient();
    
    this.mesh = this.createBeautifulDog();
    this.mesh.scale.set(1.8, 1.8, 1.8);
    this.setupInitialPose();
  }

  private createToonMaterial(color: string): THREE.MeshToonMaterial {
    return new THREE.MeshToonMaterial({
      color,
      gradientMap: this.gradientTexture,
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

  private createBeautifulDog(): THREE.Group {
    const group = new THREE.Group();
    
    // === COLORI LAGOTTO ===
    const mainFur = this.createToonMaterial('#D4C4A8'); // Crema chiaro
    const curlyFur = this.createToonMaterial('#C4B498'); // Beige più scuro (macchie)
    const darkFur = this.createToonMaterial('#8B7355'); // Marrone scuro
    const noseMat = this.createToonMaterial('#2D2420'); // Nero naso
    
    // === CORPO - Low poly capsula ===
    const bodyGeo = new THREE.CapsuleGeometry(0.35, 0.5, 6, 8);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, mainFur);
    body.position.set(0, 0.45, 0);
    body.castShadow = true;
    group.add(body);
    
    // Macchie arricciate sul corpo (low-poly spheres)
    const spotPositions = [
      { x: 0.2, y: 0.55, z: 0.1, s: 0.12 },
      { x: -0.15, y: 0.5, z: -0.15, s: 0.1 },
      { x: 0.1, y: 0.4, z: 0.25, s: 0.08 },
    ];
    spotPositions.forEach(p => {
      const spotGeo = new THREE.IcosahedronGeometry(p.s, 1);
      const spot = new THREE.Mesh(spotGeo, curlyFur);
      spot.position.set(p.x, p.y, p.z);
      spot.scale.set(1, 0.6, 1);
      group.add(spot);
    });
    
    // === COLLO ===
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.15, 8);
    const neck = new THREE.Mesh(neckGeo, mainFur);
    neck.position.set(0, 0.55, 0.32);
    group.add(neck);
    
    // === TESTA - Low poly sfera ===
    const headGeo = new THREE.IcosahedronGeometry(0.26, 2);
    const head = new THREE.Mesh(headGeo, mainFur);
    head.position.set(0, 0.65, 0.45);
    head.scale.set(1, 0.9, 0.95);
    head.castShadow = true;
    head.name = 'head';
    group.add(head);
    
    // === MUSO - Caratteristico del Lagotto ===
    const snoutGeo = new THREE.CapsuleGeometry(0.08, 0.1, 4, 6);
    snoutGeo.rotateX(Math.PI / 2);
    const snout = new THREE.Mesh(snoutGeo, curlyFur);
    snout.position.set(0, 0.58, 0.65);
    snout.name = 'snout';
    group.add(snout);
    
    // === NASO ===
    const noseGeo = new THREE.BoxGeometry(0.08, 0.05, 0.06);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.58, 0.74);
    nose.name = 'nose';
    group.add(nose);
    
    // === OCCHI - Espressivi, low-poly ===
    const eyeWhiteGeo = new THREE.SphereGeometry(0.055, 8, 6);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
    const pupilGeo = new THREE.SphereGeometry(0.03, 6, 4);
    const pupilMat = new THREE.MeshBasicMaterial({ color: '#3D2817' });
    const highlightGeo = new THREE.SphereGeometry(0.012, 4, 3);
    const highlightMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
    
    // Occhio sinistro
    const leftEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEye.position.set(-0.1, 0.68, 0.62);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.z = 0.03;
    leftEye.add(leftPupil);
    const leftHl = new THREE.Mesh(highlightGeo, highlightMat);
    leftHl.position.set(0.015, 0.015, 0.05);
    leftEye.add(leftHl);
    leftEye.name = 'leftEye';
    group.add(leftEye);
    
    // Occhio destro
    const rightEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEye.position.set(0.1, 0.68, 0.62);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.z = 0.03;
    rightEye.add(rightPupil);
    const rightHl = new THREE.Mesh(highlightGeo, highlightMat);
    rightHl.position.set(0.015, 0.015, 0.05);
    rightEye.add(rightHl);
    rightEye.name = 'rightEye';
    group.add(rightEye);
    
    // === SOVRACCIGLIA - pelo arruffato ===
    const browGeo = new THREE.BoxGeometry(0.08, 0.025, 0.03);
    const leftBrow = new THREE.Mesh(browGeo, darkFur);
    leftBrow.position.set(-0.1, 0.73, 0.58);
    leftBrow.rotation.z = 0.2;
    group.add(leftBrow);
    
    const rightBrow = new THREE.Mesh(browGeo.clone(), darkFur);
    rightBrow.position.set(0.1, 0.73, 0.58);
    rightBrow.rotation.z = -0.2;
    group.add(rightBrow);
    
    // === ORECCHIE - Pendenti con pelo arricciato ===
    const earGeo = new THREE.ConeGeometry(0.12, 0.25, 6);
    
    const leftEar = new THREE.Mesh(earGeo.clone(), mainFur);
    leftEar.position.set(-0.22, 0.55, 0.38);
    leftEar.rotation.set(0.5, 0.3, -1.0);
    leftEar.castShadow = true;
    leftEar.name = 'leftEar';
    group.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeo.clone(), mainFur);
    rightEar.position.set(0.22, 0.55, 0.38);
    rightEar.rotation.set(-0.5, -0.3, 1.0);
    rightEar.castShadow = true;
    rightEar.name = 'rightEar';
    group.add(rightEar);
    
    // Ciuffi di pelo sulle orecchie
    const tuftGeo = new THREE.TetrahedronGeometry(0.06);
    const leftTuft = new THREE.Mesh(tuftGeo, curlyFur);
    leftTuft.position.set(-0.25, 0.48, 0.35);
    leftTuft.rotation.set(0.3, 0, 0.5);
    group.add(leftTuft);
    
    const rightTuft = new THREE.Mesh(tuftGeo.clone(), curlyFur);
    rightTuft.position.set(0.25, 0.48, 0.35);
    rightTuft.rotation.set(0.3, 0, -0.5);
    group.add(rightTuft);
    
    // === ZAMPE ANTERIORI ===
    const legGeo = new THREE.CapsuleGeometry(0.055, 0.2, 4, 6);
    legGeo.rotateX(Math.PI * 0.05);
    
    const frontLeftLeg = new THREE.Mesh(legGeo.clone(), mainFur);
    frontLeftLeg.position.set(-0.13, 0.15, 0.2);
    frontLeftLeg.castShadow = true;
    frontLeftLeg.name = 'frontLeft';
    group.add(frontLeftLeg);
    
    const frontRightLeg = new THREE.Mesh(legGeo.clone(), mainFur);
    frontRightLeg.position.set(0.13, 0.15, 0.2);
    frontRightLeg.castShadow = true;
    frontRightLeg.name = 'frontRight';
    group.add(frontRightLeg);
    
    // === ZAMPE POSTERIORI ===
    const backLegGeo = new THREE.CapsuleGeometry(0.06, 0.22, 4, 6);
    backLegGeo.rotateX(Math.PI * 0.05);
    
    const backLeftLeg = new THREE.Mesh(backLegGeo.clone(), mainFur);
    backLeftLeg.position.set(-0.13, 0.15, -0.2);
    backLeftLeg.castShadow = true;
    backLeftLeg.name = 'backLeft';
    group.add(backLeftLeg);
    
    const backRightLeg = new THREE.Mesh(backLegGeo.clone(), mainFur);
    backRightLeg.position.set(0.13, 0.15, -0.2);
    backRightLeg.castShadow = true;
    backRightLeg.name = 'backRight';
    group.add(backRightLeg);
    
    // === ZAMPELLINE ===
    const pawGeo = new THREE.BoxGeometry(0.08, 0.03, 0.1);
    const pawMat = this.createToonMaterial('#B8A890');
    
    const pawPositions = [
      { x: -0.13, z: 0.32, name: 'pawFL' },
      { x: 0.13, z: 0.32, name: 'pawFR' },
      { x: -0.13, z: -0.32, name: 'pawBL' },
      { x: 0.13, z: -0.32, name: 'pawBR' },
    ];
    pawPositions.forEach(p => {
      const paw = new THREE.Mesh(pawGeo.clone(), pawMat);
      paw.position.set(p.x, 0.015, p.z);
      paw.castShadow = true;
      group.add(paw);
    });
    
    // === CODA - Arricciata caratteristica ===
    const tailGroup = new THREE.Group();
    tailGroup.name = 'tail';
    
    const tailSegments = 5;
    for (let i = 0; i < tailSegments; i++) {
      const t = i / (tailSegments - 1);
      const angle = t * Math.PI * 1.6;
      const radius = 0.06 + t * 0.02;
      const height = t * 0.16;
      
      const size = 0.035 - t * 0.006;
      const segGeo = new THREE.IcosahedronGeometry(size, 0);
      const seg = new THREE.Mesh(segGeo, mainFur);
      seg.position.set(
        Math.sin(angle) * radius,
        height,
        -Math.cos(angle) * radius * 0.5
      );
      seg.castShadow = true;
      tailGroup.add(seg);
    }
    
    tailGroup.position.set(0, 0.45, -0.38);
    group.add(tailGroup);
    
    // === CIUFFO SULLA TESTA (caratteristico Lagotto) ===
    const topTuftGeo = new THREE.ConeGeometry(0.05, 0.08, 4);
    const topTuft = new THREE.Mesh(topTuftGeo, curlyFur);
    topTuft.position.set(0, 0.88, 0.4);
    topTuft.rotation.x = -0.2;
    group.add(topTuft);
    
    return group;
  }

  private setupInitialPose(): void {
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    
    // Find and store references to animated parts
    this.mesh.traverse((child) => {
      if (child.name === 'leftEar') this.leftEar = child as THREE.Mesh;
      if (child.name === 'rightEar') this.rightEar = child as THREE.Mesh;
      if (child.name === 'tail') this.tailGroup = child as THREE.Group;
    });
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
