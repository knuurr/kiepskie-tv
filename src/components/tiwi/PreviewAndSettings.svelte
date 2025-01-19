<script lang="ts">
  import { fade } from "svelte/transition";
  import type { FFmpeg } from "@ffmpeg/ffmpeg";
  import type { PreviewFrame, VideoFrame } from "../../types/video";
  import { writable, type Writable } from "svelte/store";
  import { toasts } from "$lib/stores/toastStore";
  import { videoSettings } from "$lib/stores/videoSettingsStore";
  import AnimatedButton from "./AnimatedButton.svelte";
  import { onMount } from "svelte";
  import BackgroundSelector from "./BackgroundSelector.svelte";
  import * as DATA from "../../routes/Constans.svelte";
  import SettingsDrawer from "./SettingsDrawer.svelte";
  import backgroundsData from "$lib/tiwi/backgrounds.json";
  import TrashIcon from "virtual:icons/heroicons/trash";
  import XMarkIcon from "virtual:icons/heroicons/x-mark";
  import CloudArrowUpIcon from "virtual:icons/heroicons/cloud-arrow-up";
  import ExclamationTriangleIcon from "virtual:icons/heroicons/exclamation-triangle";
  import VideoCameraIcon from "virtual:icons/heroicons/video-camera";
  import PlayCircleIcon from "virtual:icons/heroicons/play-circle";
  import Cog6ToothIcon from "virtual:icons/heroicons/cog-6-tooth";
  import MagnifyingGlassPlusIcon from "virtual:icons/heroicons/magnifying-glass-plus";
  import ChevronLeftIcon from "virtual:icons/heroicons/chevron-left";
  import InformationCircleIcon from "virtual:icons/heroicons/information-circle";

  const PLACEHOLDER_MIN_LOADING_TIME = 300; // milliseconds

  interface AnimatedButtonProps {
    disabled?: boolean;
    fullWidth?: boolean;
    loading?: boolean;
  }

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
  export let activeTab: "how-it-works" | "select-files" | "upload" | "results";

  let showSettings = false;
  let selectedPreviewIndex = 0;
  let showPreviewModal = false;
  let selectedPreviewUrl: string | null = null;
  let showSettingsDrawer = false;
  let backgrounds = backgroundsData.backgrounds;
  let isLoadingBackgrounds = true;
  let hasUnsavedChanges = false;
  let pendingSettings: any = {};
  let currentPreviewPromise: Promise<PreviewFrame[]> | null = null;

  let selectedBackground = backgrounds.find(
    (bg) =>
      bg.id === $videoSettings[selectedFileIndex]?.settings?.selectedBackground,
  );

  $: {
    selectedBackground = backgrounds.find(
      (bg) =>
        bg.id ===
        $videoSettings[selectedFileIndex]?.settings?.selectedBackground,
    );
  }

  // Reset preview index when file changes
  $: if (selectedFileIndex !== undefined) {
    selectedPreviewIndex = 0;
    hasUnsavedChanges = false;
    if ($videoSettings[selectedFileIndex]) {
      pendingSettings = { ...$videoSettings[selectedFileIndex].settings };
    }
    // Only generate preview if we don't have frames yet
    const file = files[selectedFileIndex];
    if (file && $previewFrames.length === 0) {
      currentPreviewPromise = getOrGeneratePreview(file);
    }
  }

  function safeRemoveFile(index: number | undefined, settingId: string) {
    if (typeof index === "number") {
      removeFile(index, settingId);
    }
  }

  function isLoading(currentState: typeof state): boolean {
    return currentState === "loading" || currentState === "convert.start";
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && showPreviewModal) {
      showPreviewModal = false;
    }

    // Only handle keyboard shortcuts when in "upload" tab
    if (activeTab !== "upload") return;

    // Arrow keys for cycling through files
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      if (files && files.length > 0) {
        if (selectedFileIndex === undefined) {
          selectedFileIndex = 0;
        } else {
          if (event.key === "ArrowLeft") {
            selectedFileIndex =
              selectedFileIndex === 0
                ? files.length - 1
                : selectedFileIndex - 1;
          } else {
            selectedFileIndex =
              selectedFileIndex === files.length - 1
                ? 0
                : selectedFileIndex + 1;
          }
        }
      }
    }

    // Shift+S to open settings
    if (event.shiftKey && event.key === "S") {
      showSettingsDrawer = true;
    }

    // Shift+O to trigger conversion
    if (event.shiftKey && event.key === "O" && files?.length > 0) {
      convertVideos(files);
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  onMount(async () => {
    try {
      isLoadingBackgrounds = true;
      const response = await fetch(DATA.PATH_BACKGROUNDS_JSON);
      const data = await response.json();
      backgrounds = data.backgrounds;
    } catch (error) {
      console.error("Error loading backgrounds:", error);
      toasts.add("Błąd ładowania konfiguracji teł", "error");
    } finally {
      isLoadingBackgrounds = false;
    }
  });

  // Function to get background name
  function getBackgroundName(settingId: string) {
    if (isLoadingBackgrounds) return null;

    const selectedBackground = $videoSettings.find((s) => s.id === settingId)
      ?.settings?.selectedBackground;
    const background = backgrounds.find((bg) => bg.id === selectedBackground);
    return background?.name || backgrounds[0]?.name;
  }

  function handleSettingChange(settingId: string, changes: any) {
    hasUnsavedChanges = true;
    pendingSettings = { ...pendingSettings, ...changes };
  }

  async function saveSettings(settingId: string) {
    if (!hasUnsavedChanges) return;

    videoSettings.updateSettings(settingId, pendingSettings);
    hasUnsavedChanges = false;

    if (selectedFileIndex !== undefined) {
      const file = files[selectedFileIndex];
      await regeneratePreview(file);
      toasts.add("Ustawienia zostały zapisane", "success");
    }
  }

  function handleCheckboxChange(settingId: string, key: string, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target && target instanceof HTMLInputElement) {
      handleSettingChange(settingId, {
        [key]: target.checked,
      });
    }
  }

  function cleanupPreviews() {
    // Clear existing preview frames
    $previewFrames.forEach((frame) => URL.revokeObjectURL(frame.url));
    $previewFrames = [];
    currentPreviewPromise = null;
  }

  async function regeneratePreview(file: File) {
    // Show loading state
    previewProgress.set({ stage: "extracting", current: 0 });

    try {
      // Generate new previews before cleaning up old ones
      currentPreviewPromise = getOrGeneratePreview(file);
      const newFrames = await currentPreviewPromise;

      // Only clean up old previews after we have new ones
      cleanupPreviews();

      // Set new frames
      $previewFrames = newFrames;
      toasts.add("Podgląd został zaktualizowany", "success");
    } catch (error) {
      console.error("Error regenerating preview:", error);
      toasts.add("Błąd podczas generowania podglądu", "error");
    }
  }

  function resetSettings() {
    const currentSettings =
      selectedFileIndex !== undefined && $videoSettings[selectedFileIndex]
        ? $videoSettings[selectedFileIndex].settings
        : undefined;

    if (currentSettings) {
      pendingSettings = { ...currentSettings };
      hasUnsavedChanges = false;
    }
  }

  // Cleanup on unmount
  onMount(() => {
    return () => {
      cleanupPreviews();
    };
  });
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
                        on:click={() =>
                          safeRemoveFile(selectedFileIndex, settingId)}
                      >
                        <TrashIcon class="h-4 w-4" />
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
                        <CloudArrowUpIcon
                          class="mx-auto h-12 w-12 text-gray-400"
                        />
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
                        <div class="card-body p-4 grid grid-cols-12 gap-4">
                          <!-- Thumbnail -->
                          <div class="col-span-2">
                            {#if currentPreviewPromise}
                              {#await Promise.all( [currentPreviewPromise, new Promise( (resolve) => setTimeout(resolve, PLACEHOLDER_MIN_LOADING_TIME), )], )}
                                <div
                                  class="w-full aspect-video bg-base-300 rounded-lg animate-pulse"
                                ></div>
                              {:then [frames]}
                                <img
                                  src={frames[0]?.url}
                                  alt="Thumbnail"
                                  class="w-full aspect-video object-cover rounded-lg"
                                />
                              {:catch}
                                <div
                                  class="w-full aspect-video bg-base-300 rounded-lg flex items-center justify-center"
                                >
                                  <ExclamationTriangleIcon
                                    class="h-6 w-6 text-base-content/50"
                                  />
                                </div>
                              {/await}
                            {/if}
                          </div>
                          <!-- File info -->
                          <div class="col-span-9 pr-10">
                            <h4 class="font-medium break-all text-left">
                              {file.name}
                            </h4>
                            <p class="text-sm text-gray-500 text-left">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <!-- Delete button -->
                          <div class="col-span-1 flex justify-end">
                            <button
                              class="btn btn-sm btn-square btn-error btn-outline"
                              on:click|stopPropagation={() =>
                                removeFile(i, settingId)}
                            >
                              <XMarkIcon class="h-4 w-4" />
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
                    disabled={isLoading(state)}
                    loading={isLoading(state)}
                    fullWidth
                  >
                    <PlayCircleIcon class="h-5 w-5" />
                    Okiłizuj
                    <div
                      class="flex items-center gap-1 ml-2 text-base-content/70"
                    >
                      <kbd class="kbd kbd-sm">⇧</kbd>
                      <kbd class="kbd kbd-sm">o</kbd>
                    </div>
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
                    <VideoCameraIcon class="h-12 w-12 mx-auto mb-4" />
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
                      on:click={() => (showSettingsDrawer = true)}
                    >
                      Ustawienia
                    </button>
                  </div>
                  <div class="flex justify-end items-center mt-2">
                    <div
                      class="tooltip tooltip-bottom"
                      data-tip="Ustawienia mogą wpłynąć na czas przetwarzania"
                    >
                      <InformationCircleIcon class="h-5 w-5 text-gray-500" />
                    </div>

                    <span class="text-xs text-base-content/70">
                      Ustawienia mogą wpłynąć na czas przetwarzania
                    </span>
                  </div>

                  <!-- Desktop title -->
                  <div class="hidden lg:flex justify-between items-center mb-4">
                    <div class="flex items-center gap-4">
                      <h3 class="card-title text-lg">Podgląd</h3>
                      <!-- Keyboard shortcuts info -->
                      <div
                        class="flex items-center gap-2 text-sm text-base-content/70"
                      >
                        <span class="flex items-center gap-1">
                          <kbd class="kbd kbd-sm">←</kbd>
                          <kbd class="kbd kbd-sm">→</kbd>
                          przełączaj pliki
                        </span>
                      </div>
                    </div>
                    <button
                      class="btn btn-ghost btn-sm gap-2"
                      on:click={() => (showSettingsDrawer = true)}
                    >
                      <Cog6ToothIcon class="h-4 w-4" />
                      Ustawienia
                      <div
                        class="flex items-center gap-1 ml-1 text-base-content/70"
                      >
                        <kbd class="kbd kbd-sm">⇧</kbd>
                        <kbd class="kbd kbd-sm">s</kbd>
                      </div>
                    </button>
                  </div>

                  <!-- Preview -->
                  <div class="space-y-4">
                    <div class="bg-base-300 rounded-lg overflow-hidden">
                      {#if currentPreviewPromise}
                        {#await Promise.all( [currentPreviewPromise, new Promise( (resolve) => setTimeout(resolve, PLACEHOLDER_MIN_LOADING_TIME), )], )}
                          <div
                            class="w-full flex flex-col lg:flex-row items-center lg:items-start gap-4 p-4"
                          >
                            <!-- Main preview placeholder -->
                            <div class="flex-1 w-full">
                              <div class="relative">
                                <div
                                  class="w-full h-[133px] lg:h-[400px] bg-base-100 rounded-lg animate-pulse flex items-center justify-center"
                                >
                                  <!-- Loading state text -->
                                  <div class="text-center">
                                    <div
                                      class="flex flex-col items-center gap-2"
                                    >
                                      <span
                                        class="loading loading-spinner loading-lg"
                                      ></span>
                                      <div
                                        class="text-sm text-gray-500 text-center"
                                      >
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
                                </div>
                                <!-- Timestamp and instruction placeholders -->
                                <div class="text-center mt-2">
                                  <div
                                    class="h-5 w-32 bg-base-100 rounded animate-pulse mx-auto"
                                  ></div>
                                  <div
                                    class="h-4 w-48 bg-base-100 rounded animate-pulse mx-auto mt-0.5"
                                  ></div>
                                </div>
                              </div>
                            </div>

                            <!-- Thumbnails placeholder -->
                            <div class="w-full lg:w-32 flex-none">
                              <div
                                class="text-sm text-gray-500 mb-2 text-center"
                              >
                                <span class="hidden lg:inline"
                                  >Podgląd klatek</span
                                >
                              </div>
                              <!-- Desktop thumbnails placeholders -->
                              <div
                                class="hidden lg:flex lg:flex-col gap-2 justify-center"
                              >
                                {#each Array(3) as _, i}
                                  <div
                                    class="w-full aspect-video bg-base-100 rounded-lg animate-pulse"
                                  ></div>
                                {/each}
                              </div>

                              <!-- Mobile navigation buttons placeholders -->
                              <div
                                class="flex lg:hidden justify-center items-center gap-2"
                              >
                                {#each Array(3) as _, i}
                                  <div
                                    class="w-8 h-8 rounded-full bg-base-100 animate-pulse"
                                  ></div>
                                {/each}
                              </div>
                            </div>
                          </div>
                        {:then [frames]}
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
                                  <div
                                    class="relative w-full h-auto lg:h-[400px] flex items-center justify-center bg-base-100/50 rounded-lg"
                                  >
                                    <img
                                      src={frames[selectedPreviewIndex].url}
                                      alt="Podgląd"
                                      class="w-full lg:max-w-full lg:max-h-full lg:w-auto lg:h-auto object-contain rounded-lg transition-all group-hover:brightness-75"
                                    />
                                  </div>
                                  <!-- Bottom right magnifying glass -->
                                  <div
                                    class="absolute bottom-2 right-2 bg-black/50 p-2 rounded-full transition-opacity opacity-50 group-hover:opacity-100"
                                  >
                                    <MagnifyingGlassPlusIcon
                                      class="h-4 w-4 text-white"
                                    />
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
                                          <ChevronLeftIcon
                                            class="h-4 w-4 text-primary"
                                          />
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
                                      on:click={() =>
                                        (selectedPreviewIndex = i)}
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
                        {/await}
                      {/if}
                    </div>
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
            <PlayCircleIcon class="h-4 w-4" />
            Okiłizuj
            <div class="flex items-center gap-1 ml-2 text-base-content/70">
              <kbd class="kbd kbd-sm">⇧</kbd>
              <kbd class="kbd kbd-sm">o</kbd>
            </div>
          </AnimatedButton>
        </div>
      </div>
    </div>
  {:else if state === "convert.start"}
    <div class="card bg-base-200">
      <div class="card-body">
        <div class="card-actions justify-center">
          <button on:click={resetFfmpeg} class="btn btn-error gap-2">
            <XMarkIcon class="h-4 w-4" />
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
        <XMarkIcon class="h-4 w-4" />
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

<!-- Settings Drawer -->
{#if selectedFileIndex !== undefined}
  <SettingsDrawer
    bind:showDrawer={showSettingsDrawer}
    {selectedFileIndex}
    settingId={$videoSettings[selectedFileIndex]?.id}
    {regeneratePreview}
    {files}
  />
{/if}
