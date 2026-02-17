import { Game } from './core/Game';

async function main() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const game = new Game(canvas);

  try {
    await game.init();
  } catch (error) {
    console.error('Failed to initialize game:', error);

    // Show error message
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = `
        <h1 style="color: white;">Errore</h1>
        <p style="color: white; margin-top: 1rem;">
          Impossibile caricare il gioco. Ricarica la pagina.
        </p>
      `;
    }
  }

  // Handle visibility change for pause/resume
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Could pause game here
    } else {
      // Could resume game here
    }
  });

  // Prevent context menu on long press (mobile)
  window.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Start the game
main();
