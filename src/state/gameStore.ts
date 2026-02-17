import { create } from 'zustand';
import { DogState, TruffleType } from '../constants';

export interface ScentSpot {
  id: string;
  position: { x: number; z: number };
  truffleType: TruffleType;
  discovered: boolean;
  dug: boolean;
}

export interface CollectedTruffle {
  type: TruffleType;
  timestamp: number;
}

interface GameState {
  // Game phase
  phase: 'home' | 'playing' | 'results';
  isLoading: boolean;

  // Dog state
  dogPosition: { x: number; y: number; z: number };
  dogTarget: { x: number; z: number } | null;
  dogEmotionalState: DogState;
  dogIsMoving: boolean;
  dogIsSniffing: boolean;
  dogIsDigging: boolean;

  // Scent system
  scentSpots: ScentSpot[];
  nearestScentSpot: ScentSpot | null;
  scentIntensity: number; // 0-1 based on distance to nearest spot
  isScentActive: boolean; // FIUTO button active

  // Gameplay
  collectedTruffles: CollectedTruffle[];
  isDigAvailable: boolean; // SCAVA button visible

  // Actions
  setPhase: (phase: 'home' | 'playing' | 'results') => void;
  setLoading: (loading: boolean) => void;

  setDogPosition: (pos: { x: number; y: number; z: number }) => void;
  setDogTarget: (target: { x: number; z: number } | null) => void;
  setDogEmotionalState: (state: DogState) => void;
  setDogMoving: (moving: boolean) => void;
  setDogSniffing: (sniffing: boolean) => void;
  setDogDigging: (digging: boolean) => void;

  setScentSpots: (spots: ScentSpot[]) => void;
  updateNearestScentSpot: () => void;
  setScentIntensity: (intensity: number) => void;
  setScentActive: (active: boolean) => void;

  setDigAvailable: (available: boolean) => void;
  collectTruffle: (type: TruffleType) => void;
  digAtNearestSpot: () => TruffleType | null;

  // Game flow
  startGame: () => void;
  endGame: () => void;
  resetGame: () => void;
}

const generateScentSpots = (count: number, areaSize: number): ScentSpot[] => {
  const spots: ScentSpot[] = [];
  const types = [TruffleType.COMMON, TruffleType.RARE, TruffleType.NOTHING];
  const weights = [0.5, 0.3, 0.2];

  for (let i = 0; i < count; i++) {
    // Weighted random selection
    const rand = Math.random();
    let type = TruffleType.COMMON;
    let cumulative = 0;
    for (let j = 0; j < types.length; j++) {
      cumulative += weights[j];
      if (rand < cumulative) {
        type = types[j];
        break;
      }
    }

    spots.push({
      id: `scent-${i}`,
      position: {
        x: (Math.random() - 0.5) * areaSize,
        z: (Math.random() - 0.5) * areaSize,
      },
      truffleType: type,
      discovered: false,
      dug: false,
    });
  }

  return spots;
};

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  phase: 'home',
  isLoading: true,

  dogPosition: { x: 0, y: 0, z: 0 },
  dogTarget: null,
  dogEmotionalState: DogState.NEUTRAL,
  dogIsMoving: false,
  dogIsSniffing: false,
  dogIsDigging: false,

  scentSpots: [],
  nearestScentSpot: null,
  scentIntensity: 0,
  isScentActive: false,

  collectedTruffles: [],
  isDigAvailable: false,

  // Actions
  setPhase: (phase) => set({ phase }),
  setLoading: (isLoading) => set({ isLoading }),

  setDogPosition: (pos) => {
    set({ dogPosition: pos });
    get().updateNearestScentSpot();
  },
  setDogTarget: (target) => set({ dogTarget: target }),
  setDogEmotionalState: (state) => set({ dogEmotionalState: state }),
  setDogMoving: (moving) => set({ dogIsMoving: moving }),
  setDogSniffing: (sniffing) => set({ dogIsSniffing: sniffing }),
  setDogDigging: (digging) => set({ dogIsDigging: digging }),

  setScentSpots: (spots) => set({ scentSpots: spots }),

  updateNearestScentSpot: () => {
    const { dogPosition, scentSpots } = get();
    if (scentSpots.length === 0) return;

    let nearest: ScentSpot | null = null;
    let minDistance = Infinity;

    for (const spot of scentSpots) {
      if (spot.dug) continue;

      const dx = dogPosition.x - spot.position.x;
      const dz = dogPosition.z - spot.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = spot;
      }
    }

    // Calculate intensity (inverse of distance, normalized)
    const maxDist = 15; // GAME_SETTINGS.scent.maxDistance
    const intensity = nearest ? Math.max(0, 1 - minDistance / maxDist) : 0;

    // Determine dog state based on distance
    let dogState = DogState.NEUTRAL;
    if (nearest) {
      if (minDistance < 2) {
        dogState = DogState.ALMOST;
      } else if (minDistance < 5) {
        dogState = DogState.CONVINCED;
      } else if (minDistance < 10) {
        dogState = DogState.CURIOUS;
      }
    }

    // Dig available when very close
    const isDigAvailable = nearest !== null && minDistance < 2;

    set({
      nearestScentSpot: nearest,
      scentIntensity: intensity,
      dogEmotionalState: dogState,
      isDigAvailable,
    });
  },

  setScentIntensity: (intensity) => set({ scentIntensity: intensity }),
  setScentActive: (active) => set({ isScentActive: active }),

  setDigAvailable: (available) => set({ isDigAvailable: available }),

  collectTruffle: (type) => {
    set((state) => ({
      collectedTruffles: [
        ...state.collectedTruffles,
        { type, timestamp: Date.now() },
      ],
    }));
  },

  digAtNearestSpot: () => {
    const { nearestScentSpot, scentSpots } = get();
    if (!nearestScentSpot || nearestScentSpot.dug) return null;

    // Mark as dug
    const updatedSpots = scentSpots.map((spot) =>
      spot.id === nearestScentSpot.id ? { ...spot, dug: true } : spot
    );

    set({
      scentSpots: updatedSpots,
      nearestScentSpot: null,
      isDigAvailable: false,
    });

    // Collect truffle
    get().collectTruffle(nearestScentSpot.truffleType);

    return nearestScentSpot.truffleType;
  },

  // Game flow
  startGame: () => {
    const spots = generateScentSpots(8, 30);
    set({
      phase: 'playing',
      scentSpots: spots,
      dogPosition: { x: 0, y: 0, z: 0 },
      dogTarget: null,
      dogEmotionalState: DogState.NEUTRAL,
      collectedTruffles: [],
      isDigAvailable: false,
      isScentActive: false,
    });
  },

  endGame: () => set({ phase: 'results' }),

  resetGame: () =>
    set({
      phase: 'home',
      dogPosition: { x: 0, y: 0, z: 0 },
      dogTarget: null,
      dogEmotionalState: DogState.NEUTRAL,
      scentSpots: [],
      nearestScentSpot: null,
      collectedTruffles: [],
      isDigAvailable: false,
    }),
}));
