<!-- Dummy module for importing constans -->
<script context="module">
  // Default settings
  export const DEFAULT_SETTINGS = {
    addBoczek: true,
    addIntro: true,
    // addWatermark: true,
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
  export const FFMPEG_FILTER_ADD_BOCZEK =
    "[1:v]scale=768:576 [scaledv]; [0:v][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]";
  // x, y offets are still hardcoded
  export const FFMPEG_FILTER_ADD_GREENSCREEN =
    "[1:v]scale=w='min(iw,510)':h='min(ih,382)':force_original_aspect_ratio=decrease,pad=512:382:((512-iw)/2)+1:((382-ih)/2)+1:color=black[overlay];[0:v][overlay]overlay=x=140:y=94";
  export const FFMPEG_FILTER_ADD_WATERMARK =
    "[1][0]scale2ref=w=oh*mdar:h=ih*0.1[wm][vid];[vid][wm]overlay=W-w-10:H-h-10";
</script>
