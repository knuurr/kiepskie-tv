<script lang="ts">
  import QuestionMarkCircleIcon from "virtual:icons/heroicons/question-mark-circle";
  import DocumentPlusIcon from "virtual:icons/heroicons/document-plus";
  import CloudArrowUpIcon from "virtual:icons/heroicons/cloud-arrow-up";
  import FilmIcon from "virtual:icons/heroicons/film";

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
      <QuestionMarkCircleIcon class="h-6 w-6" />
      <span class="btm-nav-label">Info</span>
    </button>

    <button
      class={activeTab === "select-files"
        ? "active bg-primary text-primary-content"
        : ""}
      on:click
    >
      <DocumentPlusIcon class="h-6 w-6" />
      <span class="btm-nav-label">Pliki</span>
    </button>

    <button
      class={activeTab === "upload"
        ? "active bg-primary text-primary-content"
        : ""}
      on:click
    >
      <CloudArrowUpIcon class="h-6 w-6" />
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
        <FilmIcon class="h-6 w-6" />
      </div>
      <span class="btm-nav-label">Wideo</span>
    </button>
  </div>
</div>

<style>
  .btm-nav {
    @apply border-t border-base-300;
    z-index: 50;
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
