<script lang="ts">
  import type { Toast } from "$lib/types/Toast";
  import MissingMetadataInfo from "./MissingMetadataInfo.svelte";
  import AudioWavePlayer from "./AudioWavePlayer.svelte";
  import { onMount } from "svelte";
  // Import Heroicons
  import XMarkIcon from "virtual:icons/heroicons/x-mark";
  import CheckIcon from "virtual:icons/heroicons/check";
  import ClipboardIcon from "virtual:icons/heroicons/clipboard";
  import ShareIcon from "virtual:icons/heroicons/share";
  import NoSymbolIcon from "virtual:icons/heroicons/no-symbol";

  export let showDrawer = false;
  export let toastHistory: { toast: Toast; episodeTimestamp: number }[] = [];
  export let copyStates: { [key: number]: boolean } = {};
  export let shareStates: { [key: number]: boolean } = {};
  export let canShareOnDevice = false;

  // Handle escape key press
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && showDrawer) {
      showDrawer = false;
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  // Function to copy toast to clipboard
  function copyHistoryToast(episodeTimestamp: number) {
    const entry = toastHistory.find(
      (t) => t.episodeTimestamp === episodeTimestamp,
    );
    if (!entry) return;

    navigator.clipboard
      .writeText(entry.toast.text)
      .then(() => {
        copyStates[episodeTimestamp] = true;
        setTimeout(() => {
          copyStates[episodeTimestamp] = false;
        }, 3000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }

  // Function to share toast
  async function shareHistoryToast(entry: {
    toast: Toast;
    episodeTimestamp: number;
  }) {
    const shareData = {
      title: "Toast z Kiepskich",
      text: entry.toast.text,
      url: window.location.href,
    };

    try {
      if (!navigator.canShare(shareData)) {
        console.log("Content cannot be shared:", shareData);
        return;
      }

      await navigator.share(shareData);
      shareStates[entry.episodeTimestamp] = true;
      setTimeout(() => {
        shareStates[entry.episodeTimestamp] = false;
      }, 3000);
    } catch (err) {
      console.error("Error sharing:", err);
    }
  }
</script>

<div class="drawer drawer-end">
  <input
    type="checkbox"
    id="history-drawer"
    class="drawer-toggle"
    bind:checked={showDrawer}
  />

  <div class="drawer-side z-[100]">
    <label
      for="history-drawer"
      aria-label="close sidebar"
      class="drawer-overlay"
    ></label>
    <div
      class="p-4 w-80 min-h-full bg-base-200 text-base-content flex flex-col"
    >
      <!-- Sticky Drawer header -->
      <div class="sticky top-0 bg-base-200 z-[101] pb-4">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-bold text-lg">Historia toastów</h3>
            <p class="text-xs opacity-50">max. 5 ostatnich losowań</p>
          </div>
          <button
            class="btn btn-square btn-sm"
            on:click={() => (showDrawer = false)}
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto">
        {#if toastHistory.length > 0}
          <div class="flex flex-col gap-4">
            {#each toastHistory as entry}
              <div class="card bg-base-100">
                <div class="card-body p-4">
                  <div class="flex flex-col gap-2">
                    <div class="flex justify-between items-start">
                      <div class="badge badge-neutral">
                        Odcinek: {entry.toast.episodeNumber ?? "???"}
                      </div>
                      <div class="badge badge-neutral">
                        Czas: {entry.toast.episodeTimestamp ?? "??:??"}
                      </div>
                    </div>

                    <p class="text-lg">{entry.toast.text}</p>

                    <AudioWavePlayer
                      audioFile={entry.toast.audioFile}
                      showText={false}
                    />

                    <div class="grid grid-cols-2 gap-2">
                      <button
                        on:click={() =>
                          copyHistoryToast(entry.episodeTimestamp)}
                        class="btn btn-sm {copyStates[entry.episodeTimestamp]
                          ? 'btn-success'
                          : 'btn-ghost'}"
                        aria-label="Kopiuj do schowka"
                      >
                        {#if copyStates[entry.episodeTimestamp]}
                          <CheckIcon class="h-4 w-4" />
                        {:else}
                          <ClipboardIcon class="h-4 w-4" />
                        {/if}
                      </button>

                      <div
                        class="tooltip tooltip-bottom"
                        data-tip={!canShareOnDevice
                          ? "Udostępnianie nie jest dostępne w tej przeglądarce"
                          : ""}
                      >
                        <button
                          on:click={() => shareHistoryToast(entry)}
                          class="btn btn-sm w-full {shareStates[
                            entry.episodeTimestamp
                          ]
                            ? 'btn-success'
                            : 'btn-ghost'}"
                          disabled={!canShareOnDevice}
                          aria-label="Udostępnij"
                        >
                          {#if shareStates[entry.episodeTimestamp]}
                            <CheckIcon class="h-4 w-4" />
                          {:else}
                            <ShareIcon class="h-4 w-4" />
                          {/if}
                        </button>
                      </div>
                    </div>

                    <MissingMetadataInfo toast={entry.toast} compact={true} />
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8">
            <NoSymbolIcon class="h-12 w-12 mx-auto mb-3 opacity-50" />
            <h3 class="font-medium mb-2">Brak historii</h3>
            <p class="text-sm opacity-50">
              Kliknij "No to jedziem! 🍻" aby wylosować pierwszy toast
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
