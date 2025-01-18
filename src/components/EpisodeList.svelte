<script>
  import ChevronDownIcon from "virtual:icons/heroicons/chevron-down";

  export let episodes = [];
  export let isOpen = false;
</script>

<div class="w-full">
  <div class="collapse bg-base-200">
    <input type="checkbox" bind:checked={isOpen} />
    <div class="collapse-title text-xl font-medium flex items-center gap-2">
      <span>Lista odcinków</span>
      <ChevronDownIcon
        class="w-4 h-4 transform transition-transform {isOpen
          ? 'rotate-180'
          : ''}"
      />
    </div>
    <div class="collapse-content">
      {#if episodes.length > 0}
        <ul class="menu bg-base-100 w-full rounded-box">
          {#each episodes as episode, i}
            <li>
              <a
                href="/episode/{episode.id}"
                class="flex justify-between items-center"
              >
                <span>Odcinek {i + 1}</span>
                <span class="text-sm opacity-70">{episode.title}</span>
              </a>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-center py-4 text-base-content/70">
          Brak dostępnych odcinków
        </p>
      {/if}
    </div>
  </div>
</div>
