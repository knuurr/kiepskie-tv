<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let currentPage: number;
  export let totalPages: number;
  export let visiblePages: (number | string)[];

  let jumpToPageNumber = "";
  let jumpToPageInput: HTMLInputElement | null = null;

  const dispatch = createEventDispatcher<{
    changePage: number;
  }>();

  function handleJumpToPage() {
    const pageNum = parseInt(jumpToPageNumber);
    if (pageNum && pageNum >= 1 && pageNum <= totalPages) {
      dispatch("changePage", pageNum);
      jumpToPageNumber = "";
    }
  }

  function handleJumpToPageKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleJumpToPage();
    }
  }
</script>

<div class="flex flex-col md:flex-row items-center gap-2">
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
        <button class="join-item btn btn-sm">...</button>
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

  <!-- Direct page input field -->
  <div class="join items-center">
    <span class="text-sm text-base-content/70">Strona:</span>
    <input
      type="number"
      class="join-item input input-bordered input-sm w-16 mx-1"
      min="1"
      max={totalPages}
      bind:value={jumpToPageNumber}
      placeholder={currentPage.toString()}
      bind:this={jumpToPageInput}
      on:keydown={handleJumpToPageKeydown}
    />
    <span class="text-sm text-base-content/70">z {totalPages}</span>
    <button
      class="join-item btn btn-sm btn-primary ml-1"
      on:click={handleJumpToPage}
      disabled={!jumpToPageNumber ||
        parseInt(jumpToPageNumber) < 1 ||
        parseInt(jumpToPageNumber) > totalPages}
    >
      Idź
    </button>
  </div>
</div>
