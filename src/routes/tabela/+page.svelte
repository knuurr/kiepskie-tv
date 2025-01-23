<script lang="ts">
  import type { PageData } from "./$types";
  import type { EpisodeData, Filter } from "$lib/types";
  import NavBar from "../../components/NavBar.svelte";
  import Footer from "../../components/Footer.svelte";
  // import CenteredContainer from "../../components/CenteredContainer.svelte";
  // import ResponsiveContainer from "../../components/ResponsiveContainer.svelte";
  import EpisodeFilter from "../../components/EpisodeFilter.svelte";
  import HighlightText from "../../components/HighlightText.svelte";
  import EpisodeModal from "../../components/EpisodeModal.svelte";
  import { page } from "$app/stores";
  // import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import ClickableFilterValue from "../../components/ClickableFilterValue.svelte";
  import FeedbackSection from "../../components/FeedbackSection.svelte";
  import EpisodeCard from "../../components/EpisodeCard.svelte";
  import { viewPreference, type ViewMode } from "$lib/stores/viewPreference";
  import { isMobile } from "$lib/utils/isMobile";
  // icons
  import ChevronUpIcon from "virtual:icons/heroicons/chevron-up";
  import TableCellsIcon from "virtual:icons/heroicons/table-cells";
  import Squares2x2Icon from "virtual:icons/heroicons/squares-2x2";
  import ChevronDownIcon from "virtual:icons/heroicons/chevron-down";
  import InformationCircleIcon from "virtual:icons/heroicons/information-circle";
  import FunnelIcon from "virtual:icons/heroicons/funnel";
  import ArrowTopRightOnSquareIcon from "virtual:icons/heroicons/arrow-top-right-on-square";
  import ChartBarIcon from "virtual:icons/heroicons/chart-bar";
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
  } from "chart.js";
  import { Bar } from "svelte-chartjs";

  // Register ChartJS components
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  );

  export let data: PageData;

  let activeFilters: Filter[] = [];
  let filteredEpisodes: EpisodeData[] = [];
  // let isHelpOpen = false;
  let isEpisodeModalOpen = false;
  let selectedEpisode: EpisodeData | null = null;
  let modalMode: "specific" = "specific";
  let currentView: ViewMode | null = null;
  let activeTab: "table" | "plot" = "table";

  const CHUNK_SIZE_OPTIONS = [
    { value: 10, label: "10 wierszy" },
    { value: 25, label: "25 wierszy" },
    { value: 50, label: "50 wierszy" },
    { value: 100, label: "100 wierszy" },
  ];

  let selectedChunkSize = CHUNK_SIZE_OPTIONS[0].value;
  let visibleRows = selectedChunkSize;
  let showAllRows = false;

  let showScrollTop = false;

  $: {
    filteredEpisodes = data.tableData.data.filter((episode) => {
      const filtersByType = activeFilters.reduce(
        (acc, filter) => {
          if (!acc[filter.type]) {
            acc[filter.type] = [];
          }
          acc[filter.type].push(filter);
          return acc;
        },
        {} as Record<string, Filter[]>,
      );

      return Object.entries(filtersByType).every(([_, filters]) => {
        return filters.some((filter) => {
          const value = filter.value.toLowerCase();
          let matches = false;

          switch (filter.type) {
            case "year":
              matches = episode.data_components.year.toString() === value;
              break;
            case "month":
              matches =
                episode.data_components.month.toString().padStart(2, "0") ===
                value;
              break;
            case "day":
              matches =
                episode.data_components.day.toString().padStart(2, "0") ===
                value;
              break;
            case "director":
              matches =
                episode.rezyseria.toLowerCase().includes(value) &&
                !episode.scenariusz.toLowerCase().includes(value);
              break;
            case "writer":
              matches =
                episode.scenariusz.toLowerCase().includes(value) &&
                !episode.rezyseria.toLowerCase().includes(value);
              break;
            case "title":
              matches = episode.tytul.toLowerCase().includes(value);
              break;
            case "description":
              matches = episode.opis_odcinka.toLowerCase().includes(value);
              break;
            case "season":
              matches = episode.sezon === parseInt(value);
              break;
          }

          return filter.isNegated ? !matches : matches;
        });
      });
    });
  }

  $: displayedEpisodes = showAllRows
    ? filteredEpisodes
    : filteredEpisodes.slice(0, visibleRows);

  $: searchTerms = activeFilters
    .filter((f) =>
      ["title", "description", "director", "writer"].includes(f.type),
    )
    .map((f) => f.value);

  $: {
    currentView = $viewPreference;
  }

  function handleAddFilter(event: CustomEvent<Filter>) {
    activeFilters = [...activeFilters, event.detail];
  }

  function handleRemoveFilter(event: CustomEvent<number>) {
    activeFilters = activeFilters.filter((_, i) => i !== event.detail);
  }

  function loadMore() {
    if (showAllRows) return;
    if (visibleRows + selectedChunkSize >= filteredEpisodes.length) {
      showAllRows = true;
    } else {
      visibleRows += selectedChunkSize;
    }
  }

  function showAll() {
    showAllRows = true;
    visibleRows = filteredEpisodes.length;
  }

  function handleChunkSizeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    selectedChunkSize = parseInt(select.value);
    if (!showAllRows) {
      visibleRows = Math.min(selectedChunkSize, filteredEpisodes.length);
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Add scroll listener
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => {
      showScrollTop = window.scrollY > 500;
    });
  }

  function handleRemoveAllFilters() {
    activeFilters = [];
  }

  function handleEpisodeClick(episode: EpisodeData) {
    selectedEpisode = episode;
    modalMode = "specific";
    isEpisodeModalOpen = true;
    // Update URL without reload and without scrolling
    const url = new URL(window.location.href);
    url.searchParams.set("episode", episode.nr.toString());
    window.history.pushState({}, "", url);
  }

  function handleModalClose() {
    isEpisodeModalOpen = false;
    if (modalMode === "specific") {
      // Remove episode parameter from URL without scrolling
      const url = new URL(window.location.href);
      url.searchParams.delete("episode");
      window.history.pushState({}, "", url);
    }
    selectedEpisode = null;
  }

  // Handle initial URL parameters
  onMount(() => {
    const episodeNr = $page.url.searchParams.get("episode");
    if (episodeNr) {
      const episode = data.tableData.data.find(
        (ep) => ep.nr.toString() === episodeNr,
      );
      if (episode) {
        // Don't update URL again when loading from URL parameter
        selectedEpisode = episode;
        modalMode = "specific";
        isEpisodeModalOpen = true;
      }
    }
  });

  // Add new function to handle filter clicks
  function handleFilterClick(
    event: CustomEvent<{ type: string; value: string }>,
  ) {
    const newFilter: Filter = {
      type: event.detail.type,
      value: event.detail.value,
      isNegated: false,
    };

    // Check if filter already exists
    const filterExists = activeFilters.some(
      (f) => f.type === newFilter.type && f.value === newFilter.value,
    );

    if (!filterExists) {
      activeFilters = [...activeFilters, newFilter];
    }
  }

  function handleViewChange(mode: ViewMode | null) {
    viewPreference.set(mode);
    currentView = mode;
  }

  function handleTabChange(tab: "table" | "plot") {
    activeTab = tab;
    if (tab === "plot") {
      currentView = "chart";
      viewPreference.set("chart");
    } else {
      // Restore previous table view or default to null (auto)
      currentView = null;
      viewPreference.set(null);
    }
  }

  // Add event type for click handler
  function handleTableRowClick(e: MouseEvent, episode: EpisodeData) {
    if (e.target instanceof Element && !e.target.closest("td.title-cell")) {
      handleEpisodeClick(episode);
    }
  }

  // Add new view type
  type ViewMode = "table" | "card" | "chart";

  // Add chart data computation
  $: chartData = {
    labels: Array.from(
      new Set(filteredEpisodes.map((ep) => ep.data_components.year)),
    ).sort(),
    datasets: [
      {
        label: "Liczba odcinków",
        data: Array.from(
          new Set(filteredEpisodes.map((ep) => ep.data_components.year)),
        )
          .sort()
          .map(
            (year) =>
              filteredEpisodes.filter((ep) => ep.data_components.year === year)
                .length,
          ),
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Add chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Liczba odcinków w latach",
      },
    },
  };

  $: shouldShowTable =
    activeTab === "table" &&
    (currentView === "table" || (!currentView && !$isMobile));
  $: shouldShowChart = activeTab === "plot";
  $: shouldShowCards = activeTab === "table" && currentView === "card";
</script>

<div class="min-h-screen">
  <NavBar />

  {#if showScrollTop}
    <button
      class="fixed bottom-8 right-8 btn btn-circle btn-primary shadow-lg z-50"
      on:click={scrollToTop}
      aria-label="Przewiń do góry"
    >
      <ChevronUpIcon class="h-6 w-6" />
    </button>
  {/if}

  <main class="container mx-auto px-4 py-8">
    <div class="space-y-6">
      <div class="prose max-w-none mb-8">
        <h1 class="text-2xl font-bold font-kiepscy">
          Tabela odcinków "Kiepskich"
        </h1>
        <p class="text-base-content/70">
          Przeglądaj wszystkie odcinki serialu. Użyj filtrów aby znaleźć
          konkretne odcinki po dacie emisji, reżyserze, scenarzyście lub treści.
          Możesz łączyć wiele filtrów i wykluczać niechciane wyniki.
        </p>
        <p class="text-base-content/70">
          Nie wiesz od czego zacząć? Przytłacza Cię ilość odcinków? Sprawdź <a
            href="/generator"
            class="link link-primary">generator losowego odcinka 🎲</a
          >, który pomoże Ci wybrać odcinek do oglądania!
        </p>
      </div>

      <EpisodeFilter
        episodes={data.tableData.data}
        {activeFilters}
        on:addFilter={handleAddFilter}
        on:removeFilter={handleRemoveFilter}
        on:removeAllFilters={handleRemoveAllFilters}
      />

      <div class="bg-base-200 p-4 rounded-lg mb-4 space-y-2">
        <div class="flex items-center gap-2 text-sm">
          <InformationCircleIcon class="h-5 w-5" />
          <span>
            Kliknij wiersz aby zobaczyć szczegóły odcinka w oknie modalnym
          </span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <FunnelIcon class="h-5 w-5" />
          <span>
            Kliknij na <span
              class="border-b border-dotted border-base-content/30"
              >podkreślone wartości</span
            > w tabeli aby filtrować wyniki
          </span>
        </div>
      </div>

      <div class="bg-base-100 rounded-box shadow-lg">
        {#if filteredEpisodes.length > 0}
          <div class="border-b border-base-300">
            <!-- Main view tabs -->
            <div class="tabs tabs-bordered w-full">
              <button
                class="tab tab-lg flex-1 {activeTab === 'table'
                  ? 'tab-active !border-primary text-primary'
                  : ''}"
                on:click={() => handleTabChange("table")}
              >
                <TableCellsIcon class="h-5 w-5 mr-2" />
                Tabela
              </button>
              <button
                class="tab tab-lg flex-1 {activeTab === 'plot'
                  ? 'tab-active !border-primary text-primary'
                  : ''}"
                on:click={() => handleTabChange("plot")}
              >
                <ChartBarIcon class="h-5 w-5 mr-2" />
                Wykresy
              </button>
            </div>

            <!-- Table-specific controls -->
            {#if activeTab === "table"}
              <div
                class="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4"
              >
                <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <div class="flex items-center gap-2">
                    <span class="text-sm opacity-70">Wyświetl po:</span>
                    <select
                      class="select select-bordered select-sm"
                      value={selectedChunkSize}
                      on:change={handleChunkSizeChange}
                      disabled={showAllRows}
                    >
                      {#each CHUNK_SIZE_OPTIONS as option}
                        <option value={option.value}>{option.label}</option>
                      {/each}
                    </select>
                  </div>

                  {#if !showAllRows && filteredEpisodes.length > visibleRows}
                    <button
                      class="btn btn-sm w-full sm:w-auto"
                      on:click={showAll}
                    >
                      Pokaż wszystkie ({filteredEpisodes.length})
                    </button>
                  {/if}
                </div>

                <div class="join w-full sm:w-auto">
                  <button
                    class="join-item btn btn-sm flex-1 sm:flex-none {!currentView
                      ? 'btn-primary'
                      : ''}"
                    on:click={() => handleViewChange(null)}
                  >
                    <Squares2x2Icon class="h-4 w-4" />
                    Auto
                  </button>
                  <button
                    class="btn btn-ghost btn-sm gap-2 {shouldShowTable
                      ? 'btn-active'
                      : ''}"
                    on:click={() => handleViewChange("table")}
                  >
                    <TableCellsIcon class="h-5 w-5" />
                    Tabela
                  </button>
                  <button
                    class="btn btn-ghost btn-sm gap-2 {currentView === 'card'
                      ? 'btn-active'
                      : ''}"
                    on:click={() => handleViewChange("card")}
                  >
                    <Squares2x2Icon class="h-5 w-5" />
                    Siatka
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/if}

        {#if shouldShowTable}
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  {#each Object.entries(data.tableData.metadata.header_metadata) as [key, header]}
                    <th
                      class="{key === 'opis_odcinka'
                        ? 'min-w-[300px] max-w-[400px] whitespace-normal'
                        : ''} 
                               {key === 'tytul'
                        ? 'max-w-[150px] whitespace-normal'
                        : ''}
                               {['rezyseria', 'scenariusz'].includes(key)
                        ? 'whitespace-normal min-w-[200px]'
                        : 'whitespace-nowrap'}"
                    >
                      {header}
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each displayedEpisodes as episode}
                  <tr
                    class="hover cursor-pointer"
                    on:click={(e) => handleTableRowClick(e, episode)}
                  >
                    <td class="whitespace-nowrap">{episode.nr}</td>
                    <td
                      class="whitespace-normal max-w-[150px] group title-cell"
                    >
                      <a
                        href={episode.link_wiki}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="link link-hover hover:text-primary transition-colors"
                        data-tip="artykuł na wiki"
                      >
                        <HighlightText
                          text={episode.tytul}
                          highlight={searchTerms.find((term) =>
                            episode.tytul
                              .toLowerCase()
                              .includes(term.toLowerCase()),
                          )}
                        />
                        <ArrowTopRightOnSquareIcon
                          class="w-4 h-4 opacity-50 group-hover:opacity-100"
                        />
                      </a>
                    </td>
                    <td class="min-w-[300px] max-w-[400px] whitespace-normal">
                      <HighlightText
                        text={episode.opis_odcinka}
                        highlight={searchTerms.find((term) =>
                          episode.opis_odcinka
                            .toLowerCase()
                            .includes(term.toLowerCase()),
                        )}
                      />
                    </td>
                    <td class="whitespace-nowrap">
                      <ClickableFilterValue
                        value={episode.data_components.day
                          .toString()
                          .padStart(2, "0")}
                        type="day"
                        on:filter={handleFilterClick}
                      /> /
                      <ClickableFilterValue
                        value={episode.data_components.month
                          .toString()
                          .padStart(2, "0")}
                        type="month"
                        on:filter={handleFilterClick}
                      /> /
                      <ClickableFilterValue
                        value={episode.data_components.year.toString()}
                        type="year"
                        on:filter={handleFilterClick}
                      />
                    </td>
                    <td class="whitespace-normal">
                      {#each episode.rezyseria.split(", ") as director, i}
                        <div class="flex">
                          <ClickableFilterValue
                            value={director}
                            type="director"
                            on:filter={handleFilterClick}
                          >
                            <HighlightText
                              text={director}
                              highlight={searchTerms.find((term) =>
                                director
                                  .toLowerCase()
                                  .includes(term.toLowerCase()),
                              )}
                            />
                          </ClickableFilterValue>
                          {#if i < episode.rezyseria.split(", ").length - 1}
                            <span class="text-base-content/50">,</span>
                          {/if}
                        </div>
                      {/each}
                    </td>
                    <td class="whitespace-normal">
                      {#each episode.scenariusz.split(", ") as writer, i}
                        <div class="flex">
                          <ClickableFilterValue
                            value={writer}
                            type="writer"
                            on:filter={handleFilterClick}
                          >
                            <HighlightText
                              text={writer}
                              highlight={searchTerms.find((term) =>
                                writer
                                  .toLowerCase()
                                  .includes(term.toLowerCase()),
                              )}
                            />
                          </ClickableFilterValue>
                          {#if i < episode.scenariusz.split(", ").length - 1}
                            <span class="text-base-content/50">,</span>
                          {/if}
                        </div>
                      {/each}
                    </td>
                    <td class="whitespace-nowrap">
                      <ClickableFilterValue
                        value={episode.sezon.toString()}
                        type="season"
                        on:filter={handleFilterClick}
                      />
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          {#if filteredEpisodes.length > visibleRows && !showAllRows}
            <div
              class="flex flex-col items-center py-4 bg-base-200 bg-opacity-50 cursor-pointer hover:bg-opacity-70 transition-all"
              on:click={loadMore}
            >
              <ChevronDownIcon class="h-6 w-6 animate-bounce" />
              <span class="text-base-content/60">
                Pokaż kolejne {Math.min(
                  selectedChunkSize,
                  filteredEpisodes.length - visibleRows,
                )} wierszy
              </span>
            </div>
          {/if}
        {:else if shouldShowChart}
          <div class="p-6 space-y-4">
            <div class="prose max-w-none">
              <h3 class="text-lg font-medium">Rozkład odcinków w czasie</h3>
              <p class="text-base-content/70">
                Wykres przedstawia liczbę odcinków w poszczególnych latach
                emisji. Dane są filtrowane zgodnie z aktywnymi filtrami.
              </p>
            </div>
            <div class="h-[600px] bg-base-100 rounded-lg p-4">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        {:else}
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4"
          >
            {#each displayedEpisodes as episode}
              <EpisodeCard
                {episode}
                {searchTerms}
                onEpisodeClick={handleEpisodeClick}
                onFilterClick={handleFilterClick}
              />
            {/each}
          </div>
        {/if}

        <div class="p-4 bg-base-200 text-center space-y-4">
          <p class="text-sm opacity-70">
            Podziękowania dla <a
              href="https://kiepscy.fandom.com/wiki/Lista_odcink%C3%B3w_serialu_%E2%80%9E%C5%9Awiat_wed%C5%82ug_Kiepskich%E2%80%9D"
              class="link link-primary"
              target="_blank"
              rel="noopener noreferrer">Kiepscy Wiki</a
            > za tabele z danymi odcinków.
          </p>

          <button
            class="btn btn-primary gap-2"
            on:click={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ChevronUpIcon class="h-6 w-6" />
            Przewiń do góry
          </button>
        </div>

        <FeedbackSection />
      </div>
    </div>
  </main>

  <Footer />

  <EpisodeModal
    isOpen={isEpisodeModalOpen}
    episodes={filteredEpisodes}
    {selectedEpisode}
    mode={modalMode}
    onClose={handleModalClose}
  />
</div>
