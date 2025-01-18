<script lang="ts">
  import { fade } from "svelte/transition";
  import type { Writable } from "svelte/store";
  import ArrowDownTrayIcon from "virtual:icons/heroicons/arrow-down-tray";
  import ShareIcon from "virtual:icons/heroicons/share";
  import VideoCameraIcon from "virtual:icons/heroicons/video-camera";
  import CloudArrowUpIcon from "virtual:icons/heroicons/cloud-arrow-up";

  // Props
  export let files: FileList;
  export let processingStarted: Writable<boolean>;
  export let currentProcessingIndex: Writable<number | null>;
  export let fileProgress: Writable<Map<number, number>>;
  export let state: string;
  export let transformState: "1/2" | "2/2" | "0/2";
  export let videoDataList: Array<{
    videoName: string;
    videoBlob: Blob;
    videoBlobURL: string;
  }>;

  // Functions
  export let downloadVideo: (blob: Blob, fileName: string) => void;
  export let shareVideo: (blob: Blob, name: string) => void;
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
                  <div class="badge badge-primary">Przetwarzanie</div>
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
                  <span>
                    {#if $currentProcessingIndex === i}
                      Przetwarzanie...
                    {:else if i > ($currentProcessingIndex ?? -1)}
                      Czeka w kolejce...
                    {:else}
                      Finalizowanie...
                    {/if}
                  </span>
                  <span>{($fileProgress.get(i) || 0).toFixed(0)}%</span>
                </div>
                <progress
                  class="progress w-full {$currentProcessingIndex === i
                    ? 'progress-primary'
                    : 'progress-ghost'}"
                  value={$fileProgress.get(i) || 0}
                  max="100"
                />
                {#if transformState !== "0/2" && $currentProcessingIndex === i}
                  <div class="text-xs text-gray-500">
                    Etap {transformState}
                  </div>
                {/if}
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
    <!-- No files state -->
    <div class="text-center py-8 text-gray-500">
      <CloudArrowUpIcon class="h-12 w-12 mx-auto mb-4" />
      <p>
        {#if files?.length > 0}
          Kliknij "Okiłizuj" aby rozpocząć przetwarzanie
        {:else}
          Wybierz pliki do przetworzenia w zakładce "Wrzuć wideło" a następnie
          kliknij "Okiłizuj"
        {/if}
      </p>
    </div>
  {/if}
</div>
