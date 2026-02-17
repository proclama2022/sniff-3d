import * as THREE from 'three';
import { useGameStore } from '../state/gameStore';
import { GAME_SETTINGS, DogState } from '../constants';
import gsap from 'gsap';

export class Dog {
  private mesh: THREE.Group;
  private currentAnimation: string = 'idle';
  private targetPosition: THREE.Vector3 | null = null;

  constructor(dogModel: THREE.Group) {
    this.mesh = dogModel.clone();
    this.setupAnimations();
  }

  private setupAnimations(): void {
    // Setup initial state
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
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
      direction.y = 0; // Keep on ground

      const distance = direction.length();

      if (distance > GAME_SETTINGS.dog.targetReachedThreshold) {
        // Normalize and move
        direction.normalize();
        const moveAmount = GAME_SETTINGS.dog.moveSpeed * deltaTime;
        
        this.mesh.position.add(direction.multiplyScalar(Math.min(moveAmount, distance)));

        // Rotate to face direction
        const targetRotation = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = THREE.MathUtils.lerp(
          this.mesh.rotation.y,
          targetRotation,
          GAME_SETTINGS.dog.rotationSpeed * deltaTime
        );

        // Update store position
        store.setDogPosition({
          x: this.mesh.position.x,
          y: this.mesh.position.y,
          z: this.mesh.position.z,
        });
        store.setDogMoving(true);

        // Play walk animation
        if (this.currentAnimation !== 'walk') {
          this.playWalkAnimation();
        }
      } else {
        // Reached target
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
    // Simple visual feedback based on state
    const head = this.mesh.children[1] as THREE.Mesh; // Head
    
    switch (state) {
      case DogState.CURIOUS:
        // Tilt head slightly
        head.rotation.z = Math.sin(Date.now() * 0.005) * 0.1;
        break;
      case DogState.CONVINCED:
        // More animated head movement
        head.rotation.z = Math.sin(Date.now() * 0.01) * 0.15;
        break;
      case DogState.ALMOST:
        // Excited bobbing
        this.mesh.position.y = Math.abs(Math.sin(Date.now() * 0.01)) * 0.1;
        break;
      case DogState.CONFUSED:
        // Shake head
        head.rotation.z = Math.sin(Date.now() * 0.02) * 0.2;
        break;
      case DogState.NEUTRAL:
      default:
        head.rotation.z = 0;
        break;
    }
  }

  public playIdleAnimation(): void {
    this.currentAnimation = 'idle';
    // Subtle breathing animation
    gsap.to(this.mesh.scale, {
      y: 1.02,
      duration: 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }

  public playWalkAnimation(): void {
    this.currentAnimation = 'walk';
    // Stop idle animation
    gsap.killTweensOf(this.mesh.scale);
    this.mesh.scale.set(1, 1, 1);
  }

  public playSniffAnimation(): void {
    this.currentAnimation = 'sniff';
    
    // Head bob sniffing animation
    const head = this.mesh.children[1];
    gsap.to(head.position, {
      z: head.position.z + 0.1,
      duration: 0.2,
      ease: 'sine.inOut',
      repeat: 3,
      yoyo: true,
    });
  }

  public playDigAnimation(onComplete?: () => void): void {
    this.currentAnimation = 'dig';
    
    // Digging animation - bob up and down
    gsap.to(this.mesh.position, {
      y: -0.1,
      duration: 0.15,
      ease: 'power2.inOut',
      repeat: 4,
      yoyo: true,
      onComplete: () => {
        this.mesh.position.y = 0;
        if (onComplete) onComplete();
      },
    });

    // Paw movement simulation via scale
    gsap.to(this.mesh.scale, {
      y: 0.95,
      duration: 0.1,
      ease: 'power2.inOut',
      repeat: 7,
      yoyo: true,
    });
  }

  public playExcitedAnimation(): void {
    this.currentAnimation = 'excited';
    
    // Happy bounce
    gsap.to(this.mesh.position, {
      y: 0.3,
      duration: 0.2,
      ease: 'power2.out',
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.mesh.position.y = 0;
        this.playIdleAnimation();
      },
    });

    // Tail wag (rotate tail)
    const tail = this.mesh.children[this.mesh.children.length - 1];
    if (tail) {
      gsap.to(tail.rotation, {
        z: tail.rotation.z + Math.PI * 2,
        duration: 0.5,
        ease: 'power2.inOut',
      });
    }
  }

  public playConfusedAnimation(): void {
    this.currentAnimation = 'confused';
    
    // Head shake
    const head = this.mesh.children[1];
    gsap.to(head.rotation, {
      y: head.rotation.y + 0.3,
      duration: 0.1,
      ease: 'sine.inOut',
      repeat: 5,
      yoyo: true,
      onComplete: () => {
        head.rotation.y = 0;
        this.playIdleAnimation();
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
