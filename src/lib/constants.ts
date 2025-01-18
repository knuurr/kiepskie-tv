// Feature flags
export const FEATURES = {
  ENABLE_SCALE_CONTROLS: false, // Set to true to enable scale controls in UI
} as const;

export const DEFAULT_SETTINGS = {
  addBoczek: true,
  addIntro: false,
  selectedBackground: "okil-1",
  boczekFillType: 'black-padding',
  greenscreenFillType: 'black-padding',
  boczekScale: 1.0,
  greenscreenScale: FEATURES.ENABLE_SCALE_CONTROLS ? 1.0 : 0.97,
  scalesLocked: false
} as const; 