<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import FilterIcon from "virtual:icons/heroicons/funnel";

  export let value: string;
  export let type: string;
  export let disabled = false;

  const dispatch = createEventDispatcher();

  function handleClick(event: MouseEvent) {
    if (disabled) return;
    event.stopPropagation();
    dispatch("filter", { type, value });
  }
</script>

<button
  class="inline-flex items-center gap-1 hover:text-primary cursor-pointer transition-colors group"
  on:click={handleClick}
>
  <span
    class="border-b border-dotted border-base-content/30 group-hover:border-primary"
  >
    <slot>{value}</slot>
  </span>
  <FilterIcon class="w-3 h-3 opacity-50 group-hover:opacity-100" />
</button>

<style>
  /* Ensure the button doesn't affect text flow */
  button {
    font: inherit;
    padding: 0;
    margin: 0;
    background: none;
    border: none;
  }
</style>
