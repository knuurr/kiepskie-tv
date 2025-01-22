<script lang="ts">
  import { fade } from "svelte/transition";
  import FilmIcon from "virtual:icons/heroicons/film";
  import VideoIcon from "virtual:icons/heroicons/video-camera";
  import XMarkIcon from "virtual:icons/heroicons/x-mark";
  import TrashIcon from "virtual:icons/heroicons/trash";
  import InformationCircleIcon from "virtual:icons/heroicons/information-circle";
  import { createEventDispatcher } from "svelte";
  import { ffmpegStore } from "$lib/stores/ffmpegStore";

  // Props
  export let files: File[] = [];
  export let removeCachedPreview: (file: File) => void;
  export let removeFile: (index: number) => void;

  // Event dispatcher for file changes
  const dispatch = createEventDispatcher<{
    clearFiles: void;
    filesChange: { files: FileList };
  }>();

  // Handler for clearing files
  function handleClearFiles() {
    files.forEach((file) => {
      removeCachedPreview(file);
    });
    dispatch("clearFiles");
  }

  // Handler for file input changes
  function handleFilesChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      dispatch("filesChange", { files: input.files });
    }
  }

  // Handler for removing single file
  function handleRemoveFile(file: File, index: number) {
    removeCachedPreview(file);
    removeFile(index);
  }

  // Check if FFmpeg is ready
  $: isFFmpegReady = $ffmpegStore.state === "loaded";
  $: isFFmpegLoading = $ffmpegStore.state === "loading";
  $: ffmpegError = $ffmpegStore.state === "error";
</script>

<div transition:fade={{ duration: 200 }}>
  <div class="card bg-base-200">
    <div class="card-body">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4"
      >
        <h2 class="card-title">Wybierz pliki do przetworzenia</h2>
      </div>

      <div class="flex flex-col items-center justify-center w-full">
        <label
          for="dropzone-file"
          class="flex flex-col items-center justify-center w-full h-64 border-2 border-base-300 border-dashed rounded-lg cursor-{isFFmpegReady
            ? 'pointer'
            : 'not-allowed'} bg-base-100 hover:bg-base-200 transition-colors {!isFFmpegReady
            ? 'opacity-50'
            : ''} {isFFmpegLoading ? 'animate-pulse' : ''}"
        >
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
            <FilmIcon
              class="w-12 h-12 mb-4 {isFFmpegReady
                ? 'text-primary'
                : 'text-base-content/50'} {isFFmpegLoading
                ? 'animate-pulse'
                : ''}"
            />
            {#if isFFmpegReady}
              <p class="mb-2 text-lg text-center sm:text-base">
                Dropnij wideło albo kliknij by "załonczyć"
              </p>
              <p class="text-xs text-gray-500">MP4 lub WEBM (MAX 2GB)</p>
            {:else}
              <p
                class="mb-2 text-lg text-center sm:text-base text-base-content/70 {isFFmpegLoading
                  ? 'animate-pulse'
                  : ''}"
              >
                Poczekaj na załadowanie FFmpeg...
              </p>
              <p
                class="text-xs text-base-content/50 {isFFmpegLoading
                  ? 'animate-pulse'
                  : ''}"
              >
                Funkcja będzie dostępna po załadowaniu
              </p>
            {/if}
          </div>
          <input
            id="dropzone-file"
            type="file"
            class="hidden"
            name="file"
            multiple
            on:change={handleFilesChange}
            accept="video/*"
            disabled={!isFFmpegReady}
          />
        </label>
        <div class="label flex flex-col items-start gap-1 w-full mt-2">
          <span class="label-text-alt text-gray-400"
            >Max. wielkość 2GB. Testowane na plikach mp4/webm poniżej 60 sekund.</span
          >
          <span class="label-text-alt text-gray-400"
            >Twoje pliki nigdzie nie są wysyłane - <span class="font-bold"
              >obróbka jest offline</span
            >.</span
          >
        </div>
      </div>

      {#if files.length > 0}
        <div class="divider">Wybrane pliki</div>
        <div class="flex flex-col gap-2">
          {#each files as file, i}
            <div
              class="flex items-center justify-between p-2 bg-base-100 rounded-lg"
            >
              <div class="flex items-center gap-2">
                <VideoIcon class="w-6 h-6 text-primary" />
                <span class="text-sm truncate max-w-[200px]">{file.name}</span>
                <span class="text-xs text-gray-500"
                  >({(file.size / (1024 * 1024)).toFixed(2)} MB)</span
                >
              </div>
              <button
                class="btn btn-circle btn-xs btn-ghost"
                on:click={() => handleRemoveFile(file, i)}
              >
                <XMarkIcon class="h-4 w-4" />
              </button>
            </div>
          {/each}
        </div>

        <div class="flex justify-end mt-4">
          <button
            class="btn btn-sm btn-error btn-outline gap-2"
            on:click={handleClearFiles}
          >
            <TrashIcon class="h-4 w-4" />
            Wyczyść listę plików
          </button>
        </div>
      {/if}

      <div class="alert alert-neutral mt-4 sm:alert-lg alert-sm">
        <InformationCircleIcon class="h-4 w-4 sm:h-6 sm:w-6" />
        <span class="text-xs sm:text-base"
          >Po wybraniu plików zostaniesz przeniesiony do zakładki "Wrzuć wideło"
          gdzie możesz dostosować ustawienia.</span
        >
      </div>
    </div>
  </div>
</div>
