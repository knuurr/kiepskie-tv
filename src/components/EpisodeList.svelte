<script>
  export let episodes = [];
  export let isOpen = false;
</script>

<div class="w-full">
  <div class="collapse bg-base-200">
    <input type="checkbox" bind:checked={isOpen} />
    <div class="collapse-title text-xl font-medium flex items-center gap-2">
      <span>Lista odcinków</span>
      <svg
        class="w-4 h-4 transform transition-transform {isOpen
          ? 'rotate-180'
          : ''}"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
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
