import { useGameStore } from '../state/gameStore';
import { DogState, GAME_SETTINGS } from '../constants';

/**
 * DogBehaviorSystem manages the dog's emotional state transitions
 * based on distance to scent spots and player actions.
 */
export class DogBehaviorSystem {
  private lastState: DogState = DogState.NEUTRAL;
  private stateTimer: number = 0;

  constructor() {
    // The actual state updates are handled in gameStore.updateNearestScentSpot()
  }

  update(deltaTime: number): void {
    const store = useGameStore.getState();
    const currentState = store.dogEmotionalState;

    // Track state duration
    if (currentState !== this.lastState) {
      this.stateTimer = 0;
      this.lastState = currentState;
      this.onStateChange(this.lastState, currentState);
    } else {
      this.stateTimer += deltaTime;
    }
  }

  private onStateChange(from: DogState, to: DogState): void {
    console.log(`Dog state: ${from} -> ${to}`);
  }

  static calculateState(distance: number): DogState {
    const { curiousThreshold, convincedThreshold, almostThreshold } = GAME_SETTINGS.scent;

    if (distance < almostThreshold) {
      return DogState.ALMOST;
    } else if (distance < convincedThreshold) {
      return DogState.CONVINCED;
    } else if (distance < curiousThreshold) {
      return DogState.CURIOUS;
    }

    return DogState.NEUTRAL;
  }

  static shouldShowDig(distance: number): boolean {
    return distance < GAME_SETTINGS.scent.almostThreshold;
  }

  dispose(): void {
    // Cleanup if needed
  }
}
