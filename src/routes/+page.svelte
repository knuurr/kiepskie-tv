<script lang="ts">
	import { tweened } from "svelte/motion";
	import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { FFmpeg } from "@ffmpeg/ffmpeg";
  import saveAs from 'file-saver';
  // import { fetchFile, toBlobURL } from '@ffmpeg/util';
  // import { toBlobURL } from '@ffmpeg/util';

  import DashedBox from "./DashedBox.svelte";
  import * as DATA from './Constans.svelte'; // reusable constans

  import { FormText, Badge, Fade, Container, Input, Button, Col, Row, Accordion, AccordionItem } from '@sveltestrap/sveltestrap';
  


  type State = "loading" | "loaded" | "convert.ready" | "convert.start" | "convert.error" | "convert.done";
  type typeTransformState = "1/2" | "2/2" | "0/2" 

  let isOpen = false
  // let files = [];
  let files: FileList;
  // let videoData;
  let videoDataList: Array = [];

  let state: State = "loading"
  let transformState: typeTransformState = "0/2"
  
  let error = "";
  
  let ffmpeg: FFmpeg;
  let progress = tweened(0);

  // if (files) {
  //   if( files.length > 1 ) {
  //   error = "Upload one file!";
  //   state = "convert.error";
  //   // return;
  //   }  
  // }

  const removeFile = (index) => {

    const filesArr = Array.from(files); // Convert FileList to Array
    filesArr.splice(index, 1); // Remove item at index
    const _dataTransfer = new DataTransfer();
    filesArr.forEach(_file => _dataTransfer.items.add(_file));
    files = _dataTransfer.files;
}

// Usage
// const updatedFileList = removeItemFromFileList(originalFileList, 2); // Remove item at index 2


  // };
  
  // Re-implementation
  // Take straight from ffmpeg-wasm due to import issue
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

  async function convertVideos(files: FileList) {
    console.log("Started batch video converting")
    console.log(files)
    state = "convert.start";
    for (const file of files) {
      
     // Your code to be executed for each element
      console.log("About to convert: " + file.name)
      await convertVideo(file)
    
  }   
    console.log("Converts doen. Setting state.")
    console.log(videoDataList)
    transformState = "0/2"
    state = "convert.done";
    console.log("Finishing batch video converting")

}

  async function convertVideo(file) {
    // console.log(files)
    // state = "convert.start";
    // const videData = await readFile(files[0]);
    // const { name } = files[0];
    // const { name } = file.name;
    await ffmpeg.writeFile(file.name, await fetchFile(file));
    // await ffmpeg.writeFile("input.webm", videData);
    // await ffmpeg.exec(["-i", "input.webm", "output.mp4"]);
    await ffmpeg.writeFile(DATA.NAME_GREENSCREEN_PNG, await fetchFile(DATA.PATH_GREENSCREEN_PNG));
    transformState = "1/2"
    await ffmpeg.exec(['-i', DATA.NAME_GREENSCREEN_PNG ,'-i', file.name, '-filter_complex', "[1:v]scale=w='min(iw,510)':h='min(ih,382)':force_original_aspect_ratio=decrease,pad=512:382:((512-iw)/2)+1:((382-ih)/2)+1:color=black[overlay];[0:v][overlay]overlay=x=140:y=94", '-c:v', 'libx264', '-c:a',  'copy', '-preset', 'ultrafast', 'output_temp.mp4']);
    await ffmpeg.writeFile(DATA.NAME_TEMPLATE_VIDEO, await fetchFile(DATA.PATH_TEMPLATE_VIDEO));
    transformState = "2/2"
    await ffmpeg.exec(['-i', DATA.NAME_TEMP_OUTPUT ,'-i', DATA.NAME_TEMPLATE_VIDEO, '-filter_complex', "[1:v]scale=768:576 [scaledv]; [0:v][0:a][scaledv][1:a]concat=n=2:v=1:a=1[v][a]", '-map', '[v]', '-map',  '[a]', '-preset', 'ultrafast', 'output.mp4']);
    // const data = await fetchFile("output.mp4");
    const data = await ffmpeg.readFile('output.mp4');


    // videoData = data
    // videoDataList.push({videoName: name, videoBlobURL: URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))})
    const blob = new Blob([data.buffer], { type: 'video/mp4' })
    videoDataList.push({videoName: file.name, videoBlob: blob, videoBlobURL: URL.createObjectURL(blob)})

    // state = "convert.done";
    // transformState = "0/2"

    // injectVideo(data)
    // return data as Uint8Array;
  }

  // async function handleDrop(event: DragEvent) {
  //   if(!event.dataTransfer) return;
  //   const files = event.dataTransfer.files;
  //   if( files.length > 1 ) {
  //     error = "Upload one file!";
  //     state = "convert.error";
  //     return;
  //   }
  //   const [file] = files;

  //   state = "convert.ready"


  // }


  function downloadVideo(fileBlob, fileName) {
    // const blob = new Blob([videoData.buffer], { type: "video/mp4" });
    const downloadFileName = "kiepskietv-" + fileName + ".mp4"

    saveAs(fileBlob, downloadFileName);  // Trigger file picker and save

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
<Container sm={true}>
<DashedBox>
  <h3 in:fade>Zobacz przykład wideo</h3>
  <Container>
  <Accordion theme="dark">
    <Container sm>
    <AccordionItem>
      <p class="m-0" slot="header">Pokaż</p>
      
        <!-- <Row> -->
          <!-- <Col> -->
            <div id="video-container">
              <video src={DATA.EXAMPLE_URL} controls></video>
            </div>
          <!-- </Col> -->
        <!-- </Row> -->
      
    </AccordionItem>
  </Container>  
  </Accordion>
  <!-- <Button color="secondary" on:click={() => (isOpen = !isOpen)}> -->
    <!-- { isOpen ? 'Ukryj' : 'Zobacz' } -->
  <!-- </Button> -->
  <!-- <Fade {isOpen}> -->
  <!-- <Container> -->
    <!-- <Row> -->
      <!-- <Col> -->
        <!-- <div id="video-container"> -->
          <!-- <video src={DATA.EXAMPLE_URL} controls></video> -->
        <!-- </div> -->
      <!-- </Col> -->
    <!-- </Row> -->
  <!-- </Container>   -->
  <!-- </Fade> -->
</Container>
</DashedBox>
</Container>
<Container>
  <DashedBox>
      {#if state === "loading"}
        <h3>Wrzuć wideło</h3>
        <p in:fade>Ładuję ffmpeg...</p>
      {:else if state === "loaded"}
        <h3>Wrzuć wideło</h3>
        <p in:fade>
          Dropnij wideło albo kliknij by "załonczyć"
          </p>
        <Input type="file" name="file" id="exampleFile" multiple bind:files />
        <FormText inline={true}>
          max. wielkość 2GB. Testowane na plikach .mp4, .webm poniżej 60 sekund.
        </FormText>
          {#if files}
          {#if files.length > 0}
          {#each Array.from(files) as file}
          <Container sm>
            <Row>
            <Button block={false} color="dark" key={file.index} on:click={removeFile(file.index)}>
              {file.name}
              <Badge color="danger">x</Badge>
            </Button>
          </Row>
          </Container>
            {/each}
    {/if}
          {/if}
          
      {#if !files}
      <Button outline block disabled color="secondary">Okiłizuj</Button>
      {:else}
      <Button block on:click={convertVideos(files)} color="warning">Okiłizuj</Button>
      {/if}
  {:else if state === "convert.start"}
    <h2>
      Kliknij by anulować
    </h2>
    <Button on:click={resetFfmpeg} block color="danger">Anuluj</Button>
  {:else if state === "convert.done"}

      <h3>Wrzuć wideło</h3>
      <p in:fade>
        Dropnij wideło albo kliknij by "załonczyć"
        </p>
    <!-- <Input type="file" name="file" bind:files /> -->
    <Input type="file" name="file" multiple bind:files />


      <p in:fade>
        max. wielkośc 2GB. Testowane wyłącznie na plikach .mp4, .webm o długości poniżej 60 sekund.
        </p>
    {#if !files}
    <Button outline block disabled color="secondary">Okiłizuj</Button>
    {:else}
    <Button block on:click={convertVideos(files)} color="warning">Okiłizuj</Button>
    {/if}
  {/if}
</DashedBox>
</Container>

<Container md>
      <DashedBox>
        <h3 in:fade>Twoje wideo</h3>
        {#if state === "convert.start"}
          {#if transformState == "1/2"}
          <p>1/2 Nakładanie na "Okił"-a...</p>
          {:else if transformState === "2/2"}
          <p>2/2 Dodawanie reakcji Boczka...</p>
          {/if}
          <h2>{$progress.toFixed(0)} %</h2>
        {:else if state === "convert.done"}
          <p>Wszystko gotowe!</p>
          {#if videoDataList.length > 0}
          <Container fluid>
  
            <Accordion stayOpen={true} theme="dark">
              <Container fluid>
  
            {#each videoDataList as item, i}
              <AccordionItem active={i === 0 ? true : false}>
                <p class="m-1" slot="header">({i+1}/{videoDataList.length}) {item.videoName}</p>  
                <!-- <Container fluid> -->
  
                <div id="video-container">
                  <video src={item.videoBlobURL} controls autoplay={i === 0 ? true : false }></video>
                </div>
  
                <!-- </Container> -->
  
                <Button block on:click={ () => downloadVideo(item.videoBlob, item.videoName)} color="success">Zapisz #{i+1}</Button>
              </AccordionItem>
            {/each}
              </Container>
            </Accordion>
          </Container>
          {/if}
        {:else if state === "convert.error"}
          <p in:fade style="color:red">Error: {error}</p>
        {:else}
          <p in:fade>(Z pustego to i Salamon nie naleje)</p>
        {/if}

        <!-- <Container sm> -->

              <!-- <div id="video-container"> -->
                <!-- <video src={URL.createObjectURL(new Blob([videoData.buffer], { type: 'video/mp4' }))} controls autoplay muted></video> -->
              <!-- </div> -->

        <!-- </Container>   -->
      
        <!-- <Button block on:click={downloadVideo} color="success">Zapisz wideo</Button> -->
      </DashedBox>

</Container>

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
