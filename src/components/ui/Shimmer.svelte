<script lang="ts">
  export let active = false;
  export let class_name = ""; // Additional classes to apply
</script>

<div class="relative {class_name} overflow-hidden">
  <slot />
  {#if active}
    <div
      class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-base-content/[0.05] to-transparent animate-shimmer"
    />
  {/if}
</div>

<style>
  /* Ensure parent has position relative if not already set */
  div {
    isolation: isolate;
  }
</style>
