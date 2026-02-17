# Sniff 3D

Un gioco di caccia ai tartufi in 3D con stile cartoon moderno, costruito con Three.js.

## Caratteristiche

- 🎮 **Mobile-first**: Ottimizzato per dispositivi mobili
- 🎨 **Stile Cartoon**: MeshToonMaterial con gradiente 4-step
- 🐕 **Cane Animato**: Lagotto Romagnolo low-poly con stati emotivi
- 🌲 **Bosco Procedurale**: Alberi e terreno generati proceduralmente
- 👃 **Sistema Fiuto**: Meccanica di ricerca tartufi con indizi visivi
- ⛏️ **Meccanica Scavo**: Raccogli tartufi quando sei vicino al punto giusto

## Stack Tecnologico

- **Three.js r160+** - 3D Engine
- **Vite 5.x** - Build Tool
- **TypeScript 5.x** - Type Safety
- **Zustand** - State Management
- **GSAP** - Animazioni UI
- **Howler.js** - Audio (da implementare)

## Avvio

```bash
# Installa dipendenze
npm install

# Avvia in sviluppo
npm run dev

# Build per produzione
npm run build

# Anteprima build
npm run preview
```

## Struttura Progetto

```
src/
├── main.ts              # Entry point
├── constants.ts         # Colori, settings, enums
├── core/
│   ├── Game.ts          # Game loop principale
│   ├── AssetLoader.ts   # Caricamento asset
│   └── InputManager.ts  # Touch/mouse input
├── entities/
│   └── Dog.ts           # Entità cane con animazioni
├── systems/
│   ├── ScentSystem.ts   # Sistema fiuto/visualizzazione
│   ├── DogBehaviorSystem.ts
│   └── GameStateMachine.ts
├── world/
│   └── ForestWorld.ts   # Ambiente bosco 3D
├── ui/
│   ├── HUD.ts           # Pulsanti FIUTO/SCAVA
│   ├── HomeScreen.ts    # Schermata iniziale
│   └── ResultModal.ts   # Modal risultati
└── state/
    └── gameStore.ts     # Zustand store
```

## Come Giocare

1. **Entra nel bosco** dalla home screen
2. **Tap sul terreno** per muovere il cane
3. **Avvicinati** alle aree dove il cane diventa curioso
4. **Premi FIUTO** per visualizzare la zona del tartufo
5. **Premi SCAVA** quando sei molto vicino per raccogliere

## Fasi di Sviluppo

- [x] Fase 1: Fondamenta (setup progetto, toon shading)
- [ ] Fase 2: Cane (modello 3D, animazioni, state machine)
- [ ] Fase 3: Ambiente & Esplorazione (texture AI, terreno, alberi)
- [ ] Fase 4: Gameplay Core (scent system, scavo, raccolta)
- [ ] Fase 5: UI & Audio (HUD, effetti sonori)
- [ ] Fase 6: Polish & Deploy (ottimizzazione, PWA)

## Prossimi Passi

1. Sostituire modello cane procedurale con modello GLTF da Blender
2. Generare texture erba/terra con AI (Runware MCP)
3. Implementare sistema audio con Howler.js
4. Ottimizzazione performance mobile
5. PWA setup per installabilità

## Palette Colori

```typescript
erba: '#558B2F' → '#7CB342'
terra: '#5D4037' → '#8D6E63'
cielo: '#87CEEB' → '#F5DEB3'
pelo_cane: '#C9A66B' → '#E8D4B8'
raro: '#4DB6AC'
magia: '#CE93D8'
```

## Licenza

MIT
