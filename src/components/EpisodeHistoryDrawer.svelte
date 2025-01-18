<script lang="ts">
  import type { EpisodeData } from "$lib/types";
  import { onMount, onDestroy } from "svelte";
  import XMarkIcon from "virtual:icons/heroicons/x-mark";
  import ArrowTopRightOnSquareIcon from "virtual:icons/heroicons/arrow-top-right-on-square";
  import ChartBarIcon from "virtual:icons/heroicons/chart-bar";
  import ArchiveBoxIcon from "virtual:icons/heroicons/archive-box";

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
            <XMarkIcon class="h-6 w-6" />
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
                      <ArrowTopRightOnSquareIcon class="w-4 h-4" />
                    </a>
                    <a
                      href={`/tabela?episode=${episode.nr}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-ghost btn-xs"
                      on:click|stopPropagation
                    >
                      <ChartBarIcon class="w-4 h-4" />
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
            <ArchiveBoxIcon class="h-12 w-12 mx-auto mb-4 opacity-50" />
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
