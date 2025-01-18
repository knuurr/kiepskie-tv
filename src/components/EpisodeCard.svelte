<script lang="ts">
  import type { EpisodeData } from "$lib/types";
  import HighlightText from "./HighlightText.svelte";
  import ClickableFilterValue from "./ClickableFilterValue.svelte";
  import ArrowTopRightOnSquareIcon from "virtual:icons/heroicons/arrow-top-right-on-square";

  export let episode: EpisodeData;
  export let searchTerms: string[] = [];
  export let onEpisodeClick: (episode: EpisodeData) => void;
  export let onFilterClick: (
    event: CustomEvent<{ type: string; value: string }>,
  ) => void;
</script>

<div
  class="card bg-base-100 shadow-lg h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
  on:click={() => onEpisodeClick(episode)}
  on:keydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      onEpisodeClick(episode);
    }
  }}
  tabindex="0"
  role="button"
  aria-label="Zobacz szczegóły odcinka {episode.tytul}"
>
  <div class="card-body p-4 space-y-3 flex flex-col">
    <!-- Header with episode number and season -->
    <div class="flex justify-between items-center">
      <span class="text-sm opacity-70">Odcinek {episode.nr}</span>
      <div class="badge badge-primary">
        Sezon{" "}<ClickableFilterValue
          value={episode.sezon.toString()}
          type="season"
          on:filter={(e) => {
            e.stopPropagation(); // Prevent card click when clicking filter
            onFilterClick(e);
          }}
        />
      </div>
    </div>

    <!-- Title with wiki link -->
    <h2 class="card-title text-lg group flex-none">
      <a
        href={episode.link_wiki}
        target="_blank"
        rel="noopener noreferrer"
        class="link link-hover hover:text-primary transition-colors"
        on:click|stopPropagation
      >
        <HighlightText
          text={episode.tytul}
          highlight={searchTerms.find((term) =>
            episode.tytul.toLowerCase().includes(term.toLowerCase()),
          )}
        />
        <ArrowTopRightOnSquareIcon
          class="w-4 h-4 inline-block ml-1 opacity-50 group-hover:opacity-100"
        />
      </a>
    </h2>

    <!-- Description -->
    <p class="text-sm flex-1">
      <HighlightText
        text={episode.opis_odcinka}
        highlight={searchTerms.find((term) =>
          episode.opis_odcinka.toLowerCase().includes(term.toLowerCase()),
        )}
      />
    </p>

    <!-- Rest of the content -->
    <div class="space-y-3 flex-none">
      <!-- Air date -->
      <div class="text-sm">
        Data emisji:
        <ClickableFilterValue
          value={episode.data_components.day.toString().padStart(2, "0")}
          type="day"
          on:filter={(e) => {
            e.stopPropagation();
            onFilterClick(e);
          }}
        /> /
        <ClickableFilterValue
          value={episode.data_components.month.toString().padStart(2, "0")}
          type="month"
          on:filter={(e) => {
            e.stopPropagation();
            onFilterClick(e);
          }}
        /> /
        <ClickableFilterValue
          value={episode.data_components.year.toString()}
          type="year"
          on:filter={(e) => {
            e.stopPropagation();
            onFilterClick(e);
          }}
        />
      </div>

      <!-- Director and Writer -->
      <div class="text-sm space-y-1">
        <div>
          <span class="opacity-70">Reżyseria:</span>
          {#each episode.rezyseria.split(", ") as director, i}
            <ClickableFilterValue
              value={director}
              type="director"
              on:filter={(e) => {
                e.stopPropagation();
                onFilterClick(e);
              }}
            >
              <HighlightText
                text={director}
                highlight={searchTerms.find((term) =>
                  director.toLowerCase().includes(term.toLowerCase()),
                )}
              />
            </ClickableFilterValue>{#if i < episode.rezyseria.split(", ").length - 1},{/if}
          {/each}
        </div>
        <div>
          <span class="opacity-70">Scenariusz:</span>
          {#each episode.scenariusz.split(", ") as writer, i}
            <ClickableFilterValue
              value={writer}
              type="writer"
              on:filter={(e) => {
                e.stopPropagation();
                onFilterClick(e);
              }}
            >
              <HighlightText
                text={writer}
                highlight={searchTerms.find((term) =>
                  writer.toLowerCase().includes(term.toLowerCase()),
                )}
              />
            </ClickableFilterValue>{#if i < episode.scenariusz.split(", ").length - 1},{/if}
          {/each}
        </div>
      </div>
    </div>

    <!-- View details button - optional now since entire card is clickable -->
    <div class="card-actions justify-end mt-auto pt-2">
      <button
        class="btn btn-sm btn-primary hover:opacity-100 transition-opacity"
        on:click|stopPropagation={() => onEpisodeClick(episode)}
      >
        Szczegóły
      </button>
    </div>
  </div>
</div>
