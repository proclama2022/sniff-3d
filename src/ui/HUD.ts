import { useGameStore } from '../state/gameStore';
import { COLORS, DogState } from '../constants';

export class HUD {
  private container: HTMLDivElement;
  private fiutoButton: HTMLButtonElement | null = null;
  private scavaButton: HTMLButtonElement | null = null;
  private truffleCounter: HTMLDivElement | null = null;
  private stateIndicator: HTMLDivElement | null = null;

  constructor() {
    this.container = this.createContainer();
    this.createUI();
    this.setupSubscriptions();
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'hud';
    container.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 20px;
      padding-bottom: max(20px, env(safe-area-inset-bottom));
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
      pointer-events: none;
    `;
    document.getElementById('app')?.appendChild(container);
    return container;
  }

  private createUI(): void {
    // State indicator (dog's emotional state)
    this.stateIndicator = document.createElement('div');
    this.stateIndicator.style.cssText = `
      background: rgba(0, 0, 0, 0.5);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    this.container.appendChild(this.stateIndicator);

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 15px;
      justify-content: center;
      width: 100%;
      max-width: 400px;
    `;
    this.container.appendChild(buttonContainer);

    // FIUTO button
    this.fiutoButton = this.createButton('FIUTO', COLORS.buttonPrimary, () => {
      const store = useGameStore.getState();
      const nearestSpot = store.nearestScentSpot;
      if (nearestSpot) {
        store.setScentActive(true);
        store.setDogSniffing(true);
      }
    });
    this.fiutoButton.style.opacity = '0';
    this.fiutoButton.style.pointerEvents = 'none';
    buttonContainer.appendChild(this.fiutoButton);

    // SCAVA button
    this.scavaButton = this.createButton('SCAVA', COLORS.buttonAction, () => {
      this.handleDig();
    });
    this.scavaButton.style.opacity = '0';
    this.scavaButton.style.pointerEvents = 'none';
    buttonContainer.appendChild(this.scavaButton);

    // Truffle counter (top right)
    this.truffleCounter = document.createElement('div');
    this.truffleCounter.style.cssText = `
      position: absolute;
      top: max(20px, env(safe-area-inset-top));
      right: 20px;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      padding: 10px 15px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    this.truffleCounter.innerHTML = `
      <span style="font-size: 20px;">🍄</span>
      <span id="truffle-count">0</span>
    `;
    document.getElementById('app')?.appendChild(this.truffleCounter);
  }

  private createButton(
    text: string,
    bgColor: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      background: ${bgColor};
      color: white;
      border: none;
      padding: 15px 40px;
      font-size: 18px;
      font-weight: bold;
      border-radius: 30px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      text-transform: uppercase;
      letter-spacing: 2px;
      transition: transform 0.2s, box-shadow 0.2s, opacity 0.3s;
      pointer-events: auto;
      -webkit-tap-highlight-color: transparent;
    `;

    // Touch feedback
    button.addEventListener('touchstart', () => {
      button.style.transform = 'scale(0.95)';
    });
    button.addEventListener('touchend', () => {
      button.style.transform = 'scale(1)';
    });
    button.addEventListener('click', onClick);

    return button;
  }

  private handleDig(): void {
    const store = useGameStore.getState();
    if (!store.isDigAvailable || store.dogIsDigging) return;

    store.setDogDigging(true);
  }

  private setupSubscriptions(): void {
    // Subscribe to store changes
    useGameStore.subscribe((state, prevState) => {
      // Update state indicator
      if (state.dogEmotionalState !== prevState.dogEmotionalState) {
        this.updateStateIndicator(state.dogEmotionalState);
      }

      // Update FIUTO button visibility
      if (state.scentIntensity !== prevState.scentIntensity) {
        this.updateFiutoButton(state.scentIntensity > 0.3);
      }

      // Update SCAVA button visibility
      if (state.isDigAvailable !== prevState.isDigAvailable) {
        this.updateScavaButton(state.isDigAvailable);
      }

      // Update truffle counter
      if (state.collectedTruffles.length !== prevState.collectedTruffles.length) {
        this.updateTruffleCounter(state.collectedTruffles.length);
      }

      // Handle phase changes
      if (state.phase !== prevState.phase) {
        this.handlePhaseChange(state.phase);
      }
    });
  }

  private updateStateIndicator(state: DogState): void {
    if (!this.stateIndicator) return;

    const labels: Record<DogState, string> = {
      [DogState.NEUTRAL]: '',
      [DogState.CURIOUS]: '🤔 Curioso',
      [DogState.CONVINCED]: '🎯 Convinto',
      [DogState.ALMOST]: '🔥 Quasi!',
      [DogState.CONFUSED]: '😕 Confuso',
    };

    const label = labels[state];
    if (label) {
      this.stateIndicator.textContent = label;
      this.stateIndicator.style.opacity = '1';
    } else {
      this.stateIndicator.style.opacity = '0';
    }
  }

  private updateFiutoButton(visible: boolean): void {
    if (!this.fiutoButton) return;

    if (visible) {
      this.fiutoButton.style.opacity = '1';
      this.fiutoButton.style.pointerEvents = 'auto';
    } else {
      this.fiutoButton.style.opacity = '0';
      this.fiutoButton.style.pointerEvents = 'none';
    }
  }

  private updateScavaButton(visible: boolean): void {
    if (!this.scavaButton) return;

    if (visible) {
      this.scavaButton.style.opacity = '1';
      this.scavaButton.style.pointerEvents = 'auto';
      // Pulse animation
      this.scavaButton.style.animation = 'pulse 0.5s ease infinite';
    } else {
      this.scavaButton.style.opacity = '0';
      this.scavaButton.style.pointerEvents = 'none';
      this.scavaButton.style.animation = 'none';
    }
  }

  private updateTruffleCounter(count: number): void {
    const countElement = document.getElementById('truffle-count');
    if (countElement) {
      countElement.textContent = count.toString();
      // Pop animation
      countElement.style.transform = 'scale(1.3)';
      setTimeout(() => {
        countElement.style.transform = 'scale(1)';
      }, 200);
    }
  }

  private handlePhaseChange(phase: string): void {
    if (phase === 'playing') {
      this.container.style.display = 'flex';
    } else {
      this.container.style.display = 'none';
    }
  }

  public show(): void {
    this.container.style.display = 'flex';
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public dispose(): void {
    this.container.remove();
    this.truffleCounter?.remove();
  }
}
