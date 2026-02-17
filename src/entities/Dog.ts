import * as THREE from 'three';
import { useGameStore } from '../state/gameStore';
import { GAME_SETTINGS, DogState } from '../constants';
import gsap from 'gsap';

export class Dog {
  private mesh: THREE.Group;
  private currentAnimation: string = 'idle';
  private targetPosition: THREE.Vector3 | null = null;
  private baseScale: number = 1;

  constructor(dogModel: THREE.Group) {
    this.mesh = dogModel.clone();
    
    // Abilita ombre su tutti i mesh del modello
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Calcola bounding box
    const box = new THREE.Box3().setFromObject(this.mesh);
    const size = box.getSize(new THREE.Vector3());
    console.log('🐕 Model size:', size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2));
    
    // Scala a dimensione corretta per il gioco
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 1.2; // Aumentato da 1.0 a 1.2
    this.baseScale = targetSize / maxDim;
    this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
    
    // Centra il modello sul terreno
    box.setFromObject(this.mesh);
    const center = box.getCenter(new THREE.Vector3());
    this.mesh.position.x = -center.x;
    this.mesh.position.z = -center.z;
    this.mesh.position.y = -box.min.y + 0.2; // Alzato di 20cm dal terreno
    
    // Ruota per guardare in avanti (Z positivo)
    this.mesh.rotation.y = Math.PI;
    
    console.log('🐕 Dog positioned - scale:', this.baseScale.toFixed(3), 'y:', this.mesh.position.y.toFixed(3));
    this.setupAnimations();
  }

  private setupAnimations(): void {
    // Non resettare posizione/rotazione - già impostate
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

    // Move towards target
    if (this.targetPosition) {
      const direction = new THREE.Vector3()
        .subVectors(this.targetPosition, this.mesh.position);
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

        store.setDogPosition({
          x: this.mesh.position.x,
          y: this.mesh.position.y,
          z: this.mesh.position.z,
        });
        store.setDogMoving(true);

        if (this.currentAnimation !== 'walk') {
          this.playWalkAnimation();
        }
      } else {
        this.targetPosition = null;
        store.setDogTarget(null);
        store.setDogMoving(false);

        if (this.currentAnimation !== 'idle' && !store.dogIsSniffing && !store.dogIsDigging) {
          this.playIdleAnimation();
        }
      }
    }

    // Update emotional state visual
    this.updateEmotionalVisual(store.dogEmotionalState);
  }

  private updateEmotionalVisual(state: DogState): void {
    // Movimento body intero invece di cercare parti specifiche
    const time = Date.now() * 0.001;
    
    switch (state) {
      case DogState.CURIOUS:
        // Leggero tilt del corpo
        this.mesh.rotation.z = Math.sin(time * 3) * 0.05;
        break;
      case DogState.CONVINCED:
        this.mesh.rotation.z = Math.sin(time * 5) * 0.08;
        break;
      case DogState.ALMOST:
        // Saltelli eccitati
        const bounce = Math.abs(Math.sin(time * 8)) * 0.05;
        this.mesh.position.y = bounce;
        this.mesh.rotation.z = Math.sin(time * 6) * 0.1;
        break;
      case DogState.CONFUSED:
        this.mesh.rotation.z = Math.sin(time * 10) * 0.15;
        break;
      case DogState.NEUTRAL:
      default:
        this.mesh.rotation.z *= 0.9; // Torna a zero gradualmente
        break;
    }
  }

  public playIdleAnimation(): void {
    this.currentAnimation = 'idle';
    gsap.killTweensOf(this.mesh.scale);
    // Respirazione leggera
    gsap.to(this.mesh.scale, {
      x: this.baseScale * 1.01,
      z: this.baseScale * 1.01,
      duration: 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }

  public playWalkAnimation(): void {
    this.currentAnimation = 'walk';
    gsap.killTweensOf(this.mesh.scale);
    this.mesh.scale.set(this.baseScale, this.baseScale, this.baseScale);
  }

  public playSniffAnimation(): void {
    this.currentAnimation = 'sniff';
    
    // Movimento in avanti e indietro
    const originalZ = this.mesh.position.z;
    gsap.to(this.mesh.position, {
      z: originalZ + 0.08,
      duration: 0.15,
      ease: 'sine.inOut',
      repeat: 5,
      yoyo: true,
    });
    
    // Leggero abbassamento
    gsap.to(this.mesh.position, {
      y: -0.03,
      duration: 0.1,
      ease: 'sine.inOut',
      repeat: 10,
      yoyo: true,
    });
  }

  public playDigAnimation(onComplete?: () => void): void {
    this.currentAnimation = 'dig';
    
    const originalY = this.mesh.position.y;
    gsap.to(this.mesh.position, {
      y: originalY - 0.08,
      duration: 0.12,
      ease: 'power2.inOut',
      repeat: 6,
      yoyo: true,
      onComplete: () => {
        this.mesh.position.y = originalY;
        if (onComplete) onComplete();
      },
    });
  }

  public playExcitedAnimation(): void {
    this.currentAnimation = 'excited';
    
    const originalY = this.mesh.position.y;
    gsap.to(this.mesh.position, {
      y: originalY + 0.25,
      duration: 0.25,
      ease: 'power2.out',
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.mesh.position.y = originalY;
        this.currentAnimation = 'idle';
      },
    });
    
    // Rotazione felice
    gsap.to(this.mesh.rotation, {
      y: this.mesh.rotation.y + Math.PI * 2,
      duration: 0.8,
      ease: 'power2.inOut',
    });
  }

  public playConfusedAnimation(): void {
    this.currentAnimation = 'confused';
    
    gsap.to(this.mesh.rotation, {
      z: 0.3,
      duration: 0.15,
      ease: 'sine.inOut',
      repeat: 5,
      yoyo: true,
      onComplete: () => {
        this.mesh.rotation.z = 0;
        this.currentAnimation = 'idle';
      },
    });
  }

  public dispose(): void {
    gsap.killTweensOf(this.mesh);
    gsap.killTweensOf(this.mesh.position);
    gsap.killTweensOf(this.mesh.scale);
    this.mesh.children.forEach(child => {
      gsap.killTweensOf(child);
      gsap.killTweensOf(child.position);
      gsap.killTweensOf(child.rotation);
    });
  }
}
