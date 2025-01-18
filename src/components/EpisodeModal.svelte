<script lang="ts">
  import type { EpisodeData } from "$lib/types";
  import { onMount } from "svelte";
  // Import Heroicons
  import HashtagIcon from "~icons/heroicons/hashtag";
  import DocumentIcon from "~icons/heroicons/document";
  import CalendarIcon from "~icons/heroicons/calendar";
  import QueueListIcon from "~icons/heroicons/queue-list";
  import FilmIcon from "~icons/heroicons/film";
  import DocumentTextIcon from "~icons/heroicons/document-text";
  import ArrowTopRightOnSquareIcon from "~icons/heroicons/arrow-top-right-on-square";
  import ShareIcon from "~icons/heroicons/share";

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
      icon: HashtagIcon,
    },
    {
      label: "Tytuł",
      key: "tytul" as keyof EpisodeData,
      icon: DocumentIcon,
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
      icon: DocumentTextIcon,
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
            <svelte:component this={field.icon} class="w-4 h-4" />
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
          <ArrowTopRightOnSquareIcon class="w-5 h-5" />
          Kiepscy Wiki
        </a>
        <button class="btn btn-primary gap-2" on:click={handleShare}>
          <ShareIcon class="h-5 w-5" />
          Udostępnij
        </button>
      {/if}
    </div>
  </div>
</div>
