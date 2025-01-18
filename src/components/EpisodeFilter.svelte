<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Filter, FilterType, EpisodeData } from "$lib/types";
  // Import Heroicons
  import CalendarIcon from "virtual:icons/heroicons/calendar";
  import FilmIcon from "virtual:icons/heroicons/film";
  import PencilSquareIcon from "virtual:icons/heroicons/pencil-square";
  import BoltIcon from "virtual:icons/heroicons/bolt";
  import ListBulletIcon from "virtual:icons/heroicons/list-bullet";
  import QueueListIcon from "virtual:icons/heroicons/queue-list";
  import MagnifyingGlassIcon from "virtual:icons/heroicons/magnifying-glass";
  import XMarkIcon from "virtual:icons/heroicons/x-mark";
  import XCircleIcon from "virtual:icons/heroicons/x-circle";
  import CommandLineIcon from "virtual:icons/heroicons/command-line";
  import TrashIcon from "virtual:icons/heroicons/trash";

  export let episodes: EpisodeData[] = [];
  export let activeFilters: Filter[] = [];

  const dispatch = createEventDispatcher();
  let searchInput = "";
  let suggestions: Array<{
    type: FilterType;
    value: string;
    display: string;
    isNegated?: boolean;
  }> = [];
  let selectedSuggestionIndex = 0;
  let showSuggestions = false;

  // Polish month names mapping
  const MONTHS = {
    "01": "styczeń",
    "02": "luty",
    "03": "marzec",
    "04": "kwiecień",
    "05": "maj",
    "06": "czerwiec",
    "07": "lipiec",
    "08": "sierpień",
    "09": "wrzesień",
    "10": "październik",
    "11": "listopad",
    "12": "grudzień",
  };

  // Get unique values from episodes
  const directors = [
    ...new Set(episodes.map((e) => e.rezyseria.split(", ")).flat()),
  ];
  const writers = [
    ...new Set(episodes.map((e) => e.scenariusz.split(", ")).flat()),
  ];
  const seasons = [...new Set(episodes.map((e) => e.sezon))].sort(
    (a, b) => a - b,
  );

  // Extract unique years, months, and days from the new data structure
  const years = [...new Set(episodes.map((e) => e.data_components.year))].sort(
    (a, b) => a - b,
  );
  const months = [
    ...new Set(episodes.map((e) => e.data_components.month)),
  ].sort((a, b) => a - b);
  const days = [...new Set(episodes.map((e) => e.data_components.day))].sort(
    (a, b) => a - b,
  );

  function getSuggestions(input: string) {
    const inputLower = input.toLowerCase();
    const regularSuggestions: Array<{
      type: FilterType;
      value: string;
      display: string;
      isNegated?: boolean;
    }> = [];

    // Season suggestions (if input is a number)
    if (/^\d+$/.test(input)) {
      const seasonNumber = parseInt(input);
      if (seasons.includes(seasonNumber)) {
        regularSuggestions.push({
          type: "season",
          value: input,
          display: `Sezon: ${input}`,
        });
      }
    }

    // Date suggestions
    if (/^\d{1,4}$/.test(input)) {
      // Year suggestions
      const matchingYears = years
        .filter((year) => year.toString().startsWith(input))
        .map((year) => year.toString());

      if (matchingYears.length > 0) {
        matchingYears.forEach((year) => {
          regularSuggestions.push({
            type: "year",
            value: year,
            display: `Rok: ${year}`,
          });
        });
      }

      // Day suggestions (1-31)
      const dayNum = parseInt(input);
      if (dayNum >= 1 && dayNum <= 31 && days.includes(dayNum)) {
        regularSuggestions.push({
          type: "day",
          value: input.padStart(2, "0"),
          display: `Dzień: ${input}`,
        });
      }

      // Month suggestions (1-12)
      if (dayNum >= 1 && dayNum <= 12 && months.includes(dayNum)) {
        const monthStr = input.padStart(2, "0");
        regularSuggestions.push({
          type: "month",
          value: monthStr,
          display: `Miesiąc: ${MONTHS[monthStr as keyof typeof MONTHS]}`,
        });
      }
    }

    // Month suggestions by name
    Object.entries(MONTHS).forEach(([num, name]) => {
      if (name.toLowerCase().includes(inputLower)) {
        regularSuggestions.push({
          type: "month",
          value: num,
          display: `Miesiąc: ${name}`,
        });
      }
    });

    // Director suggestions
    directors.forEach((director) => {
      if (director.toLowerCase().includes(inputLower)) {
        regularSuggestions.push({
          type: "director",
          value: director,
          display: `Reżyser: ${director}`,
        });
      }
    });

    // Writer suggestions
    writers.forEach((writer) => {
      if (writer.toLowerCase().includes(inputLower)) {
        regularSuggestions.push({
          type: "writer",
          value: writer,
          display: `Scenarzysta: ${writer}`,
        });
      }
    });

    // Title and description suggestions (only if input is longer than 2 characters)
    if (input.length > 2) {
      regularSuggestions.push(
        {
          type: "title",
          value: input,
          display: `Szukaj w tytule: ${input}`,
        },
        {
          type: "description",
          value: input,
          display: `Szukaj w opisie: ${input}`,
        },
      );
    }

    // Create final suggestions array with negated versions at the bottom
    const suggestions = [
      ...regularSuggestions,
      ...regularSuggestions.map((suggestion) => ({
        ...suggestion,
        isNegated: true,
        display: `Wyklucz: ${suggestion.display}`,
      })),
    ];

    return suggestions;
  }

  $: suggestions = getSuggestions(searchInput);

  function addFilter(suggestion: (typeof suggestions)[0]) {
    dispatch("addFilter", {
      type: suggestion.type,
      value: suggestion.value,
      isNegated: suggestion.isNegated || false,
    });
    searchInput = "";
    showSuggestions = false;
  }

  function removeFilter(index: number) {
    dispatch("removeFilter", index);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "/" && !searchInput) {
      event.preventDefault();
      const input = document.querySelector<HTMLInputElement>("#search-input");
      input?.focus();
    } else if (event.key === "Escape") {
      searchInput = "";
      showSuggestions = false;
    } else if (suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        selectedSuggestionIndex =
          (selectedSuggestionIndex + 1) % suggestions.length;
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        selectedSuggestionIndex =
          (selectedSuggestionIndex - 1 + suggestions.length) %
          suggestions.length;
      } else if (event.key === "Enter" && showSuggestions) {
        event.preventDefault();
        const suggestion = suggestions[selectedSuggestionIndex];
        addFilter(suggestion);
        showSuggestions = false;
      }
    }
  }

  $: {
    if (searchInput) {
      showSuggestions = true;
      selectedSuggestionIndex = 0;
    }
  }

  // Update the helper function to use Heroicon components
  function getSuggestionIcon(type: FilterType) {
    switch (type) {
      case "date":
      case "year":
      case "month":
      case "day":
        return CalendarIcon;
      case "director":
        return FilmIcon;
      case "writer":
        return PencilSquareIcon;
      case "title":
        return BoltIcon;
      case "description":
        return ListBulletIcon;
      case "season":
        return QueueListIcon;
      default:
        return null;
    }
  }

  // Add this helper function
  function getFilterLabel(filter: Filter): string {
    switch (filter.type) {
      case "year":
        return "Rok:";
      case "month":
        return "Miesiąc:";
      case "day":
        return "Dzień:";
      case "director":
        return "Reżyser:";
      case "writer":
        return "Scenarzysta:";
      case "title":
        return "Tytuł:";
      case "season":
        return "Sezon:";
      case "description":
        return "Opis:";
      default:
        return "";
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="w-full space-y-4">
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h2 class="card-title text-lg">Filtry wyszukiwania</h2>

      <div class="relative w-full">
        <div class="relative">
          <MagnifyingGlassIcon
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/50"
          />
          <input
            type="text"
            id="search-input"
            class="input input-bordered w-full pl-10 pr-10"
            placeholder="Wyszukaj... (/ aby skupić)"
            bind:value={searchInput}
            on:focus={() => (showSuggestions = true)}
            on:blur={() => setTimeout(() => (showSuggestions = false), 200)}
          />
          {#if searchInput}
            <button
              class="absolute right-3 top-1/2 -translate-y-1/2"
              on:click={() => {
                searchInput = "";
                showSuggestions = false;
              }}
            >
              <XMarkIcon class="w-5 h-5 text-base-content/50" />
            </button>
          {/if}
        </div>

        <!-- Active filters -->
        <div class="flex flex-wrap gap-2 mt-2">
          {#each activeFilters as filter, index}
            <button
              class="btn btn-sm gap-2 {filter.isNegated
                ? 'btn-error'
                : 'btn-primary'}"
              on:click={() => removeFilter(index)}
            >
              <svelte:component
                this={getSuggestionIcon(filter.type)}
                class="w-4 h-4"
              />
              {getFilterLabel(filter)}
              <XCircleIcon class="w-4 h-4" />
            </button>
          {/each}
        </div>

        <!-- Keyboard shortcut hint -->
        <div class="absolute right-3 -bottom-6">
          <span class="text-xs text-base-content/50 flex items-center gap-1">
            <CommandLineIcon class="w-4 h-4" />
            Naciśnij "/" aby skupić
          </span>
        </div>
      </div>

      <div class="mt-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-medium">Aktywne filtry</h3>
          {#if activeFilters.length > 0}
            <button
              class="btn btn-sm btn-error btn-outline gap-2"
              on:click={() => dispatch("removeAllFilters")}
            >
              <TrashIcon class="h-4 w-4" />
              Wyczyść filtry
            </button>
          {/if}
        </div>

        {#if activeFilters.length > 0}
          <div class="flex flex-wrap gap-2">
            {#each activeFilters as filter, i}
              <button
                class="badge badge-lg gap-2 cursor-pointer hover:opacity-80 {filter.isNegated
                  ? 'badge-error'
                  : 'badge-primary'}"
                on:click={() => removeFilter(i)}
              >
                <span>
                  {filter.isNegated ? "Bez: " : ""}
                  {getFilterLabel(filter)}
                  {filter.value}
                </span>
                <span class="ml-1">✕</span>
              </button>
            {/each}
          </div>
        {:else}
          <p class="text-base-content/50 text-sm">
            Brak aktywnych filtrów. Użyj pola wyszukiwania powyżej aby dodać
            filtry.
          </p>
        {/if}
      </div>
    </div>
  </div>
</div>
