<script lang="ts">
  import { tweened } from "svelte/motion";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { FFmpeg } from "@ffmpeg/ffmpeg";
  import { writable } from "svelte/store";
  import saveAs from "file-saver";
  // import { fetchFile, toBlobURL } from '@ffmpeg/util';
  // import { toBlobURL } from '@ffmpeg/util';

  import DashedBox from "../DashedBox.svelte";

  import CenteredContainer from "../../components/CenteredContainer.svelte";
  import ResponsiveContainer from "../../components/ResponsiveContainer.svelte";
  import NavBar from "../../components/NavBar.svelte";
  import Header from "../Header.svelte";
  import Footer from "../../components/Footer.svelte";
  import FeedbackSection from "../../components/FeedbackSection.svelte";
  import * as DATA from "../Constans.svelte"; // reusable constans

  import { videoSettings } from "$lib/stores/videoSettingsStore";
  import { DEFAULT_SETTINGS } from "$lib/constants";

  import BottomNav from "../../components/BottomNav.svelte";

  import Toast from "../../components/Toast.svelte";
  import { toasts } from "$lib/stores/toastStore";

  import HowItWorks from "../../components/tiwi/HowItWorks.svelte";
  import SelectFiles from "../../components/tiwi/SelectFiles.svelte";
  import PreviewAndSettings from "../../components/tiwi/PreviewAndSettings.svelte";
  import Results from "../../components/tiwi/Results.svelte";

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

  onMount(async () => {
    loadFfmpeg();
    // Load backgrounds data
    try {
      const response = await fetch(DATA.PATH_BACKGROUNDS_JSON);
      const data = await response.json();
      backgrounds = data.backgrounds;
    } catch (err) {
      const error = err as Error;
      console.error("Error loading backgrounds:", error);
      toasts.add("Błąd ładowania konfiguracji teł: " + error.message, "error");
    }
  });

  async function convertVideos(files: FileList) {
    console.log("Started batch video converting");
    toasts.add("Rozpoczęto przetwarzanie plików", "info", 3000, true);
    console.log(files);
    videoDataList = new Array(files.length); // Pre-allocate array
    state = "convert.start";
    processedFiles.set(new Set()); // Reset processed files
    fileProgress.set(new Map());
    processingStarted.set(true); // Set processing started flag

    for (let i = 0; i < files.length; i++) {
      currentProcessingIndex.set(i);
      const file = files[i];
      console.log("About to convert: " + file.name);
      toasts.add(`Przetwarzanie: ${file.name}`, "info");
      const duration = await getVideoDuration(file);
      console.log("Video duration:", duration);
      await convertVideo(file, duration);
      toasts.add(`Zakończono przetwarzanie: ${file.name}`, "success");
    }

    console.log("Converts done. Setting state.");
    transformState = "0/2";
    state = "convert.done";
    currentProcessingIndex.set(null);
    toasts.add(
      `Zakończono przetwarzanie wszystkich plików (${files.length})`,
      "success",
      5000,
      true,
    );
    console.log("Finishing batch video converting");
  }

  // Apply ffmpeg logic to individual input file
  async function convertVideo(file: File, duration: number) {
    const fileSettings =
      $videoSettings.find((s) => s.fileName === file.name)?.settings ||
      DEFAULT_SETTINGS;

    // Find selected background configuration
    const selectedBackground = backgrounds.find(
      (bg) => bg.id === fileSettings.selectedBackground,
    );

    if (!selectedBackground) {
      console.error(
        "Selected background not found:",
        fileSettings.selectedBackground,
      );
      toasts.add("Błąd: Nie znaleziono wybranego tła", "error");
      return;
    }

    let _i = 0;
    let outputs = [];

    console.log("Using background:", selectedBackground.name);
    console.log("Background config:", selectedBackground.overlayConfig);

    await ffmpeg.writeFile(file.name, await fetchFile(file));
    console.log("[*] Current Virtual FS:", await ffmpeg.listDir("/"));

    // Load selected background image using the background's imagePath
    await ffmpeg.writeFile(
      selectedBackground.id + ".png",
      await fetchFile(selectedBackground.imagePath),
    );
    console.log(
      "[*] Current Virtual FS after loading background image:",
      await ffmpeg.listDir("/"),
    );

    transformState = "1/2";

    // Generate FFmpeg filter with selected background's configuration
    const greenscreenFilter = DATA.generateGreenscreenFilter(
      selectedBackground.overlayConfig,
      fileSettings.greenscreenFillType,
      fileSettings.greenscreenScale,
    );
    console.log("Generated FFmpeg filter:", greenscreenFilter);

    await ffmpeg.exec([
      "-i",
      selectedBackground.id + ".png",
      "-i",
      file.name,
      "-filter_complex",
      greenscreenFilter,
      "-c:v",
      "libx264",
      "-c:a",
      "copy",
      "-preset",
      "ultrafast",
      `output${_i}.mp4`,
    ]);
    outputs.push(`output${_i}.mp4`);
    console.log(
      "[*] Current Virtual FS after first conversion:",
      await ffmpeg.listDir("/"),
    );
    _i++;

    transformState = "2/2";

    if (fileSettings.addBoczek) {
      console.log("Appending Boczek reaction");
      await ffmpeg.writeFile(
        DATA.NAME_TEMPLATE_VIDEO,
        await fetchFile(DATA.PATH_TEMPLATE_VIDEO),
      );

      // Use background dimensions for Boczek filter
      const boczekFilter = DATA.generateBoczekFilter(
        selectedBackground.overlayConfig.maxWidth,
        selectedBackground.overlayConfig.maxHeight,
        fileSettings.boczekFillType,
        fileSettings.boczekScale,
      );
      console.log("Generated Boczek filter:", boczekFilter);

      await ffmpeg.exec([
        "-i",
        outputs[_i - 1],
        "-i",
        DATA.NAME_TEMPLATE_VIDEO,
        "-filter_complex",
        boczekFilter,
        "-map",
        "[v]",
        "-map",
        "[a]",
        "-preset",
        "ultrafast",
        `output${_i}.mp4`,
      ]);
      outputs.push(`output${_i}.mp4`);
      console.log(
        "[*] Current Virtual FS after adding Boczek:",
        await ffmpeg.listDir("/"),
      );

      _i++;
    }
    // Add intro sound
    if (fileSettings.addIntro) {
      console.log("Adding intro audio sound");
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
      console.log(
        "[*] Current Virtual FS after adding intro:",
        await ffmpeg.listDir("/"),
      );

      _i++;
    }

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
      console.log("[*] File cleanup from Virtual FS: ", _fileDelete);
    }

    await ffmpeg.deleteFile(file.name);
    await ffmpeg.deleteFile(selectedBackground.id + ".png");
    console.log("[*] Cleanup original input file name: ", file.name);

    const dirList = await ffmpeg.listDir("/");
    console.log("[*] List of Virtual FS (after): ", dirList);
    console.log("[*] FFmpeg Virtual FS cleaned up.");
  }

  async function extractFrames(file: File): Promise<VideoFrame[]> {
    try {
      console.log("[*] Starting frame extraction");
      previewProgress.set({ stage: "extracting", current: 0 });
      const duration = await getVideoDuration(file);
      const timestamps = [duration * 0.25, duration * 0.5, duration * 0.75];

      const frames: VideoFrame[] = [];

      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        previewProgress.set({ stage: "extracting", current: i + 1 });
        console.log(`[*] Extracting frame at ${timestamp.toFixed(2)}s`);
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

      console.log(`[*] Extracted ${frames.length} frames`);
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
      console.log(
        `[*] Starting preview generation for ${frames.length} frames`,
      );
      previewProgress.set({ stage: "processing", current: 0 });

      const previewFrames: PreviewFrame[] = [];

      // Get the file settings and background
      const fileSettings =
        $videoSettings.find((s) => s.fileName === file.name)?.settings ||
        DEFAULT_SETTINGS;

      const selectedBackground = backgrounds.find(
        (bg) => bg.id === fileSettings.selectedBackground,
      );

      if (!selectedBackground) {
        throw new Error(
          `Background not found: ${fileSettings.selectedBackground}`,
        );
      }

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        previewProgress.set({ stage: "processing", current: i + 1 });
        console.log(
          `[*] Processing preview for timestamp ${frame.timestamp.toFixed(2)}s`,
        );

        try {
          await ffmpeg.writeFile(file.name, await fetchFile(file));
          await ffmpeg.writeFile(
            selectedBackground.id + ".png",
            await fetchFile(selectedBackground.imagePath),
          );

          // Create a temporary file from the frame blob
          const frameFileName = `input_frame_${frame.timestamp}.png`;
          await ffmpeg.writeFile(frameFileName, await fetchFile(frame.blob));

          // Process the frame with greenscreen effect
          await ffmpeg.exec([
            "-i",
            selectedBackground.id + ".png",
            "-i",
            frameFileName,
            "-filter_complex",
            DATA.generateGreenscreenFilter(
              selectedBackground.overlayConfig,
              fileSettings.greenscreenFillType,
              fileSettings.greenscreenScale,
            ),
            "-frames:v",
            "1",
            "-preset",
            "ultrafast",
            `preview_${frame.timestamp}.png`,
          ]);

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
          await ffmpeg.deleteFile(`preview_${frame.timestamp}.png`);
          await ffmpeg.deleteFile(frameFileName);
          await ffmpeg.deleteFile(file.name);
          await ffmpeg.deleteFile(selectedBackground.id + ".png");
          console.log(
            `[*] Generated preview for timestamp ${frame.timestamp.toFixed(2)}s`,
          );
        } catch (frameError) {
          console.error(
            `Error processing frame at ${frame.timestamp}s:`,
            frameError,
          );
          // Clean up any remaining files
          try {
            await ffmpeg.deleteFile(`preview_${frame.timestamp}.png`);
            await ffmpeg.deleteFile(`input_frame_${frame.timestamp}.png`);
            await ffmpeg.deleteFile(file.name);
            await ffmpeg.deleteFile(selectedBackground.id + ".png");
          } catch (cleanupError) {
            console.error("Error during cleanup:", cleanupError);
          }
          throw frameError;
        }
      }

      console.log("[*] Preview generation complete");
      return previewFrames;
    } catch (error) {
      console.error("Error during preview generation:", error);
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
      const baseUrl = "https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm";
      ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: `${baseUrl}/ffmpeg-core.js`,
        wasmURL: `${baseUrl}/ffmpeg-core.wasm`,
        log: true,
      });
      ffmpeg.on("log", ({ message }) => {
        console.log("FFmpeg Log:", message);
      });
      ffmpeg.on("progress", ({ progress }) => {
        $currentProcessingIndex !== null &&
          fileProgress.update((map) => {
            map.set($currentProcessingIndex, progress * 100);
            return map;
          });
      });
      state = "loaded";
    } catch (error) {
      toasts.add(
        "Błąd ładowania FFmpeg: " + error.message,
        "error",
        5000,
        true,
      );
    }
  }

  async function resetFfmpeg() {
    state = "loading";
    processingStarted.set(false); // Reset processing flag
    ffmpeg.terminate();
    loadFfmpeg();
  }

  onMount(() => {
    loadFfmpeg();
  });

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
      toasts.add(
        `Dodano ${files.length} ${files.length === 1 ? "plik" : "plików"} do przetworzenia`,
        "success",
        3000,
        false, // Regular events don't need OS notifications
      );
    }
  }

  // Function for removing file inputs and its settings
  const removeFile = (index: number, settingId: string) => {
    const filesArr = Array.from(files);
    const fileToRemove = filesArr[index];
    if (fileToRemove) {
      removeCachedPreview(fileToRemove);
      toasts.add(`Usunięto plik: ${fileToRemove.name}`, "info");
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
    toasts.add("Wyczyszczono listę plików", "info");
  }

  let showPreviewModal = false;
  let selectedPreviewUrl: string | null = null;
</script>

<!-- Add Toast component at the top level of your markup -->
<Toast />

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
        ✕
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4 animate-bounce"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 14l-7 7m0 0l-7-7m7 7V3"
      />
    </svg>
  </button>
</Header>
<!-- </ResponsiveContainer> -->

<!-- How it works section -->
<!-- <ResponsiveContainer> -->
<div class="card bg-base-100 shadow-xl" id="main-card">
  <div class="card-body">
    <!-- Section Title -->
    <div class="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h7"
        />
      </svg>
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Jak to działa
        </button>

        <button
          class="tab {activeTab === 'select-files'
            ? 'tab-active'
            : ''} flex items-center gap-2"
          on:click={() => (activeTab = "select-files")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Wybierz pliki
        </button>

        <button
          class="tab {activeTab === 'upload'
            ? 'tab-active'
            : ''} flex items-center gap-2"
          on:click={() => (activeTab = "upload")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Podgląd i ustawienia
        </button>

        <button
          class="tab {activeTab === 'results'
            ? 'tab-active'
            : ''} flex items-center gap-2"
          on:click={() => (activeTab = "results")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
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
          toasts.add("Wyczyszczono listę plików", "info");
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
