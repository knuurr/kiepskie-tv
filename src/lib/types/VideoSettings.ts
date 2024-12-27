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
  };
} 