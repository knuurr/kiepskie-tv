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

  const previewUrl = writable("");

  let selectedFileIndex: number | undefined = undefined;

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
  const readFromBlobOrFile = (blob: Blob): Promise<Uint8Array> =>
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
  const fetchFile = async (
    file: string | URL | File | Blob,
  ): Promise<Uint8Array> => {
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

  async function convertVideos(files: FileList) {
    console.log("Started batch video converting");
    console.log(files);
    // Reset array of processed videos
    // To avoid appending new videos to past processing
    // So that only new video will be presented in Twoje wideo
    videoDataList = [];
    state = "convert.start";
    for (const file of files) {
      // Your code to be executed for each element
      console.log("About to convert: " + file.name);
      const duration = await getVideoDuration(file);
      console.log("Video duration:", duration);
      await convertVideo(file, duration);
    }
    console.log("Converts done. Setting state.");
    // console.log(videoDataList);
    transformState = "0/2";
    state = "convert.done";
    console.log("Finishing batch video converting");
    const _dataTransfer = new DataTransfer();
    // filesArr.forEach((_file) => _dataTransfer.items.add(_file));
    files = _dataTransfer.files;
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
    videoDataList.push({
      videoName: file.name,
      videoBlob: blob,
      videoBlobURL: URL.createObjectURL(blob),
    });

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

  async function generatePreview(file) {
    console.log("[*] Attempting to generate preview:");
    await ffmpeg.writeFile(file.name, await fetchFile(file));
    await ffmpeg.writeFile(
      DATA.NAME_GREENSCREEN_PNG,
      await fetchFile(DATA.PATH_GREENSCREEN_PNG),
    );

    await ffmpeg.exec([
      "-i",
      DATA.NAME_GREENSCREEN_PNG,
      "-i",
      file.name,
      "-filter_complex",
      DATA.FFMPEG_FILTER_ADD_GREENSCREEN,
      "-frames:v",
      "1",
      "-preset",
      "ultrafast",
      "preview_image.png",
    ]);

    const previewData = await ffmpeg.readFile(
      // `${DATA.NAME_TEMP_OUTPUT}-${_i}${DATA.NAME_TEMP_OUTPUT_FORMAT}`,
      "preview_image.png",
    );

    // console.log("previewData ", previewData);
    const blob = new Blob([previewData.buffer], { type: "image/png" });
    const previewImgBlobURL = URL.createObjectURL(blob);
    // console.log("blob ", blob);

    const _fileDelete = await ffmpeg.deleteFile("preview_image.png");
    console.log("[*] File cleanup from Virtual FS: ", _fileDelete);

    // console.log(previewImgBlobURL);

    return URL.createObjectURL(blob);
    // previewUrl.set(previewBlobUrl);

    // return;
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
      $progress = progress * 100;
    });
    state = "loaded";
  }

  async function resetFfmpeg() {
    state = "loading";
    ffmpeg.terminate();
    loadFfmpeg();
  }

  onMount(() => {
    loadFfmpeg();
  });

  $: console.log({ state });

  // Add file settings when files are selected
  $: if (files) {
    videoSettings.reset();
    Array.from(files).forEach((file) => {
      videoSettings.addFile(file.name);
    });
    selectedFileIndex = files.length > 0 ? 0 : undefined;
  }

  // Add removeFile function back
  const removeFile = (index: number, settingId: string) => {
    const filesArr = Array.from(files);
    filesArr.splice(index, 1);
    const _dataTransfer = new DataTransfer();
    filesArr.forEach((_file) => _dataTransfer.items.add(_file));
    files = _dataTransfer.files;
    videoSettings.removeFile(settingId);

    // Update selectedFileIndex after removal
    if (selectedFileIndex !== undefined) {
      if (filesArr.length === 0) {
        selectedFileIndex = undefined;
      } else if (selectedFileIndex >= filesArr.length) {
        selectedFileIndex = filesArr.length - 1;
      }
    }
  };
</script>

<!-- <CenteredContainer> -->
<NavBar />

<!-- <ResponsiveContainer> -->
<Header title={DATA.APP_TITLE} description={DATA.APP_DESC}>
  <p class="text-lg">
    Twoje wideo nigdzie nie jest wysłane - obróbka jest 100% offline
  </p>
</Header>
<!-- </ResponsiveContainer> -->

<!-- How it works section -->
<!-- <ResponsiveContainer> -->
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Jak to działa?</h2>

    <div class="collapse collapse-plus bg-base-200">
      <input type="checkbox" />
      <div class="collapse-title text-lg font-medium">Zobacz przykład</div>
      <div class="collapse-content text-sm">
        <div class="steps steps-vertical">
          <div class="step step-primary">Załącz swoje wideo</div>
          <div class="step step-primary">Dobierz ustawienia</div>
          <div class="step step-primary">Poczekaj aż sie przeprocesują</div>
          <div class="step step-primary">Profit</div>
        </div>
        <div id="video-container" class="mt-4">
          <video src={DATA.EXAMPLE_URL} controls class="rounded-lg"></video>
        </div>
      </div>
    </div>
  </div>
</div>
<!-- </ResponsiveContainer> -->

<!-- Upload section -->
<!-- <ResponsiveContainer> -->
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Wrzuć wideło</h2>

    {#if state === "loading"}
      <div class="flex items-center justify-center">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="ml-2">Ładuję ffmpeg...</p>
      </div>
    {:else if state === "loaded" || state === "convert.done"}
      <p class="text-lg mb-4">Dropnij wideło albo kliknij by "załonczyć"</p>

      <label class="form-control w-full">
        <input
          type="file"
          name="file"
          multiple
          bind:files
          accept="video/*"
          class="file-input file-input-bordered w-full {files &&
          files.length > 0
            ? 'file-input-success'
            : ''}"
        />
        <div class="label">
          <span class="label-text-alt"
            >Max. wielkość 2GB. Testowane na plikach mp4/webm poniżej 60 sekund.</span
          >
          <span class="label-text-alt"
            >Twoje pliki nigdzie nie są wysyłane - obróbka jest offline.</span
          >
        </div>
      </label>

      {#if files && files.length > 0}
        <!-- Preview Card -->
        <div class="card bg-base-200 mt-4">
          <div class="card-body">
            <h3 class="card-title text-lg">
              Wybrane pliki
              <div class="badge badge-primary">{files.length}</div>
            </h3>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <!-- File List -->
              <div class="lg:col-span-1 overflow-x-auto">
                <div class="flex flex-col gap-2">
                  {#each Array.from(files) as file, i}
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
                          <div class="text-left">
                            <h4 class="font-medium break-words">
                              {file.name}
                            </h4>
                            <p class="text-sm text-gray-500">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          class="btn btn-sm btn-square btn-error btn-outline absolute top-4 right-4"
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
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Preview and Settings -->
              <div class="lg:col-span-2 mt-4 lg:mt-0">
                {#if selectedFileIndex !== undefined && files[selectedFileIndex]}
                  {@const file = files[selectedFileIndex]}
                  {@const settingId = $videoSettings[selectedFileIndex]?.id}

                  <div class="card bg-base-100">
                    <div class="card-body">
                      <h4 class="card-title text-lg">Podgląd i ustawienia</h4>

                      <!-- Preview -->
                      <div
                        class="aspect-video bg-base-300 rounded-lg overflow-hidden"
                      >
                        {#await generatePreview(file)}
                          <div
                            class="w-full h-full flex items-center justify-center"
                          >
                            <span class="loading loading-spinner loading-lg"
                            ></span>
                          </div>
                        {:then previewUrl}
                          <img
                            src={previewUrl}
                            alt="Podgląd"
                            class="w-full h-full object-contain"
                          />
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

                      <!-- Settings -->
                      <div class="divider">Ustawienia</div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label
                          class="flex items-center gap-4 p-4 bg-base-200 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            class="toggle toggle-success"
                            checked={$videoSettings[selectedFileIndex]?.settings
                              .addIntro}
                            on:change={(e) =>
                              videoSettings.updateSettings(settingId, {
                                addIntro: e.target.checked,
                              })}
                          />
                          <div>
                            <div class="font-medium">Efekt przejścia</div>
                            <div class="text-sm text-gray-500">
                              Dodaj kultowy efekt przejścia na starcie
                            </div>
                          </div>
                        </label>

                        <label
                          class="flex items-center gap-4 p-4 bg-base-200 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            class="toggle toggle-success"
                            checked={$videoSettings[selectedFileIndex]?.settings
                              .addBoczek}
                            on:change={(e) =>
                              videoSettings.updateSettings(settingId, {
                                addBoczek: e.target.checked,
                              })}
                          />
                          <div>
                            <div class="font-medium">Reakcja Boczka</div>
                            <div class="text-sm text-gray-500">
                              Dodaj reakcję Boczka na końcu
                            </div>
                          </div>
                        </label>
                      </div>

                      <div class="card-actions justify-end mt-4">
                        <button
                          class="btn btn-ghost btn-sm gap-2"
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
                {:else}
                  <div class="card bg-base-100">
                    <div class="card-body">
                      <div class="text-center text-gray-500">
                        <p>
                          Wybierz plik z listy aby zobaczyć podgląd i ustawienia
                        </p>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Convert Button -->
      <div class="card-actions justify-end mt-4">
        <button
          on:click={() => convertVideos(files)}
          class="btn btn-primary btn-lg gap-2 {!files ? 'btn-disabled' : ''}"
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
          <h3 class="card-title">Przetwarzanie...</h3>
          <progress
            class="progress progress-primary"
            value={$progress}
            max="100"
          ></progress>
          <p class="text-center">{$progress.toFixed(0)}%</p>
          <div class="card-actions justify-center">
            <button on:click={resetFfmpeg} class="btn btn-error">
              Anuluj
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
<!-- </ResponsiveContainer> -->

<!-- Results section -->
<!-- <ResponsiveContainer> -->
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Twoje wideo</h2>

    {#if state === "convert.done" && videoDataList.length > 0}
      {#each videoDataList as item, i}
        <div class="card bg-base-200 mt-4">
          <div class="card-body">
            <h3 class="card-title">
              ({i + 1}/{videoDataList.length}) {item.videoName}
            </h3>
            <div class="aspect-video">
              <video
                src={item.videoBlobURL}
                controls
                autoplay={i === 0}
                class="w-full h-full rounded-lg"
              ></video>
            </div>
            <div class="card-actions justify-end gap-2 mt-4">
              <button
                class="btn btn-primary gap-2"
                on:click={() => downloadVideo(item.videoBlob, item.videoName)}
              >
                Zapisz
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
              </button>
              <button
                class="btn btn-secondary gap-2"
                on:click={() => shareVideo(item.videoBlob, item.videoName)}
              >
                Udostępnij
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
              </button>
            </div>
          </div>
        </div>
      {/each}
    {:else if state === "convert.error"}
      <div class="alert alert-error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          /></svg
        >
        <span>{error}</span>
      </div>
    {/if}
  </div>
</div>
<!-- </ResponsiveContainer> -->
<!-- </CenteredContainer> -->

<Footer />

<style>
  video {
    max-width: 100%;
    height: auto;
    margin-bottom: 10px;
    margin-top: 5px;
  }

  #video-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
