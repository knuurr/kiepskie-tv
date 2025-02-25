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
  import HashtagIcon from "virtual:icons/heroicons/hashtag";
  import ClockIcon from "virtual:icons/heroicons/clock";
  import ExclamationTriangleIcon from "virtual:icons/heroicons/exclamation-triangle";
  import TrashIcon from "virtual:icons/heroicons/trash";
  import CalendarIcon from "virtual:icons/heroicons/calendar";
  import { Toast as ToastNotification } from "$lib/toast";
  import { ToastService } from "$lib/services/toasts";

  export let showDrawer = false;
  export let toastHistory: { toast: Toast; episodeTimestamp: number }[] = [];
  export let copyStates: { [key: number]: boolean } = {};
  export let shareStates: { [key: number]: boolean } = {};
  export let canShareOnDevice = false;

  let isClearingHistory = false;
  const toastService = ToastService.getInstance();

  // Format date with timezone consideration
  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(date);
  }

  async function handleClearHistory() {
    if (!isClearingHistory) {
      isClearingHistory = true;
      return;
    }

    try {
      await toastService.clearHistory();
      toastHistory = [];
      copyStates = {};
      shareStates = {};
      showDrawer = false; // Close drawer after successful cleanup
      ToastNotification.success("Historia została wyczyszczona");
    } catch (error) {
      console.error("Failed to clear history:", error);
      ToastNotification.error("Błąd podczas czyszczenia historii");
    } finally {
      isClearingHistory = false;
    }
  }

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
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">Historia toastów</h3>
        <button
          class="btn btn-ghost btn-sm"
          on:click={() => (showDrawer = false)}
          aria-label="Zamknij"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- Clear history button -->
      <button
        class="btn btn-error btn-sm mb-4 gap-2 {isClearingHistory
          ? 'btn-outline'
          : ''}"
        on:click={handleClearHistory}
      >
        <TrashIcon class="h-4 w-4" />
        {isClearingHistory ? "Na pewno?" : "Wyczyść historię"}
      </button>

      {#if toastHistory.length === 0}
        <div
          class="flex flex-col items-center justify-center flex-1 opacity-50"
        >
          <p>Historia jest pusta</p>
        </div>
      {:else}
        <div class="flex flex-col gap-4">
          {#each toastHistory as entry}
            <div class="card bg-base-100 shadow-sm">
              <div class="card-body p-4">
                <div class="flex flex-col gap-2">
                  <div class="flex justify-between items-start">
                    <div class="badge badge-neutral gap-1">
                      <HashtagIcon class="h-4 w-4" />
                      {entry.toast.episodeNumber ?? "???"}
                    </div>
                    <div class="badge badge-neutral gap-1">
                      <ClockIcon class="h-4 w-4" />
                      {entry.toast.episodeTimestamp ?? "??:??"}
                    </div>
                  </div>

                  {#if entry.toast.rollTimestamp}
                    <div
                      class="text-xs text-base-content/60 flex items-center gap-1"
                    >
                      <CalendarIcon class="h-4 w-4" />
                      <span
                        >Wylosowano: {formatDate(
                          entry.toast.rollTimestamp,
                        )}</span
                      >
                    </div>
                  {/if}

                  <p class="text-lg">{entry.toast.text}</p>

                  <AudioWavePlayer
                    audioFile={entry.toast.audioFile}
                    showText={false}
                  />

                  <div class="grid grid-cols-2 gap-2">
                    <button
                      on:click={() => copyHistoryToast(entry.episodeTimestamp)}
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

                  {#if !entry.toast.audioFile || !entry.toast.episodeNumber || !entry.toast.episodeTimestamp}
                    <div
                      class="text-xs text-base-content/60 flex gap-1 items-center"
                    >
                      <ExclamationTriangleIcon class="h-4 w-4 text-warning" />
                      <span
                        >Brakujące dane: {[
                          !entry.toast.audioFile && "dźwięk",
                          (!entry.toast.episodeNumber ||
                            entry.toast.episodeNumber === null) &&
                            "numer odcinka",
                          !entry.toast.episodeTimestamp && "timestamp",
                        ]
                          .filter(Boolean)
                          .join(", ")}</span
                      >
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
