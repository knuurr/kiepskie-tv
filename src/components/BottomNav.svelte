<script lang="ts">
  export let activeTab: "how-it-works" | "select-files" | "upload" | "results";
  export let videoCount: number = 0;
</script>

<div class="lg:hidden">
  <div class="pb-16">
    <slot />
  </div>
  <div class="btm-nav">
    <button
      class={activeTab === "how-it-works"
        ? "active bg-primary text-primary-content"
        : ""}
      on:click
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span class="btm-nav-label">Info</span>
    </button>

    <button
      class={activeTab === "select-files"
        ? "active bg-primary text-primary-content"
        : ""}
      on:click
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span class="btm-nav-label">Pliki</span>
    </button>

    <button
      class={activeTab === "upload"
        ? "active bg-primary text-primary-content"
        : ""}
      on:click
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <span class="btm-nav-label">Edycja</span>
    </button>

    <button
      class={activeTab === "results"
        ? "active bg-primary text-primary-content"
        : ""}
      on:click
    >
      <div class="indicator">
        {#if videoCount > 0}
          <span class="indicator-item badge badge-secondary badge-xs"
            >{videoCount}</span
          >
        {/if}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>
      <span class="btm-nav-label">Wideo</span>
    </button>
  </div>
</div>

<style>
  .btm-nav {
    @apply border-t border-base-300;
  }

  .btm-nav-label {
    @apply text-sm;
  }

  /* Add styles for active state */
  .btm-nav > button.active {
    @apply border-t-2 border-primary;
  }

  /* Update badge color when button is active */
  .btm-nav > button.active .badge {
    @apply badge-secondary;
  }
</style>
