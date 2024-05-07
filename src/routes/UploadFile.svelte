<script>
    import { onMount } from 'svelte';
  
    let dragOver = false;
    let file;
  
    const handleDragEnter = () => {
      dragOver = true;
    };
  
    const handleDragLeave = () => {
      dragOver = false;
    };
  
    const handleDrop = (event) => {
      event.preventDefault();
      dragOver = false;
      file = event.dataTransfer.files[0];
    };
  
    const handleInputChange = (event) => {
    //   file = event.target.files[0];
        if(!event.dataTransfer) return;
        const files = event.dataTransfer.files;
        if( files.length > 1 ) {
        // error = "Upload one file!";
        // state = "convert.error";
        return;
        }
        const [file] = files;
        const { type } = file;
        if(type !== "video/webm") {
        // error = "File must be webm";
        // state = "convert.error"
        return;
    }
    };
  
    const handleConvert = () => {
      // Add your conversion logic here
      console.log('File converted:', file);
      file = null;
    };
  
    const handleAbort = () => {
      file = null;
    };
  
    onMount(() => {
      const dropArea = document.querySelector('.file-upload');
      dropArea.addEventListener('dragover', handleDragEnter);
      dropArea.addEventListener('dragleave', handleDragLeave);
      dropArea.addEventListener('drop', handleDrop);
    });
  </script>
  
  <style>
    .file-upload {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      border: 2px dashed #ccc;
      border-radius: 5px;
      cursor: pointer;
      margin: 10px auto;
      width: 250px;
      height: 150px;
      color: #aaa;
    }
  
    .file-upload.drag-over {
      border-color: #ddd;
    }
  
    .file-upload p {
      margin: 10px 0;
    }
  
    .file-upload button {
      background-color: #ddd;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      color: #333;
    }
  
    .file-upload button.disabled {
      background-color: #f1f1f1;
      cursor: default;
    }
  
    .file-upload button.abort {
      background-color: red;
      color: white;
    }
  </style>
  
  <div class="file-upload" on:dragover={handleDragEnter} on:dragleave={handleDragLeave} on:drop={handleDrop}>
    {#if dragOver}
        <p class="hidden">Drag a file here or</p>
    {:else}
    <p>Drag a file here or</p>
    {/if}
    <!-- <p {dragOver ? 'hidden' : ''}>Drag a file here or</p> -->
    <input type="file" hidden on:change={handleInputChange} />
    <button class:disabled={!file} on:click={file ? handleConvert : handleInputChange}>
      {file ? 'Convert' : 'Browse'}
    </button>
    {#if file}
    <button class="abort disabled" on:click={handleAbort}>Abort</button>    
    {:else}
    <button class="abort disabled" hidden on:click={handleAbort}>Abort</button>    
    {/if}
    <!-- <button class="abort disabled" {class:file ? '' : 'hidden'} on:click={handleAbort}>Abort</button> -->
  </div>
  