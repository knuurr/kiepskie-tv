<!-- Help modal component for displaying feature information -->
<script lang="ts">
  import type { SvelteComponent } from "svelte";

  export let showModal = false;
  export let title: string;
  export let description: string | undefined = undefined;
  export let imagePath: string | undefined = undefined;
  export let ContentComponent: typeof SvelteComponent | undefined = undefined;
</script>

<div class="modal modal-bottom sm:modal-middle" class:modal-open={showModal}>
  <div class="modal-box">
    <h3 class="font-bold text-lg">{title}</h3>

    {#if ContentComponent}
      <div class="py-4">
        <svelte:component this={ContentComponent} />
      </div>
    {:else if description}
      <p class="py-4 whitespace-pre-line">{description}</p>
    {/if}

    {#if imagePath}
      <figure class="py-2">
        <img
          src={imagePath}
          alt="Feature visualization"
          class="rounded-lg w-full"
          loading="lazy"
        />
      </figure>
    {/if}

    <div class="modal-action">
      <button class="btn" on:click={() => (showModal = false)}>Zamknij</button>
    </div>
  </div>
  <div class="modal-backdrop" on:click={() => (showModal = false)} />
</div>
