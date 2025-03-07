<script lang="ts">
  import { tweened } from "svelte/motion";
  import { onMount } from "svelte";
  import { FFmpeg } from "@ffmpeg/ffmpeg";
  import { writable } from "svelte/store";
  import saveAs from "file-saver";
  // import { fetchFile, toBlobURL } from '@ffmpeg/util';
  // import { toBlobURL } from '@ffmpeg/util';

  import NavBar from "../../components/NavBar.svelte";
  import Header from "../Header.svelte";
  import Footer from "../../components/Footer.svelte";
  import FeedbackSection from "../../components/FeedbackSection.svelte";
  import * as DATA from "../Constans.svelte"; // reusable constans

  import { videoSettings } from "$lib/stores/videoSettingsStore";
  import { DEFAULT_SETTINGS } from "$lib/constants";

  import BottomNav from "../../components/BottomNav.svelte";

  import { Toast } from "$lib/toast";
  import { toast } from "@zerodevx/svelte-toast";

  import HowItWorks from "../../components/tiwi/HowItWorks.svelte";
  import SelectFiles from "../../components/tiwi/SelectFiles.svelte";
  import PreviewAndSettings from "../../components/tiwi/PreviewAndSettings.svelte";
  import Results from "../../components/tiwi/Results.svelte";

  // icons
  import XMarkIcon from "virtual:icons/heroicons/x-mark";
  import ArrowDownIcon from "virtual:icons/heroicons/arrow-down";
  import Bars3Icon from "virtual:icons/heroicons/bars-3";
  import QuestionMarkCircleIcon from "virtual:icons/heroicons/question-mark-circle";
  import DocumentPlusIcon from "virtual:icons/heroicons/document-plus";
  import CloudIcon from "virtual:icons/heroicons/cloud";
  import FilmIcon from "virtual:icons/heroicons/film";

  // Debug logging utility
  const isDev = import.meta.env.DEV;
  const debug = (...args: unknown[]) => {
    if (isDev) {
      console.log("[DEBUG]", ...args);
    }
  };

  const previewUrl = writable("");
  let selectedFileIndex: number | undefined;

  type State =
    | "loading"
    | "loaded"
    | "convert.ready"
    | "convert.start"
    | "convert.error"
    | "convert.done";
  type typeTransformState = "1/2" | "2/2" | "0/2";

  // let isOpen = false;
  let files: FileList;
  // let videoData;
  let videoDataList: Array<{
    videoName: string;
    videoBlob: Blob;
    videoBlobURL: string;
  }> = [];

  let state: State = "loading";
  let transformState: typeTransformState = "0/2";

  let error = "";

  let ffmpeg: FFmpeg;
  let progress = tweened(0);
  let ffmpegLoadingToastId: number | null = null;

  type PreviewFrame = {
    timestamp: number;
    url: string;
  };

  const previewFrames = writable<PreviewFrame[]>([]);
  const previewProgress = writable<{
    stage: "extracting" | "processing";
    current: number;
  }>({ stage: "extracting", current: 0 });

  // Cache for storing generated previews
  const previewCache = new Map<
    string,
    { frames: PreviewFrame[]; timestamp: number }
  >();

  let selectedPreviewIndex = 0;
  let showSettings = false;

  type VideoFrame = {
    timestamp: number;
    blob: Blob;
  };

  interface Background {
    id: string;
    name: string;
    description: string;
    imagePath: string;
    previewPath: string;
    overlayConfig: {
      maxWidth: number;
      maxHeight: number;
      padWidth: number;
      padHeight: number;
      offsetX: number;
      offsetY: number;
    };
  }

  let backgrounds: Background[] = [];

  function getVideoDuration(file: File): Promise<number> {
    const video = document.createElement("video");
    const objectURL = URL.createObjectURL(file);

    video.src = objectURL;

    return new Promise((resolve, reject) => {
      video.addEventListener("loadedmetadata", () => {
        const duration = video.duration;
        URL.revokeObjectURL(objectURL);
        video.remove();
        resolve(duration);
      });

      video.addEventListener("error", (error) => {
        URL.revokeObjectURL(objectURL);
        video.remove();
        reject(error);
      });
    });
  }

  // Function to handle UI changes
  function handleSwitchChange(
    key: keyof typeof DEFAULT_SETTINGS,
    event: Event,
  ) {
    const target = event.target as HTMLInputElement;
    videoSettings.updateSettings(settingId, {
      [key]: target.checked,
    });
  }

  // Re-implementation
  // Take straight from ffmpeg-wasm due to import issue
  // https://github.com/ffmpegwasm/ffmpeg.wasm/issues/603
  const readFromBlobOrFile = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const { result } = fileReader;
        if (result instanceof ArrayBuffer) {
          resolve(new Uint8Array(result));
        } else {
          resolve(new Uint8Array());
        }
      };
      fileReader.onerror = (event) => {
        reject(
          Error(
            `File could not be read! Code=${event?.target?.error?.code || -1}`,
          ),
        );
      };
      fileReader.readAsArrayBuffer(blob);
    });

  // Re-implementation
  // Take straight from ffmpeg-wasm due to import issue
  // https://github.com/ffmpegwasm/ffmpeg.wasm/issues/603
  const fetchFile = async (file: string | URL | File | Blob) => {
    let data;
    if (typeof file === "string") {
      /* From base64 format */
      if (/data:_data\/([a-zA-Z]*);base64,([^"]*)/.test(file)) {
        data = atob(file.split(",")[1])
          .split("")
          .map((c) => c.charCodeAt(0));
        /* From remote server/URL */
      } else {
        data = await (await fetch(file)).arrayBuffer();
      }
    } else if (file instanceof URL) {
      data = await (await fetch(file)).arrayBuffer();
    } else if (file instanceof File || file instanceof Blob) {
      data = await readFromBlobOrFile(file);
    } else {
      return new Uint8Array();
    }
    return new Uint8Array(data);
  };

  // Add this new store for tracking current processing file index
  const currentProcessingIndex = writable<number | null>(null);

  // Modify the progress store to track progress per file
  const fileProgress = writable<Map<number, number>>(new Map());

  // Add a store to track which files have been processed
  const processedFiles = writable<Set<number>>(new Set());

  // Add a store to track if processing has started
  const processingStarted = writable(false);

  import { ffmpegStore } from "$lib/stores/ffmpegStore";
  import FFmpegStatus from "../../components/tiwi/FFmpegStatus.svelte";

  onMount(async () => {
    // Initialize FFmpeg
    loadFfmpeg();

    // Load backgrounds data
    try {
      const response = await fetch(DATA.PATH_BACKGROUNDS_JSON);
      const data = await response.json();
      backgrounds = data.backgrounds;
    } catch (err) {
      const error = err as Error;
      console.error("Error loading backgrounds:", error);
      Toast.error("Błąd ładowania konfiguracji teł: " + error.message);
    }
  });

  async function convertVideos(files: FileList) {
    debug("Started batch video converting");
    Toast.info("Rozpoczęto przetwarzanie plików");
    debug(files);
    videoDataList = new Array(files.length); // Pre-allocate array
    state = "convert.start";
    processedFiles.set(new Set()); // Reset processed files
    fileProgress.set(new Map());
    processingStarted.set(true); // Set processing started flag

    for (let i = 0; i < files.length; i++) {
      currentProcessingIndex.set(i);
      const file = files[i];
      debug("About to convert: " + file.name);
      Toast.info(`Przetwarzanie: ${file.name}`);
      const duration = await getVideoDuration(file);
      debug("Video duration:", duration);
      await convertVideo(file, duration);
      Toast.success(`Zakończono przetwarzanie: ${file.name}`);
    }

    debug("Converts done. Setting state.");
    transformState = "0/2";
    state = "convert.done";
    currentProcessingIndex.set(null);
    Toast.success(
      `Zakończono przetwarzanie wszystkich plików (${files.length})`,
    );
    debug("Finishing batch video converting");
  }

  // Apply ffmpeg logic to individual input file
  async function convertVideo(file: File, duration: number) {
    // Initial setup
    transformState = "PREPARING";
    let _i = 0; // Initialize counter
    const outputs: string[] = []; // Initialize outputs array

    const fileSettings =
      $videoSettings.find((s) => s.fileName === file.name)?.settings ||
      DEFAULT_SETTINGS;
    const selectedBackground = backgrounds.find(
      (bg) => bg.id === fileSettings.selectedBackground,
    );

    if (!selectedBackground) {
      console.error(
        "Selected background not found:",
        fileSettings.selectedBackground,
      );
      Toast.error("Błąd: Nie znaleziono wybranego tła");
      return;
    }

    // Load files
    await ffmpeg.writeFile(file.name, await fetchFile(file));
    await ffmpeg.writeFile(
      selectedBackground.id + ".png",
      await fetchFile(selectedBackground.imagePath),
    );

    // Main processing
    transformState = "PROCESSING";
    const greenscreenFilter = DATA.generateCRTFilter(
      selectedBackground.overlayConfig,
      fileSettings.greenscreenFillType,
      fileSettings.greenscreenScale,
      fileSettings.enableCRT,
      fileSettings.enableBloom,
      fileSettings.enableInterlaced,
      fileSettings.enableHighlight,
      fileSettings.enableRGB,
      fileSettings.paddingColor,
    );
    await ffmpeg.exec([
      "-i",
      selectedBackground.id + ".png",
      "-i",
      file.name,
      "-filter_complex",
      greenscreenFilter,
      "-map",
      "[v]",
      "-map",
      "1:a",
      "-c:v",
      "libx264",
      "-c:a",
      "copy",
      "-preset",
      "ultrafast",
      `output${_i}.mp4`,
    ]);
    outputs.push(`output${_i}.mp4`);
    debug(
      "[*] Current Virtual FS after first conversion:",
      await ffmpeg.listDir("/"),
    );
    _i++;

    // Optional Boczek and intro
    if (fileSettings.addBoczek || fileSettings.addIntro) {
      transformState = "APPENDING";

      if (fileSettings.addBoczek) {
        await ffmpeg.writeFile(
          DATA.NAME_TEMPLATE_VIDEO,
          await fetchFile(DATA.PATH_TEMPLATE_VIDEO),
        );
        const boczekFilter = DATA.generateBoczekFilter(
          selectedBackground.overlayConfig.maxWidth,
          selectedBackground.overlayConfig.maxHeight,
          fileSettings.boczekFillType,
          fileSettings.boczekScale,
        );
        await ffmpeg.exec([
          "-i",
          outputs[_i - 1],
          "-i",
          DATA.NAME_TEMPLATE_VIDEO,
          "-filter_complex",
          boczekFilter,
          "-map",
          "[v]",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          `output${_i}.mp4`,
        ]);
        outputs.push(`output${_i}.mp4`);
        debug(
          "[*] Current Virtual FS after adding Boczek:",
          await ffmpeg.listDir("/"),
        );

        _i++;
      }

      if (fileSettings.addIntro) {
        await ffmpeg.writeFile(
          DATA.NAME_INTRO_AUDIO,
          await fetchFile(DATA.NAME_INTRO_AUDIO),
        );
        await ffmpeg.exec([
          "-i",
          outputs[_i - 1],
          "-i",
          DATA.NAME_INTRO_AUDIO,
          "-filter_complex",
          DATA.FFMPEG_FILTER_ADD_INTRO,
          "-c:v",
          "copy",
          `output${_i}.mp4`,
        ]);
        outputs.push(`output${_i}.mp4`);
        debug(
          "[*] Current Virtual FS after adding intro:",
          await ffmpeg.listDir("/"),
        );

        _i++;
      }
    }

    // Finalization
    transformState = "FINALIZING";
    const data = await ffmpeg.readFile(`output${_i - 1}.mp4`);
    const blob = new Blob(
      [data instanceof Uint8Array ? data : new Uint8Array()],
      { type: "video/mp4" },
    );

    // Get the current index safely
    const currentIndex = $currentProcessingIndex;
    if (currentIndex !== null) {
      videoDataList[currentIndex] = {
        videoName: file.name,
        videoBlob: blob,
        videoBlobURL: URL.createObjectURL(blob),
      };

      // Mark this file as processed
      processedFiles.update((set) => {
        if (currentIndex !== null) {
          set.add(currentIndex);
        }
        return set;
      });
    }

    // Cleanup files
    for (const output of outputs) {
      const _fileDelete = await ffmpeg.deleteFile(output);
      debug("[*] File cleanup from Virtual FS: ", _fileDelete);
    }

    await ffmpeg.deleteFile(file.name);
    await ffmpeg.deleteFile(selectedBackground.id + ".png");
    debug("[*] Cleanup original input file name: ", file.name);

    const dirList = await ffmpeg.listDir("/");
    debug("[*] List of Virtual FS (after): ", dirList);
    debug("[*] FFmpeg Virtual FS cleaned up.");
  }

  async function extractFrames(file: File): Promise<VideoFrame[]> {
    try {
      debug("[*] Starting frame extraction");
      previewProgress.set({ stage: "extracting", current: 0 });
      const duration = await getVideoDuration(file);
      const timestamps = [duration * 0.25, duration * 0.5, duration * 0.75];

      const frames: VideoFrame[] = [];

      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        previewProgress.set({ stage: "extracting", current: i + 1 });
        debug(`[*] Extracting frame at ${timestamp.toFixed(2)}s`);
        await ffmpeg.writeFile(file.name, await fetchFile(file));

        // Extract frame at timestamp
        await ffmpeg.exec([
          "-ss",
          timestamp.toString(),
          "-i",
          file.name,
          "-frames:v",
          "1",
          "-f",
          "image2",
          "-c:v",
          "png",
          `frame_${timestamp}.png`,
        ]);

        const frameData = await ffmpeg.readFile(`frame_${timestamp}.png`);
        if (!frameData) {
          throw new Error(
            `Failed to read frame data at timestamp ${timestamp}s`,
          );
        }
        const blob = new Blob([frameData.buffer], { type: "image/png" });

        frames.push({
          timestamp,
          blob,
        });

        // Cleanup
        await ffmpeg.deleteFile(`frame_${timestamp}.png`);
        await ffmpeg.deleteFile(file.name);
      }

      debug(`[*] Extracted ${frames.length} frames`);
      return frames;
    } catch (error) {
      console.error("Error during frame extraction:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to extract video frames",
      );
    }
  }

  async function generatePreview(
    file: File,
    frames: VideoFrame[],
  ): Promise<PreviewFrame[]> {
    try {
      debug(`[*] Starting preview generation for ${frames.length} frames`);
      debug(
        `[*] File details: name=${file.name}, size=${file.size}, type=${file.type}`,
      );
      previewProgress.set({ stage: "processing", current: 0 });

      const previewFrames: PreviewFrame[] = [];

      // Get the file settings and background
      const fileSettings =
        $videoSettings.find((s) => s.fileName === file.name)?.settings ||
        DEFAULT_SETTINGS;

      debug(`[*] Using settings:`, fileSettings);

      const selectedBackground = backgrounds.find(
        (bg) => bg.id === fileSettings.selectedBackground,
      );

      if (!selectedBackground) {
        throw new Error(
          `Background not found: ${fileSettings.selectedBackground}`,
        );
      }

      debug(
        `[*] Selected background: ${selectedBackground.name} (${selectedBackground.id})`,
      );

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        previewProgress.set({ stage: "processing", current: i + 1 });
        debug(
          `[*] Processing frame ${i + 1}/${frames.length} at timestamp ${frame.timestamp.toFixed(2)}s`,
        );

        try {
          debug(`[*] Writing input file to FFmpeg virtual filesystem`);
          await ffmpeg.writeFile(file.name, await fetchFile(file));

          debug(`[*] Writing background image to FFmpeg virtual filesystem`);
          await ffmpeg.writeFile(
            selectedBackground.id + ".png",
            await fetchFile(selectedBackground.imagePath),
          );

          // Create a temporary file from the frame blob
          const frameFileName = `input_frame_${frame.timestamp}.png`;
          debug(
            `[*] Writing frame blob to FFmpeg virtual filesystem as ${frameFileName}`,
          );
          await ffmpeg.writeFile(frameFileName, await fetchFile(frame.blob));

          // List files before processing to verify everything is in place
          const filesBeforeProcess = await ffmpeg.listDir("/");
          debug(
            `[*] Files in virtual filesystem before processing:`,
            filesBeforeProcess,
          );

          // Process the frame with greenscreen effect
          const filter = DATA.generateCRTFilter(
            selectedBackground.overlayConfig,
            fileSettings.greenscreenFillType,
            fileSettings.greenscreenScale,
            fileSettings.enableCRT,
            fileSettings.enableBloom,
            fileSettings.enableInterlaced,
            fileSettings.enableHighlight,
            fileSettings.enableRGB,
            fileSettings.paddingColor,
          );
          debug(`[*] Generated FFmpeg filter:`, filter);

          debug(`[*] Executing FFmpeg command for frame processing`);
          await ffmpeg.exec([
            "-i",
            selectedBackground.id + ".png",
            "-i",
            frameFileName,
            "-filter_complex",
            filter,
            "-frames:v",
            "1",
            "-map",
            "[v]",

            "-preset",
            "ultrafast",
            `preview_${frame.timestamp}.png`,
          ]);

          debug(`[*] Reading processed frame from virtual filesystem`);
          const previewData = await ffmpeg.readFile(
            `preview_${frame.timestamp}.png`,
          );
          if (!previewData) {
            throw new Error(
              `Failed to read preview data for frame at ${frame.timestamp}s`,
            );
          }

          const previewBlob = new Blob(
            [
              previewData instanceof Uint8Array
                ? previewData
                : new Uint8Array(),
            ],
            { type: "image/png" },
          );
          const url = URL.createObjectURL(previewBlob);

          previewFrames.push({
            timestamp: frame.timestamp,
            url,
          });

          // Cleanup
          debug(`[*] Starting cleanup for frame ${i + 1}`);
          try {
            await ffmpeg.deleteFile(`preview_${frame.timestamp}.png`);
            await ffmpeg.deleteFile(frameFileName);
            await ffmpeg.deleteFile(file.name);
            await ffmpeg.deleteFile(selectedBackground.id + ".png");

            // Verify cleanup
            const remainingFiles = await ffmpeg.listDir("/");
            debug(`[*] Files remaining after cleanup:`, remainingFiles);
          } catch (cleanupError) {
            debug(`[*] Error during frame cleanup:`, cleanupError);
            // Continue processing even if cleanup fails
          }

          debug(
            `[*] Successfully generated preview for timestamp ${frame.timestamp.toFixed(2)}s`,
          );
        } catch (frameError) {
          debug(`[*] Detailed frame processing error:`, frameError);
          if (frameError instanceof Error) {
            debug(`[*] Error name: ${frameError.name}`);
            debug(`[*] Error message: ${frameError.message}`);
            debug(`[*] Error stack: ${frameError.stack}`);
          }

          // Try to get filesystem state for debugging
          try {
            const fsState = await ffmpeg.listDir("/");
            debug(`[*] Virtual filesystem state at error:`, fsState);
          } catch (fsError) {
            debug(`[*] Could not read filesystem state:`, fsError);
          }

          // Clean up any remaining files
          try {
            debug(`[*] Attempting emergency cleanup after error`);
            await ffmpeg.deleteFile(`preview_${frame.timestamp}.png`);
            await ffmpeg.deleteFile(`input_frame_${frame.timestamp}.png`);
            await ffmpeg.deleteFile(file.name);
            await ffmpeg.deleteFile(selectedBackground.id + ".png");
          } catch (cleanupError) {
            debug(`[*] Emergency cleanup failed:`, cleanupError);
          }
          throw frameError;
        }
      }

      debug(
        `[*] Preview generation complete. Generated ${previewFrames.length} previews`,
      );
      return previewFrames;
    } catch (error) {
      debug(`[*] Fatal error during preview generation:`, error);
      if (error instanceof Error) {
        debug(`[*] Error name: ${error.name}`);
        debug(`[*] Error message: ${error.message}`);
        debug(`[*] Error stack: ${error.stack}`);
      }
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to generate preview frames",
      );
    }
  }

  // Save on disk individual processed file
  function downloadVideo(fileBlob: Blob, fileName: string) {
    const downloadFileName = "kiepskietv-" + fileName + ".mp4";
    saveAs(fileBlob, downloadFileName);
  }

  async function shareVideo(blob: Blob, name: string) {
    const downloadFileName = "kiepskietv-" + name + ".mp4";
    const file = new File([blob], downloadFileName, { type: "video/mp4" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: downloadFileName,
          text:
            "Co jest kurde, noc jest kurde 🍻: " +
            "http://kiepskie-tv.vercel.app",
          files: [file],
        });
        console.log("Video shared successfully!");
      } catch (error) {
        console.error("Error sharing video:", error);
      }
    } else {
      console.log(
        "Web Share API not supported or sharing files is not supported.",
      );
      // Fallback for testing: simply log the video details
      console.log("Sharing file:", file);
      // You can add more debugging information or actions here
    }
  }

  async function loadFfmpeg() {
    try {
      // Show neutral loading toast
      ffmpegLoadingToastId = Toast.custom("Ładowanie FFmpeg...", {
        duration: 0, // Make it persistent
        dismissable: false,
        theme: {
          "--toastBackground": "#94A3B8", // Neutral gray color
          "--toastColor": "white",
          "--toastBarBackground": "#64748B",
        },
      });

      ffmpegStore.setState("loading");
      const baseUrl = "https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm";
      ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: `${baseUrl}/ffmpeg-core.js`,
        wasmURL: `${baseUrl}/ffmpeg-core.wasm`,
      });

      // Only attach log listener in development mode
      if (isDev) {
        ffmpeg.on("log", ({ message }) => {
          debug("FFmpeg:", message);
        });
      }

      ffmpeg.on("progress", ({ progress }) => {
        $currentProcessingIndex !== null &&
          fileProgress.update((map) => {
            map.set($currentProcessingIndex, progress * 100);
            return map;
          });
      });

      state = "loaded";
      ffmpegStore.setState("loaded");

      // Update the loading toast to success
      if (ffmpegLoadingToastId !== null) {
        // First remove the loading toast
        toast.pop(ffmpegLoadingToastId);
        // Then show a success toast that will auto-dismiss
        Toast.success("FFmpeg załadowany pomyślnie");
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[FFmpeg Load Error]", error);
      ffmpegStore.setState("error");

      // Update the loading toast to error
      if (ffmpegLoadingToastId !== null) {
        toast.pop(ffmpegLoadingToastId);
        Toast.error(
          "Wystąpił błąd podczas ładowania. Sprawdź połączenie i spróbuj ponownie.",
        );
      }
    }
  }

  async function resetFfmpeg() {
    // Clear any existing loading toast
    if (ffmpegLoadingToastId !== null) {
      toast.pop(ffmpegLoadingToastId);
      ffmpegLoadingToastId = null;
    }

    state = "loading";
    processingStarted.set(false); // Reset processing flag
    ffmpeg.terminate();
    loadFfmpeg();
  }

  $: console.log({ state });

  // Update selectedFileIndex when files change
  $: if (files && files.length === 0) {
    selectedFileIndex = undefined;
  } else if (files && selectedFileIndex === undefined) {
    selectedFileIndex = 0;
  }

  // Add file settings when files are selected
  $: if (files) {
    videoSettings.reset();
    Array.from(files).forEach((file) => {
      videoSettings.addFile(file.name);
    });
    if (files.length > 0) {
      Toast.success(
        `Dodano ${files.length} ${files.length === 1 ? "plik" : "plików"} do przetworzenia`,
      );
    }
  }

  // Function for removing file inputs and its settings
  const removeFile = (index: number, settingId: string) => {
    const filesArr = Array.from(files);
    const fileToRemove = filesArr[index];
    if (fileToRemove) {
      removeCachedPreview(fileToRemove);
      Toast.info(`Usunięto plik: ${fileToRemove.name}`);
    }
    filesArr.splice(index, 1);
    const _dataTransfer = new DataTransfer();
    filesArr.forEach((_file) => _dataTransfer.items.add(_file));
    files = _dataTransfer.files;
    videoSettings.removeFile(settingId);

    // Update selectedFileIndex if needed
    if (selectedFileIndex === index) {
      if (filesArr.length === 0) {
        selectedFileIndex = undefined;
      } else if (selectedFileIndex >= filesArr.length) {
        selectedFileIndex = filesArr.length - 1;
      }
    } else if (selectedFileIndex > index) {
      selectedFileIndex--;
    }
  };

  // Reset preview index when file changes
  $: if (selectedFileIndex !== undefined) {
    selectedPreviewIndex = 0;
  }

  // Add cleanup on file change
  $: if (files) {
    // Cleanup old preview URLs
    $previewFrames.forEach((frame) => URL.revokeObjectURL(frame.url));
    previewFrames.set([]);
  }

  // Function to get cache key for a file
  function getPreviewCacheKey(file: File): string {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }

  // Function to get cached preview if available
  function getCachedPreview(file: File): PreviewFrame[] | null {
    const cacheKey = getPreviewCacheKey(file);
    const cached = previewCache.get(cacheKey);

    if (cached) {
      console.log("[*] Found cached preview for", file.name);
      return cached.frames;
    }
    return null;
  }

  // Function to store preview in cache
  function cachePreview(file: File, frames: PreviewFrame[]): void {
    const cacheKey = getPreviewCacheKey(file);
    console.log("[*] Caching preview for", file.name);

    // Create new URLs for the cached frames to avoid sharing blob URLs
    const cachedFrames = frames.map((frame) => ({
      timestamp: frame.timestamp,
      url: frame.url, // The original URL will be kept alive as long as it's in the previewFrames store
    }));

    previewCache.set(cacheKey, {
      frames: cachedFrames,
      timestamp: Date.now(),
    });
  }

  // Function to remove preview from cache
  function removeCachedPreview(file: File): void {
    const cacheKey = getPreviewCacheKey(file);
    console.log("[*] Removing cached preview for", file.name);

    // Get cached frames before deleting
    const cached = previewCache.get(cacheKey);
    if (cached) {
      // Don't revoke URLs here as they might be shared with previewFrames
      previewCache.delete(cacheKey);
    }
  }

  // Function to generate or get cached preview
  async function getOrGeneratePreview(file: File): Promise<PreviewFrame[]> {
    // First check if we have a cached version
    const cached = getCachedPreview(file);
    if (cached) {
      console.log("[*] Using cached preview for", file.name);
      // Create new blob URLs for the cached frames
      const frames = await Promise.all(
        cached.map(async (frame) => {
          // If the URL is still valid, reuse it
          try {
            await fetch(frame.url);
            return frame;
          } catch {
            // If the URL is invalid (revoked), regenerate it
            console.log("[*] Regenerating invalid preview URL");
            return null;
          }
        }),
      );

      // If any frame URLs were invalid, regenerate all previews
      if (frames.some((frame) => frame === null)) {
        console.log("[*] Some cached frames were invalid, regenerating all");
        removeCachedPreview(file);
        return getOrGeneratePreview(file);
      }

      return frames as PreviewFrame[];
    }

    console.log("[*] Generating new preview for", file.name);
    const frames = await extractFrames(file).then((frames) =>
      generatePreview(file, frames),
    );
    cachePreview(file, frames);
    return frames;
  }

  // Add type for activeTab
  let activeTab: "how-it-works" | "select-files" | "upload" | "results" =
    "select-files";

  // Add this to handle automatic tab switching after file selection
  $: if (files?.length > 0) {
    activeTab = "upload";
  }

  // Automatically switch to results tab when processing starts
  $: if (state === "convert.start") {
    activeTab = "results";
  }

  // Switch to results tab when videos are done processing
  $: if (state === "convert.done") {
    activeTab = "results";
  }

  // Handle select change with type safety
  function handleSelectChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value as
      | "how-it-works"
      | "select-files"
      | "upload"
      | "results";
    activeTab = value;
  }

  // Modify clear files function
  function clearFiles() {
    Array.from(files || []).forEach((file) => {
      removeCachedPreview(file);
    });
    const _dataTransfer = new DataTransfer();
    files = _dataTransfer.files;
    selectedFileIndex = undefined;
    Toast.info("Wyczyszczono listę plików");
  }

  let showPreviewModal = false;
  let selectedPreviewUrl: string | null = null;
</script>

<!-- Preview Modal -->
{#if showPreviewModal && selectedPreviewUrl}
  <div
    class="modal modal-open"
    on:click|self={() => (showPreviewModal = false)}
  >
    <div class="modal-box relative max-w-4xl w-11/12 h-auto">
      <button
        class="btn btn-sm btn-circle absolute right-2 top-2"
        on:click={() => (showPreviewModal = false)}
      >
        <XMarkIcon class="h-4 w-4" />
      </button>
      <figure class="flex items-center justify-center">
        <img
          src={selectedPreviewUrl}
          alt="Podgląd w pełnej rozdzielczości"
          class="max-h-[80vh] w-auto object-contain rounded-lg"
        />
      </figure>
    </div>
  </div>
{/if}

<!-- <CenteredContainer> -->
<NavBar />

<!-- <ResponsiveContainer> -->
<Header title={DATA.APP_TITLE} description={DATA.APP_DESC}>
  <!-- <p class="text-lg">
      Twoje wideo nigdzie nie jest wysłane - obróbka jest 100% offline
    </p> -->
  <!-- Add scroll button -->
  <button
    class="btn btn-sm btn-outline gap-2 mt-2"
    on:click={() => {
      document.getElementById("main-card")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }}
  >
    Przejdź do aplikacji
    <ArrowDownIcon class="h-4 w-4 animate-bounce" />
  </button>
</Header>
<!-- </ResponsiveContainer> -->

<!-- How it works section -->
<!-- <ResponsiveContainer> -->
<div class="card bg-base-100 shadow-xl" id="main-card">
  <div class="card-body">
    <!-- FFmpeg Status -->
    <FFmpegStatus onRetry={resetFfmpeg} />

    <!-- Section Title -->
    <div class="flex items-center gap-2">
      <Bars3Icon class="h-5 w-5" />
      <h2 class="text-lg font-bold">Sekcje</h2>
    </div>
    <!-- Notice text with slight transparency -->
    <div class="text-sm text-base-content/70">
      Wszystkie pliki są przetwarzane lokalnie i nie opuszczają Twojego
      urządzenia
    </div>

    <!-- Mobile Select -->
    <div class="lg:hidden mb-4">
      <select
        class="select select-bordered w-full"
        value={activeTab}
        on:change={(e) => (activeTab = e.currentTarget.value)}
      >
        <option value="how-it-works">Jak to działa</option>
        <option value="select-files">Wybierz pliki</option>
        <option value="upload">Podgląd i ustawienia</option>
        <option value="results">
          Twoje wideo {#if videoDataList.length > 0}({videoDataList.length}){/if}
        </option>
      </select>
    </div>

    <!-- Desktop Tabs -->
    <div class="hidden lg:flex flex-col sm:flex-row gap-2 p-2">
      <div class="tabs tabs-boxed">
        <button
          class="tab {activeTab === 'how-it-works'
            ? 'tab-active'
            : ''} flex items-center gap-2"
          on:click={() => (activeTab = "how-it-works")}
        >
          <QuestionMarkCircleIcon class="h-5 w-5" />
          Jak to działa
        </button>

        <button
          class="tab {activeTab === 'select-files'
            ? 'tab-active'
            : ''} flex items-center gap-2"
          on:click={() => (activeTab = "select-files")}
        >
          <DocumentPlusIcon class="h-5 w-5" />
          Wybierz pliki
        </button>

        <button
          class="tab {activeTab === 'upload'
            ? 'tab-active'
            : ''} flex items-center gap-2"
          on:click={() => (activeTab = "upload")}
        >
          <CloudIcon class="h-5 w-5" />
          Podgląd i ustawienia
        </button>

        <button
          class="tab {activeTab === 'results'
            ? 'tab-active'
            : ''} flex items-center gap-2"
          on:click={() => (activeTab = "results")}
        >
          <FilmIcon class="h-5 w-5" />
          Twoje wideo
          {#if videoDataList.length > 0}
            <div class="badge badge-sm badge-ghost">
              {videoDataList.length}
            </div>
          {/if}
        </button>
      </div>
    </div>

    <!-- How it works Section -->
    {#if activeTab === "how-it-works"}
      <HowItWorks />
    {/if}

    <!-- Select Files Section -->
    {#if activeTab === "select-files"}
      <SelectFiles
        files={Array.from(files || [])}
        {removeCachedPreview}
        on:clearFiles={() => {
          const dataTransfer = new DataTransfer();
          files = dataTransfer.files;
          selectedFileIndex = undefined;
          Toast.info("Wyczyszczono listę plików");
        }}
        on:filesChange={(e) => {
          files = e.detail.files;
        }}
        removeFile={(index) => {
          const settingId = $videoSettings[index]?.id;
          if (settingId) {
            removeFile(index, settingId);
          }
        }}
      />
    {/if}

    <!-- Upload Section -->
    {#if activeTab === "upload"}
      <PreviewAndSettings
        {state}
        {files}
        {selectedFileIndex}
        {ffmpeg}
        {previewFrames}
        {previewProgress}
        {getOrGeneratePreview}
        {convertVideos}
        {removeFile}
        {resetFfmpeg}
        {activeTab}
      />
    {/if}

    <!-- Results Section -->
    {#if activeTab === "results"}
      <Results
        {files}
        {processingStarted}
        {currentProcessingIndex}
        {fileProgress}
        {state}
        {transformState}
        {videoDataList}
        {downloadVideo}
        {shareVideo}
      />
    {/if}
  </div>
</div>
<!-- </ResponsiveContainer> -->
<!-- </CenteredContainer> -->
<FeedbackSection />
<Footer />
<BottomNav
  {activeTab}
  videoCount={videoDataList.length}
  on:click={(e) => {
    const target = e.target;
    const button = target.closest("button");
    if (button) {
      if (button.classList.contains("active")) return;
      const label = button.querySelector(".btm-nav-label");
      if (label) {
        const text = label.textContent;
        if (text === "Info") activeTab = "how-it-works";
        else if (text === "Pliki") activeTab = "select-files";
        else if (text === "Edycja") activeTab = "upload";
        else if (text === "Wideo") activeTab = "results";
      }
    }
  }}
></BottomNav>

<style>
  video {
    max-width: 100%;
    height: auto;
    margin-bottom: 10px;
    margin-top: 5px;
  }

  /* #video-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    } */

  .btm-nav-label {
    @apply text-sm;
  }
</style>
