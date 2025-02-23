<script lang="ts">
  export let value: string;
  export let type: string;
  export let disabled = false;

  let isHovered = false;

  function handleClick(event: MouseEvent) {
    if (disabled) return;
    event.stopPropagation();
    dispatch("filter", { type, value });
  }

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
</script>

<span
  class="cursor-pointer inline-block group relative {disabled
    ? ''
    : 'hover:text-primary-focus hover:underline'} 
    transition-colors duration-150 ease-in-out border-b border-dotted border-base-content/30"
  class:text-primary={isHovered}
  on:click={handleClick}
  on:mouseenter={() => (isHovered = true)}
  on:mouseleave={() => (isHovered = false)}
  role="button"
  tabindex="0"
>
  <slot>{value}</slot>
  <span
    class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-base-300 text-base-content px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-[9999]"
    >Kliknij aby filtrować</span
  >
</span>
