import CRTEffectsHelp from '../../components/tiwi/help/CRTEffectsHelp.svelte';
import BoczekFillHelp from '../../components/tiwi/help/BoczekFillHelp.svelte';
import VideoScaleHelp from '../../components/tiwi/help/VideoScaleHelp.svelte';
import GreenscreenFillHelp from '../../components/tiwi/help/GreenscreenFillHelp.svelte';

export const HELP_CONTENT = {
  CRT_EFFECTS: {
    title: "Efekty CRT",
    component: CRTEffectsHelp
  },
  BOCZEK_FILL: {
    title: "Tryb dopasowania Boczka",
    component: BoczekFillHelp
  },
  VIDEO_SCALE: {
    title: "Grubość ramki",
    component: VideoScaleHelp
  },
  GREENSCREEN_FILL: {
    title: "Tryb dopasowania do tła",
    component: GreenscreenFillHelp
  }
} as const; 