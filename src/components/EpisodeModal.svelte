<script lang="ts">
  import type { EpisodeData } from "$lib/types";
  import { onMount } from "svelte";

  // Animation configuration
  const ANIMATION_TIMING = {
    DELAY: {
      BEFORE_DETAILS: 150, // Delay before starting typewriter effect
      LOADING: 800, // Loading state duration
    },
  } as const;

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
        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
      </svg>`,
    },
    {
      label: "Data premiery",
      key: "data_premiery" as keyof EpisodeData,
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" clip-rule="evenodd" />
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
        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z" clip-rule="evenodd" />
      </svg>`,
    },
    {
      label: "Scenariusz",
      key: "scenariusz" as keyof EpisodeData,
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
      </svg>`,
    },
  ];

  export let isOpen = false;
  export let episodes: EpisodeData[] = [];
  export let onClose: () => void;
  export let selectedEpisode: EpisodeData | null = null;
  export let mode: "random" | "specific" = "random";

  // let respectFilters = false;
  let isLoading = false;

  // Close modal when clicking outside
  function handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains("modal")) {
      onClose();
    }
  }

  function randomizeEpisode() {
    isLoading = true;
    selectedEpisode = null;

    // Artificial delay for UX
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * episodes.length);
      selectedEpisode = episodes[randomIndex];
      isLoading = false;
    }, ANIMATION_TIMING.DELAY.LOADING);
  }

  // New function to handle share button click
  async function handleShare() {
    if (!selectedEpisode) return;

    const shareData = {
      title: `Świat według Kiepskich - ${selectedEpisode.tytul}`,
      text: `Odcinek ${selectedEpisode.nr}: ${selectedEpisode.tytul}`,
      url: `${window.location.origin}/tabela?episode=${selectedEpisode.nr}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        // You might want to show a toast notification here
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  }

  // Handle keyboard events
  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;

    if (event.key === "Escape") {
      onClose();
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });
</script>

<!-- Keep existing modal structure, but modify the header and actions -->
<div class="modal {isOpen ? 'modal-open' : ''}" on:click={handleOutsideClick}>
  <div class="modal-box relative max-w-2xl">
    <button
      class="btn btn-sm btn-circle absolute right-2 top-2"
      on:click={onClose}
    >
      ✕
    </button>

    <h3 class="font-bold text-lg mb-4">
      {#if mode === "random"}
        Losowy odcinek
      {:else}
        Szczegóły odcinka
      {/if}
    </h3>

    {#if mode === "random"}
      <!-- Keep existing random episode UI -->
      <div class="prose max-w-none mb-2">
        <p class="text-base-content/70">
          Problem z wyborem odcinka "Kiepskich"? Wylosuj!
        </p>
      </div>
    {/if}

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
          {:else if selectedEpisode}
            <span>
              {selectedEpisode[field.key]}
            </span>
          {:else}
            <span class="text-base-content/30">—</span>
          {/if}
        {/each}
      </div>

      <div class="pt-2">
        <span class="font-semibold block mb-2">Opis odcinka:</span>
        {#if isLoading}
          <div class="space-y-2">
            <div class="h-4 bg-base-300 animate-pulse rounded w-full" />
            <div class="h-4 bg-base-300 animate-pulse rounded w-3/4" />
          </div>
        {:else if selectedEpisode}
          <p class="text-base-content/80">
            {selectedEpisode.opis_odcinka}
          </p>
        {:else}
          <p class="text-base-content/30">
            Opis pojawi się po wylosowaniu odcinka
          </p>
        {/if}
      </div>
    </div>

    <div class="modal-action">
      {#if selectedEpisode}
        <a
          href={selectedEpisode.link_wiki}
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-outline gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
          Kiepscy Wiki
        </a>
        <button class="btn btn-primary gap-2" on:click={handleShare}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"
            />
          </svg>
          Udostępnij
        </button>
      {/if}
    </div>
  </div>
</div>
