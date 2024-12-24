<script lang="ts">
  import { fade } from "svelte/transition";
  import type { FFmpeg } from "@ffmpeg/ffmpeg";
  import type { PreviewFrame, VideoFrame } from "../../types/video";
  import { writable, type Writable } from "svelte/store";
  import { toasts } from "$lib/stores/toastStore";
  import { videoSettings } from "$lib/stores/videoSettingsStore";
  import AnimatedButton from "./AnimatedButton.svelte";

  // Props
  export let state:
    | "loading"
    | "loaded"
    | "convert.ready"
    | "convert.start"
    | "convert.error"
    | "convert.done";
  export let files: FileList;
  export let selectedFileIndex: number | undefined;
  export let ffmpeg: FFmpeg;
  export let previewFrames: Writable<PreviewFrame[]>;
  export let previewProgress: Writable<{
    stage: "extracting" | "processing";
    current: number;
  }>;
  export let getOrGeneratePreview: (file: File) => Promise<PreviewFrame[]>;
  export let convertVideos: (files: FileList) => Promise<void>;
  export let removeFile: (index: number, settingId: string) => void;
  export let resetFfmpeg: () => void;

  let showSettings = false;
  let selectedPreviewIndex = 0;
  let showPreviewModal = false;
  let selectedPreviewUrl: string | null = null;

  // Reset preview index when file changes
  $: if (selectedFileIndex !== undefined) {
    selectedPreviewIndex = 0;
  }

  function handleRemoveFile(index: number | undefined, settingId: string) {
    if (index !== undefined) {
      removeFile(index, settingId);
    }
  }

  function isLoading(state: string): boolean {
    return state === "loading";
  }
</script>

<div class="" transition:fade={{ duration: 200 }}>
  {#if state === "loading"}
    <div class="flex items-center justify-center">
      <span class="loading loading-spinner loading-lg"></span>
      <p class="ml-2">Ładuję ffmpeg...</p>
    </div>
  {:else if state === "loaded" || state === "convert.done"}
    <div class="card bg-base-200 mt-4">
      <div class="card-body">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- File List -->
          <div class="lg:col-span-1 overflow-x-auto">
            <div class="flex flex-col h-full">
              <!-- Existing file list content -->
              <div class="flex-1">
                <!-- Mobile Select -->
                <div class="lg:hidden">
                  <div class="flex flex-col gap-2">
                    <select
                      class="select select-bordered w-full {files?.length
                        ? 'select-primary'
                        : ''}"
                      value={selectedFileIndex}
                      on:change={(e) =>
                        (selectedFileIndex = Number(e.currentTarget.value))}
                      disabled={!files?.length}
                    >
                      <option
                        value={undefined}
                        disabled
                        selected={selectedFileIndex === undefined}
                      >
                        {files?.length
                          ? "Wybierz plik do edycji"
                          : "Brak plików"}
                      </option>
                      {#each Array.from(files || []) as file, i}
                        <option value={i}>
                          {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </option>
                      {/each}
                    </select>

                    <!-- Add mobile file removal button when a file is selected -->
                    {#if selectedFileIndex !== undefined && files[selectedFileIndex]}
                      {@const settingId = $videoSettings[selectedFileIndex]?.id}
                      <button
                        class="btn btn-error btn-outline btn-sm gap-2 w-full"
                        on:click={() => {
                          const currentIndex = selectedFileIndex;
                          removeFile(currentIndex, settingId);
                        }}
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
                        Usuń wybrany plik
                      </button>
                    {/if}
                  </div>
                </div>

                <!-- Desktop List -->
                <div class="hidden lg:block">
                  <div class="flex flex-col gap-2">
                    {#if !files?.length}
                      <div class="text-center p-8 bg-base-100 rounded-lg">
                        <svg
                          class="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <h3 class="mt-2 text-sm font-medium">Brak plików</h3>
                        <p class="mt-1 text-sm text-gray-500">
                          Wybierz pliki do przetworzenia
                        </p>
                      </div>
                    {/if}
                    {#each Array.from(files || []) as file, i}
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
                            <!-- Add padding-right to make space for the delete button -->
                            <h4 class="font-medium break-all text-left">
                              {file.name}
                            </h4>
                            <p class="text-sm text-gray-500 text-left">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <div class="absolute right-4 top-4">
                            <button
                              class="btn btn-sm btn-square btn-error btn-outline"
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
                        </div>
                      </button>
                    {/each}
                  </div>
                </div>
              </div>

              <!-- Convert Button - Now at bottom of column -->
              {#if files?.length > 0}
                <div class="mt-4 pt-4 border-t border-base-300 hidden lg:block">
                  <AnimatedButton
                    on:click={() => convertVideos(files)}
                    disabled={state === "loading"}
                    loading={state === "loading"}
                    fullWidth
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
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
                    Okiłizuj
                  </AnimatedButton>
                  <p class="text-xs text-center mt-2 text-base-content/70">
                    Wszystkie pliki zostaną przetworzone po kolei
                  </p>
                </div>
              {/if}
            </div>
          </div>

          <!-- Preview and Settings -->
          <div class="lg:col-span-2">
            {#if !files?.length}
              <div class="card bg-base-100">
                <div class="card-body">
                  <div class="text-center text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-12 w-12 mx-auto mb-4"
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
                    <p>Wybierz pliki aby zobaczyć podgląd i ustawienia</p>
                  </div>
                </div>
              </div>
            {/if}
            {#if selectedFileIndex !== undefined && files[selectedFileIndex]}
              {@const file = files[selectedFileIndex]}
              {@const settingId = $videoSettings[selectedFileIndex]?.id}
              <div class="card bg-base-100">
                <div class="card-body">
                  <!-- Mobile tabs -->
                  <div class="lg:hidden tabs tabs-boxed mb-4">
                    <button
                      class="tab flex-1 {!showSettings ? 'tab-active' : ''}"
                      on:click={() => (showSettings = false)}
                    >
                      Podgląd
                    </button>
                    <button
                      class="tab flex-1 {showSettings ? 'tab-active' : ''}"
                      on:click={() => (showSettings = true)}
                    >
                      Ustawienia
                    </button>
                  </div>

                  <!-- Desktop title -->
                  <h3 class="card-title text-lg hidden lg:block">
                    Podgląd i ustawienia
                  </h3>

                  <!-- Preview -->
                  <div
                    class="space-y-4 {showSettings ? 'hidden lg:block' : ''}"
                  >
                    <div
                      class="bg-base-300 rounded-lg overflow-hidden lg:min-h-[400px]"
                    >
                      {#await getOrGeneratePreview(file)}
                        <div
                          class="w-full h-[400px] flex flex-col items-center justify-center gap-4"
                        >
                          <div class="flex flex-col items-center gap-2">
                            <span class="loading loading-spinner loading-lg"
                            ></span>
                            <div class="text-sm text-gray-500 text-center">
                              <p>Generowanie podglądu...</p>
                              <p class="text-xs mt-1">
                                {#if $previewProgress.stage === "extracting"}
                                  Wyciąganie klatki {$previewProgress.current}/3
                                {:else if $previewProgress.stage === "processing"}
                                  Przetwarzanie klatki {$previewProgress.current}/3
                                {/if}
                              </p>
                            </div>
                          </div>
                        </div>
                      {:then frames}
                        {#if frames.length > 0}
                          <!-- Main preview image -->
                          <div
                            class="relative flex flex-col lg:flex-row items-center lg:items-start gap-4 p-4"
                          >
                            <div class="flex-1">
                              <button
                                class="w-full group relative"
                                on:click={() => {
                                  selectedPreviewUrl =
                                    frames[selectedPreviewIndex].url;
                                  showPreviewModal = true;
                                }}
                              >
                                <img
                                  src={frames[selectedPreviewIndex].url}
                                  alt="Podgląd"
                                  class="max-w-full max-h-[400px] w-auto h-auto object-contain mx-auto rounded-lg transition-all group-hover:brightness-75"
                                />
                                <!-- Bottom right magnifying glass -->
                                <div
                                  class="absolute bottom-2 right-2 bg-black/50 p-2 rounded-full transition-opacity opacity-50 group-hover:opacity-100"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-4 w-4 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                    />
                                  </svg>
                                </div>
                                <!-- Zoom icon overlay -->
                                <div
                                  class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <div class="bg-black/50 p-2 rounded-full">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      class="h-6 w-6 text-white"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </button>
                              <!-- Timestamp indicator -->
                              <div class="text-center text-sm mt-2">
                                <div class="text-gray-500">
                                  Klatka z {frames[
                                    selectedPreviewIndex
                                  ].timestamp.toFixed(1)}s
                                </div>
                                <div class="text-gray-500 text-xs mt-0.5">
                                  Kliknij na obrazek aby powiększyć
                                </div>
                              </div>
                            </div>
                            <!-- Frame picker thumbnails -->
                            <div class="w-full lg:w-32 flex-none">
                              <div
                                class="text-sm text-gray-500 mb-2 text-center"
                              >
                                {#if frames.length > 0}
                                  <span class="hidden lg:inline"
                                    >Podgląd klatek</span
                                  >
                                {/if}
                              </div>
                              <!-- Desktop thumbnails -->
                              <div
                                class="hidden lg:flex lg:flex-col gap-2 justify-center"
                              >
                                {#each frames as frame, i}
                                  <button
                                    class="relative w-24 lg:w-full aspect-video group"
                                    on:click={() => {
                                      console.log(
                                        `[*] Selecting preview frame ${i} (${frame.timestamp.toFixed(2)}s)`,
                                      );
                                      selectedPreviewIndex = i;
                                    }}
                                  >
                                    <div
                                      class="absolute inset-0 rounded-lg border-2 transition-all {selectedPreviewIndex ===
                                      i
                                        ? 'border-primary bg-primary/10 shadow-lg'
                                        : 'border-base-100 group-hover:border-primary/50'}"
                                    />
                                    <img
                                      src={frame.url}
                                      alt="Podgląd klatki {i + 1}"
                                      class="w-full h-full object-cover rounded-lg"
                                    />
                                    {#if selectedPreviewIndex === i}
                                      <div
                                        class="absolute -left-2 top-1/2 -translate-y-1/2"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          class="h-4 w-4 text-primary"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fill-rule="evenodd"
                                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                            clip-rule="evenodd"
                                          />
                                        </svg>
                                      </div>
                                    {/if}
                                    <div
                                      class="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/50 rounded text-[10px] text-white"
                                    >
                                      {frame.timestamp.toFixed(1)}s
                                    </div>
                                  </button>
                                {/each}
                              </div>

                              <!-- Mobile navigation buttons -->
                              <div
                                class="flex lg:hidden justify-center items-center gap-2"
                              >
                                {#each frames as _, i}
                                  <button
                                    class="btn btn-circle btn-sm {selectedPreviewIndex ===
                                    i
                                      ? 'btn-primary'
                                      : 'btn-ghost'}"
                                    on:click={() => (selectedPreviewIndex = i)}
                                    aria-label="Podgląd klatki {i + 1}"
                                  >
                                    {i + 1}
                                  </button>
                                {/each}
                              </div>

                              <!-- Add preview info below pagination -->
                              <div
                                class="text-center text-sm text-gray-500 mt-2 lg:hidden"
                              >
                                Klatka {selectedPreviewIndex +
                                  1}/{frames.length} ({frames[
                                  selectedPreviewIndex
                                ].timestamp.toFixed(1)}s)
                              </div>
                            </div>
                          </div>
                        {/if}
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
                  </div>

                  <!-- Settings -->
                  <div class="divider hidden lg:flex">Ustawienia</div>
                  <div
                    class="grid grid-cols-1 md:grid-cols-2 gap-4 {!showSettings
                      ? 'hidden lg:grid'
                      : ''}"
                  >
                    <label
                      class="flex items-center gap-4 p-4 bg-base-200 rounded-lg"
                    >
                      <span class="flex-1 lg:text-base text-sm"
                        >Dodaj efekt dźwiękowy przejścia</span
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
                    </label>
                    <label
                      class="flex items-center gap-4 p-4 bg-base-200 rounded-lg"
                    >
                      <span class="flex-1 lg:text-base text-sm"
                        >Dodaj reakcję Boczka</span
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
                    </label>
                  </div>

                  <!-- Reset button - Only show in settings tab on mobile -->
                  <div
                    class="{!showSettings
                      ? 'hidden lg:block'
                      : ''} card-actions justify-end mt-4"
                  >
                    <button
                      class="btn btn-outline btn-sm w-full lg:w-auto lg:btn-ghost"
                      on:click={() => videoSettings.resetToDefault(settingId)}
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
            {/if}
          </div>
        </div>

        <!-- Mobile Convert Button -->
        <div class="lg:hidden card-actions justify-end mt-4">
          <AnimatedButton
            on:click={() => convertVideos(files)}
            disabled={!files}
            fullWidth
          >
            Okiłizuj
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
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </AnimatedButton>
        </div>
      </div>
    </div>
  {:else if state === "convert.start"}
    <div class="card bg-base-200">
      <div class="card-body">
        <div class="card-actions justify-center">
          <button on:click={resetFfmpeg} class="btn btn-error gap-2">
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
            Anuluj przetwarzanie
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Preview Modal -->
{#if showPreviewModal && selectedPreviewUrl}
  <div
    class="modal modal-open"
    on:click|self={() => (showPreviewModal = false)}
  >
    <div class="modal-box relative max-w-4xl w-11/12 h-auto">
      <button
        class="btn btn-sm btn-circle absolute right-2 top-2"
        on:click={() => (showPreviewModal = false)}
      >
        ✕
      </button>
      <figure class="flex items-center justify-center">
        <img
          src={selectedPreviewUrl}
          alt="Podgląd w pełnej rozdzielczości"
          class="max-h-[80vh] w-auto object-contain rounded-lg"
        />
      </figure>
    </div>
  </div>
{/if}
