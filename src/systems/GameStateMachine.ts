import { useGameStore } from '../state/gameStore';

export enum GamePhase {
  HOME = 'home',
  PLAYING = 'playing',
  RESULTS = 'results',
}

export class GameStateMachine {
  private currentPhase: GamePhase = GamePhase.HOME;

  constructor() {
    useGameStore.subscribe((state) => {
      this.currentPhase = state.phase as GamePhase;
    });
  }

  getCurrentPhase(): GamePhase {
    return this.currentPhase;
  }

  transitionTo(phase: GamePhase): void {
    const store = useGameStore.getState();

    switch (phase) {
      case GamePhase.HOME:
        store.resetGame();
        break;
      case GamePhase.PLAYING:
        store.startGame();
        break;
      case GamePhase.RESULTS:
        store.endGame();
        break;
    }
  }

  dispose(): void {
    // Cleanup
  }
}
