import * as THREE from 'three';
import { useGameStore } from '../state/gameStore';

export class InputManager {
  private canvas: HTMLCanvasElement;
  private camera: THREE.Camera;
  private raycaster: THREE.Raycaster;
  private groundPlane: THREE.Plane;
  private touchStartPos: { x: number; y: number } | null = null;
  private isDragging: boolean = false;
  private dragThreshold: number = 10; // pixels

  constructor(canvas: HTMLCanvasElement, camera: THREE.Camera) {
    this.canvas = canvas;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: false,
    });

    // Mouse events (for desktop testing)
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.touchStartPos = { x: touch.clientX, y: touch.clientY };
      this.isDragging = false;
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 1 && this.touchStartPos) {
      const touch = event.touches[0];
      const dx = touch.clientX - this.touchStartPos.x;
      const dy = touch.clientY - this.touchStartPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.dragThreshold) {
        this.isDragging = true;
        // Could handle camera orbit here
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDragging && event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      this.processInput(touch.clientX, touch.clientY);
    }
    this.touchStartPos = null;
    this.isDragging = false;
  }

  private handleMouseDown(event: MouseEvent): void {
    this.touchStartPos = { x: event.clientX, y: event.clientY };
    this.isDragging = false;
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.touchStartPos) {
      const dx = event.clientX - this.touchStartPos.x;
      const dy = event.clientY - this.touchStartPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > this.dragThreshold) {
        this.isDragging = true;
      }
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.isDragging && this.touchStartPos) {
      this.processInput(event.clientX, event.clientY);
    }
    this.touchStartPos = null;
    this.isDragging = false;
  }

  private processInput(clientX: number, clientY: number): void {
    // Convert screen coordinates to normalized device coordinates (-1 to +1)
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast from camera through the click point
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    // Find intersection with ground plane
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, intersection);

    if (intersection) {
      // Set dog target
      useGameStore.getState().setDogTarget({
        x: intersection.x,
        z: intersection.z,
      });
    }
  }

  public dispose(): void {
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }
}
