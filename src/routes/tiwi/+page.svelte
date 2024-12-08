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

  import * as DATA from "../Constans.svelte"; // reusable constans

  import { videoSettings } from "$lib/stores/videoSettingsStore";
  import { DEFAULT_SETTINGS } from "$lib/constants";

  import BottomNav from "../../components/BottomNav.svelte";

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
    videoSettings.updateSettings(key, target.checked);
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

  async function convertVideos(files: FileList) {
    console.log("Started batch video converting");
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
      const duration = await getVideoDuration(file);
      console.log("Video duration:", duration);
      await convertVideo(file, duration);
    }

    console.log("Converts done. Setting state.");
    transformState = "0/2";
    state = "convert.done";
    currentProcessingIndex.set(null);
    console.log("Finishing batch video converting");
  }

  // Apply ffmpeg logic to individual input file
  async function convertVideo(file: File, duration: number) {
    const fileSettings =
      $videoSettings.find((s) => s.fileName === file.name)?.settings ||
      DEFAULT_SETTINGS;

    let _i = 0;
    let outputs = [];
    await ffmpeg.writeFile(file.name, await fetchFile(file));
    // await ffmpeg.writeFile("input.webm", videData);
    // await ffmpeg.exec(["-i", "input.webm", "output.mp4"]);
    await ffmpeg.writeFile(
      DATA.NAME_GREENSCREEN_PNG,
      await fetchFile(DATA.PATH_GREENSCREEN_PNG),
    );
    transformState = "1/2";
    await ffmpeg.exec([
      "-i",
      DATA.NAME_GREENSCREEN_PNG,
      "-i",
      file.name,
      "-filter_complex",
      DATA.FFMPEG_FILTER_ADD_GREENSCREEN,
      "-c:v",
      "libx264",
      "-c:a",
      "copy",
      "-preset",
      "ultrafast",
      // `${DATA.NAME_TEMP_OUTPUT}-${_i}${DATA.NAME_TEMP_OUTPUT_FORMAT}`,
      `output${_i}.mp4`,
    ]);
    outputs.push(`output${_i}.mp4`);
    _i++;
    // await ffmpeg.readFile(DATA.NAME_TEMP_OUTPUT);

    transformState = "2/2";

    if (fileSettings.addBoczek) {
      console.log("Appending Boczek reaction");
      await ffmpeg.writeFile(
        DATA.NAME_TEMPLATE_VIDEO,
        await fetchFile(DATA.PATH_TEMPLATE_VIDEO),
      );
      await ffmpeg.exec([
        "-i",
        // DATA.NAME_TEMP_OUTPUT,
        // `${DATA.NAME_TEMP_OUTPUT}-${_i - 1}${DATA.NAME_TEMP_OUTPUT_FORMAT}`,
        outputs[_i - 1],
        "-i",
        DATA.NAME_TEMPLATE_VIDEO,
        "-filter_complex",
        DATA.FFMPEG_FILTER_ADD_BOCZEK,
        "-map",
        "[v]",
        "-map",
        "[a]",
        "-preset",
        "ultrafast",
        // DATA.NAME_TEMP_OUTPUT + _i + DATA.NAME_TEMP_OUTPUT_FORMAT,
        // `${DATA.NAME_TEMP_OUTPUT}-${_i}${DATA.NAME_TEMP_OUTPUT_FORMAT}`,
        `output${_i}.mp4`,
      ]);
      // await ffmpeg.readFile(DATA.NAME_TEMP_OUTPUT);
      outputs.push(`output${_i}.mp4`);

      _i++;
    }
    // Add intro sound
    if (fileSettings.addIntro) {
      console.log("Adding intro audio sound");
      await ffmpeg.writeFile(
        // DATA.NAME_TEMPLATE_VIDEO,
        DATA.NAME_INTRO_AUDIO,
        await fetchFile(DATA.NAME_INTRO_AUDIO),
      );
      await ffmpeg.exec([
        "-i",
        // DATA.NAME_TEMP_OUTPUT, // Input video file
        // `${DATA.NAME_TEMP_OUTPUT}-${_i - 1}${DATA.NAME_TEMP_OUTPUT_FORMAT}`,
        outputs[_i - 1],
        "-i",
        DATA.NAME_INTRO_AUDIO, // Input audio file
        "-filter_complex",
        DATA.FFMPEG_FILTER_ADD_INTRO, // Filter complex with variable
        "-c:v",
        "copy", // Copy video stream without re-encoding
        // DATA.NAME_TEMP_OUTPUT + _i + DATA.NAME_TEMP_OUTPUT_FORMAT, // Output file name
        // "output.mp4", // Output file name
        // `${DATA.NAME_TEMP_OUTPUT}-${_i}${DATA.NAME_TEMP_OUTPUT_FORMAT}`,
        `output${_i}.mp4`,
      ]);
      // await ffmpeg.writeFile(DATA.NAME_TEMP_OUTPUT, DATA.NAME_TEMP_OUTPUT);
      // await ffmpeg.readFile(DATA.NAME_TEMP_OUTPUT);
      outputs.push(`output${_i}.mp4`);

      _i++;
    }

    // if (transformSettings.addWatermark) {
    //   console.log("[*] Adding watermark");
    //   await ffmpeg.writeFile(
    //     // DATA.NAME_TEMPLATE_VIDEO,
    //     DATA.NAME_WATERMARK,
    //     await fetchFile(DATA.NAME_WATERMARK),
    //   ),
    //     await ffmpeg.exec([
    //       "-i",
    //       outputs[_i - 1],
    //       "-i",
    //       DATA.NAME_WATERMARK, // Watermark file
    //       "-filter_complex",
    //       DATA.FFMPEG_FILTER_ADD_WATERMARK, // Filter complex with variable
    //       "-c:a",
    //       "copy",
    //       `output${_i}.mp4`,
    //     ]);

    //   outputs.push(`output${_i}.mp4`);

    //   _i++;
    // }

    // const data = await ffmpeg.readFile("output.mp4");
    // const data = await ffmpeg.readFile(DATA.NAME_TEMP_OUTPUT);
    const data = await ffmpeg.readFile(
      // `${DATA.NAME_TEMP_OUTPUT}-${_i}${DATA.NAME_TEMP_OUTPUT_FORMAT}`,
      `output${_i - 1}.mp4`,
    );

    const blob = new Blob([data.buffer], { type: "video/mp4" });

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

    // console.log("[*] Attempting cleanup of Virtual FS");
    // let dirList = await ffmpeg.listDir("/");
    // console.log("[*] List of Virtual FS (before): ", dirList);

    for (const output of outputs) {
      const _fileDelete = await ffmpeg.deleteFile(output);
      console.log("[*] File cleanup from Virtual FS: ", _fileDelete);
    }

    const _fileDelete = await ffmpeg.deleteFile(file.name);
    console.log("[*] Cleanup original input file name: ", _fileDelete);

    const dirList = await ffmpeg.listDir("/");
    console.log("[*] List of Virtual FS (after): ", dirList);
    console.log("[*] FFmpeg Virtual FS cleaned up.");
  }

  async function extractFrames(file: File): Promise<VideoFrame[]> {
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
  }

  async function generatePreview(
    file: File,
    frames: VideoFrame[],
  ): Promise<PreviewFrame[]> {
    console.log(`[*] Starting preview generation for ${frames.length} frames`);
    previewProgress.set({ stage: "processing", current: 0 });

    const previewFrames: PreviewFrame[] = [];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      previewProgress.set({ stage: "processing", current: i + 1 });
      console.log(
        `[*] Processing preview for timestamp ${frame.timestamp.toFixed(2)}s`,
      );
      await ffmpeg.writeFile(file.name, await fetchFile(file));
      await ffmpeg.writeFile(
        DATA.NAME_GREENSCREEN_PNG,
        await fetchFile(DATA.PATH_GREENSCREEN_PNG),
      );

      // Create a temporary file from the frame blob
      const frameFileName = `input_frame_${frame.timestamp}.png`;
      await ffmpeg.writeFile(frameFileName, await fetchFile(frame.blob));

      // Process the frame with greenscreen effect
      await ffmpeg.exec([
        "-i",
        DATA.NAME_GREENSCREEN_PNG,
        "-i",
        frameFileName,
        "-filter_complex",
        DATA.FFMPEG_FILTER_ADD_GREENSCREEN,
        "-frames:v",
        "1",
        "-preset",
        "ultrafast",
        `preview_${frame.timestamp}.png`,
      ]);

      const previewData = await ffmpeg.readFile(
        `preview_${frame.timestamp}.png`,
      );
      const previewBlob = new Blob([previewData.buffer], { type: "image/png" });
      const url = URL.createObjectURL(previewBlob);

      previewFrames.push({
        timestamp: frame.timestamp,
        url,
      });

      // Cleanup
      await ffmpeg.deleteFile(`preview_${frame.timestamp}.png`);
      await ffmpeg.deleteFile(frameFileName);
      await ffmpeg.deleteFile(file.name);
      console.log(
        `[*] Generated preview for timestamp ${frame.timestamp.toFixed(2)}s`,
      );
    }

    console.log("[*] Preview generation complete");
    return previewFrames;
  }

  // Save on disk individual processed file
  function downloadVideo(fileBlob, fileName) {
    // const blob = new Blob([videoData.buffer], { type: "video/mp4" });
    const downloadFileName = "kiepskietv-" + fileName + ".mp4";

    saveAs(fileBlob, downloadFileName); // Trigger file picker and save
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
    const baseUrl = "https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm";
    ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: `${baseUrl}/ffmpeg-core.js`,
      wasmURL: `${baseUrl}/ffmpeg-core.wasm`,
    });
    ffmpeg.on("progress", ({ progress }) => {
      $currentProcessingIndex !== null &&
        fileProgress.update((map) => {
          map.set($currentProcessingIndex, progress * 100);
          return map;
        });
    });
    state = "loaded";
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
  }

  // Function for removing file inputs and its settings
  const removeFile = (index: number, settingId: string) => {
    const filesArr = Array.from(files);
    // Remove preview from cache before removing the file
    const fileToRemove = filesArr[index];
    if (fileToRemove) {
      removeCachedPreview(fileToRemove);
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
    previewCache.set(cacheKey, {
      frames,
      timestamp: Date.now(),
    });
  }

  // Function to remove preview from cache
  function removeCachedPreview(file: File): void {
    const cacheKey = getPreviewCacheKey(file);
    console.log("[*] Removing cached preview for", file.name);
    previewCache.delete(cacheKey);
  }

  // Function to generate or get cached preview
  async function getOrGeneratePreview(file: File): Promise<PreviewFrame[]> {
    const cached = getCachedPreview(file);
    if (cached) {
      return cached;
    }

    const frames = await extractFrames(file).then((frames) =>
      generatePreview(file, frames),
    );
    cachePreview(file, frames);
    return frames;
  }

  // Update the type definition for activeTab
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

  // Add this function to handle select change with type safety
  function handleSelectChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value as
      | "how-it-works"
      | "select-files"
      | "upload"
      | "results";
    activeTab = value;
  }
</script>

<!-- <CenteredContainer> -->
<NavBar />

<!-- <ResponsiveContainer> -->
<Header title={DATA.APP_TITLE} description={DATA.APP_DESC}>
  <p class="text-lg">
    Twoje wideo nigdzie nie jest wysłane - obróbka jest 100% offline
  </p>
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
    <div class="flex items-center gap-2 mb-4">
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
      <div class="mt-4" transition:fade={{ duration: 200 }}>
        <div class="card bg-base-200">
          <div class="card-body space-y-6">
            <!-- Timeline Overview -->
            <div class="hidden lg:block">
              <ul class="steps steps-horizontal w-full">
                <li class="step step-primary" data-content="1">
                  <div class="text-xs text-center max-w-[120px]">
                    <span class="font-semibold">Wybierz pliki</span>
                    <br />
                    <span class="text-base-content/60"
                      >Dodaj jedno lub więcej wideo</span
                    >
                  </div>
                </li>
                <li class="step step-primary" data-content="2">
                  <div class="text-xs text-center max-w-[120px]">
                    <span class="font-semibold">Dostosuj</span>
                    <br />
                    <span class="text-base-content/60"
                      >Wybierz efekty i zobacz podgląd</span
                    >
                  </div>
                </li>
                <li class="step step-primary" data-content="3">
                  <div class="text-xs text-center max-w-[120px]">
                    <span class="font-semibold">Przetwórz</span>
                    <br />
                    <span class="text-base-content/60">Kliknij "Okiłizuj"</span>
                  </div>
                </li>
                <li class="step step-primary" data-content="4">
                  <div class="text-xs text-center max-w-[120px]">
                    <span class="font-semibold">Gotowe!</span>
                    <br />
                    <span class="text-base-content/60"
                      >Pobierz lub udostępnij</span
                    >
                  </div>
                </li>
              </ul>
            </div>

            <!-- Mobile Timeline - Make it more compact -->
            <div class="block lg:hidden">
              <ul class="steps steps-vertical min-h-[200px]">
                <li class="step step-primary">
                  <div class="text-sm ml-2 text-left">
                    <span class="font-semibold">1. Wybierz pliki</span>
                    <br />
                    <span class="text-base-content/60 text-xs"
                      >Dodaj jedno lub więcej wideo</span
                    >
                  </div>
                </li>
                <li class="step step-primary">
                  <div class="text-sm ml-2 text-left">
                    <span class="font-semibold">2. Dostosuj</span>
                    <br />
                    <span class="text-base-content/60 text-xs"
                      >Wybierz efekty i zobacz podgląd</span
                    >
                  </div>
                </li>
                <li class="step step-primary">
                  <div class="text-sm ml-2 text-left">
                    <span class="font-semibold">3. Przetwórz</span>
                    <br />
                    <span class="text-base-content/60 text-xs"
                      >Kliknij "Okiłizuj"</span
                    >
                  </div>
                </li>
                <li class="step step-primary">
                  <div class="text-sm ml-2 text-left">
                    <span class="font-semibold">4. Gotowe!</span>
                    <br />
                    <span class="text-base-content/60 text-xs"
                      >Pobierz lub udostępnij</span
                    >
                  </div>
                </li>
              </ul>
            </div>

            <div class="divider">Szczegółowa instrukcja</div>

            <!-- Desktop Two-Column Layout -->
            <div class="flex flex-col lg:flex-row lg:gap-8">
              <!-- Left Column (Instructions) - 2/3 width -->
              <div class="lg:w-2/3">
                <h2 class="card-title text-2xl">Jak to działa?</h2>

                <!-- Steps 1-4 -->
                <div class="space-y-6 mt-4">
                  <!-- Step 1 -->
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <div class="badge badge-primary">1</div>
                      <h3 class="text-lg font-semibold">Wybierz pliki</h3>
                    </div>
                    <p class="text-base-content/80">
                      Wybierz jedno lub więcej wideo do przetworzenia. Możesz
                      dodać kilka plików naraz - każdy zostanie przetworzony po
                      kolei.
                    </p>
                  </div>

                  <!-- Step 2 -->
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <div class="badge badge-primary">2</div>
                      <h3 class="text-lg font-semibold">Dostosuj ustawienia</h3>
                    </div>
                    <p class="text-base-content/80">
                      Dla każdego wideo możesz wybrać efekty:
                    </p>
                    <ul class="list-disc list-inside ml-4 text-base-content/80">
                      <li>Dodaj dźwięk przejścia z "Kiepskich"</li>
                      <li>Dodaj reakcję Boczka na koniec</li>
                    </ul>
                    <p class="text-base-content/80">
                      Przed przetworzeniem zobaczysz podgląd kilku klatek, jak
                      będzie wyglądać efekt końcowy.
                    </p>
                  </div>

                  <!-- Step 3 -->
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <div class="badge badge-primary">3</div>
                      <h3 class="text-lg font-semibold">Przetwórz wideo</h3>
                    </div>
                    <p class="text-base-content/80">
                      Kliknij "Okiłizuj" aby rozpocząć przetwarzanie. Wszystko
                      dzieje się lokalnie w twojej przeglądarce - żadne pliki
                      nie są NIGDZIE na serwer.
                    </p>
                  </div>

                  <!-- Step 4 -->
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <div class="badge badge-primary">4</div>
                      <h3 class="text-lg font-semibold">
                        Pobierz lub udostępnij
                      </h3>
                    </div>
                    <p class="text-base-content/80">Po przetworzeniu możesz:</p>
                    <ul class="list-disc list-inside ml-4 text-base-content/80">
                      <li>Pobrać wideo na urządzenie</li>
                      <li>Udostępnić bezpośrednio przez menu udostępniania</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Right Column (Example Video) - 1/3 width -->
              <div class="lg:w-1/3 mt-6 lg:mt-0">
                <div class="sticky top-4">
                  <h3 class="text-lg font-semibold mb-2">Zobacz przykład:</h3>
                  <div class="bg-base-300 rounded-lg overflow-hidden">
                    <div class="aspect-video">
                      <video
                        src={DATA.EXAMPLE_URL}
                        controls
                        class="w-full h-full object-contain"
                      ></video>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Select Files Section -->
    {#if activeTab === "select-files"}
      <div class="mt-4" transition:fade={{ duration: 200 }}>
        <div class="card bg-base-200">
          <div class="card-body">
            <div
              class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4"
            >
              <h2 class="card-title">Wybierz pliki do przetworzenia</h2>
            </div>

            <p class="text-lg mb-4">
              Dropnij wideło albo kliknij by "załonczyć"
            </p>

            <label class="form-control w-full">
              <input
                type="file"
                name="file"
                multiple
                bind:files
                accept="video/*"
                class="file-input file-input-bordered w-full file-input-sm sm:file-input-md {files &&
                files.length > 0
                  ? 'file-input-success'
                  : ''}"
              />
              <div class="label flex flex-col items-start gap-1">
                <span class="label-text-alt text-gray-400"
                  >Max. wielkość 2GB. Testowane na plikach mp4/webm poniżej 60
                  sekund.</span
                >
                <span class="label-text-alt text-gray-400"
                  >Twoje pliki nigdzie nie są wysyłane - <span class="font-bold"
                    >obróbka jest offline</span
                  >.</span
                >
              </div>
            </label>
            <button
              class="btn btn-sm btn-error btn-outline gap-2 {!files?.length
                ? 'btn-disabled'
                : ''}"
              on:click={() => {
                // Clear all previews from cache
                Array.from(files || []).forEach((file) => {
                  removeCachedPreview(file);
                });
                const _dataTransfer = new DataTransfer();
                files = _dataTransfer.files;
                selectedFileIndex = undefined;
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Wyczyść listę plików
            </button>
            <div class="alert alert-info mt-4 sm:alert-lg alert-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="text-xs sm:text-base"
                >Po wybraniu plików zostaniesz przeniesiony do zakładki "Wrzuć
                wideło" gdzie możesz dostosować ustawienia.</span
              >
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Upload Section -->
    {#if activeTab === "upload"}
      <div class="mt-4" transition:fade={{ duration: 200 }}>
        {#if state === "loading"}
          <div class="flex items-center justify-center">
            <span class="loading loading-spinner loading-lg"></span>
            <p class="ml-2">Ładuję ffmpeg...</p>
          </div>
        {:else if state === "loaded" || state === "convert.done"}
          <div class="card bg-base-200 mt-4">
            <div class="card-body">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <!-- File List -->
                <div class="lg:col-span-1 overflow-x-auto">
                  <div class="flex flex-col gap-2">
                    <!-- Mobile Select -->
                    <div class="lg:hidden">
                      <div class="flex flex-col gap-2">
                        <select
                          class="select select-bordered w-full {files?.length
                            ? 'select-primary'
                            : ''}"
                          value={selectedFileIndex}
                          on:change={(e) =>
                            (selectedFileIndex = Number(e.currentTarget.value))}
                          disabled={!files?.length}
                        >
                          <option
                            value={undefined}
                            disabled
                            selected={selectedFileIndex === undefined}
                          >
                            {files?.length
                              ? "Wybierz plik do edycji"
                              : "Brak plików"}
                          </option>
                          {#each Array.from(files || []) as file, i}
                            <option value={i}>
                              {file.name} ({(file.size / (1024 * 1024)).toFixed(
                                2,
                              )} MB)
                            </option>
                          {/each}
                        </select>

                        <!-- Add mobile file removal button when a file is selected -->
                        {#if selectedFileIndex !== undefined && files[selectedFileIndex]}
                          {@const settingId =
                            $videoSettings[selectedFileIndex]?.id}
                          <button
                            class="btn btn-error btn-outline btn-sm gap-2 w-full"
                            on:click={() => {
                              const currentIndex = selectedFileIndex;
                              removeFile(currentIndex, settingId);
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Usuń wybrany plik
                          </button>
                        {/if}
                      </div>
                    </div>

                    <!-- Desktop List -->
                    <div class="hidden lg:block">
                      <div class="flex flex-col gap-2">
                        {#if !files?.length}
                          <div class="text-center p-8 bg-base-100 rounded-lg">
                            <svg
                              class="mx-auto h-12 w-12 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            <h3 class="mt-2 text-sm font-medium">
                              Brak plików
                            </h3>
                            <p class="mt-1 text-sm text-gray-500">
                              Wybierz pliki do przetworzenia
                            </p>
                          </div>
                        {/if}
                        {#each Array.from(files || []) as file, i}
                          {@const settingId = $videoSettings[i]?.id}
                          {@const isSelected = selectedFileIndex === i}
                          <button
                            class="card bg-base-100 hover:bg-base-200 transition-colors {isSelected
                              ? 'ring-2 ring-primary'
                              : ''}"
                            on:click={() => (selectedFileIndex = i)}
                          >
                            <div class="card-body p-4 relative">
                              <div class="pr-10">
                                <!-- Add padding-right to make space for the delete button -->
                                <h4 class="font-medium break-all text-left">
                                  {file.name}
                                </h4>
                                <p class="text-sm text-gray-500 text-left">
                                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                              <div class="absolute right-4 top-4">
                                <button
                                  class="btn btn-sm btn-square btn-error btn-outline"
                                  on:click|stopPropagation={() =>
                                    removeFile(i, settingId)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </button>
                        {/each}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Preview and Settings -->
                <div class="lg:col-span-2">
                  {#if !files?.length}
                    <div class="card bg-base-100">
                      <div class="card-body">
                        <div class="text-center text-gray-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-12 w-12 mx-auto mb-4"
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
                          <p>Wybierz pliki aby zobaczyć podgląd i ustawienia</p>
                        </div>
                      </div>
                    </div>
                  {/if}
                  {#if selectedFileIndex !== undefined && files[selectedFileIndex]}
                    {@const file = files[selectedFileIndex]}
                    {@const settingId = $videoSettings[selectedFileIndex]?.id}
                    <div class="card bg-base-100">
                      <div class="card-body">
                        <!-- Mobile tabs -->
                        <div class="lg:hidden tabs tabs-boxed mb-4">
                          <button
                            class="tab flex-1 {!showSettings
                              ? 'tab-active'
                              : ''}"
                            on:click={() => (showSettings = false)}
                          >
                            Podgląd
                          </button>
                          <button
                            class="tab flex-1 {showSettings
                              ? 'tab-active'
                              : ''}"
                            on:click={() => (showSettings = true)}
                          >
                            Ustawienia
                          </button>
                        </div>

                        <!-- Desktop title -->
                        <h3 class="card-title text-lg hidden lg:block">
                          Podgląd i ustawienia
                        </h3>

                        <!-- Preview -->
                        <div
                          class="space-y-4 {showSettings
                            ? 'hidden lg:block'
                            : ''}"
                        >
                          <div
                            class="bg-base-300 rounded-lg overflow-hidden lg:min-h-[400px]"
                          >
                            {#await getOrGeneratePreview(file)}
                              <div
                                class="w-full h-[400px] flex flex-col items-center justify-center gap-4"
                              >
                                <div class="flex flex-col items-center gap-2">
                                  <span
                                    class="loading loading-spinner loading-lg"
                                  ></span>
                                  <div
                                    class="text-sm text-gray-500 text-center"
                                  >
                                    <p>Generowanie podglądu...</p>
                                    <p class="text-xs mt-1">
                                      {#if $previewProgress.stage === "extracting"}
                                        Wyciąganie klatki {$previewProgress.current}/3
                                      {:else if $previewProgress.stage === "processing"}
                                        Przetwarzanie klatki {$previewProgress.current}/3
                                      {/if}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            {:then frames}
                              {#if frames.length > 0}
                                <!-- Main preview image -->
                                <div
                                  class="relative flex flex-col lg:flex-row items-center lg:items-start gap-4 p-4"
                                >
                                  <div class="flex-1">
                                    <img
                                      src={frames[selectedPreviewIndex].url}
                                      alt="Podgląd"
                                      class="max-w-full max-h-[400px] w-auto h-auto object-contain mx-auto"
                                    />
                                    <!-- Timestamp indicator -->
                                    <div
                                      class="text-center text-sm text-gray-500 mt-2"
                                    >
                                      Klatka z {frames[
                                        selectedPreviewIndex
                                      ].timestamp.toFixed(1)}s
                                    </div>
                                  </div>
                                  <!-- Frame picker thumbnails -->
                                  <div class="w-full lg:w-32 flex-none">
                                    <div
                                      class="text-sm text-gray-500 mb-2 text-center"
                                    >
                                      {#if frames.length > 0}
                                        <span class="hidden lg:inline"
                                          >Podgląd klatek</span
                                        >
                                        <span class="lg:hidden"
                                          >Podgląd z {selectedPreviewIndex +
                                            1}/{frames.length} klatki ({frames[
                                            selectedPreviewIndex
                                          ].timestamp.toFixed(1)}s)</span
                                        >
                                      {/if}
                                    </div>
                                    <!-- Desktop thumbnails -->
                                    <div
                                      class="hidden lg:flex lg:flex-col gap-2 justify-center"
                                    >
                                      {#each frames as frame, i}
                                        <button
                                          class="relative w-24 lg:w-full aspect-video group"
                                          on:click={() => {
                                            console.log(
                                              `[*] Selecting preview frame ${i} (${frame.timestamp.toFixed(2)}s)`,
                                            );
                                            selectedPreviewIndex = i;
                                          }}
                                        >
                                          <div
                                            class="absolute inset-0 rounded-lg border-2 transition-all {selectedPreviewIndex ===
                                            i
                                              ? 'border-primary bg-primary/10 shadow-lg'
                                              : 'border-base-100 group-hover:border-primary/50'}"
                                          />
                                          <img
                                            src={frame.url}
                                            alt="Podgląd klatki {i + 1}"
                                            class="w-full h-full object-cover rounded-lg"
                                          />
                                          {#if selectedPreviewIndex === i}
                                            <div
                                              class="absolute -left-2 top-1/2 -translate-y-1/2"
                                            >
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                class="h-4 w-4 text-primary"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                              >
                                                <path
                                                  fill-rule="evenodd"
                                                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                                  clip-rule="evenodd"
                                                />
                                              </svg>
                                            </div>
                                          {/if}
                                          <div
                                            class="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/50 rounded text-[10px] text-white"
                                          >
                                            {frame.timestamp.toFixed(1)}s
                                          </div>
                                        </button>
                                      {/each}
                                    </div>

                                    <!-- Mobile navigation arrows -->
                                    <div
                                      class="flex lg:hidden justify-center items-center gap-4"
                                    >
                                      <button
                                        class="btn btn-circle btn-sm {selectedPreviewIndex ===
                                        0
                                          ? 'btn-disabled'
                                          : ''}"
                                        on:click={() =>
                                          (selectedPreviewIndex = Math.max(
                                            0,
                                            selectedPreviewIndex - 1,
                                          ))}
                                        disabled={selectedPreviewIndex === 0}
                                        aria-label="Poprzednia klatka"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          class="h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M15 19l-7-7 7-7"
                                          />
                                        </svg>
                                      </button>

                                      <button
                                        class="btn btn-circle btn-sm {selectedPreviewIndex ===
                                        frames.length - 1
                                          ? 'btn-disabled'
                                          : ''}"
                                        on:click={() =>
                                          (selectedPreviewIndex = Math.min(
                                            frames.length - 1,
                                            selectedPreviewIndex + 1,
                                          ))}
                                        disabled={selectedPreviewIndex ===
                                          frames.length - 1}
                                        aria-label="Następna klatka"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          class="h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 5l7 7-7 7"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              {/if}
                            {:catch error}
                              <div
                                class="w-full h-full flex items-center justify-center"
                              >
                                <div class="alert alert-error">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="stroke-current shrink-0 h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span>Error: {error.message}</span>
                                </div>
                              </div>
                            {/await}
                          </div>
                        </div>

                        <!-- Settings -->
                        <div class="divider hidden lg:flex">Ustawienia</div>
                        <div
                          class="grid grid-cols-1 md:grid-cols-2 gap-4 {!showSettings
                            ? 'hidden lg:grid'
                            : ''}"
                        >
                          <label
                            class="flex items-center gap-4 p-4 bg-base-200 rounded-lg"
                          >
                            <span class="flex-1"
                              >Dodaj efekt dźwiękowy przejścia</span
                            >
                            <input
                              type="checkbox"
                              class="toggle toggle-success"
                              checked={$videoSettings[selectedFileIndex]
                                ?.settings.addIntro}
                              on:change={(e) =>
                                videoSettings.updateSettings(settingId, {
                                  addIntro: e.target.checked,
                                })}
                            />
                          </label>
                          <label
                            class="flex items-center gap-4 p-4 bg-base-200 rounded-lg"
                          >
                            <span class="flex-1">Dodaj reakcję Boczka</span>
                            <input
                              type="checkbox"
                              class="toggle toggle-success"
                              checked={$videoSettings[selectedFileIndex]
                                ?.settings.addBoczek}
                              on:change={(e) =>
                                videoSettings.updateSettings(settingId, {
                                  addBoczek: e.target.checked,
                                })}
                            />
                          </label>
                        </div>
                        <div class="card-actions justify-end mt-4">
                          <button
                            class="btn btn-ghost btn-sm"
                            on:click={() =>
                              videoSettings.resetToDefault(settingId)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Reset ustawień
                          </button>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          </div>

          <!-- Convert Button -->
          <div class="card-actions justify-end mt-4">
            <button
              on:click={() => convertVideos(files)}
              class="btn btn-primary btn-lg gap-2 {!files
                ? 'btn-disabled'
                : ''}"
            >
              Okiłizuj
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        {:else if state === "convert.start"}
          <div class="card bg-base-200">
            <div class="card-body">
              <div class="card-actions justify-center">
                <button on:click={resetFfmpeg} class="btn btn-error gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Anuluj przetwarzanie
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Results Section -->
    {#if activeTab === "results"}
      <div class="mt-4" transition:fade={{ duration: 200 }}>
        <!-- Move existing results section content here -->
        {#if files?.length > 0 && $processingStarted}
          {#each Array.from(files) as file, i}
            <div class="card bg-base-200 mt-4">
              <div class="card-body">
                <div class="flex flex-col gap-4">
                  <!-- Title and status -->
                  <div class="flex items-center">
                    <h3 class="card-title text-base">
                      {file.name}
                      {#if $currentProcessingIndex === i}
                        <div class="badge badge-primary">Przetwarzanie</div>
                      {:else if videoDataList[i]}
                        <div class="badge badge-success">Gotowe</div>
                      {:else if state === "convert.start"}
                        <div class="badge">W kolejce</div>
                      {/if}
                    </h3>
                  </div>

                  <!-- Progress bar - outside accordion -->
                  {#if state === "convert.start"}
                    <div class="space-y-2">
                      <div
                        class="flex justify-between text-sm {$currentProcessingIndex !==
                        i
                          ? 'text-gray-400'
                          : ''}"
                      >
                        <span>
                          {#if $currentProcessingIndex === i}
                            Przetwarzanie...
                          {:else if i > ($currentProcessingIndex ?? -1)}
                            Czeka w kolejce...
                          {:else}
                            Finalizowanie...
                          {/if}
                        </span>
                        <span>{($fileProgress.get(i) || 0).toFixed(0)}%</span>
                      </div>
                      <progress
                        class="progress w-full {$currentProcessingIndex === i
                          ? 'progress-primary'
                          : 'progress-ghost'}"
                        value={$fileProgress.get(i) || 0}
                        max="100"
                      />
                      {#if transformState !== "0/2" && $currentProcessingIndex === i}
                        <div class="text-xs text-gray-500">
                          Etap {transformState}
                        </div>
                      {/if}
                    </div>
                  {/if}

                  <!-- Content -->
                  <div
                    class="collapse collapse-arrow bg-base-100 lg:collapse-open"
                  >
                    <input type="checkbox" />
                    <div class="collapse-title text-sm font-medium lg:hidden">
                      {#if videoDataList[i]}
                        Kliknij aby zobaczyć wideo
                      {:else if $currentProcessingIndex === i}
                        Kliknij aby zobaczyć postęp
                      {:else}
                        Kliknij aby zobaczyć status
                      {/if}
                    </div>
                    <div class="collapse-content">
                      {#if videoDataList[i]}
                        <!-- Processed video with buttons - desktop layout -->
                        <div class="flex flex-col lg:flex-row gap-4">
                          <!-- Video container - takes 2/3 width on desktop -->
                          <div class="lg:w-2/3">
                            <div class="aspect-video max-h-[500px]">
                              <video
                                src={videoDataList[i].videoBlobURL}
                                controls
                                autoplay={false}
                                class="w-full h-full rounded-lg object-contain bg-black"
                              />
                            </div>
                          </div>

                          <!-- Buttons container - takes 1/3 width and full height on desktop -->
                          <div
                            class="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-1/3 lg:justify-start"
                          >
                            <button
                              class="btn btn-primary btn-sm gap-2 w-full"
                              on:click={() =>
                                downloadVideo(
                                  videoDataList[i].videoBlob,
                                  videoDataList[i].videoName,
                                )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              <span>Zapisz</span>
                            </button>
                            <button
                              class="btn btn-secondary btn-sm gap-2 w-full"
                              on:click={() =>
                                shareVideo(
                                  videoDataList[i].videoBlob,
                                  videoDataList[i].videoName,
                                )}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                />
                              </svg>
                              <span>Udostępnij</span>
                            </button>
                          </div>
                        </div>
                      {:else}
                        <!-- Waiting to process -->
                        <div
                          class="flex items-center justify-center py-8 text-gray-500"
                        >
                          {#if i > ($currentProcessingIndex ?? -1)}
                            <!-- Waiting -->
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-12 w-12"
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
                            <span class="ml-3">Czeka na przetworzenie</span>
                          {:else}
                            <!-- Already processed but no result yet -->
                            <div
                              class="loading loading-spinner loading-lg"
                            ></div>
                            <span class="ml-3">Finalizowanie...</span>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        {:else}
          <!-- No files selected or processing not started -->
          <div class="text-center py-8 text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12 mx-auto mb-4"
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
            <p>
              {#if files?.length > 0}
                Kliknij "Okiłizuj" aby rozpocząć przetwarzanie
              {:else}
                Wybierz pliki do przetworzenia w zakładce "Wrzuć wideło" an
                następnie kliknij "Okiłizuj"
              {/if}
            </p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
<!-- </ResponsiveContainer> -->
<!-- </CenteredContainer> -->

<BottomNav
  {activeTab}
  videoCount={videoDataList.length}
  on:click={(e) => {
    const button = e.target.closest("button");
    if (button) {
      if (button.classList.contains("active")) return;
      if (button.querySelector(".btm-nav-label").textContent === "Info")
        activeTab = "how-it-works";
      else if (button.querySelector(".btm-nav-label").textContent === "Pliki")
        activeTab = "select-files";
      else if (button.querySelector(".btm-nav-label").textContent === "Edycja")
        activeTab = "upload";
      else if (button.querySelector(".btm-nav-label").textContent === "Wideo")
        activeTab = "results";
    }
  }}
>
  <Footer />
</BottomNav>

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
