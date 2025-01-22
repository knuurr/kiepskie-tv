<script lang="ts">
  import { fade } from "svelte/transition";
  import type { Writable } from "svelte/store";
  import ArrowDownTrayIcon from "virtual:icons/heroicons/arrow-down-tray";
  import ShareIcon from "virtual:icons/heroicons/share";
  import VideoCameraIcon from "virtual:icons/heroicons/video-camera";
  import Shimmer from "../ui/Shimmer.svelte";
  import { ffmpegStore } from "$lib/stores/ffmpegStore";

  import {
    getCurrentSubstate,
    type TransformState,
  } from "$lib/types/ProcessingState";

  // Props
  export let files: FileList;
  export let processingStarted: Writable<boolean>;
  export let currentProcessingIndex: Writable<number | null>;
  export let fileProgress: Writable<Map<number, number>>;
  export let state: string;
  export let transformState: TransformState;
  export let videoDataList: Array<{
    videoName: string;
    videoBlob: Blob;
    videoBlobURL: string;
  }>;

  // Functions
  export let downloadVideo: (blob: Blob, fileName: string) => void;
  export let shareVideo: (blob: Blob, name: string) => void;

  // FFmpeg state
  $: isFFmpegLoading = $ffmpegStore.state === "loading";
</script>

<div transition:fade={{ duration: 200 }}>
  {#if files?.length > 0 && $processingStarted}
    <!-- Responsive grid of video cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {#each Array.from(files) as file, i}
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <!-- Title and status badges -->
            <div class="card-title text-base justify-between">
              <div class="truncate flex-1" title={file.name}>
                {file.name}
              </div>
              <div class="flex-none">
                {#if $currentProcessingIndex === i}
                  <div class="badge badge-primary">
                    <span class="animate-pulse">Przetwarzanie</span>
                  </div>
                {:else if videoDataList[i]}
                  <div class="badge badge-success">Gotowe</div>
                {:else if state === "convert.start"}
                  <div class="badge">W kolejce</div>
                {/if}
              </div>
            </div>

            <!-- Progress bar during processing -->
            {#if state === "convert.start"}
              <div class="space-y-2">
                <div
                  class="flex justify-between text-sm {$currentProcessingIndex !==
                  i
                    ? 'text-gray-400'
                    : ''}"
                >
                  {#if $currentProcessingIndex === i}
                    <span class="font-medium">
                      <span class="animate-pulse">
                        {getCurrentSubstate(
                          transformState,
                          $fileProgress.get(i) || 0,
                        )}
                      </span>
                    </span>
                  {:else if i > ($currentProcessingIndex ?? -1)}
                    <span>Czeka w kolejce...</span>
                  {:else}
                    <span>Finalizowanie...</span>
                  {/if}
                  <span>{($fileProgress.get(i) || 0).toFixed(0)}%</span>
                </div>
                <progress
                  class="progress w-full {$currentProcessingIndex === i
                    ? 'progress-primary'
                    : 'progress-ghost'}"
                  value={$fileProgress.get(i) || 0}
                  max="100"
                />
              </div>
            {/if}

            <!-- Video player and actions -->
            {#if videoDataList[i]}
              <!-- Mobile accordion -->
              <div class="block lg:hidden">
                <div class="collapse collapse-arrow bg-base-100">
                  <input type="checkbox" />
                  <div class="collapse-title text-sm font-medium">
                    Kliknij aby zobaczyć wideo
                  </div>
                  <div class="collapse-content">
                    <div class="bg-black rounded-lg overflow-hidden">
                      <video
                        src={videoDataList[i].videoBlobURL}
                        controls
                        autoplay={false}
                        class="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Desktop video player -->
              <div class="hidden lg:block">
                <div class="bg-black rounded-lg overflow-hidden">
                  <video
                    src={videoDataList[i].videoBlobURL}
                    controls
                    autoplay={false}
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Action buttons -->
              <div class="card-actions justify-end mt-4 gap-2">
                <button
                  class="btn btn-primary btn-sm gap-2 flex-1"
                  on:click={() =>
                    downloadVideo(
                      videoDataList[i].videoBlob,
                      videoDataList[i].videoName,
                    )}
                >
                  <ArrowDownTrayIcon class="h-4 w-4" />
                  <span>Zapisz</span>
                </button>
                <button
                  class="btn btn-secondary btn-sm gap-2 flex-1"
                  on:click={() =>
                    shareVideo(
                      videoDataList[i].videoBlob,
                      videoDataList[i].videoName,
                    )}
                >
                  <ShareIcon class="h-4 w-4" />
                  <span>Udostępnij</span>
                </button>
              </div>
            {:else}
              <!-- Waiting state -->
              <div class="flex items-center justify-center py-12 text-gray-500">
                <VideoCameraIcon class="h-12 w-12" />
                <span class="ml-3">Czeka na przetworzenie</span>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- No files placeholder that mimics video card -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <Shimmer active={isFFmpegLoading}>
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <!-- Title and status badges -->
            <div class="card-title text-base justify-between">
              <div class="truncate flex-1 text-base-content/50">wideło.mp4</div>
              <div class="flex-none">
                <div class="badge badge-ghost">Przykład</div>
              </div>
            </div>

            <!-- Placeholder video area -->

            <div
              class="bg-black/5 rounded-lg overflow-hidden aspect-video flex items-center justify-center"
            >
              <div class="text-center text-base-content/50">
                <VideoCameraIcon class="h-12 w-12 mx-auto mb-2" />
                {#if files?.length > 0}
                  <p class="text-sm">
                    Kliknij "Okiłizuj" aby rozpocząć przetwarzanie
                  </p>
                {:else}
                  <p class="text-sm">
                    Wybierz pliki do przetworzenia w zakładce "Wrzuć wideło"
                  </p>
                {/if}
              </div>
            </div>

            <!-- Action buttons placeholder -->
            <div class="card-actions justify-end mt-4 gap-2">
              <button class="btn btn-primary btn-sm gap-2 flex-1 btn-disabled">
                <ArrowDownTrayIcon class="h-4 w-4" />
                <span>Zapisz</span>
              </button>
              <button
                class="btn btn-secondary btn-sm gap-2 flex-1 btn-disabled"
              >
                <ShareIcon class="h-4 w-4" />
                <span>Udostępnij</span>
              </button>
            </div>
          </div>
        </div>
      </Shimmer>
    </div>
  {/if}
</div>
