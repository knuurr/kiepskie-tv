<script lang="ts">
	import { tweened } from "svelte/motion";
	import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { FFmpeg } from "@ffmpeg/ffmpeg";
  // import { fetchFile, toBlobURL } from '@ffmpeg/util';
  // import { toBlobURL } from '@ffmpeg/util';

  // import Image from './Image.svelte';
  // import Video from './Video.svelte';
  // import ProgressBar from "./ProgressBar.svelte";
  import DashedBox from "./DashedBox.svelte";
  import * as DATA from './Constans.svelte'; // Import all from data.js

  import { Container, Input, Button, Col, Row } from '@sveltestrap/sveltestrap';
  


  type State = "loading" | "loaded" | "convert.ready" | "convert.start" | "convert.error" | "convert.done";
  type typeTransformState = "1/2" | "2/2" | "0/2" 

  let files;
  let videoData;

  let state: State = "loading"
  let transformState: typeTransformState = "0/2"
  
  let error = "";
  
  let ffmpeg: FFmpeg;
  let progress = tweened(0);

  if (files) {
    if( files.length > 1 ) {
    error = "Upload one file!";
    state = "convert.error";
    // return;
  }  
  }
  
  // Re-implementation
  // https://github.com/ffmpegwasm/ffmpeg.wasm/issues/603
  const readFromBlobOrFile = (blob) => new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
        const { result } = fileReader;
        if (result instanceof ArrayBuffer) {
            resolve(new Uint8Array(result));
        }
        else {
            resolve(new Uint8Array());
        }
    };
    fileReader.onerror = (event) => {
        reject(Error(`File could not be read! Code=${event?.target?.error?.code || -1}`));
    };
    fileReader.readAsArrayBuffer(blob);
});

//   async function fetchFile(file) {
//     return new Promise(resolve => {
//         const fileReader = new FileReader();
//         console.log(file)
//         fileReader.onload = () => {
//             const {result} = fileReader;
//             if (result instanceof ArrayBuffer) {
//                 resolve(new Uint8Array(result));
//             }
//         }
//         fileReader.readAsArrayBuffer(file);
//     })
// }

  const fetchFile = async (file) => {
      let data;
      if (typeof file === "string") {
          /* From base64 format */
          if (/data:_data\/([a-zA-Z]*);base64,([^"]*)/.test(file)) {
              data = atob(file.split(",")[1])
                  .split("")
                  .map((c) => c.charCodeAt(0));
              /* From remote server/URL */
          }
          else {
              data = await (await fetch(file)).arrayBuffer();
          }
      }
      else if (file instanceof URL) {
          data = await (await fetch(file)).arrayBuffer();
      }
      else if (file instanceof File || file instanceof Blob) {
          data = await readFromBlobOrFile(file);
      }
      else {
          return new Uint8Array();
      }
      return new Uint8Array(data);
  };

  async function readFile(file): Promise<Uint8Array> {
    return new Promise(resolve=>{
      const fileReader = new FileReader();
      fileReader.onload = (e)=>{
        const { result } = fileReader;
        if( result instanceof ArrayBuffer ) {
          resolve(new Uint8Array(result));
        }
      };

      fileReader.onerror = (e)=>{
        error = "Error reading file";
        state = "convert.error";
        resolve(null);
        console.error(e);
      }

      fileReader.readAsArrayBuffer(file);
    })
  }

  async function convertVideo() {
    state = "convert.start";
    // const videData = await readFile(files[0]);
    const { name } = files[0];
    await ffmpeg.writeFile(name, await fetchFile(files[0]));
    // await ffmpeg.writeFile("input.webm", videData);
    // await ffmpeg.exec(["-i", "input.webm", "output.mp4"]);
    await ffmpeg.writeFile(DATA.NAME_GREENSCREEN_PNG, await fetchFile(DATA.PATH_GREENSCREEN_PNG));
    transformState = "1/2"
    await ffmpeg.exec(['-i', DATA.NAME_GREENSCREEN_PNG ,'-i', name, '-filter_complex', "[1:v]scale=w='min(iw,510)':h='min(ih,382)':force_original_aspect_ratio=decrease,pad=512:382:((512-iw)/2)+1:((382-ih)/2)+1:color=black[overlay];[0:v][overlay]overlay=x=140:y=94", '-c:v', 'libx264', '-c:a',  'copy', '-preset', 'ultrafast', 'output_temp.mp4']);
    await ffmpeg.writeFile(DATA.NAME_TEMPLATE_VIDEO, await fetchFile(DATA.PATH_TEMPLATE_VIDEO));
    transformState = "2/2"
    await ffmpeg.exec(['-i', DATA.NAME_TEMP_OUTPUT ,'-i', DATA.NAME_TEMPLATE_VIDEO, '-filter_complex', "[1:v]scale=768:576 [scaledv]; [0:v][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]", '-map', '[v]', '-map',  '[a]', '-preset', 'ultrafast', 'output.mp4']);
    // const data = await fetchFile("output.mp4");
    const data = await ffmpeg.readFile('output.mp4');


    videoData = data
    state = "convert.done";
    transformState = "0/2"

    // injectVideo(data)
    // return data as Uint8Array;
  }

  async function handleDrop(event: DragEvent) {
    if(!event.dataTransfer) return;
    const files = event.dataTransfer.files;
    if( files.length > 1 ) {
      error = "Upload one file!";
      state = "convert.error";
      return;
    }
    const [file] = files;
    // const { type } = file;
    // if(type !== "video/webm") {
    //   error = "File must be webm";
    //   state = "convert.error"
    //   return;
    // }



    state = "convert.ready"
    // const data = await convertVideo(file);
    // downloadVideo(data);
    // injectVideo(data);

  }

  function downloadVideo() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([videoData.buffer], {type: "video/mp4"})) 
    a.download = "output.mp4";
    setTimeout(()=>{
      a.click();
      state = "convert.done"
    }, 1000)
  }

  function injectVideo(data: any) {
    return
    // const a = document.createElement('a');
    // let videoObject = URL.createObjectURL(new Blob([data.buffer], {type: "video/mp4"})) 
    // a.download = "output.mp4";
    // setTimeout(()=>{
    //   a.click();
    //   state = "convert.done"
    // }, 1000)

    // state = "convert.done"

  }


  async function loadFfmpeg() {
    const baseUrl = "https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm";
    ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: `${baseUrl}/ffmpeg-core.js`,
      wasmURL: `${baseUrl}/ffmpeg-core.wasm`
    });
    ffmpeg.on("progress", ({ progress })=> {
      $progress = progress * 100;
    });
    state = "loaded";
  }

  async function resetFfmpeg() {
    state = "loading";
    ffmpeg.terminate();
    loadFfmpeg();
  }

  onMount(()=>{
    loadFfmpeg()
  })
  $: console.log({ state })
</script>

  <DashedBox>
    <!-- <Row> -->
      {#if state === "loading"}
        <h3>Wrzuć wideło</h3>
        <p in:fade>Ładuję ffmpeg...</p>
      {:else if state === "loaded"}
      <!-- <p in:fade >Drop a video file here</p> -->
        <h3>Wrzuć wideło</h3>
        <p in:fade>
          Dropnij wideło albo kliknij by "załonczyć"
          </p>
      <Input type="file" name="file" id="exampleFile" bind:files />
        <!-- <FormText> -->
          <!-- This is some placeholder block-level help text for the above input. It's a bit lighter and easily wraps to a new line. -->
        <!-- </FormText> -->
        <p in:fade>
          max. wielkość 2GB. Testowane wyłącznie na plikach .mp4, .webm o długości poniżej 60 sekund. 1 plik naraz.
          </p>
      {#if !files}
      <Button outline block disabled color="secondary">Okiłizuj</Button>
      {:else}
      <Button outline block on:click={convertVideo} color="warning">Okiłizuj</Button>
      {/if}
  {:else if state === "convert.start"}
    <h2>
      Kliknij by anulować
    </h2>
    <!-- <button>Anuluj (niedizala)</button> -->
    <Button on:click={resetFfmpeg} block color="danger">Anuluj</Button>
  {:else if state === "convert.done"}
      <!-- <p in:fade >Drop a video file here</p> -->
      <h3>Wrzuć wideło</h3>
      <p in:fade>
        Dropnij wideło albo kliknij by "załonczyć"
        </p>
    <Input type="file" name="file" bind:files />
      <!-- <FormText> -->
        <!-- This is some placeholder block-level help text for the above input. It's a bit lighter and easily wraps to a new line. -->
      <!-- </FormText> -->
      <p in:fade>
        max. wielkośc 2GB. Testowane wyłącznie na plikach .mp4, .webm o długości poniżej 60 sekund.
        </p>
    {#if !files}
    <Button outline block disabled color="secondary">Okiłizuj</Button>
    {:else}
    <Button outline block on:click={convertVideo} color="warning">Okiłizuj</Button>
    {/if}
  {/if}
</DashedBox>

<Container md>
  <Row>
    <Col>
      <DashedBox>
        <h3 in:fade>Podgląd</h3>
        {#if state === "convert.start"}
          {#if transformState == "1/2"}
          <p>1/2 Nakładanie na "Okił"-a...</p>
          {:else if transformState === "2/2"}
          <p>2/2 Dodawanie reakcji Boczka...</p>
          {/if}
        <h2>{$progress.toFixed(0)} %</h2>
        {:else if state === "convert.done"}
        <Container>
          <Row>
            <Col>
              <div id="video-container">
                <video src={URL.createObjectURL(new Blob([videoData.buffer], { type: 'video/mp4' }))} controls autoplay muted></video>
              </div>
            </Col>
          </Row>
        </Container>  
      
        <Button outline block on:click={downloadVideo} color="success">Pobierz</Button>
      
      {:else if state === "convert.error"}
        <p in:fade style="color:red">Error: {error}</p>
      {:else}
        <p in:fade>(Z pustego to i Salamon nie naleje)</p>
      {/if}
      </DashedBox>
    </Col>
  </Row>
</Container>


<style>

  .drop {
    cursor: pointer;
  }

  .drop[data-state="hover"] {
    outline: 5px solid green;
    transform: scale(1.05); /* Zoom in by 5% on hover */
  }

  /* Hide the default browser file input */
  Input[type="file"] {
    display: none !important;
  }

  video {
      max-height: 400px;
      width: auto;
      margin: 10px
      
    }

    #video-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

  </style>
