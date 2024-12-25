<script lang="ts">
  import { onMount } from "svelte";
  import { videoSettings } from "$lib/stores/videoSettingsStore";
  import * as DATA from "../../routes/Constans.svelte";

  export let settingId: string;
  export let showDrawer = false;

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

  let backgrounds: Background[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      const response = await fetch(DATA.PATH_BACKGROUNDS_JSON);
      const data = await response.json();
      backgrounds = data.backgrounds;

      // Set the first background as default if no background is selected
      if (backgrounds.length > 0) {
        const currentSetting = $videoSettings.find((s) => s.id === settingId);
        if (!currentSetting?.settings?.selectedBackground) {
          videoSettings.updateSettings(settingId, {
            selectedBackground: backgrounds[0].id,
          });
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    } finally {
      loading = false;
    }
  });

  function selectBackground(backgroundId: string) {
    videoSettings.updateSettings(settingId, {
      selectedBackground: backgroundId,
    });
    showDrawer = false;
  }

  // Get current background
  $: currentBackground = backgrounds.find(
    (bg) =>
      bg.id ===
      $videoSettings.find((s) => s.id === settingId)?.settings
        ?.selectedBackground,
  );
</script>

<div class="drawer drawer-end">
  <input
    type="checkbox"
    id="background-drawer-{settingId}"
    class="drawer-toggle"
    bind:checked={showDrawer}
  />

  <div class="drawer-content">
    <!-- Trigger button -->
    <button class="btn btn-primary" on:click={() => (showDrawer = true)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 mr-2"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
        <path
          fill-rule="evenodd"
          d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      Wybierz tło
    </button>
  </div>

  <div class="drawer-side">
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Bł��d: {error}</span>
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6 text-primary"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clip-rule="evenodd"
                        />
                      </svg>
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
