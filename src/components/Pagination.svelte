<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let currentPage: number;
  export let totalPages: number;
  export let visiblePages: (number | string)[];

  let showJumpToPage = false;
  let jumpToPageNumber = "";
  let jumpToPageInput: HTMLInputElement | null = null;

  const dispatch = createEventDispatcher<{
    changePage: number;
  }>();

  function handleJumpToPage() {
    const pageNum = parseInt(jumpToPageNumber);
    if (pageNum && pageNum >= 1 && pageNum <= totalPages) {
      dispatch("changePage", pageNum);
      closeJumpToPage();
    }
  }

  function closeJumpToPage() {
    showJumpToPage = false;
    jumpToPageNumber = "";
  }

  function toggleJumpToPage() {
    showJumpToPage = !showJumpToPage;
    if (showJumpToPage) {
      // Wait for the input to be rendered
      setTimeout(() => jumpToPageInput?.focus(), 0);
    }
  }

  function handleJumpToPageKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      closeJumpToPage();
    } else if (e.key === "Enter") {
      handleJumpToPage();
    }
  }
</script>

<div class="join">
  <button
    class="join-item btn btn-sm"
    disabled={currentPage === 1}
    on:click={() => dispatch("changePage", currentPage - 1)}
  >
    «
  </button>

  {#each visiblePages as page}
    {#if page === "..."}
      <div class="dropdown dropdown-top">
        <button
          class="join-item btn btn-sm"
          on:click={toggleJumpToPage}
          tabindex="0"
        >
          ...
        </button>
        {#if showJumpToPage}
          <div
            class="dropdown-content z-50 card card-compact bg-base-200 shadow-xl p-2"
            tabindex="0"
            on:keydown={handleJumpToPageKeydown}
          >
            <div class="card-body p-2 gap-2">
              <h3 class="text-sm font-medium">Przejdź do strony</h3>
              <div class="join">
                <input
                  type="number"
                  class="join-item input input-bordered input-sm w-20"
                  min="1"
                  max={totalPages}
                  bind:value={jumpToPageNumber}
                  placeholder="Nr strony"
                  bind:this={jumpToPageInput}
                  on:keydown={handleJumpToPageKeydown}
                />
                <button
                  class="join-item btn btn-sm btn-primary"
                  on:click={handleJumpToPage}
                >
                  Idź
                </button>
              </div>
              <p class="text-xs text-base-content/70">
                Strony 1-{totalPages}
              </p>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <button
        class="join-item btn btn-sm {Number(page) === currentPage
          ? 'btn-primary'
          : ''}"
        on:click={() => dispatch("changePage", Number(page))}
      >
        {page}
      </button>
    {/if}
  {/each}

  <button
    class="join-item btn btn-sm"
    disabled={currentPage === totalPages}
    on:click={() => dispatch("changePage", currentPage + 1)}
  >
    »
  </button>
</div>
