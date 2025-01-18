<script lang="ts">
  import type { Toast } from "$lib/types/Toast";
  import ExclamationTriangleIcon from "virtual:icons/heroicons/exclamation-triangle";

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
      <ExclamationTriangleIcon class="h-6 w-6 text-warning" />
    </span>
    <span class="col-span-6">
      {#if compact}
        Brakuje: {missingItems}
      {:else}
        Pomóż uzupełnić brakujące dane ({missingItems}).
        <a
          href="https://www.facebook.com/groups/227062558151644"
          target="_blank"
          class="underline text-blue-400 hover:text-blue-600"
        >
          Napisz na "Pośredniawce"
        </a>
      {/if}
    </span>
  </div>
{/if}
