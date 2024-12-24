<script lang="ts">
  import { fade } from "svelte/transition";

  // Props
  export let files: File[] = [];
  export let removeCachedPreview: (file: File) => void;
  export let removeFile: (index: number) => void;

  // Event dispatcher for file changes
  import { createEventDispatcher } from "svelte";
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
          class="flex flex-col items-center justify-center w-full h-64 border-2 border-base-300 border-dashed rounded-lg cursor-pointer bg-base-100 hover:bg-base-200 transition-colors"
        >
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              class="w-12 h-12 mb-4 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
            <p class="mb-2 text-lg">
              Dropnij wideło albo kliknij by "załonczyć"
            </p>
            <p class="text-xs text-gray-500">MP4 lub WEBM (MAX 2GB)</p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            class="hidden"
            name="file"
            multiple
            on:change={handleFilesChange}
            accept="video/*"
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
                <svg
                  class="w-6 h-6 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
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
                <span class="text-sm truncate max-w-[200px]">{file.name}</span>
                <span class="text-xs text-gray-500"
                  >({(file.size / (1024 * 1024)).toFixed(2)} MB)</span
                >
              </div>
              <button
                class="btn btn-circle btn-xs btn-ghost"
                on:click={() => handleRemoveFile(file, i)}
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
          {/each}
        </div>

        <div class="flex justify-end mt-4">
          <button
            class="btn btn-sm btn-error btn-outline gap-2"
            on:click={handleClearFiles}
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
        </div>
      {/if}

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
          >Po wybraniu plików zostaniesz przeniesiony do zakładki "Wrzuć wideło"
          gdzie możesz dostosować ustawienia.</span
        >
      </div>
    </div>
  </div>
</div>
