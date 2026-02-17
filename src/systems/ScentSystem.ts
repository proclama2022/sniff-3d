import * as THREE from 'three';
import { COLORS, GAME_SETTINGS, TruffleType } from '../constants';
import type { ScentSpot } from '../state/gameStore';
import { LoadedAssets } from '../core/AssetLoader';
import gsap from 'gsap';

export class ScentSystem {
  private scene: THREE.Scene;
  private assets: LoadedAssets;
  private scentIndicators: Map<string, THREE.Group> = new Map();
  private truffleMeshes: Map<string, THREE.Group> = new Map();
  private activeScentIndicator: THREE.Group | null = null;

  constructor(scene: THREE.Scene, assets: LoadedAssets) {
    this.scene = scene;
    this.assets = assets;
  }

  public initializeScentSpots(spots: ScentSpot[]): void {
    // Clear existing
    this.clearAll();

    // Create hidden markers for each scent spot
    spots.forEach((spot) => {
      this.createScentSpot(spot);
    });
  }

  private createScentSpot(spot: ScentSpot): void {
    // Create a group for this scent spot
    const group = new THREE.Group();
    group.position.set(spot.position.x, 0.05, spot.position.z);
    group.visible = false;

    // Create scent cone/indicator (hidden by default)
    const coneGeometry = new THREE.ConeGeometry(
      GAME_SETTINGS.scent.spotRadius,
      0.5,
      32,
      1,
      true
    );
    const coneMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(COLORS.scent) },
        opacity: { value: 0.3 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          float alpha = opacity * (1.0 - vUv.y) * 0.5;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.rotation.x = Math.PI;
    group.add(cone);

    // Add glow ring at base
    const ringGeometry = new THREE.RingGeometry(
      GAME_SETTINGS.scent.spotRadius * 0.8,
      GAME_SETTINGS.scent.spotRadius,
      32
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.scent,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    this.scene.add(group);
    this.scentIndicators.set(spot.id, group);
  }

  public activateScentVisualization(spotId: string): void {
    const indicator = this.scentIndicators.get(spotId);
    if (!indicator) return;

    // Hide any previous active indicator
    if (this.activeScentIndicator && this.activeScentIndicator !== indicator) {
      this.activeScentIndicator.visible = false;
    }

    // Show and animate this indicator
    indicator.visible = true;
    this.activeScentIndicator = indicator;

    // Pulse animation
    const ring = indicator.children[1] as THREE.Mesh;
    if (ring) {
      gsap.to(ring.scale, {
        x: 1.3,
        y: 1.3,
        z: 1.3,
        duration: 0.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }

    // Rotate cone
    const cone = indicator.children[0];
    gsap.to(cone.rotation, {
      y: Math.PI * 2,
      duration: 3,
      ease: 'none',
      repeat: -1,
    });
  }

  public deactivateScentVisualization(): void {
    if (this.activeScentIndicator) {
      gsap.killTweensOf(this.activeScentIndicator.children);
      this.activeScentIndicator.visible = false;
      this.activeScentIndicator = null;
    }
  }

  public showTruffle(spotId: string, spot: ScentSpot): void {
    const indicator = this.scentIndicators.get(spotId);
    if (!indicator) return;

    // Hide the scent visualization
    indicator.visible = false;

    // Create truffle at position
    const truffle = (spot.truffleType === TruffleType.RARE
      ? this.assets.truffleRare
      : this.assets.truffleCommon
    )?.clone();

    if (truffle) {
      truffle.position.set(spot.position.x, 0, spot.position.z);
      truffle.scale.setScalar(0.5);
      this.scene.add(truffle);
      this.truffleMeshes.set(spotId, truffle);

      // Pop-up animation
      truffle.scale.setScalar(0);
      gsap.to(truffle.scale, {
        x: 0.5,
        y: 0.5,
        z: 0.5,
        duration: 0.3,
        ease: 'back.out(2)',
      });

      // Float up and collect animation
      gsap.timeline({ delay: 0.5 })
        .to(truffle.position, {
          y: 1.5,
          duration: 0.5,
          ease: 'power2.out',
        })
        .to(truffle.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            this.scene.remove(truffle);
            this.truffleMeshes.delete(spotId);
          },
        }, '-=0.2');
    }
  }

  public showNothingFound(spotId: string, spot: ScentSpot): void {
    const indicator = this.scentIndicators.get(spotId);
    if (!indicator) return;

    // Hide the scent visualization
    indicator.visible = false;

    // Show "dirt pile" or particle effect
    const dirtGeometry = new THREE.SphereGeometry(0.2, 8, 6);
    const dirtMaterial = new THREE.MeshToonMaterial({ color: COLORS.dirt.dark });
    const dirt = new THREE.Mesh(dirtGeometry, dirtMaterial);
    dirt.position.set(spot.position.x, 0.1, spot.position.z);
    dirt.scale.set(1, 0.5, 1);
    this.scene.add(dirt);

    // Fade out
    gsap.to(dirt.material, {
      opacity: 0,
      duration: 1,
      delay: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        this.scene.remove(dirt);
        dirtGeometry.dispose();
        dirtMaterial.dispose();
      },
    });
  }

  public updateIntensity(intensity: number): void {
    if (this.activeScentIndicator) {
      const ring = this.activeScentIndicator.children[1] as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshBasicMaterial
      >;
      if (ring && ring.material) {
        ring.material.opacity = 0.2 + intensity * 0.4;
      }
    }
  }

  private clearAll(): void {
    // Remove all scent indicators
    this.scentIndicators.forEach((indicator) => {
      gsap.killTweensOf(indicator.children);
      this.scene.remove(indicator);
    });
    this.scentIndicators.clear();

    // Remove all truffles
    this.truffleMeshes.forEach((truffle) => {
      this.scene.remove(truffle);
    });
    this.truffleMeshes.clear();

    this.activeScentIndicator = null;
  }

  public dispose(): void {
    this.clearAll();
  }
}
