// Feature flags
export const FEATURES = {
  ENABLE_SCALE_CONTROLS: false, // Set to true to enable scale controls in UI
  ENABLE_HIGHLIGHT: false, // Set to true to enable highlight effect in UI
  ENABLE_RGB: false, // Set to true to enable RGB filter as one of options in /tiwi
  ENABLE_DONATION_POPUP: true, // Set to true to enable donation popup
  DEBUG_FORCE_DONATION: true, // Set to true to force donation popup to show every time
} as const;

// Greenscreen scale presets
export const GREENSCREEN_SCALE_PRESETS = {
  NONE: { value: 1.0, label: "Brak ramki" },
  SLIGHT: { value: 0.99, label: "Delikatna ramka" },
  THICK: { value: 0.97, label: "Gruba ramka" },
} as const;

export const DEFAULT_SETTINGS = {
  addBoczek: false,
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
  enableRGB: FEATURES.ENABLE_RGB ? true : false,
  bloomPadding: 50,
  bloomBlur: 20,
  bloomIntensity: 1.2,
  paddingColor: "0x141414FF"
} as const; 