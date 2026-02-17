// Color Palette - Cartoon Moderno
export const COLORS = {
  // Ambientazione bosco calda
  grass: {
    light: '#8BC34A',
    dark: '#7CB342',
  },
  dirt: {
    light: '#8D6E63',
    dark: '#5D4037',
  },
  sky: {
    top: '#87CEEB',
    horizon: '#F5DEB3',
  },

  // Cane Lagotto Romagnolo
  dog: {
    fur: '#C9A66B',
    furLight: '#E8D4B8',
    nose: '#3E2723',
  },

  // Accenti
  rare: '#4DB6AC',
  magic: '#CE93D8',
  scent: '#CE93D8',

  // UI
  buttonPrimary: '#558B2F',
  buttonSecondary: '#5D4037',
  buttonAction: '#FF6F00',
  text: '#FFFFFF',
  textDark: '#3E2723',
} as const;

// Game Settings
export const GAME_SETTINGS = {
  // Performance - Mobile-first
  lowEnd: {
    shadowMapSize: 512,
    pixelRatio: 1.5,
    antialias: false,
    treeCount: 30,
    fogNear: 20,
    fogFar: 60,
  },
  highEnd: {
    shadowMapSize: 1024,
    pixelRatio: 2,
    antialias: true,
    treeCount: 50,
    fogNear: 30,
    fogFar: 100,
  },

  // Dog settings
  dog: {
    moveSpeed: 3,
    rotationSpeed: 5,
    targetReachedThreshold: 0.5,
  },

  // Camera
  camera: {
    distance: 8,
    height: 6,
    angle: Math.PI / 4, // 45 degrees
    lerpSpeed: 0.1,
  },

  // Scent System
  scent: {
    maxDistance: 15,
    curiousThreshold: 10,
    convincedThreshold: 5,
    almostThreshold: 2,
    spotRadius: 1.5,
  },

  // Truffle drop rates
  truffle: {
    commonChance: 0.5,
    rareChance: 0.3,
    nothingChance: 0.2,
  },
} as const;

// Dog Emotional States
export enum DogState {
  NEUTRAL = 'neutral',
  CURIOUS = 'curious',
  CONVINCED = 'convinced',
  ALMOST = 'almost',
  CONFUSED = 'confused',
}

// Animation names for the dog
export const DOG_ANIMATIONS = {
  idle: 'idle',
  walk: 'walk',
  sniff: 'sniff',
  dig: 'dig',
  excited: 'excited',
  confused: 'confused',
} as const;

// Truffle types
export enum TruffleType {
  COMMON = 'common',
  RARE = 'rare',
  NOTHING = 'nothing',
}
