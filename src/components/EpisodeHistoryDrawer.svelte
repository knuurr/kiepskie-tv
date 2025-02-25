<script lang="ts">
  import type { EpisodeData } from "$lib/types/Episode";
  import { onMount, onDestroy } from "svelte";
  import XMarkIcon from "virtual:icons/heroicons/x-mark";
  import ArrowTopRightOnSquareIcon from "virtual:icons/heroicons/arrow-top-right-on-square";
  import ChartBarIcon from "virtual:icons/heroicons/chart-bar";
  import CalendarIcon from "virtual:icons/heroicons/calendar";
  import TrashIcon from "virtual:icons/heroicons/trash";
  import { Toast } from "$lib/toast";
  import { EpisodeService } from "$lib/services/episodes";
  import TitleBackground from "./TitleBackground.svelte";

  const isDev = import.meta.env.DEV;

  export let showDrawer = false;
  export let generationHistory: EpisodeData[] = [];
  export let currentHistoryIndex = -1;
  export let isLoading = false;
  export let MAX_HISTORY = 6;
  export let onEpisodeSelect: (episode: EpisodeData, index: number) => void;
  export let onRandomize: () => void;
  export let onClearHistory: () => void;

  let isClearingHistory = false;
  let isLoadingHistory = false;
  let loadError: string | null = null;
  let hasAttemptedLoad = false;
  const episodeService = EpisodeService.getInstance();

  // Debug logging only for significant state changes
  function logHistoryState(action: string, details: any = {}) {
    if (!isDev) return;
    console.debug(`[HistoryDrawer ${action}]:`, {
      historyLength: generationHistory.length,
      currentIndex: currentHistoryIndex,
      hasAttemptedLoad,
      ...details,
      episodes: generationHistory.map((ep) => ({
        uuid: ep.uuid,
        nr: ep.nr,
        title: ep.tytul,
        timestamp: ep.rollTimestamp,
      })),
    });
  }

  // Format date helper
  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function loadHistory() {
    if (isLoadingHistory) {
      console.debug("[HistoryDrawer] Skip - already loading");
      return;
    }

    isLoadingHistory = true;
    loadError = null;

    console.debug("[HistoryDrawer] Starting history load");

    try {
      const history = await episodeService.getHistory("/generator");
      console.debug("[HistoryDrawer] Loaded history:", {
        count: history.length,
        episodes: history.map((ep) => ({ uuid: ep.uuid, nr: ep.nr })),
      });

      // Always update history and index
      generationHistory = history;
      if (history.length > 0) {
        currentHistoryIndex = history.length - 1;
        logHistoryState("loaded", { source: "loadHistory" });
      }
    } catch (error) {
      console.error("Failed to load history:", error);
      loadError = error instanceof Error ? error.message : "Unknown error";
      Toast.error("Błąd podczas wczytywania historii");
    } finally {
      isLoadingHistory = false;
    }
  }

  async function handleClearHistory() {
    if (!isClearingHistory) {
      isClearingHistory = true;
      return;
    }

    try {
      await onClearHistory();
      showDrawer = false; // Close drawer after successful cleanup
      isDev && logHistoryState("cleared");
    } finally {
      isClearingHistory = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && showDrawer) {
      showDrawer = false;
    }
  }

  // Reset flags when drawer closes
  $: if (!showDrawer) {
    isLoadingHistory = false;
  }

  // Only load history if it's empty when drawer opens
  $: if (
    showDrawer &&
    !isLoadingHistory &&
    generationHistory.length === 0 &&
    !hasAttemptedLoad
  ) {
    hasAttemptedLoad = true;
    loadHistory();
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
              max. {#if isLoadingHistory}
                <div
                  class="loading loading-spinner loading-xs inline-block"
                ></div>
              {:else}
                {generationHistory.length}
              {/if}/{MAX_HISTORY} ostatnich losowań
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

      <!-- Clear history button -->
      <button
        class="btn btn-error btn-sm mb-4 gap-2 {isClearingHistory
          ? 'btn-outline'
          : ''}"
        on:click={handleClearHistory}
        disabled={isLoadingHistory}
      >
        {#if isLoadingHistory}
          <div class="loading loading-spinner loading-xs"></div>
        {:else}
          <TrashIcon class="h-4 w-4" />
        {/if}
        {isClearingHistory ? "Na pewno?" : "Wyczyść historię"}
      </button>

      <!-- Loading state -->
      {#if isLoadingHistory}
        <div class="flex flex-col items-center justify-center flex-1 gap-4">
          <div class="loading loading-spinner loading-lg"></div>
          <p class="text-base-content/70">Wczytywanie historii...</p>
        </div>
        <!-- Error state -->
      {:else if loadError}
        <div class="flex flex-col items-center justify-center flex-1 gap-4">
          <div class="alert alert-error">
            <p>Błąd wczytywania: {loadError}</p>
          </div>
          <button class="btn btn-primary btn-sm" on:click={loadHistory}>
            Spróbuj ponownie
          </button>
        </div>
        <!-- Content -->
      {:else}
        <div class="flex-1 overflow-y-auto">
          {#if generationHistory.length > 0}
            <div class="flex flex-col gap-4">
              {#each [...generationHistory].reverse() as episode, index (episode.uuid)}
                <div
                  class="card bg-base-100 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer {index ===
                  currentHistoryIndex
                    ? 'ring-2 ring-primary shadow-lg scale-[1.02]'
                    : 'opacity-70 hover:opacity-100'}"
                  data-uuid={episode.uuid}
                  data-nr={episode.nr}
                  on:click={() => {
                    if (index !== currentHistoryIndex && !isLoading) {
                      isDev &&
                        console.debug("Selected episode:", {
                          action: "click",
                          uuid: episode.uuid,
                          nr: episode.nr,
                          index,
                          newIndex: generationHistory.length - 1 - index,
                        });
                      onEpisodeSelect(
                        episode,
                        generationHistory.length - 1 - index,
                      );
                    }
                  }}
                  on:keydown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (index !== currentHistoryIndex && !isLoading) {
                        isDev &&
                          console.debug("Selected episode:", {
                            action: "keyboard",
                            uuid: episode.uuid,
                            nr: episode.nr,
                            index,
                            newIndex: generationHistory.length - 1 - index,
                          });
                        onEpisodeSelect(
                          episode,
                          generationHistory.length - 1 - index,
                        );
                      }
                    }
                  }}
                  role="button"
                  tabindex="0"
                >
                  <div class="card-body p-4">
                    <!-- Title visualization -->
                    <div class="relative w-full mb-3" style="padding-top: 40%;">
                      <div class="absolute inset-0">
                        <TitleBackground
                          title={episode.tytul}
                          height="h-full"
                          baseSize={0.5}
                        />
                      </div>
                    </div>

                    <div class="flex justify-between items-start gap-2">
                      <span class="badge badge-primary">#{episode.nr}</span>
                      <span class="badge badge-ghost">S{episode.sezon}</span>
                    </div>

                    <!-- Timestamp -->
                    {#if episode.rollTimestamp}
                      <div
                        class="text-xs text-base-content/60 flex items-center gap-1 mt-1"
                      >
                        <CalendarIcon class="h-4 w-4" />
                        <span
                          >Wylosowano: {formatDate(episode.rollTimestamp)}</span
                        >
                      </div>
                    {/if}

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
              <p class="font-medium">Historia jest pusta</p>
              <p class="text-sm mt-1">
                Kliknij "Losuj odcinek" aby rozpocząć swoją przygodę z losowymi
                odcinkami!
              </p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
