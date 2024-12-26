export interface VideoSettings {
  id: string;
  fileName: string;
  settings: {
    addBoczek: boolean;
    addIntro: boolean;
    selectedBackground: string;
    boczekFillType: 'stretch' | 'blur-padding';
  };
} 