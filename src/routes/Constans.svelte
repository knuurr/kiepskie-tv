<!-- Dummy module for importing constans -->
<script context="module" lang="ts">
  // Default settings
  export const DEFAULT_SETTINGS = {
    addBoczek: true,
    addIntro: true,
    selectedBackground: "okil-1",
  };

  // Names
  export const NAME_GREENSCREEN_PNG = "greenscreen.png";
  export const NAME_TEMP_OUTPUT = "output_temp";
  export const NAME_TEMP_OUTPUT_FORMAT = ".mp4";
  export const NAME_TEMPLATE_VIDEO = "video.mp4";
  export const NAME_INTRO_AUDIO = "intro.mp3";
  export const NAME_WATERMARK = "watermark.png";
  export const APP_TITLE2 = "📺 Kiepskie TV";
  export const APP_TITLE = "Kiepskie TV 🍻";
  export const APP_DESC =
    "Zobacz swoje wideo oczami Ferdka z zapierdziałego fotela";

  // Paths
  export const PATH_TEMPLATE_VIDEO = "/video.mp4";
  export const PATH_GREENSCREEN_PNG = "/greenscreen.png";
  export const PATH_BACKGROUNDS_JSON = "/tiwi/backgrounds.json";
  // URLs
  export const GH_BASE_URL = "https://github.com/knuurr";
  export const GH_REPO_URL = "?tab=repositories";
  export const GH_PROJECT_URL = "/kiepskie-tv";
  export const GH_ISSUE_URL = "/kiepskie-tv/issues";
  export const LI_URL = "https://www.linkedin.com/in/jakub-mikos/";
  export const EXAMPLE_URL = "/example.webm";

  //   FFmpeg presets
  export const FFMPEG_FILTER_ADD_INTRO =
    "[1:a]adelay=0|0[a1];[0:a][a1]amix=inputs=2";

  // Internal settings
  const BOCZEK_VERTICAL_SCALE: number = 0.8; // 80% of the height, adjust between 0-1

  export function generateBoczekFilter(
    imageWidth: number,
    imageHeight: number,
    fillType: "stretch" | "blur-padding" | "black-padding" = "stretch",
  ) {
    if (fillType === "stretch") {
      return `[0:v]scale=${imageWidth}:${imageHeight},setsar=1[mainv];[1:v]scale=${imageWidth}:${imageHeight},setsar=1[scaledv];[mainv][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]`;
    } else {
      // Calculate scaled height based on BOCZEK_VERTICAL_SCALE
      const scaledHeight = Math.round(imageHeight * BOCZEK_VERTICAL_SCALE);

      if (fillType === "blur-padding") {
        // Taken from: https://stackoverflow.com/questions/30789367/ffmpeg-how-to-convert-vertical-video-with-black-sides-to-video-169-with-blur
        return `[0:v]scale=${imageWidth}:${imageHeight},setsar=1[mainv];[1:v]split[toScale][toBlur];[toScale]scale=${imageWidth}:${scaledHeight}:force_original_aspect_ratio=decrease,setsar=1[scaled];[toBlur]scale=32:18,gblur=sigma=2,scale=${imageWidth}:${imageHeight},setsar=1[blurred];[blurred][scaled]overlay=(W-w)/2:(H-h)/2,setsar=1[scaledv];[mainv][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]`;
      } else {
        // Black padding - scale video and pad with black
        return `[0:v]scale=${imageWidth}:${imageHeight},setsar=1[mainv];[1:v]scale=${imageWidth}:${scaledHeight}:force_original_aspect_ratio=decrease,pad=${imageWidth}:${imageHeight}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[scaledv];[mainv][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]`;
      }
    }
  }

  export function generateGreenscreenFilter(config: any) {
    return `[1:v]scale=w='min(iw,${config.maxWidth})':h='min(ih,${config.maxHeight})':force_original_aspect_ratio=decrease,pad=${config.padWidth}:${config.padHeight}:((${config.padWidth}-iw)/2)+1:((${config.padHeight}-ih)/2)+1:color=black[overlay];[0:v][overlay]overlay=x=${config.offsetX}:y=${config.offsetY}`;
  }

  // Default greenscreen filter (for backward compatibility)
  // TODO: Remove this
  export const FFMPEG_FILTER_ADD_GREENSCREEN = generateGreenscreenFilter({
    maxWidth: 510,
    maxHeight: 382,
    padWidth: 512,
    padHeight: 382,
    offsetX: 140,
    offsetY: 94,
  });

  export const FFMPEG_FILTER_ADD_WATERMARK =
    "[1][0]scale2ref=w=oh*mdar:h=ih*0.1[wm][vid];[vid][wm]overlay=W-w-10:H-h-10";
</script>
