<script lang="ts">
  import type { Toast } from "$lib/types/Toast";
  import MissingMetadataInfo from "./MissingMetadataInfo.svelte";
  import AudioWavePlayer from "./AudioWavePlayer.svelte";
  import { onMount } from "svelte";

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
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
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        {:else}
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
                              d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                            />
                          </svg>
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
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            </svg>
                          {:else}
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
                                d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                              />
                            </svg>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12 mx-auto mb-3 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
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
