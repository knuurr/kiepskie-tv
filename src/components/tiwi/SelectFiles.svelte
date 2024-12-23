<script lang="ts">
  import { fade } from "svelte/transition";

  // Props
  export let files: FileList | undefined;
  export let removeCachedPreview: (file: File) => void;

  // Event dispatcher for file changes
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher<{
    clearFiles: void;
    filesChange: { files: FileList };
  }>();

  // Handler for clearing files
  function handleClearFiles() {
    Array.from(files || []).forEach((file) => {
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
</script>

<div transition:fade={{ duration: 200 }}>
  <div class="card bg-base-200">
    <div class="card-body">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4"
      >
        <h2 class="card-title">Wybierz pliki do przetworzenia</h2>
      </div>

      <p class="text-lg">Dropnij wideło albo kliknij by "załonczyć"</p>

      <label class="form-control w-full">
        <input
          type="file"
          name="file"
          multiple
          on:change={handleFilesChange}
          accept="video/*"
          class="file-input file-input-bordered w-full file-input-md sm:file-input-md {files &&
          files.length > 0
            ? 'file-input-success'
            : ''}"
        />
        <div class="label flex flex-col items-start gap-1">
          <span class="label-text-alt text-gray-400"
            >Max. wielkość 2GB. Testowane na plikach mp4/webm poniżej 60 sekund.</span
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
