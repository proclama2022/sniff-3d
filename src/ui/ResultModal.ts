import { useGameStore } from '../state/gameStore';
import { COLORS, TruffleType } from '../constants';

export class ResultModal {
  private container: HTMLDivElement | null = null;

  constructor() {
    this.setupSubscription();
  }

  private setupSubscription(): void {
    useGameStore.subscribe((state, prevState) => {
      if (state.phase === 'results' && prevState.phase !== 'results') {
        this.show(state.collectedTruffles);
      }
    });
  }

  private show(collected: { type: TruffleType; timestamp: number }[]): void {
    this.container = document.createElement('div');
    this.container.id = 'result-modal';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.7);
      z-index: 100;
    `;

    // Content card
    const card = document.createElement('div');
    card.style.cssText = `
      background: white;
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      max-width: 90%;
      width: 350px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Fine giornata! 🌲';
    title.style.cssText = `
      font-size: 1.8rem;
      color: ${COLORS.textDark};
      margin-bottom: 20px;
    `;
    card.appendChild(title);

    // Count truffles by type
    const common = collected.filter((t) => t.type === TruffleType.COMMON).length;
    const rare = collected.filter((t) => t.type === TruffleType.RARE).length;
    const total = collected.length;

    // Stats
    const stats = document.createElement('div');
    stats.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-bottom: 30px;
    `;

    // Common truffles
    const commonStat = this.createStatRow('🍄 Tartufi comuni', common, COLORS.dirt.dark);
    stats.appendChild(commonStat);

    // Rare truffles
    const rareStat = this.createStatRow('💎 Tartufi rari', rare, COLORS.rare);
    stats.appendChild(rareStat);

    // Total
    const totalStat = this.createStatRow('📦 Totale', total, COLORS.buttonPrimary);
    stats.appendChild(totalStat);

    card.appendChild(stats);

    // Play again button
    const playAgainButton = document.createElement('button');
    playAgainButton.textContent = 'Rigioca';
    playAgainButton.style.cssText = `
      background: ${COLORS.buttonAction};
      color: white;
      border: none;
      padding: 15px 40px;
      font-size: 1.1rem;
      font-weight: bold;
      border-radius: 25px;
      cursor: pointer;
      width: 100%;
      transition: transform 0.2s;
    `;

    playAgainButton.addEventListener('click', () => {
      this.hide();
      useGameStore.getState().resetGame();
      useGameStore.getState().startGame();
    });

    card.appendChild(playAgainButton);

    // Home button
    const homeButton = document.createElement('button');
    homeButton.textContent = 'Home';
    homeButton.style.cssText = `
      background: transparent;
      color: ${COLORS.textDark};
      border: none;
      padding: 12px 30px;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 10px;
      opacity: 0.7;
    `;

    homeButton.addEventListener('click', () => {
      this.hide();
      useGameStore.getState().resetGame();
    });

    card.appendChild(homeButton);

    this.container.appendChild(card);
    document.getElementById('app')?.appendChild(this.container);

    // Animate in
    card.style.opacity = '0';
    card.style.transform = 'scale(0.9)';
    requestAnimationFrame(() => {
      card.style.transition = 'all 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'scale(1)';
    });
  }

  private createStatRow(
    label: string,
    count: number,
    color: string
  ): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 10px;
    `;

    const labelText = document.createElement('span');
    labelText.textContent = label;
    labelText.style.color = COLORS.textDark;
    row.appendChild(labelText);

    const countBadge = document.createElement('span');
    countBadge.textContent = count.toString();
    countBadge.style.cssText = `
      background: ${color};
      color: white;
      padding: 5px 15px;
      border-radius: 15px;
      font-weight: bold;
      font-size: 1.1rem;
    `;
    row.appendChild(countBadge);

    return row;
  }

  private hide(): void {
    if (this.container) {
      this.container.style.opacity = '0';
      setTimeout(() => {
        this.container?.remove();
        this.container = null;
      }, 300);
    }
  }

  public dispose(): void {
    this.container?.remove();
  }
}
