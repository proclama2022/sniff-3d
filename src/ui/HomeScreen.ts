import { useGameStore } from '../state/gameStore';
import { COLORS } from '../constants';

export class HomeScreen {
  private container: HTMLDivElement;

  constructor() {
    this.container = this.createHomeScreen();
    document.getElementById('app')?.appendChild(this.container);
  }

  private createHomeScreen(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'home-screen';
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, ${COLORS.grass.dark} 0%, ${COLORS.dirt.dark} 100%);
      z-index: 50;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Sniff';
    title.style.cssText = `
      font-size: 4rem;
      color: white;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
      margin-bottom: 1rem;
    `;
    container.appendChild(title);

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Caccia ai tartufi nel bosco';
    subtitle.style.cssText = `
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 3rem;
    `;
    container.appendChild(subtitle);

    // Dog emoji
    const dogIcon = document.createElement('div');
    dogIcon.textContent = '🐕';
    dogIcon.style.cssText = `
      font-size: 5rem;
      margin-bottom: 2rem;
      animation: bounce 2s ease-in-out infinite;
    `;
    container.appendChild(dogIcon);

    // Start button
    const startButton = document.createElement('button');
    startButton.textContent = 'Entra nel bosco';
    startButton.style.cssText = `
      background: ${COLORS.buttonAction};
      color: white;
      border: none;
      padding: 18px 50px;
      font-size: 1.3rem;
      font-weight: bold;
      border-radius: 35px;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
      text-transform: uppercase;
      letter-spacing: 2px;
      transition: transform 0.2s, box-shadow 0.2s;
      -webkit-tap-highlight-color: transparent;
    `;

    startButton.addEventListener('click', () => {
      this.hide();
      useGameStore.getState().startGame();
    });

    startButton.addEventListener('touchstart', () => {
      startButton.style.transform = 'scale(0.95)';
    });
    startButton.addEventListener('touchend', () => {
      startButton.style.transform = 'scale(1)';
    });

    container.appendChild(startButton);

    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      position: absolute;
      bottom: max(40px, env(safe-area-inset-bottom));
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
    `;
    instructions.innerHTML = `
      <p>Tap sul terreno per muoverti</p>
      <p>Usa FIUTO per sentire i tartufi</p>
      <p>SCAVA quando sei vicino</p>
    `;
    container.appendChild(instructions);

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);

    return container;
  }

  public show(): void {
    this.container.style.display = 'flex';
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public dispose(): void {
    this.container.remove();
  }
}
