<script lang="ts">
  import type { EpisodeData } from "$lib/types";
  import { formatDate } from "$lib/utils/date";
  import HighlightText from "./HighlightText.svelte";
  import ClickableFilterValue from "./ClickableFilterValue.svelte";
  import ArrowTopRightOnSquareIcon from "virtual:icons/heroicons/arrow-top-right-on-square";

  export let episodes: EpisodeData[];
  export let searchTerms: string[] = [];
  export let onEpisodeClick: (episode: EpisodeData) => void;
  export let onFilterClick: (
    event: CustomEvent<{ type: string; value: string }>,
  ) => void;

  // Group episodes by season, then by year and month
  $: groupedEpisodes = episodes.reduce(
    (acc, episode) => {
      const season = episode.sezon;
      const year = episode.data_components.year;
      const month = episode.data_components.month;

      if (!acc[season]) {
        acc[season] = {};
      }
      if (!acc[season][year]) {
        acc[season][year] = {};
      }
      if (!acc[season][year][month]) {
        acc[season][year][month] = [];
      }
      acc[season][year][month].push(episode);
      return acc;
    },
    {} as Record<number, Record<number, Record<number, EpisodeData[]>>>,
  );

  // Calculate time gaps between episodes
  function calculateGap(
    currentEpisode: EpisodeData,
    nextEpisode: EpisodeData,
  ): string {
    if (!nextEpisode) return "gap-8"; // default gap for last episode in group

    const currentDate = new Date(
      currentEpisode.data_components.year,
      currentEpisode.data_components.month - 1,
      currentEpisode.data_components.day,
    );
    const nextDate = new Date(
      nextEpisode.data_components.year,
      nextEpisode.data_components.month - 1,
      nextEpisode.data_components.day,
    );

    const diffDays = Math.floor(
      (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Return Tailwind gap classes based on time difference
    if (diffDays <= 7) return "gap-4";
    if (diffDays <= 30) return "gap-6";
    if (diffDays <= 90) return "gap-8";
    return "gap-12";
  }

  // Helper to determine content side based on season
  function getContentSide(season: number): "left" | "right" {
    return season % 2 === 0 ? "left" : "right";
  }
</script>

<div class="relative min-h-[500px] p-4">
  <div class="space-y-24">
    {#each Object.entries(groupedEpisodes).sort(([a], [b]) => Number(a) - Number(b)) as [season, yearData]}
      <div class="relative">
        <!-- Season marker - always visible -->
        <div class="sticky top-4 z-10 flex justify-center mb-8">
          <div
            class="bg-secondary text-secondary-content px-4 py-2 rounded-full text-sm font-bold"
          >
            Sezon {season}
          </div>
        </div>

        <!-- Timeline for this season -->
        <div class="relative">
          <!-- Timeline line -->
          <div
            class="absolute left-1/2 top-0 bottom-0 w-px bg-primary/20"
          ></div>

          <div class="space-y-16">
            {#each Object.entries(yearData).sort(([a], [b]) => Number(a) - Number(b)) as [year, monthData]}
              <div class="relative">
                <!-- Year marker -->
                <div class="sticky top-16 z-10 flex justify-center mb-8">
                  <div
                    class="bg-primary text-primary-content px-3 py-1 rounded-full text-xs"
                  >
                    {year}
                  </div>
                </div>

                {#each Object.entries(monthData).sort(([a], [b]) => Number(a) - Number(b)) as [month, monthEpisodes]}
                  <div class="relative">
                    <!-- Month marker -->
                    <div class="flex justify-center mb-4">
                      <div class="bg-base-300 px-3 py-1 rounded-full text-xs">
                        {new Date(
                          Number(year),
                          Number(month) - 1,
                        ).toLocaleString("pl-PL", { month: "long" })}
                      </div>
                    </div>

                    <div class="space-y-4">
                      {#each monthEpisodes.sort((a, b) => a.nr - b.nr) as episode, i}
                        <div
                          class={`flex items-start justify-center ${calculateGap(episode, monthEpisodes[i + 1])}`}
                        >
                          <!-- Episode card -->
                          <div
                            class="relative group w-full max-w-2xl grid grid-cols-[1fr,auto,1fr] gap-4 items-center cursor-pointer hover:bg-base-200 rounded-lg p-4 transition-colors"
                            on:click={() => onEpisodeClick(episode)}
                          >
                            <!-- Left side content -->
                            {#if getContentSide(Number(season)) === "left"}
                              <div class="text-right space-y-2">
                                <div
                                  class="flex items-center justify-end gap-2"
                                >
                                  <span class="text-xs font-mono opacity-50"
                                    >#{episode.nr}</span
                                  >
                                  <h3
                                    class="font-medium group-hover:text-primary transition-colors"
                                  >
                                    <HighlightText
                                      text={episode.tytul}
                                      highlight={searchTerms.find((term) =>
                                        episode.tytul
                                          .toLowerCase()
                                          .includes(term.toLowerCase()),
                                      )}
                                    />
                                  </h3>
                                  <a
                                    href={episode.link_wiki}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="opacity-50 hover:opacity-100 transition-opacity"
                                    on:click|stopPropagation
                                  >
                                    <ArrowTopRightOnSquareIcon
                                      class="w-4 h-4"
                                    />
                                  </a>
                                </div>
                                <p class="text-sm opacity-70 line-clamp-2">
                                  <HighlightText
                                    text={episode.opis_odcinka}
                                    highlight={searchTerms.find((term) =>
                                      episode.opis_odcinka
                                        .toLowerCase()
                                        .includes(term.toLowerCase()),
                                    )}
                                  />
                                </p>
                                <div
                                  class="text-xs space-x-2 flex items-center flex-wrap gap-1"
                                >
                                  <span class="opacity-50">Reżyseria:</span>
                                  {#each episode.rezyseria.split(", ") as director, i}
                                    <ClickableFilterValue
                                      value={director}
                                      type="director"
                                      on:filter={onFilterClick}
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
                                  {/each}
                                </div>
                                <div
                                  class="text-right opacity-70 text-sm flex items-center justify-end gap-1"
                                >
                                  <ClickableFilterValue
                                    value={episode.data_components.day
                                      .toString()
                                      .padStart(2, "0")}
                                    type="day"
                                    on:filter={onFilterClick}
                                  /> /
                                  <ClickableFilterValue
                                    value={episode.data_components.month
                                      .toString()
                                      .padStart(2, "0")}
                                    type="month"
                                    on:filter={onFilterClick}
                                  />
                                </div>
                              </div>
                            {:else}
                              <div class="opacity-0">Placeholder</div>
                            {/if}

                            <!-- Timeline dot -->
                            <div
                              class="relative flex items-center justify-center"
                            >
                              <div
                                class="w-3 h-3 bg-primary rounded-full"
                              ></div>
                            </div>

                            <!-- Right side content -->
                            {#if getContentSide(Number(season)) === "right"}
                              <div class="space-y-2">
                                <div class="flex items-center gap-2">
                                  <span class="text-xs font-mono opacity-50"
                                    >#{episode.nr}</span
                                  >
                                  <h3
                                    class="font-medium group-hover:text-primary transition-colors"
                                  >
                                    <HighlightText
                                      text={episode.tytul}
                                      highlight={searchTerms.find((term) =>
                                        episode.tytul
                                          .toLowerCase()
                                          .includes(term.toLowerCase()),
                                      )}
                                    />
                                  </h3>
                                  <a
                                    href={episode.link_wiki}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="opacity-50 hover:opacity-100 transition-opacity"
                                    on:click|stopPropagation
                                  >
                                    <ArrowTopRightOnSquareIcon
                                      class="w-4 h-4"
                                    />
                                  </a>
                                </div>
                                <p class="text-sm opacity-70 line-clamp-2">
                                  <HighlightText
                                    text={episode.opis_odcinka}
                                    highlight={searchTerms.find((term) =>
                                      episode.opis_odcinka
                                        .toLowerCase()
                                        .includes(term.toLowerCase()),
                                    )}
                                  />
                                </p>
                                <div
                                  class="text-xs space-x-2 flex items-center flex-wrap gap-1"
                                >
                                  <span class="opacity-50">Reżyseria:</span>
                                  {#each episode.rezyseria.split(", ") as director, i}
                                    <ClickableFilterValue
                                      value={director}
                                      type="director"
                                      on:filter={onFilterClick}
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
                                  {/each}
                                </div>
                                <div class="opacity-70 text-sm">
                                  <ClickableFilterValue
                                    value={episode.data_components.day
                                      .toString()
                                      .padStart(2, "0")}
                                    type="day"
                                    on:filter={onFilterClick}
                                  /> /
                                  <ClickableFilterValue
                                    value={episode.data_components.month
                                      .toString()
                                      .padStart(2, "0")}
                                    type="month"
                                    on:filter={onFilterClick}
                                  />
                                </div>
                              </div>
                            {:else}
                              <div class="opacity-0">Placeholder</div>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
