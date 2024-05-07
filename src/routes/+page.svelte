<script lang="ts">
	import { tweened } from "svelte/motion";
	import { fade } from "svelte/transition";
  // import { confetti } from "@neoconfetti/svelte";
  import { onMount } from "svelte";
  import { FFmpeg } from "@ffmpeg/ffmpeg";
  import { fetchFile, toBlobURL } from '@ffmpeg/util';

  // import Image from './Image.svelte';
  import Video from './Video.svelte';
  import ProgressBar from "./ProgressBar.svelte";


  type State = "loading" | "loaded" | "convert.ready" | "covert.start" | "convert.error" | "convert.done";

  let files;
  let videoData;

  let state: State = "loading"
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
    state = "covert.start";
    // const videData = await readFile(files[0]);
    const { name } = files[0];
    await ffmpeg.writeFile(name, await fetchFile(files[0]));
    // await ffmpeg.writeFile("input.webm", videData);
    // await ffmpeg.exec(["-i", "input.webm", "output.mp4"]);
    await ffmpeg.writeFile("greenscreen.png", await fetchFile("src/routes/greenscreen.png"));
    await ffmpeg.exec(['-i', 'greenscreen.png' ,'-i', name, '-filter_complex', "[1:v]scale=w='min(iw,510)':h='min(ih,382)':force_original_aspect_ratio=decrease,pad=512:382:((512-iw)/2)+1:((382-ih)/2)+1:color=black[overlay];[0:v][overlay]overlay=x=140:y=94", '-c:v', 'libx264', '-c:a',  'copy', '-preset', 'ultrafast', 'output_temp.mp4']);
    await ffmpeg.writeFile("video.mp4", await fetchFile("src/routes/video.mp4"));
    await ffmpeg.exec(['-i', 'output_temp.mp4' ,'-i', 'video.mp4', '-filter_complex', "[1:v]scale=768:576 [scaledv]; [0:v][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]", '-map', '[v]', '-map',  '[a]', '-preset', 'ultrafast', 'output.mp4']);
    // const data = await fetchFile("output.mp4");
    const data = await ffmpeg.readFile('output.mp4');


    videoData = data
    state = "convert.done";

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

  function downloadVideo(data: Uint8Array) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data.buffer], {type: "video/mp4"})) 
    a.download = "output.mp4";
    setTimeout(()=>{
      a.click();
      state = "convert.done"
    }, 1000)
  }

  function injectVideo(data: any) {
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

  onMount(()=>{
    loadFfmpeg()
  })
  $: console.log({ state })
</script>


<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  on:drop|preventDefault={handleDrop}
  on:dragover|preventDefault={() => (state === "loaded" ? (state = "hover") : {})} 
  on:dragleave|preventDefault={() => (state === "hover" ? (state = "loaded") : {})} 

  data-state={state}
  class="drop box"
  >
  <h3>Wrzuć wideło</h3>
  {#if state === "loading"}
    <p in:fade>Ładuję ffmpeg...</p>
  {:else if state === "loaded"}
    <!-- <p in:fade class="box">Drop a video file here</p> -->
    <p in:fade>
      Dropnij wideło albo kliknij by "załonczyć"
      </p>
    <!-- <input type="file" accept="video/*" bind:files /> -->
    <label in:fade for="file-upload" class="custom-file-upload">
      <input in:fade type="file" id="file-upload" accept="video/*" bind:files>
      Przeglądaj...
    </label>
    {#if !files}
    <button class="custom-file-upload" disabled>Okiłizuj</button>
    {:else}
    <button class="custom-file-upload" style="background-color: orange;" on:click={convertVideo} >Okiłizuj</button>
    {/if}
  {:else if state === "covert.start"}
    <h2>
      Kliknij by anulować
    </h2>
  {:else if state === "covert.done"}
    <p in:fade>
      Dropnij wideło albo kliknij by "załonczyć"
      </p>
    <!-- <input type="file" accept="video/*" bind:files /> -->
    <label in:fade for="file-upload" class="custom-file-upload">
      <input in:fade type="file" id="file-upload" accept="video/*" bind:files>
      Przeglądaj...
    </label>
  {/if}


</div>

<div class="box" id="preview">
  <h3 in:fade>Podgląd</h3>
  {#if state === "covert.start"}
  <!-- Add proggress bar -->
  <!-- <ProgressBar progress={progress}></ProgressBar> -->
  <!-- <div class="progress" style:--progress={$progress}> -->
    <!-- {$progress.toFixed(0)} -->
  <!-- </div> -->
  <h2>{$progress.toFixed(0)} %</h2>
{:else if state === "convert.done"}
  <!-- <div use:confetti></div> -->
  <!-- <p in:fade>Done!! 🎉</p> -->
  <video src={URL.createObjectURL(new Blob([videoData.buffer], { type: 'video/mp4' }))} controls autoplay muted></video>
  <!-- <video ></video> -->
  <!-- <video src={URL.createObjectURL(new Blob([videoData.buffer]))} controls autoplay muted></video> -->

{:else if state === "convert.error"}
  <p in:fade style="color:red">Error: {error}</p>
{:else}
  <!-- <Image src="src/routes/ferdek.jpeg" /> -->
  <p in:fade>(Z pustego to i Salamon nie naleje)</p>
{/if}

</div>
<style>
	.box {
	  width: 100%;
	  height: 200px;
	  display: flex;
    flex-direction: column;
	  justify-content: center;
	  align-items: center;
	  /* color: var(--); */
	  font-size: 16px;
	  /* background-color: #000; */
	  border: 2px dashed var(--txt-clr);
	  border-radius: 5px;
	  
    margin-top: 20px;
    margin-bottom: 20px;
	}
  .drop {
    cursor: pointer;
  }

  .drop[data-state="hover"] {
    outline: 5px solid green;
    transform: scale(1.05); /* Zoom in by 5% on hover */
  }

  #preview {
    height: auto;
  }

  .custom-file-upload {
  /* Base styles (similar to Bootstrap button) */
  display: inline-block;
  padding: 0.5rem 1rem;
  border: 1px solid #3f3d3d; /* Adjust border color as needed */
  border-radius: 0.25rem; /* Adjust border-radius as needed */
  cursor: pointer;
  text-align: center;
  font-weight: bold; /* Simulate Bootstrap button weight */
  color: #000000; /* White text for primary button */
  background-color: #f9d300; /* Bootstrap primary color */
  transition: background-color 0.2s ease-in-out;
  margin-top: 5px;
  margin-bottom: 5px;
  }

  /* Hide the default browser file input */
  input[type="file"] {
    display: none;
  }

  /* Optional hover and active states (similar to Bootstrap) */
  .custom-file-upload:hover {
    background-color: #f5e589; /* Darken on hover */
  }

  /* Disabled state styles */
  .custom-file-upload:disabled {
  background-color: #ccc; /* Light gray for disabled state */
  cursor: not-allowed; /* Indicate disabled behavior */
  opacity: 0.65; /* Reduce opacity for disabled look */
}

video {
      height: auto;
      width: 100%;
      margin: 10px
    }

  </style>
