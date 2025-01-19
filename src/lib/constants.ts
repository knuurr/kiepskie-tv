// Feature flags
export const FEATURES = {
  ENABLE_SCALE_CONTROLS: false, // Set to true to enable scale controls in UI
  ENABLE_HIGHLIGHT: false, // Set to true to enable highlight effect in UI
  ENABLE_RGB: true, // Set to true to enable RGB effect in UI
} as const;

// Greenscreen scale presets
export const GREENSCREEN_SCALE_PRESETS = {
  NONE: { value: 1.0, label: "Brak skalowania" },
  SLIGHT: { value: 0.99, label: "Delikatne skalowanie" },
  THICK: { value: 0.97, label: "Mocne skalowanie" },
} as const;

export const DEFAULT_SETTINGS = {
  addBoczek: true,
  addIntro: false,
  selectedBackground: "okil-1",
  boczekFillType: 'black-padding',
  greenscreenFillType: 'black-padding',
  boczekScale: 1.0,
  greenscreenScale: GREENSCREEN_SCALE_PRESETS.SLIGHT.value,
  scalesLocked: false,
  enableCRT: false,
  enableBloom: false,
  enableInterlaced: false,
  enableHighlight: false,
  enableRGB: true,
  bloomPadding: 50,
  bloomBlur: 20,
  bloomIntensity: 1.2,
  paddingColor: "0x000000FF"
} as const; 