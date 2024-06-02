<script lang="ts">
  import { tweened } from "svelte/motion";
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { FFmpeg } from "@ffmpeg/ffmpeg";
  import saveAs from "file-saver";
  // import { fetchFile, toBlobURL } from '@ffmpeg/util';
  // import { toBlobURL } from '@ffmpeg/util';

  import DashedBox from "./DashedBox.svelte";

  import CenteredContainer from "../components/CenteredContainer.svelte";
  import ResponsiveContainer from "../components/ResponsiveContainer.svelte";
  import NavBar from "../components/NavBar.svelte";
  import Header from "./Header.svelte";
  import Footer from "./Footer.svelte";

  import * as DATA from "./Constans.svelte"; // reusable constans

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
  let videoDataList: Array = [];

  let state: State = "loading";
  let transformState: typeTransformState = "0/2";

  // let transformSettings = {
  //   addBoczek: true,
  //   addIntro: false,
  // };
  let transformSettings = {};

  let error = "";

  let ffmpeg: FFmpeg;
  let progress = tweened(0);

  function getVideoDuration(file) {
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

  // Function to reset settings to default values
  function resetSettings() {
    transformSettings = { ...DATA.DEFAULT_SETTINGS };
    saveSettings(transformSettings);
    console.log("Settings reset to default:", transformSettings);
  }
  // Function to save settings to local storage
  function saveSettings(settings) {
    localStorage.setItem("transformSettings", JSON.stringify(settings));
    console.log("Settings saved:", settings);
  }

  // Function to update settings and save to local storage
  function updateSettings(key, value) {
    console.log("Updating settings:", key, value);
    transformSettings = { ...transformSettings, [key]: value };
    saveSettings(transformSettings);
  }

  // Function to handle UI changes
  function handleSwitchChange(key, event) {
    updateSettings(key, event.target.checked);
  }

  function loadSettings() {
    const savedSettings = localStorage.getItem("transformSettings");
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        const mergedSettings = { ...DATA.DEFAULT_SETTINGS };

        for (const key in DATA.DEFAULT_SETTINGS) {
          if (key in parsedSettings) {
            mergedSettings[key] = parsedSettings[key];
          } else {
            console.warn(
              `Setting for key "${key}" not found in saved settings. Defaulting to default value.`,
            );
          }
        }

        return mergedSettings;
      } catch (error) {
        console.error("Error parsing saved settings:", error.message);
        return DATA.DEFAULT_SETTINGS;
      }
    } else {
      return DATA.DEFAULT_SETTINGS;
    }
  }

  // Function for removing file inputs
  // Used when clicked on button representing individual button
  const removeFile = (index) => {
    const filesArr = Array.from(files); // Convert FileList to Array
    filesArr.splice(index, 1); // Remove item at index
    const _dataTransfer = new DataTransfer();
    filesArr.forEach((_file) => _dataTransfer.items.add(_file));
    files = _dataTransfer.files;
  };

  // Re-implementation
  // Take straight from ffmpeg-wasm due to import issue
  // https://github.com/ffmpegwasm/ffmpeg.wasm/issues/603
  const readFromBlobOrFile = (blob) =>
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
  const fetchFile = async (file) => {
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
  async function convertVideo(file, duration) {
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

    if (transformSettings.addBoczek) {
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
    if (transformSettings.addIntro) {
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

    console.log("[*] Attempting cleanup of Virtual FS");
    let dirList = await ffmpeg.listDir("/");
    console.log("[*] List of Virtual FS (before): ", dirList);

    for (const output of outputs) {
      const _fileDelete = await ffmpeg.deleteFile(output);
      console.log("[*] File cleanup from Virtual FS: ", _fileDelete);
    }

    const _fileDelete = await ffmpeg.deleteFile(file.name);
    console.log("[*] Cleanup original input file name: ", _fileDelete);

    dirList = await ffmpeg.listDir("/");
    console.log("[*] List of Virtual FS (after): ", dirList);
    console.log("[*] FFmpeg Virtual FS cleaned up.");
  }

  // Save on disk individual processed file
  function downloadVideo(fileBlob, fileName) {
    // const blob = new Blob([videoData.buffer], { type: "video/mp4" });
    const downloadFileName = "kiepskietv-" + fileName + ".mp4";

    saveAs(fileBlob, downloadFileName); // Trigger file picker and save
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
    transformSettings = loadSettings();
  });

  $: console.log({ state });
</script>

<CenteredContainer>
  <NavBar></NavBar>

  <ResponsiveContainer>
    <Header title={DATA.APP_TITLE} description={DATA.APP_DESC}>
      <p class="text-lg">
        Twoje wideo nigdzie nie jest wysłane - obróbka jest 100% offline
      </p></Header
    >
  </ResponsiveContainer>

  <ResponsiveContainer>
    <DashedBox>
      <p in:fade class="font-bold text-2xl mt-1 mb-1">Jak to działa?</p>

      <div class="collapse collapse-plus bg-base-200">
        <input type="checkbox" />
        <div class="collapse-title text-lg font-medium">Zobacz przykład</div>
        <div class="collapse-content text-sm">
          <p>1. Załącz swoje wideo</p>
          <p>2. Dobierz ustawienia</p>
          <p>3. Poczekaj aż sie przeprocesują</p>
          <p>4. Profit</p>
          <div id="video-container">
            <video src={DATA.EXAMPLE_URL} controls></video>
          </div>
        </div>
      </div>
    </DashedBox>
  </ResponsiveContainer>
  <ResponsiveContainer>
    <DashedBox>
      <p in:fade class=" font-bold text-2xl mt-1 mb-1">Wrzuć wideło</p>

      {#if state === "loading"}
        <p in:fade>Ładuję ffmpeg...</p>
      {:else if state === "loaded" || state === "convert.done"}
        <p in:fade>Dropnij wideło albo kliknij by "załonczyć"</p>

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
              >Max. wielkość 2GB. Testowane na plikach mp4/webm poniżej 60
              sekund.</span
            >
          </div>
        </label>

        {#if files}
          {#if files.length > 0}
            <div class="join join-vertical w-full">
              <div class="collapse collapse-plus bg-base-200">
                <input type="checkbox" />
                <div class="collapse-title text-md font-medium">Pliki</div>
                <div class="collapse-content">
                  {#each Array.from(files) as file, i}
                    <button
                      class="btn btn-outline btn-info btn-sm"
                      on:click={() => removeFile(i)}
                    >
                      {file.name}
                      <div class="badge">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-2 h-2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        {/if}

        <div class="collapse collapse-plus bg-base-200">
          <input type="checkbox" />
          <div class="collapse-title text-md font-medium">Ustawienia</div>

          <div class="collapse-content">
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Opis</th>
                    <th>Przycisk</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Dodaj kultowy efekt przejścia na starcie</td>
                    <td
                      ><input
                        type="checkbox"
                        checked={transformSettings.addIntro}
                        class="toggle toggle-success"
                        on:change={(e) => handleSwitchChange("addIntro", e)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Dodaj reakcję Boczka</td>
                    <td
                      ><input
                        type="checkbox"
                        checked={transformSettings.addBoczek}
                        class="toggle toggle-success"
                        on:change={(e) => handleSwitchChange("addBoczek", e)}
                      /></td
                    >
                  </tr>
                  <tr>
                    <td>Resetuj ustawienia do domyślnych</td>
                    <td>
                      <button
                        class="btn btn-error btn-sm"
                        on:click={() => {
                          resetSettings();
                        }}
                        >Reset
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-4 h-4"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {#if !files}
          <button
            class="btn btn-warning btn-outline btn-disabled btn-block btn-lg mt-1 mb-1"
            >Okiłizuj
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
              />
            </svg>
          </button>
        {:else}
          <button
            on:click={() => {
              convertVideos(files);
            }}
            class="btn btn-warning btn-block bg-yellow-500"
            >Okiłizuj
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
              />
            </svg>
          </button>
        {/if}
      {:else if state === "convert.start"}
        <h2>Kliknij by anulować</h2>

        <button
          on:click={() => {
            resetFfmpeg();
          }}
          class="btn btn-error btn-block">Anuluj</button
        >
      {/if}
    </DashedBox>
  </ResponsiveContainer>
  <ResponsiveContainer>
    <DashedBox>
      <p in:fade class="font-bold text-2xl mt-1 mb-1">Twoje wideo</p>
      {#if state === "loaded"}
        <div class="join join-vertical w-full">
          <details class="collapse bg-base-200 collapse-arrow collapse-close">
            <summary class="collapse-title text-lg font-medium">
              Tu będą Twoje wideło...
            </summary>
            <div class="collapse-content">
              <p>Brak &#128546;</p>
            </div>
            <!-- </div> -->
          </details>
        </div>
      {:else if state === "convert.start"}
        {#if transformState == "1/2"}
          <p class="text-lg">1/2 Nakładanie na "Okił"-a...</p>
        {:else if transformState === "2/2"}
          <p class="text-lg">2/2 Dodawanie reakcji Boczka...</p>
        {/if}
        <p class="text-sm mt-1">Twoje wideo będą poniżej</p>
        <p class="text-lg">{$progress.toFixed(0)} %</p>
        <p class="text-sm mt-1">
          (tak - czasem wychodzi ponad setkę. Pracuję nad tym)
        </p>
      {:else if state === "convert.done"}
        <p>Wideło gotowe!</p>
        {#if videoDataList}
          {#if videoDataList.length > 0}
            <div class="join join-vertical w-full">
              {#each videoDataList as item, i}
                <details
                  class="collapse bg-base-200 collapse-arrow {i === 0
                    ? 'collapse-open'
                    : ''}"
                >
                  <summary class="collapse-title text-lg font-medium">
                    ({i + 1}/{videoDataList.length}) {item.videoName}
                  </summary>
                  <div class="collapse-content">
                    <div id="video-container">
                      <video
                        src={item.videoBlobURL}
                        controls
                        autoplay={i === 0 ? true : false}
                      ></video>
                    </div>
                    <button
                      class="btn btn-success btn-block mt-1 mb-1 btn-sm"
                      on:click={() =>
                        downloadVideo(item.videoBlob, item.videoName)}
                      >Zapisz #{i + 1}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-4 h-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25"
                        />
                      </svg>
                    </button>
                    <p class="text-sm">
                      Nie pobiera się? Sprawdź powiadomienia albo pobrane w
                      przeglądarce
                    </p>
                  </div>
                  <!-- </div> -->
                </details>
              {/each}
            </div>
          {/if}
        {/if}
      {:else if state === "convert.error"}
        <p in:fade style="color:red">Error: {error}</p>
      {:else}
        <p in:fade>(Z pustego to i Salamon nie naleje)</p>
      {/if}
    </DashedBox>
  </ResponsiveContainer>
</CenteredContainer>
<Footer></Footer>

<style>
  video {
    max-width: 100%;
    height: auto;
    /* margin: 10px */
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
