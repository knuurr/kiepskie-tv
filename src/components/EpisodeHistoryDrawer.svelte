<script lang="ts">
  import type { EpisodeData } from "$lib/types";
  import { onMount, onDestroy } from "svelte";

  export let showDrawer = false;
  export let generationHistory: EpisodeData[] = [];
  export let currentHistoryIndex = -1;
  export let isLoading = false;
  export let onEpisodeSelect: (episode: EpisodeData, index: number) => void;
  export let onRandomize: () => void;
  export let MAX_HISTORY = 6;

  const ANIMATION_TIMING = {
    DELAY: {
      BEFORE_DETAILS: 150,
    },
  };

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && showDrawer) {
      showDrawer = false;
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    document.removeEventListener("keydown", handleKeydown);
  });
</script>

<div class="drawer drawer-end z-[100]">
  <input
    type="checkbox"
    id="history-drawer"
    class="drawer-toggle"
    bind:checked={showDrawer}
  />

  <div class="drawer-side">
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
            <h3 class="font-bold text-lg">Historia losowań</h3>
            <p class="text-xs opacity-50">
              max. {MAX_HISTORY} ostatnich losowań
            </p>
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
        {#if generationHistory.length > 0}
          <div class="flex flex-col gap-4">
            {#each generationHistory as episode, index}
              <div
                class="card bg-base-100 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer {index ===
                currentHistoryIndex
                  ? 'ring-2 ring-primary shadow-lg scale-[1.02]'
                  : 'opacity-70 hover:opacity-100'}"
                on:click={() => {
                  if (index !== currentHistoryIndex && !isLoading) {
                    onEpisodeSelect(episode, index);
                  }
                }}
                on:keydown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (index !== currentHistoryIndex && !isLoading) {
                      onEpisodeSelect(episode, index);
                    }
                  }
                }}
                role="button"
                tabindex="0"
              >
                <div class="card-body p-4">
                  <div class="flex justify-between items-start gap-2">
                    <span class="badge badge-primary">#{episode.nr}</span>
                    <span class="badge badge-ghost">S{episode.sezon}</span>
                  </div>
                  <h3 class="card-title text-sm mt-2 line-clamp-2">
                    {episode.tytul}
                  </h3>
                  <p class="text-xs text-base-content/70 line-clamp-1 mt-1">
                    {episode.opis_odcinka}
                  </p>
                  <div class="card-actions justify-end mt-2">
                    <a
                      href={episode.link_wiki}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-ghost btn-xs"
                      on:click|stopPropagation
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-4 h-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </a>
                    <a
                      href={`/tabela?episode=${episode.nr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-ghost btn-xs"
                      on:click|stopPropagation
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-4 h-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div
            class="border-2 border-dashed border-base-300 rounded-box p-8 text-center text-base-content/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12 mx-auto mb-4 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p class="font-medium">Historia jest pusta</p>
            <p class="text-sm mt-1">
              Kliknij "Losuj odcinek" aby rozpocząć swoją przygodę z losowymi
              odcinkami!
            </p>
            <div class="mt-4">
              <button
                class="btn btn-primary btn-sm"
                on:click={() => {
                  showDrawer = false;
                  onRandomize();
                }}
              >
                Losuj teraz!
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
