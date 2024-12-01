<script lang="ts">
  export let text: string;
  export let highlight: string = "";

  $: parts = highlight
    ? text.split(new RegExp(`(${highlight})`, "gi"))
    : [text];
</script>

{#each parts as part}
  {#if highlight && part.toLowerCase() === highlight.toLowerCase()}
    <span class="bg-warning/30 font-medium">{part}</span>
  {:else}
    {part}
  {/if}
{/each}
