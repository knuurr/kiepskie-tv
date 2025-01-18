<script lang="ts">
  import { onMount } from "svelte";
  import { videoSettings } from "$lib/stores/videoSettingsStore";
  import * as DATA from "../../routes/Constans.svelte";
  import { createEventDispatcher } from "svelte";
  import backgroundsData from "$lib/tiwi/backgrounds.json";
  import XMarkIcon from "virtual:icons/heroicons/x-mark";
  import XCircleIcon from "virtual:icons/heroicons/x-circle";
  import CheckCircleIcon from "virtual:icons/heroicons/check-circle";

  export let settingId: string;
  export let showDrawer = false;
  export let selectedBackgroundId: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    backgroundSelected: { backgroundId: string };
  }>();

  interface Background {
    id: string;
    name: string;
    description: string;
    imagePath: string;
    previewPath: string;
    overlayConfig: {
      maxWidth: number;
      maxHeight: number;
      padWidth: number;
      padHeight: number;
      offsetX: number;
      offsetY: number;
    };
  }

  let backgrounds: Background[] = backgroundsData.backgrounds;
  let loading = false;
  let error: string | null = null;

  function selectBackground(backgroundId: string) {
    dispatch("backgroundSelected", { backgroundId });
    showDrawer = false;
  }

  // Get current background
  $: currentBackground = backgrounds.find(
    (bg) => bg.id === selectedBackgroundId,
  );
</script>

<div class="drawer drawer-end">
  <input
    type="checkbox"
    id="background-drawer-{settingId}"
    class="drawer-toggle"
    bind:checked={showDrawer}
  />

  <div class="drawer-side z-[100]">
    <label
      for="background-drawer-{settingId}"
      aria-label="close sidebar"
      class="drawer-overlay"
    ></label>
    <div class="p-4 w-80 min-h-full bg-base-200 text-base-content">
      <!-- Drawer header -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-lg">Wybierz tło</h3>
        <button
          class="btn btn-square btn-sm absolute top-2 right-2 z-[90]"
          on:click={() => (showDrawer = false)}
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <!-- Loading state -->
      {#if loading}
        <div class="flex justify-center items-center h-48">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      {/if}

      <!-- Error state -->
      {#if error}
        <div class="alert alert-error">
          <XCircleIcon class="stroke-current shrink-0 h-6 w-6" />
          <span>Błd: {error}</span>
        </div>
      {/if}

      <!-- Background options -->
      {#if backgrounds.length > 0}
        <div class="grid grid-cols-1 gap-4">
          {#each backgrounds as background}
            {@const isSelected = currentBackground?.id === background.id}
            <button
              class="card bg-base-100 hover:bg-base-300 transition-all {isSelected
                ? 'ring-2 ring-primary'
                : ''}"
              on:click={() => selectBackground(background.id)}
            >
              <div class="card-body p-4">
                <div class="flex items-start gap-4">
                  <!-- Preview image -->
                  <div
                    class="w-24 h-24 rounded-lg overflow-hidden bg-base-300 flex-shrink-0"
                  >
                    <img
                      src={background.previewPath}
                      alt={background.name}
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <!-- Background info -->
                  <div class="flex-1">
                    <h4 class="font-medium">{background.name}</h4>
                    <p class="text-sm text-base-content/70">
                      {background.description}
                    </p>
                  </div>
                  <!-- Selected indicator -->
                  {#if isSelected}
                    <div class="flex-shrink-0">
                      <CheckCircleIcon class="h-6 w-6 text-primary" />
                    </div>
                  {/if}
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
