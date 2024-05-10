<script lang="ts">
  import { tweened } from "svelte/motion";
  import { fade } from "svelte/transition";
  import { onMount, onDestroy } from "svelte";
  import { FFmpeg } from "@ffmpeg/ffmpeg";
  import saveAs from "file-saver";
  // import { fetchFile, toBlobURL } from '@ffmpeg/util';
  // import { toBlobURL } from '@ffmpeg/util';

  import DashedBox from "./DashedBox.svelte";
  import * as DATA from "./Constans.svelte"; // reusable constans

  import {
    InputGroup,
    FormText,
    Badge,
    // Fade,
    Container,
    Input,
    Button,
    // Col,
    // Row,
    Accordion,
    AccordionItem,
    Table,
  } from "@sveltestrap/sveltestrap";

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
    console.log("Converts doen. Setting state.");
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

<DashedBox>
  <h3 in:fade>Jak to działa?</h3>
  <Container>
    <Accordion theme="dark">
      <!-- <Container sm> -->
      <AccordionItem>
        <p class="m-0" slot="header">Zobacz przykład</p>
        <p>1. Załącz swoje wideo</p>
        <p>2. Dobierz ustawienia</p>
        <p>3. Poczekaj aż sie przeprocesują</p>
        <p>4. Profit</p>
        <div id="video-container">
          <video src={DATA.EXAMPLE_URL} controls></video>
        </div>
      </AccordionItem>
    </Accordion>
  </Container>
</DashedBox>

<DashedBox>
  <!-- {#if state === "loading"} -->
  {#if state === "loading"}
    <h3>Wrzuć wideło</h3>
    <p in:fade>Ładuję ffmpeg...</p>
  {:else if state === "loaded" || state === "convert.done"}
    <h3>Wrzuć wideło</h3>
    <p in:fade>Dropnij wideło albo kliknij by "załonczyć"</p>
    <InputGroup theme="dark">
      <Container>
        <Input
          valid={files && files.length > 0 ? true : false}
          type="file"
          bsSize="lg"
          name="file"
          multiple
          bind:files
          accept="video/*"
        />
        <FormText inline={true}>
          max. wielkość 2GB. Testowane na plikach .mp4, .webm poniżej 60 sekund.
        </FormText>
      </Container>
    </InputGroup>

    {#if files}
      {#if files.length > 0}
        <Container fluid>
          <Accordion theme="dark">
            <AccordionItem>
              <p class="m-0" slot="header">Pliki</p>
              {#each Array.from(files) as file}
                <Button
                  block={false}
                  color="info"
                  size="sm"
                  outline
                  key={file.index}
                  on:click={() => removeFile(file.index)}
                >
                  {file.name}
                  <Badge color="danger">x</Badge>
                </Button>
              {/each}
            </AccordionItem>
          </Accordion>
        </Container>
      {/if}
    {/if}
    <Container fluid>
      <Accordion theme="dark">
        <AccordionItem>
          <p class="m-0" slot="header">Ustawienia</p>
          <Table bordered>
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
                  ><Input
                    type="switch"
                    label=""
                    bsSize="lg"
                    reverse
                    checked={transformSettings.addIntro}
                    on:change={(e) => handleSwitchChange("addIntro", e)}
                  />
                </td>
              </tr>
              <tr>
                <td>Dodaj reakcję Boczka</td>
                <td
                  ><Input
                    type="switch"
                    label=""
                    bsSize="lg"
                    reverse
                    checked={transformSettings.addBoczek}
                    on:change={(e) => handleSwitchChange("addBoczek", e)}
                  /></td
                >
              </tr>
              <tr>
                <td>Resetuj ustawienia do domyślnych</td>
                <td>
                  <Button color="danger" reverse on:click={resetSettings}
                    >Resetuj</Button
                  >
                </td>
              </tr>
            </tbody>
          </Table>
        </AccordionItem>
      </Accordion>
    </Container>
    <Container>
      {#if !files}
        <Button outline block disabled color="secondary">Okiłizuj</Button>
      {:else}
        <Button block on:click={convertVideos(files)} color="warning"
          >Okiłizuj</Button
        >
      {/if}
    </Container>
  {:else if state === "convert.start"}
    <h2>Kliknij by anulować</h2>
    <Container>
      <Button on:click={resetFfmpeg} block color="danger">Anuluj</Button>
    </Container>
  {/if}
</DashedBox>

<DashedBox>
  <h3 in:fade>Twoje wideo</h3>
  {#if state === "convert.start"}
    {#if transformState == "1/2"}
      <p>1/2 Nakładanie na "Okił"-a...</p>
    {:else if transformState === "2/2"}
      <p>2/2 Dodawanie reakcji Boczka...</p>
    {/if}
    <p>Twoje wideo będą poniżej</p>
    <h2>{$progress.toFixed(0)} %</h2>
  {:else if state === "convert.done"}
    <p>Wszystko gotowe!</p>
    {#if videoDataList}
      {#if videoDataList.length > 0}
        <Container fluid>
          <Accordion stayOpen={true} theme="dark">
            <!-- <Container fluid> -->
            {#each videoDataList as item, i}
              <AccordionItem active={i === 0 ? true : false}>
                <p class="m-1" slot="header">
                  ({i + 1}/{videoDataList.length}) {item.videoName}
                </p>

                <div id="video-container">
                  <video
                    src={item.videoBlobURL}
                    controls
                    autoplay={i === 0 ? true : false}
                  ></video>
                </div>
                <Button
                  block
                  on:click={() => downloadVideo(item.videoBlob, item.videoName)}
                  color="success">Zapisz #{i + 1}</Button
                >
                <p>
                  Nie wyskoczyło okienko? Sprawdź powiadomienia albo pobrane w
                  przeglądarce
                </p>
              </AccordionItem>
            {/each}
            <!-- </Container> -->
          </Accordion>
        </Container>
      {/if}
    {/if}
  {:else if state === "convert.error"}
    <p in:fade style="color:red">Error: {error}</p>
  {:else}
    <p in:fade>(Z pustego to i Salamon nie naleje)</p>
  {/if}
</DashedBox>

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

  /* :global(#dashed-box) { */
  /* justify-content:center; */
  /* max-width: 700px; */
  /* } */
</style>
