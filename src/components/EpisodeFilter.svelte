<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Filter, FilterType, EpisodeData } from "$lib/types";
  import XIcon from "virtual:icons/heroicons/x-mark";
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

  // Add this helper function to get icons for each type
  function getSuggestionIcon(type: FilterType, isNegated: boolean) {
    switch (type) {
      case "year":
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />`;
      case "month":
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />`;
      case "day":
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />`;
      case "director":
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />`;
      case "writer":
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />`;
      case "title":
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />`;
      case "description":
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />`;
      case "season":
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />`;
      default:
        return "";
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
              <span>Użyj Enter aby wybrać filtr</span>
              <span class="badge badge-sm badge-neutral"
                >{suggestions.length} opcji</span
              >
            </div>
            <!-- Scrollable suggestions container with fixed height -->
            <div
              class="max-h-[300px] overflow-y-auto overflow-x-hidden"
              role="listbox"
              tabindex="-1"
              id="suggestions-list"
            >
              <!-- Regular suggestions -->
              {#each suggestions.filter((s) => !s.isNegated) as suggestion, i (suggestion.type + suggestion.value)}
                <div
                  role="option"
                  aria-selected={i === selectedSuggestionIndex}
                  class="suggestion-item {i === selectedSuggestionIndex
                    ? 'bg-primary text-primary-content'
                    : 'hover:bg-base-300'}"
                  on:click={() => addFilter(suggestion)}
                  data-index={i}
                >
                  <div class="flex items-center gap-2 px-4 py-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {@html getSuggestionIcon(suggestion.type, false)}
                    </svg>
                    <span class="truncate">{suggestion.display}</span>
                  </div>
                </div>
              {/each}

              <!-- Negated section header -->
              {#if suggestions.some((s) => s.isNegated)}
                <div
                  class="bg-base-300/30 px-4 py-2 text-sm font-medium text-base-content/70 border-y border-base-300"
                >
                  Wyklucz z wyników
                </div>

                <!-- Negated suggestions -->
                {#each suggestions.filter((s) => s.isNegated) as suggestion, i (suggestion.type + suggestion.value)}
                  <div
                    role="option"
                    aria-selected={i +
                      suggestions.filter((s) => !s.isNegated).length ===
                      selectedSuggestionIndex}
                    class="suggestion-item {i +
                      suggestions.filter((s) => !s.isNegated).length ===
                    selectedSuggestionIndex
                      ? 'bg-primary text-primary-content'
                      : 'hover:bg-base-300'} text-error hover:text-error"
                    on:click={() => addFilter(suggestion)}
                    data-index={i +
                      suggestions.filter((s) => !s.isNegated).length}
                  >
                    <div class="flex items-center gap-2 px-4 py-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {@html getSuggestionIcon(suggestion.type, false)}
                      </svg>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 flex-shrink-0"
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
          {#if activeFilters.length > 0}
            <button
              class="btn btn-sm btn-error btn-outline gap-2"
              on:click={() => dispatch("removeAllFilters")}
            >
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
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
