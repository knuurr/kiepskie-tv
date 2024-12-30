<script lang="ts">
  import type { Toast } from "$lib/types/Toast";

  export let toast: Toast;
  export let compact = false;

  $: hasMissingMetadata =
    !toast.audioFile ||
    !toast.episodeNumber ||
    toast.episodeNumber === null ||
    !toast.episodeTimestamp;

  $: missingItems = [
    !toast.audioFile && "dźwięk",
    (!toast.episodeNumber || toast.episodeNumber === null) && "numer odcinka",
    !toast.episodeTimestamp && "timestamp",
  ]
    .filter(Boolean)
    .join(", ");
</script>

{#if hasMissingMetadata}
  <div
    class="mt-2 grid grid-cols-7 {compact
      ? 'text-xs'
      : 'text-sm'} text-base-content/60"
  >
    <span class="col-span-1 text-warning flex justify-center items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 text-warning"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 2L2 22h20L12 2z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 16v2m0-8v6"
        />
      </svg>
    </span>
    <span class="col-span-6">
      {#if compact}
        Brakuje: {missingItems}
      {:else}
        Pomóż uzupełnić brakujące dane ({missingItems}).
        <a
          href="https://github.com/qbus-agentur/kiepscy-tv/issues/new"
          target="_blank"
          class="underline text-blue-600 hover:text-blue-800"
        >
          Zgłoś problem
        </a>
      {/if}
    </span>
  </div>
{/if}
