<script lang="ts">
  import type { PageData } from "./$types";
  import type { EpisodeData } from "$lib/types";
  import NavBar from "../../components/NavBar.svelte";
  import Footer from "../../components/Footer.svelte";
  import { onMount } from "svelte";
  import FeedbackSection from "../../components/FeedbackSection.svelte";
  import AnimatedButton from "../../components/tiwi/AnimatedButton.svelte";
  import EpisodeHistoryDrawer from "../../components/EpisodeHistoryDrawer.svelte";

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

  const MAX_HISTORY = 6; // Configure maximum history size
  let generationHistory: EpisodeData[] = [];
  let currentHistoryIndex = -1; // -1 means no generation yet

  const FIELDS = [
    {
      label: "Numer",
      key: "nr" as keyof EpisodeData,
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.938l1-4H9.031z" clip-rule="evenodd" />
      </svg>`,
    },
    {
      label: "Tytuł",
      key: "tytul" as keyof EpisodeData,
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
      </svg>`,
    },
    {
      label: "Data premiery",
      key: "data_premiery" as keyof EpisodeData,
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
      </svg>`,
    },
    {
      label: "Sezon",
      key: "sezon" as keyof EpisodeData,
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
      </svg>`,
    },
    {
      label: "Reżyseria",
      key: "rezyseria" as keyof EpisodeData,
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z" clip-rule="evenodd" />
      </svg>`,
    },
    {
      label: "Scenariusz",
      key: "scenariusz" as keyof EpisodeData,
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
      </svg>`,
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

  function randomizeEpisode() {
    isLoading = true;
    showDetails = false;
    selectedEpisode = null;

    setTimeout(() => {
      const episodes = data.tableData.data;
      const randomIndex = Math.floor(Math.random() * episodes.length);
      const newEpisode = episodes[randomIndex];

      // Update history
      if (generationHistory.length >= MAX_HISTORY) {
        generationHistory = [...generationHistory.slice(1), newEpisode];
      } else {
        generationHistory = [...generationHistory, newEpisode];
      }
      currentHistoryIndex = generationHistory.length - 1;
      selectedEpisode = newEpisode;

      isLoading = false;

      setTimeout(() => {
        showDetails = true;
      }, ANIMATION_TIMING.DELAY.BEFORE_DETAILS);
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

  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });
</script>

<div class="min-h-screen bg-base-200">
  <NavBar />

  <main class="container mx-auto px-4 py-8 max-w-5xl">
    <div class="prose max-w-none mb-8 text-center">
      <h1 class="text-4xl font-bold font-kiepscy">
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
            <div class="flex justify-between items-center mb-4">
              <div class="badge badge-outline badge-lg">
                Losowań: {generationHistory.length}
              </div>
              <button
                class="btn btn-ghost btn-sm gap-2"
                on:click={() => (showDrawer = true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
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
                Historia
                <div class="badge badge-sm badge-primary">
                  {generationHistory.length}/{MAX_HISTORY}
                </div>
                <kbd class="kbd kbd-sm text-gray-400 hidden md:inline">⇧ H</kbd>
              </button>
            </div>

            <!-- Episode details section -->
            <div class="space-y-4 mb-6">
              <div class="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
                {#each FIELDS as field}
                  <span class="font-semibold flex items-center gap-2">
                    {@html field.icon}
                    {field.label}:
                  </span>
                  {#if isLoading}
                    <div class="h-6 bg-base-300 animate-pulse rounded w-32" />
                  {:else if selectedEpisode && showDetails}
                    <span
                      class="typewriter-line"
                      in:typewriter={{
                        duration: ANIMATION_TIMING.TYPEWRITER.METADATA,
                      }}
                    >
                      {selectedEpisode[field.key]}
                    </span>
                  {:else}
                    <span class="text-base-content/30">—</span>
                  {/if}
                {/each}

                <!-- Links section after Scenariusz -->
                <span class="font-semibold flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Linki:
                </span>
                <div class="flex gap-2">
                  <a
                    href={selectedEpisode?.link_wiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="gap-2 flex items-center underline"
                    class:btn-disabled={!selectedEpisode || !showDetails}
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
                    Zobacz w tabeli
                  </a>
                </div>
              </div>

              <div class="pt-2">
                <span class="font-semibold block mb-2">Opis odcinka:</span>
                {#if isLoading}
                  <div class="space-y-2">
                    <div class="h-4 bg-base-300 animate-pulse rounded w-full" />
                    <div class="h-4 bg-base-300 animate-pulse rounded w-3/4" />
                  </div>
                {:else if selectedEpisode && showDetails}
                  <p
                    class="text-base-content/80 typewriter-line"
                    in:typewriter={{
                      duration: ANIMATION_TIMING.TYPEWRITER.DESCRIPTION,
                    }}
                  >
                    {selectedEpisode.opis_odcinka}
                  </p>
                {:else}
                  <p class="text-base-content/30">
                    Opis pojawi się po wylosowaniu odcinka
                  </p>
                {/if}
              </div>
            </div>

            <!-- Draw button -->
            <div
              class="card-actions flex justify-center items-center w-full mb-8"
            >
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
