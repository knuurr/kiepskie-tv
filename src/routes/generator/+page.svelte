<script lang="ts">
  import type { PageData } from "./$types";
  import type { EpisodeData } from "$lib/types/Episode";
  import NavBar from "../../components/NavBar.svelte";
  import Footer from "../../components/Footer.svelte";
  import { onMount } from "svelte";
  import FeedbackSection from "../../components/FeedbackSection.svelte";
  import AnimatedButton from "../../components/tiwi/AnimatedButton.svelte";
  import EpisodeHistoryDrawer from "../../components/EpisodeHistoryDrawer.svelte";
  import TitleBackground from "../../components/TitleBackground.svelte";
  import { Toast } from "$lib/toast";
  import { EpisodeService } from "$lib/services/episodes";
  import { DatabaseService } from "$lib/services/db";

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

  // icons
  import HashtagIcon from "virtual:icons/heroicons/hashtag";
  import DocumentTextIcon from "virtual:icons/heroicons/document-text";
  import CalendarIcon from "virtual:icons/heroicons/calendar";
  import QueueListIcon from "virtual:icons/heroicons/queue-list";
  import FilmIcon from "virtual:icons/heroicons/film";
  import PencilSquareIcon from "virtual:icons/heroicons/pencil-square";
  import ClockIcon from "virtual:icons/heroicons/clock";
  import LinkIcon from "virtual:icons/heroicons/link";
  import ArrowTopRightOnSquareIcon from "virtual:icons/heroicons/arrow-top-right-on-square";
  import ChartBarIcon from "virtual:icons/heroicons/chart-bar";
  import ChevronDownIcon from "virtual:icons/heroicons/chevron-down";
  import ChevronUpIcon from "virtual:icons/heroicons/chevron-up";

  export let data: PageData;

  // Animation configuration
  const ANIMATION_TIMING = {
    TYPEWRITER: {
      METADATA: 400,
      DESCRIPTION: 400,
    },
    DELAY: {
      BEFORE_DETAILS: 150,
      LOADING: 800,
    },
  } as const;

  let selectedEpisode: EpisodeData | null = null;
  let isLoading = false;
  let showDetails = false;
  let showDrawer = false;

  const MAX_HISTORY = 6;
  let generationHistory: EpisodeData[] = [];
  let currentHistoryIndex = -1;

  let isDescriptionExpanded = false;
  const DESCRIPTION_THRESHOLD = 100;

  // Initialize services
  const episodeService = EpisodeService.getInstance();
  const dbService = DatabaseService.getInstance();

  const FIELDS = [
    {
      label: "Numer",
      key: "nr" as keyof EpisodeData,
      icon: HashtagIcon,
    },
    {
      label: "Tytuł",
      key: "tytul" as keyof EpisodeData,
      icon: DocumentTextIcon,
    },
    {
      label: "Data premiery",
      key: "data_premiery" as keyof EpisodeData,
      icon: CalendarIcon,
    },
    {
      label: "Sezon",
      key: "sezon" as keyof EpisodeData,
      icon: QueueListIcon,
    },
    {
      label: "Reżyseria",
      key: "rezyseria" as keyof EpisodeData,
      icon: FilmIcon,
    },
    {
      label: "Scenariusz",
      key: "scenariusz" as keyof EpisodeData,
      icon: PencilSquareIcon,
    },
  ];

  // Typewriter effect custom function with fixed duration
  function typewriter(
    node: HTMLElement,
    { duration = ANIMATION_TIMING.TYPEWRITER.METADATA },
  ) {
    const text = node.textContent || "";
    const cursorEl = document.createElement("span");
    cursorEl.textContent = "|";
    cursorEl.className = "animate-pulse text-primary";

    return {
      duration,
      tick: (t: number) => {
        const i = Math.trunc(text.length * t);
        node.textContent = text.slice(0, i);
        if (i < text.length) {
          node.appendChild(cursorEl);
        }
      },
      end: () => {
        node.textContent = text;
      },
    };
  }

  // Load history from IndexedDB
  async function loadHistory() {
    try {
      const history = await episodeService.getHistory("/generator");
      console.debug("Main: Loading history:", {
        count: history.length,
        episodes: history.map((ep) => ({ uuid: ep.uuid, nr: ep.nr })),
      });

      if (history.length > 0) {
        generationHistory = history;
        currentHistoryIndex = history.length - 1;
        Toast.success("Wczytano historię odcinków");
      }
    } catch (error) {
      console.error("Failed to load history:", error);
      Toast.error("Błąd podczas wczytywania historii");
    }
  }

  // Migrate existing history to IndexedDB
  async function migrateHistory() {
    if (generationHistory.length === 0) return;

    try {
      // Get existing history to check for duplicates
      const existingHistory = await episodeService.getHistory("/generator");
      console.debug("Migration: Existing history:", {
        count: existingHistory.length,
        episodes: existingHistory.map((ep) => ({
          uuid: ep.uuid || "unknown",
          nr: ep.nr,
          timestamp: ep.rollTimestamp,
        })),
      });

      // Only migrate episodes that don't exist in IndexedDB
      for (const episode of generationHistory) {
        const episodeWithUUID = {
          ...episode,
          uuid: episode.uuid || crypto.randomUUID(), // Use crypto.randomUUID() directly
        };

        const isDuplicate = existingHistory.some(
          (existingEp) =>
            existingEp.uuid === episodeWithUUID.uuid ||
            (existingEp.nr === episodeWithUUID.nr &&
              existingEp.rollTimestamp === episodeWithUUID.rollTimestamp),
        );

        if (!isDuplicate) {
          console.debug("Migration: Adding episode:", {
            uuid: episodeWithUUID.uuid,
            nr: episodeWithUUID.nr,
            timestamp: episodeWithUUID.rollTimestamp,
          });
          await episodeService.addToHistory(episodeWithUUID, "/generator");
        } else {
          console.debug("Migration: Skipping duplicate episode:", {
            uuid: episodeWithUUID.uuid,
            nr: episodeWithUUID.nr,
            timestamp: episodeWithUUID.rollTimestamp,
          });
        }
      }
      console.debug("Successfully migrated history to IndexedDB");
    } catch (error) {
      console.error("Failed to migrate history:", error);
      Toast.error("Błąd podczas migracji historii");
    }
  }

  // Modified randomizeEpisode to use service
  function randomizeEpisode() {
    isLoading = true;
    showDetails = false;
    selectedEpisode = null;

    setTimeout(async () => {
      try {
        // Add UUIDs to table data if missing
        const episodesWithUUID = data.tableData.data.map((ep) => ({
          ...ep,
          uuid: crypto.randomUUID(),
        }));

        const newEpisode = episodeService.getRandomEpisode(
          episodesWithUUID,
          selectedEpisode || undefined,
        );

        // Add timestamp to the episode
        const episodeWithTimestamp = {
          ...newEpisode,
          rollTimestamp: Date.now(),
        };

        // Update local state
        if (generationHistory.length >= MAX_HISTORY) {
          generationHistory = [
            ...generationHistory.slice(1),
            episodeWithTimestamp,
          ];
        } else {
          generationHistory = [...generationHistory, episodeWithTimestamp];
        }
        currentHistoryIndex = generationHistory.length - 1;
        selectedEpisode = episodeWithTimestamp;

        // Add to IndexedDB
        await episodeService.addToHistory(episodeWithTimestamp, "/generator");

        isLoading = false;
        setTimeout(() => {
          showDetails = true;
        }, ANIMATION_TIMING.DELAY.BEFORE_DETAILS);
      } catch (error) {
        console.error("Failed to randomize episode:", error);
        Toast.error("Błąd podczas losowania odcinka");
        isLoading = false;
      }
    }, ANIMATION_TIMING.DELAY.LOADING);
  }

  function navigateHistory(direction: "prev" | "next") {
    if (generationHistory.length === 0) return;

    const newIndex =
      direction === "prev"
        ? Math.max(0, currentHistoryIndex - 1)
        : Math.min(generationHistory.length - 1, currentHistoryIndex + 1);

    if (newIndex !== currentHistoryIndex) {
      showDetails = false;
      setTimeout(() => {
        currentHistoryIndex = newIndex;
        selectedEpisode = generationHistory[newIndex];
        showDetails = true;
      }, ANIMATION_TIMING.DELAY.BEFORE_DETAILS);
    }
  }

  // Update keyboard handler to include left/right arrow navigation
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "r" && !isLoading) {
      event.preventDefault();
      randomizeEpisode();
    } else if (
      event.key === "ArrowLeft" &&
      !isLoading &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      navigateHistory("prev");
    } else if (
      event.key === "ArrowRight" &&
      !isLoading &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      navigateHistory("next");
    } else if (
      event.key === "H" &&
      event.shiftKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      showDrawer = true;
    }
  }

  function handleEpisodeSelect(episode: EpisodeData, index: number) {
    showDetails = false;
    setTimeout(() => {
      currentHistoryIndex = index;
      selectedEpisode = episode;
      showDetails = true;
    }, ANIMATION_TIMING.DELAY.BEFORE_DETAILS);
  }

  function toggleDescription() {
    isDescriptionExpanded = !isDescriptionExpanded;
  }

  async function handleClearHistory() {
    try {
      await episodeService.clearHistory("/generator");
      generationHistory = [];
      currentHistoryIndex = -1;
      selectedEpisode = null;
      showDetails = false;
      Toast.success("Historia została wyczyszczona");
    } catch (error) {
      console.error("Failed to clear history:", error);
      Toast.error("Błąd podczas czyszczenia historii");
    }
  }

  // Initialize database and load history
  onMount(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      try {
        // Initialize database first
        await dbService.init();

        // Load history once
        const history = await episodeService.getHistory("/generator");
        console.debug("Main: Initial history load:", {
          count: history.length,
          episodes: history.map((ep) => ({ uuid: ep.uuid, nr: ep.nr })),
        });

        // Update local state
        generationHistory = history;

        // If there's history, set the current episode
        if (history.length > 0) {
          selectedEpisode = history[history.length - 1];
          currentHistoryIndex = history.length - 1;
          showDetails = true; // Show details immediately
          console.debug("Main: Set initial episode:", {
            uuid: selectedEpisode.uuid,
            nr: selectedEpisode.nr,
          });
        }

        // Setup keyboard shortcuts
        document.addEventListener("keydown", handleKeydown);
        cleanup = () => document.removeEventListener("keydown", handleKeydown);
      } catch (error) {
        console.error("Failed to initialize:", error);
        Toast.error("Błąd podczas inicjalizacji");
      } finally {
        isLoading = false;
      }
    };

    init();
    return () => cleanup?.();
  });
</script>

<div class="min-h-screen">
  <NavBar />

  <main class="container mx-auto md:px-4 py-8 max-w-5xl">
    <div class="prose max-w-none mb-8 text-center">
      <h1 class="text-2xl md:text-4xl font-bold font-kiepscy">
        Generator losowego odcinka
      </h1>
      <p class="text-base-content/70">
        Problem z wyborem odcinka "Kiepskich"? Wylosuj jeden z {data.tableData
          .data.length} odcinków!
      </p>

      <!-- Replace the alert usage instructions with this accordion version -->
    </div>

    <div class="flex flex-col">
      <!-- Main content area (2/3) -->
      <div>
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <!-- Mobile history button -->
            <div class="flex justify-between items-start mb-4">
              <div class="flex flex-col gap-1">
                <div class="badge badge-outline badge-lg">
                  Losowań: {generationHistory.length}
                </div>
                <div
                  class="text-xs text-base-content/60 flex items-center gap-1"
                >
                  <CalendarIcon class="h-4 w-4" />
                  <span>
                    Wylosowano: {selectedEpisode?.rollTimestamp
                      ? formatDate(selectedEpisode.rollTimestamp)
                      : "nigdy"}
                  </span>
                </div>
              </div>
              <button
                class="btn btn-ghost btn-sm gap-2"
                on:click={() => (showDrawer = true)}
              >
                <ClockIcon class="h-5 w-5" />
                Historia
                <div class="badge badge-sm badge-primary">
                  {generationHistory.length}/{MAX_HISTORY}
                </div>
                <kbd class="kbd kbd-sm text-gray-400 hidden md:inline">⇧</kbd>
                <kbd class="kbd kbd-sm text-gray-400 hidden md:inline">h</kbd>
              </button>
            </div>

            <!-- Episode details section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <!-- Left side - Episode details (2/3 on desktop) -->
              <div class="lg:col-span-2 min-w-[300px] space-y-4">
                <!-- Title visualization on mobile -->
                <div class="block lg:hidden">
                  <div class="relative w-full" style="padding-top: 40%;">
                    {#if selectedEpisode && showDetails}
                      <div class="absolute inset-0">
                        <TitleBackground
                          title={selectedEpisode.tytul}
                          height="h-12"
                          baseSize={1}
                        />
                      </div>
                    {:else if isLoading}
                      <div
                        class="absolute inset-0 bg-base-300 animate-pulse rounded"
                      />
                    {:else}
                      <div
                        class="absolute inset-0 bg-base-200 rounded flex items-center justify-center text-base-content/30"
                      >
                        Tytuł pojawi się po wylosowaniu
                      </div>
                    {/if}
                  </div>
                </div>

                <div
                  class="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 divide-y divide-base-200"
                >
                  {#each FIELDS.slice(0, 4) as field, i}
                    <div
                      class="col-span-2 {i === 0
                        ? ''
                        : 'pt-2'} flex justify-between items-center"
                    >
                      <span class="font-semibold flex items-center gap-2">
                        <svelte:component this={field.icon} class="h-4 w-4" />
                        {field.label}:
                      </span>
                      {#if isLoading}
                        <div
                          class="h-6 bg-base-300 animate-pulse rounded w-32 ml-auto"
                        />
                      {:else if selectedEpisode && showDetails}
                        <span
                          class="typewriter-line text-right"
                          in:typewriter={{
                            duration: ANIMATION_TIMING.TYPEWRITER.METADATA,
                          }}
                        >
                          {selectedEpisode[field.key]}
                        </span>
                      {:else}
                        <span class="text-base-content/30 text-right">—</span>
                      {/if}
                    </div>
                  {/each}

                  <!-- Mobile collapse for additional details -->
                  <div class="col-span-2 lg:hidden">
                    <div class="collapse bg-base-200/50 mt-2">
                      <input type="checkbox" />
                      <div
                        class="collapse-title flex items-center gap-2 text-sm font-medium"
                      >
                        <ChevronDownIcon class="w-4 h-4" />
                        Więcej szczegółów
                      </div>
                      <div class="collapse-content">
                        <div
                          class="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 divide-y divide-base-200/50 pt-2"
                        >
                          {#each FIELDS.slice(4) as field, i}
                            <div
                              class="col-span-2 {i === 0
                                ? ''
                                : 'pt-2'} flex justify-between items-center"
                            >
                              <span
                                class="font-semibold flex items-center gap-2"
                              >
                                <svelte:component
                                  this={field.icon}
                                  class="h-4 w-4"
                                />
                                {field.label}:
                              </span>
                              {#if isLoading}
                                <div
                                  class="h-6 bg-base-300 animate-pulse rounded w-32 ml-auto"
                                />
                              {:else if selectedEpisode && showDetails}
                                <span
                                  class="typewriter-line text-right"
                                  in:typewriter={{
                                    duration:
                                      ANIMATION_TIMING.TYPEWRITER.METADATA,
                                  }}
                                >
                                  {selectedEpisode[field.key]}
                                </span>
                              {:else}
                                <span class="text-base-content/30 text-right"
                                  >—</span
                                >
                              {/if}
                            </div>
                          {/each}

                          <!-- Links section -->
                          <div
                            class="col-span-2 pt-2 flex justify-between items-center"
                          >
                            <span class="font-semibold flex items-center gap-2">
                              <LinkIcon class="w-4 h-4" />
                              Linki:
                            </span>
                            <div class="flex gap-2 justify-end text-right">
                              <a
                                href={selectedEpisode?.link_wiki}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="gap-2 flex items-center underline"
                                class:btn-disabled={!selectedEpisode ||
                                  !showDetails}
                              >
                                <ArrowTopRightOnSquareIcon class="w-4 h-4" />
                                Kiepscy Wiki
                              </a>
                              <a
                                href={selectedEpisode
                                  ? `/tabela?episode=${selectedEpisode.nr}`
                                  : "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="gap-2 flex items-center underline"
                                class:btn-disabled={!selectedEpisode ||
                                  !showDetails}
                              >
                                <ChartBarIcon class="w-4 h-4" />
                                Zobacz w tabeli
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Desktop only - additional fields -->
                  <div class="hidden lg:contents">
                    {#each FIELDS.slice(4) as field, i}
                      <div
                        class="col-span-2 pt-2 flex justify-between items-center"
                      >
                        <span class="font-semibold flex items-center gap-2">
                          <svelte:component this={field.icon} class="h-4 w-4" />
                          {field.label}:
                        </span>
                        {#if isLoading}
                          <div
                            class="h-6 bg-base-300 animate-pulse rounded w-32 ml-auto"
                          />
                        {:else if selectedEpisode && showDetails}
                          <span
                            class="typewriter-line text-right"
                            in:typewriter={{
                              duration: ANIMATION_TIMING.TYPEWRITER.METADATA,
                            }}
                          >
                            {selectedEpisode[field.key]}
                          </span>
                        {:else}
                          <span class="text-base-content/30 text-right">—</span>
                        {/if}
                      </div>
                    {/each}

                    <!-- Desktop only - Links section -->
                    <div
                      class="col-span-2 pt-2 flex justify-between items-center"
                    >
                      <span class="font-semibold flex items-center gap-2">
                        <LinkIcon class="w-4 h-4" />
                        Linki:
                      </span>
                      <div class="flex gap-2 justify-end">
                        <a
                          href={selectedEpisode?.link_wiki}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="gap-2 flex items-center underline"
                          class:btn-disabled={!selectedEpisode || !showDetails}
                        >
                          <ArrowTopRightOnSquareIcon class="w-4 h-4" />
                          Kiepscy Wiki
                        </a>
                        <a
                          href={selectedEpisode
                            ? `/tabela?episode=${selectedEpisode.nr}`
                            : "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="gap-2 flex items-center underline"
                          class:btn-disabled={!selectedEpisode || !showDetails}
                        >
                          <ChartBarIcon class="w-4 h-4" />
                          Zobacz w tabeli
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right side - Title visualization (1/3 on desktop) -->
              <div class="hidden lg:block lg:col-span-1">
                <div class="relative w-full" style="padding-top: 56.25%;">
                  {#if selectedEpisode && showDetails}
                    <div class="absolute inset-0">
                      <TitleBackground
                        title={selectedEpisode.tytul}
                        height="h-full"
                        baseSize={0.7}
                      />
                    </div>
                  {:else if isLoading}
                    <div
                      class="absolute inset-0 bg-base-300 animate-pulse rounded"
                    />
                  {:else}
                    <div
                      class="absolute inset-0 bg-base-200 rounded flex items-center justify-center text-base-content/30"
                    >
                      Tytuł pojawi się po wylosowaniu
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Description section (full width on desktop) -->
              <div class="lg:col-span-3">
                <div class="pt-2">
                  <span class="font-semibold block mb-2">Opis odcinka:</span>
                  {#if isLoading}
                    <div class="space-y-2">
                      <div
                        class="h-4 bg-base-300 animate-pulse rounded w-full"
                      />
                      <div
                        class="h-4 bg-base-300 animate-pulse rounded w-3/4"
                      />
                    </div>
                  {:else if selectedEpisode && showDetails}
                    <!-- Desktop view - always expanded -->
                    <p
                      class="text-base-content/80 typewriter-line hidden lg:block"
                      in:typewriter={{
                        duration: ANIMATION_TIMING.TYPEWRITER.DESCRIPTION,
                      }}
                    >
                      {selectedEpisode.opis_odcinka}
                    </p>

                    <!-- Mobile view - with expand/collapse -->
                    <div class="lg:hidden">
                      <p
                        class="text-base-content/80 typewriter-line"
                        class:line-clamp-2={!isDescriptionExpanded &&
                          selectedEpisode.opis_odcinka.length >
                            DESCRIPTION_THRESHOLD}
                        in:typewriter={{
                          duration: ANIMATION_TIMING.TYPEWRITER.DESCRIPTION,
                        }}
                      >
                        {selectedEpisode.opis_odcinka}
                      </p>

                      {#if selectedEpisode.opis_odcinka.length > DESCRIPTION_THRESHOLD}
                        <button
                          class="btn btn-ghost btn-sm mt-2 w-full flex items-center justify-center gap-2"
                          on:click={toggleDescription}
                        >
                          {#if isDescriptionExpanded}
                            <ChevronUpIcon class="w-4 h-4" />
                            Zwiń opis
                          {:else}
                            <ChevronDownIcon class="w-4 h-4" />
                            Rozwiń opis
                          {/if}
                        </button>
                      {/if}
                    </div>
                  {:else}
                    <p class="text-base-content/30">
                      Opis pojawi się po wylosowaniu odcinka
                    </p>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Draw button -->
            <div class="card-actions flex justify-center items-center w-full">
              <div class="flex gap-2 items-center w-full">
                <AnimatedButton
                  on:click={randomizeEpisode}
                  disabled={isLoading}
                  fullWidth={true}
                >
                  {#if selectedEpisode}
                    Losuj ponownie 🎲 <kbd
                      class="kbd kbd-sm text-gray-400 hidden md:inline">r</kbd
                    >
                  {:else}
                    Losuj odcinek 🎲 <kbd
                      class="kbd kbd-sm text-gray-400 hidden md:inline">r</kbd
                    >
                  {/if}
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <EpisodeHistoryDrawer
    bind:showDrawer
    {generationHistory}
    {currentHistoryIndex}
    {isLoading}
    {MAX_HISTORY}
    onEpisodeSelect={handleEpisodeSelect}
    onRandomize={randomizeEpisode}
    onClearHistory={handleClearHistory}
  />

  <FeedbackSection />
  <Footer />
</div>

<style>
  .typewriter-line {
    min-height: 1.5em;
  }

  /* Add these styles to ensure proper card layout in smaller container */
  :global(.card) {
    max-width: 100%;
  }

  :global(.card-body) {
    overflow-wrap: break-word;
  }
</style>
