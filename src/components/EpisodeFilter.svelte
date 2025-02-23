<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Filter, FilterType, EpisodeData } from "$lib/types";
  import XIcon from "virtual:icons/heroicons/x-mark";
  import CalendarIcon from "virtual:icons/heroicons/calendar";
  import VideoCameraIcon from "virtual:icons/heroicons/video-camera";
  import PencilIcon from "virtual:icons/heroicons/pencil";
  import BoltIcon from "virtual:icons/heroicons/bolt";
  import Bars3Icon from "virtual:icons/heroicons/bars-3";
  import ArchiveBoxIcon from "virtual:icons/heroicons/archive-box";
  import TrashIcon from "virtual:icons/heroicons/trash";
  import XMarkIcon from "virtual:icons/heroicons/x-mark";
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

      // Year suggestions moved to the end
      const matchingYears = years
        .filter((year) => year.toString().startsWith(input))
        .map((year) => year.toString());
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

    // Add year suggestions at the very end
    if (/^\d{1,4}$/.test(input)) {
      const matchingYears = years
        .filter((year) => year.toString().startsWith(input))
        .map((year) => year.toString());

      matchingYears.forEach((year) => {
        regularSuggestions.push({
          type: "year",
          value: year,
          display: `Rok: ${year}`,
        });
      });
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
        scrollSelectedIntoView();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        selectedSuggestionIndex =
          (selectedSuggestionIndex - 1 + suggestions.length) %
          suggestions.length;
        scrollSelectedIntoView();
      } else if (event.key === "Enter" && showSuggestions) {
        event.preventDefault();
        const suggestion = suggestions[selectedSuggestionIndex];
        addFilter(suggestion);
        showSuggestions = false;
      }
    }
  }

  // Add this new function to handle scrolling
  function scrollSelectedIntoView() {
    // Wait for the next tick to ensure the DOM is updated
    setTimeout(() => {
      const container = document.getElementById("suggestions-list");
      const selectedElement = container?.querySelector(
        `[data-index="${selectedSuggestionIndex}"]`,
      );

      if (container && selectedElement) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = selectedElement.getBoundingClientRect();

        // Check if element is outside the visible area
        if (elementRect.bottom > containerRect.bottom) {
          // Scroll down if element is below
          selectedElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        } else if (elementRect.top < containerRect.top) {
          // Scroll up if element is above
          selectedElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }
      }
    }, 0);
  }

  $: {
    if (searchInput) {
      showSuggestions = true;
      selectedSuggestionIndex = 0;
    }
  }

  // Update the helper function to use imported icons
  function getSuggestionIcon(type: FilterType, isNegated: boolean) {
    switch (type) {
      case "year":
      case "month":
      case "day":
        return CalendarIcon;
      case "director":
        return VideoCameraIcon;
      case "writer":
        return PencilIcon;
      case "title":
        return BoltIcon;
      case "description":
        return Bars3Icon;
      case "season":
        return ArchiveBoxIcon;
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

      <div class="form-control relative">
        <div class="relative">
          <label class="input input-bordered flex items-center gap-2 w-full">
            <input
              id="search-input"
              type="text"
              class="grow"
              placeholder="Wpisz frazę np. 1999, Okił, browary..."
              bind:value={searchInput}
            />
            <kbd class="kbd kbd-sm">/</kbd>
          </label>
          {#if searchInput}
            <button
              class="absolute right-12 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle hover:bg-error hover:text-error-content transition-colors"
              on:click={() => {
                searchInput = "";
                showSuggestions = false;
              }}
              aria-label="Wyczyść wyszukiwanie"
            >
              <XIcon class="h-4 w-4" />
            </button>
          {/if}
        </div>

        {#if searchInput && suggestions.length > 0 && showSuggestions}
          <div
            class="absolute top-full left-0 w-full mt-1 bg-base-200 rounded-box shadow-lg z-50 border border-base-300"
          >
            <div
              class="bg-base-300/30 px-4 py-2 text-sm font-medium text-base-content/70 border-b border-base-300 flex justify-between items-center"
            >
              <div class="flex items-center gap-2">
                <span>Użyj Enter aby wybrać filtr</span>
                <span class="badge badge-sm badge-secondary"
                  >{selectedSuggestionIndex + 1}/{suggestions.length}</span
                >
              </div>
              <span class="text-sm text-base-content/50"
                >Liczba wyników: {suggestions.length}</span
              >
            </div>
            <div
              class="max-h-[300px] overflow-y-auto overflow-x-hidden"
              role="listbox"
              tabindex="-1"
              id="suggestions-list"
            >
              {#each suggestions.filter((s) => !s.isNegated) as suggestion, i (suggestion.type + suggestion.value)}
                <div
                  role="option"
                  aria-selected={i === selectedSuggestionIndex}
                  class="suggestion-item {i === selectedSuggestionIndex
                    ? 'bg-primary/20 '
                    : 'hover:bg-base-300'}"
                  on:click={() => addFilter(suggestion)}
                  data-index={i}
                >
                  <div class="flex items-center gap-2 px-4 py-2">
                    <svelte:component
                      this={getSuggestionIcon(suggestion.type, false)}
                      class="h-4 w-4 flex-shrink-0"
                    />
                    <span class="truncate">{suggestion.display}</span>
                  </div>
                </div>
              {/each}

              {#if suggestions.some((s) => s.isNegated)}
                <div
                  class="bg-base-300/30 px-4 py-2 text-sm font-medium text-base-content/70 border-y border-base-300"
                >
                  Wyklucz z wyników
                </div>

                {#each suggestions.filter((s) => s.isNegated) as suggestion, i (suggestion.type + suggestion.value)}
                  <div
                    role="option"
                    aria-selected={i +
                      suggestions.filter((s) => !s.isNegated).length ===
                      selectedSuggestionIndex}
                    class="suggestion-item {i +
                      suggestions.filter((s) => !s.isNegated).length ===
                    selectedSuggestionIndex
                      ? 'bg-primary/20'
                      : 'hover:bg-base-300'} text-error hover:text-error"
                    on:click={() => addFilter(suggestion)}
                    data-index={i +
                      suggestions.filter((s) => !s.isNegated).length}
                  >
                    <div class="flex items-center gap-2 px-4 py-2">
                      <svelte:component
                        this={getSuggestionIcon(suggestion.type, false)}
                        class="h-4 w-4 flex-shrink-0"
                      />
                      <XIcon class="h-4 w-4 flex-shrink-0" />
                      <span class="truncate">{suggestion.display}</span>
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <div class="mt-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-medium">Aktywne filtry</h3>
          <button
            class="btn btn-sm {activeFilters.length > 0
              ? 'btn-error btn-outline'
              : 'btn-ghost'} gap-2"
            on:click={() => dispatch("removeAllFilters")}
            disabled={activeFilters.length === 0}
          >
            <TrashIcon class="h-4 w-4" />
            Wyczyść filtry
          </button>
        </div>

        <div class="min-h-[48px] flex flex-wrap gap-2">
          {#if activeFilters.length > 0}
            {#each activeFilters as filter, i}
              <div
                class="badge badge-lg gap-2 {filter.isNegated
                  ? 'badge-error'
                  : 'badge-primary'}"
              >
                <span class="opacity-70">{getFilterLabel(filter)}</span>
                {filter.value}
                <button
                  class="btn btn-ghost btn-xs btn-circle"
                  on:click={() => dispatch("removeFilter", i)}
                >
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>
            {/each}
          {:else}
            <div class="text-base-content/50 text-sm flex items-center">
              Brak aktywnych filtrów
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
