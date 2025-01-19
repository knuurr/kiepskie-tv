export interface OverlayConfig {
  bgWidth: number;
  bgHeight: number;
  maxWidth: number;
  maxHeight: number;
  padWidth: number;
  padHeight: number;
  offsetX: number;
  offsetY: number;
  overlayWidthPercent: number;
  overlayHeightPercent: number;
  bloomSettings: {
    padding: number;
    blur: number;
    intensity: number;
  };
  crtSettings: {
    k1: number;
    k2: number;
    curveScaleFactor: number;
    interpolation: string;
  };
  highlightSettings: {
    x: number;
    y: number;
    size: number;
    blur: number;
  };
}

export interface VideoSettings {
  id: string;
  fileName: string;
  settings: {
    addBoczek: boolean;
    addIntro: boolean;
    selectedBackground: string;
    boczekFillType: "stretch" | "black-padding" | "blur-padding";
    greenscreenFillType: "stretch" | "black-padding" | "blur-padding";
    boczekScale: number;
    greenscreenScale: number;
    scalesLocked: boolean;
    enableCRT: boolean;
    enableBloom: boolean;
    enableInterlaced: boolean;
    enableHighlight: boolean;
    enableRGB: boolean;
    bloomPadding: number;
    bloomBlur: number;
    bloomIntensity: number;
    paddingColor: string;
  };
} 
