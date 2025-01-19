<!-- Dummy module for importing constans -->
<script context="module" lang="ts">
  // Default settings
  export const DEFAULT_SETTINGS = {
    addBoczek: false,
    addIntro: false,
    selectedBackground: "okil-1",
    boczekScale: 0.8,
    greenscreenScale: 0.8,
    scalesLocked: false,
    enableCRT: false,
    enableBloom: false,
    enableInterlaced: false,
    enableHighlight: false,
    bloomSettings: {
      padding: 50,
      blur: 20,
      intensity: 1.2,
    },
    crtSettings: {
      k1: 0.03,
      k2: 0.05,
      curveScaleFactor: 1.05,
      interpolation: "bilinear",
    },
    highlightSettings: {
      x: 80,
      y: 60,
      size: 90,
      blur: 7,
    },
    paddingColor: "0x000000FF",
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

  export function generateBoczekFilter(
    imageWidth: number,
    imageHeight: number,
    fillType: "stretch" | "blur-padding" | "black-padding" = "stretch",
    scale: number = 0.8,
  ) {
    if (fillType === "stretch") {
      return `[0:v]scale=${imageWidth}:${imageHeight},setsar=1[mainv];[1:v]scale=${imageWidth}:${imageHeight},setsar=1[scaledv];[mainv][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]`;
    } else {
      // Calculate scaled height based on scale parameter
      const scaledHeight = Math.round(imageHeight * scale);

      if (fillType === "blur-padding") {
        // Taken from: https://stackoverflow.com/questions/30789367/ffmpeg-how-to-convert-vertical-video-with-black-sides-to-video-169-with-blur
        return `[0:v]scale=${imageWidth}:${imageHeight},setsar=1[mainv];[1:v]split[toScale][toBlur];[toScale]scale=${imageWidth}:${scaledHeight}:force_original_aspect_ratio=decrease,setsar=1[scaled];[toBlur]scale=32:18,gblur=sigma=2,scale=${imageWidth}:${imageHeight},setsar=1[blurred];[blurred][scaled]overlay=(W-w)/2:(H-h)/2,setsar=1[scaledv];[mainv][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]`;
      } else {
        // Black padding - scale video and pad with black
        return `[0:v]scale=${imageWidth}:${imageHeight},setsar=1[mainv];[1:v]scale=${imageWidth}:${scaledHeight}:force_original_aspect_ratio=decrease,pad=${imageWidth}:${imageHeight}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1[scaledv];[mainv][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]`;
      }
    }
  }

  export function generateGreenscreenFilter(
    config: {
      maxWidth: number;
      maxHeight: number;
      padWidth: number;
      padHeight: number;
      offsetX: number;
      offsetY: number;
    },
    greenscreenFillType:
      | "stretch"
      | "blur-padding"
      | "black-padding" = "black-padding",
    scale: number = 0.8,
  ) {
    // Apply scale to maxWidth and maxHeight
    const scaledMaxWidth = Math.round(config.maxWidth * scale);
    const scaledMaxHeight = Math.round(config.maxHeight * scale);

    if (greenscreenFillType === "stretch") {
      // Simple stretch to fit the container
      return `[1:v]scale=${config.padWidth}:${config.padHeight}[overlay];[0:v][overlay]overlay=x=${config.offsetX}:y=${config.offsetY}`;
    } else if (greenscreenFillType === "blur-padding") {
      // Scale with aspect ratio and fill with blur
      return `[1:v]split[toScale][toBlur];[toScale]scale=w='min(iw,${scaledMaxWidth})':h='min(ih,${scaledMaxHeight})':force_original_aspect_ratio=decrease[scaled];[toBlur]scale=32:18,gblur=sigma=2,scale=${config.padWidth}:${config.padHeight}[blurred];[blurred][scaled]overlay=(W-w)/2:(H-h)/2[overlay];[0:v][overlay]overlay=x=${config.offsetX}:y=${config.offsetY}`;
    } else {
      // Original black padding behavior
      return `[1:v]scale=w='min(iw,${scaledMaxWidth})':h='min(ih,${scaledMaxHeight})':force_original_aspect_ratio=decrease,pad=${config.padWidth}:${config.padHeight}:((${config.padWidth}-iw)/2)+1:((${config.padHeight}-ih)/2)+1:color=black[overlay];[0:v][overlay]overlay=x=${config.offsetX}:y=${config.offsetY}`;
    }
  }

  import type { OverlayConfig } from "$lib/types/VideoSettings";

  export function generateCRTFilter(
    config: OverlayConfig,
    greenscreenFillType:
      | "stretch"
      | "blur-padding"
      | "black-padding" = "black-padding",
    scale: number,
    enableCRT: boolean,
    enableBloom: boolean,
    enableInterlaced: boolean,
    enableHighlight: boolean,
    paddingColor: string,
  ) {
    // Debug statement to log config values
    console.debug("Config values:", {
      config: config,
      enableCRT,
      enableBloom,
      enableInterlaced,
      enableHighlight,
      paddingColor,
    });

    // Calculate actual dimensions from percentages
    const overlayWidth: number = Math.round(
      (config.bgWidth * config.overlayWidthPercent) / 100,
    );
    const overlayHeight: number = Math.round(
      (config.bgHeight * config.overlayHeightPercent) / 100,
    );

    // Debug output for calculated dimensions
    console.debug(
      `Calculated overlay dimensions: ${overlayWidth}x${overlayHeight} (Width x Height)`,
    );

    // Calculate scaled dimensions
    const scaledWidth: number = Math.round(overlayWidth * scale);
    const scaledHeight: number = Math.round(overlayHeight * scale);

    // Define paddedWidth and paddedHeight outside the conditional
    let paddedWidth: number = overlayWidth;
    let paddedHeight: number = overlayHeight;

    let overlayX: number = config.offsetX;
    let overlayY: number = config.offsetY;

    // Calculate position adjustments for CRT effect
    if (enableCRT) {
      // Scale from center point in one calculation
      const scaleOffsetX = Math.round(
        (overlayWidth * (config.crtSettings.curveScaleFactor - 1)) / 2,
      );
      const scaleOffsetY = Math.round(
        (overlayHeight * (config.crtSettings.curveScaleFactor - 1)) / 2,
      );
      overlayX = overlayX - scaleOffsetX;
      overlayY = overlayY - scaleOffsetY;

      // Debug output
      console.debug("Scale offsets:", { scaleOffsetX, scaleOffsetY });
      console.debug("Adjusted position:", { overlayX, overlayY });
    }

    // If bloom is enabled, we'll adjust the padding later in the filter chain
    if (enableBloom) {
      // Additional logging for calculated values when bloom is enabled
      console.debug(
        "Bloom enabled: paddedWidth =",
        paddedWidth,
        ", paddedHeight =",
        paddedHeight,
        ", overlayX =",
        overlayX,
        ", overlayY =",
        overlayY,
      );
    } else {
      // Additional logging for calculated values when bloom is disabled
      console.debug(
        "Bloom disabled: paddedWidth =",
        paddedWidth,
        ", paddedHeight =",
        paddedHeight,
        ", overlayX =",
        overlayX,
        ", overlayY =",
        overlayY,
      );
    }

    // Create the ffmpeg filter chain
    let scaleFilter: string = `[1:v]scale=${scaledWidth}:${scaledHeight}:force_original_aspect_ratio=decrease`;
    if (greenscreenFillType === "black-padding") {
      scaleFilter += `,pad=${overlayWidth}:${overlayHeight}:(ow-iw)/2:(oh-ih)/2:color=${paddingColor}`;
    }

    // Build the highlight filter if enabled
    let highlightFilter: string = "";
    if (enableHighlight) {
      highlightFilter = `split [main][for_highlight];
        [for_highlight] format=gbrp,
        drawbox=x=${config.highlightSettings.x}:y=${config.highlightSettings.y}:w=${config.highlightSettings.size}:h=${config.highlightSettings.size}:color=white@0.5:t=fill,
        boxblur=${config.highlightSettings.blur} [highlight];
        [main][highlight] blend=all_mode=screen:shortest=1`;
    }

    let filterChain: string = "";
    // Build the filter chain based on effects toggle
    if (enableCRT) {
      if (enableInterlaced) {
        filterChain = `${scaleFilter},\
            split[a][b];\
            [a]curves=darker[a];\
            [a][b]blend=all_expr='if(eq(0,mod(Y,2)),A,B)':shortest=1`;

        if (enableHighlight) {
          filterChain = `${filterChain},\
                ${highlightFilter}`;
        }

        if (enableBloom) {
          filterChain = `${filterChain},\
                format=rgba,\
                pad=${overlayWidth + 2 * config.bloomSettings.padding}:${overlayHeight + 2 * config.bloomSettings.padding}:${config.bloomSettings.padding}:${config.bloomSettings.padding}:color=0x00000000,\
                split [main][bloom];\
                [bloom]boxblur=${config.bloomSettings.blur}[bloom];\
                [main][bloom]blend=all_mode=screen:shortest=1`;

          // Adjust position for bloom padding
          overlayX = overlayX - config.bloomSettings.padding;
          overlayY = overlayY - config.bloomSettings.padding;
        }

        filterChain = `${filterChain},\
            format=rgba,\
            lenscorrection=k1=${config.crtSettings.k1}:k2=${config.crtSettings.k2}:i=${config.crtSettings.interpolation},\
            scale=iw*${config.crtSettings.curveScaleFactor}:ih*${config.crtSettings.curveScaleFactor}[scaled]`;
      } else {
        filterChain = `${scaleFilter}`;

        if (enableHighlight) {
          filterChain = `${filterChain},\
                ${highlightFilter}`;
        }

        if (enableBloom) {
          filterChain = `${filterChain},\
                format=rgba,\
                pad=${overlayWidth + 2 * config.bloomSettings.padding}:${overlayHeight + 2 * config.bloomSettings.padding}:${config.bloomSettings.padding}:${config.bloomSettings.padding}:color=0x00000000,\
                split [main][bloom];\
                [bloom]boxblur=${config.bloomSettings.blur}[bloom];\
                [main][bloom]blend=all_mode=screen:shortest=1`;

          // Adjust position for bloom padding
          overlayX = overlayX - config.bloomSettings.padding;
          overlayY = overlayY - config.bloomSettings.padding;
        }

        filterChain = `${filterChain},\
            format=rgba,\
            lenscorrection=k1=${config.crtSettings.k1}:k2=${config.crtSettings.k2}:i=${config.crtSettings.interpolation},\
            scale=iw*${config.crtSettings.curveScaleFactor}:ih*${config.crtSettings.curveScaleFactor}[scaled]`;
      }
    } else {
      if (enableInterlaced) {
        filterChain = `${scaleFilter},\
            split[a][b];\
            [a]curves=darker[a];\
            [a][b]blend=all_expr='if(eq(0,mod(Y,2)),A,B)':shortest=1`;

        if (enableHighlight) {
          filterChain = `${filterChain},\
                ${highlightFilter}`;
        }

        if (enableBloom) {
          filterChain = `${filterChain},\
                format=rgba,\
                pad=${overlayWidth + 2 * config.bloomSettings.padding}:${overlayHeight + 2 * config.bloomSettings.padding}:${config.bloomSettings.padding}:${config.bloomSettings.padding}:color=0x00000000,\
                split [main][bloom];\
                [bloom]boxblur=${config.bloomSettings.blur}[bloom];\
                [main][bloom]blend=all_mode=screen:shortest=1`;

          // Adjust position for bloom padding
          overlayX = overlayX - config.bloomSettings.padding;
          overlayY = overlayY - config.bloomSettings.padding;
        }

        filterChain = `${filterChain},\
            format=rgba[scaled]`;
      } else {
        filterChain = `${scaleFilter}`;

        if (enableHighlight) {
          filterChain = `${filterChain},\
                ${highlightFilter}`;
        }

        if (enableBloom) {
          filterChain = `${filterChain},\
                format=rgba,\
                pad=${overlayWidth + 2 * config.bloomSettings.padding}:${overlayHeight + 2 * config.bloomSettings.padding}:${config.bloomSettings.padding}:${config.bloomSettings.padding}:color=0x00000000,\
                split [main][bloom];\
                [bloom]boxblur=${config.bloomSettings.blur}[bloom];\
                [main][bloom]blend=all_mode=screen:shortest=1`;

          // Adjust position for bloom padding
          overlayX = overlayX - config.bloomSettings.padding;
          overlayY = overlayY - config.bloomSettings.padding;
        }

        filterChain = `${filterChain},\
            format=rgba[scaled]`;
      }
    }

    return `${filterChain};\
        [0:v][scaled]overlay=${overlayX}:${overlayY}[v]`;
  }

  // Default greenscreen filter (for backward compatibility)
  // TODO: Remove this
  // export const FFMPEG_FILTER_ADD_GREENSCREEN = generateGreenscreenFilter({
  //   maxWidth: 510,
  //   maxHeight: 382,
  //   padWidth: 512,
  //   padHeight: 382,
  //   offsetX: 140,
  //   offsetY: 94,
  // });

  export const FFMPEG_FILTER_ADD_WATERMARK =
    "[1][0]scale2ref=w=oh*mdar:h=ih*0.1[wm][vid];[vid][wm]overlay=W-w-10:H-h-10";
</script>
