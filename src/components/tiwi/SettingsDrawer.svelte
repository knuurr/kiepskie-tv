<script lang="ts">
  import { onMount } from "svelte";
  import { videoSettings } from "$lib/stores/videoSettingsStore";
  import { DEFAULT_SETTINGS } from "$lib/constants";
  import { toasts } from "$lib/stores/toastStore";
  import BackgroundSelector from "./BackgroundSelector.svelte";
  import * as DATA from "../../routes/Constans.svelte";

  export let showDrawer = false;
  export let selectedFileIndex: number | undefined;
  export let settingId: string | undefined;
  export let regeneratePreview: (file: File) => Promise<void>;
  export let files: FileList;

  let isLoadingBackgrounds = true;
  let backgrounds: any[] = [];
  let hasUnsavedChanges = false;
  let pendingSettings: any = {};
  let lastSavedSettings: any = {};
  let showBackgroundDrawer = false;
  let showCloseConfirmModal = false;

  // Reset to last saved state whenever file changes or drawer opens
  $: if (selectedFileIndex !== undefined) {
    if ($videoSettings[selectedFileIndex]) {
      lastSavedSettings = { ...$videoSettings[selectedFileIndex].settings };
      pendingSettings = { ...lastSavedSettings };
    }
    hasUnsavedChanges = false;
  }

  // Also reset when drawer opens
  $: if (showDrawer) {
    if (selectedFileIndex !== undefined && $videoSettings[selectedFileIndex]) {
      lastSavedSettings = { ...$videoSettings[selectedFileIndex].settings };
      pendingSettings = { ...lastSavedSettings };
    }
    hasUnsavedChanges = false;
  }

  function handleSettingChange(settingId: string | undefined, changes: any) {
    if (!settingId) return;
    pendingSettings = { ...pendingSettings, ...changes };
    // Compare with last saved state to determine if there are changes
    hasUnsavedChanges =
      JSON.stringify(pendingSettings) !== JSON.stringify(lastSavedSettings);
  }

  async function saveSettings(settingId: string | undefined) {
    if (!settingId || !hasUnsavedChanges) return;

    videoSettings.updateSettings(settingId, pendingSettings);
    lastSavedSettings = { ...pendingSettings };
    hasUnsavedChanges = false;

    if (selectedFileIndex !== undefined) {
      const file = files[selectedFileIndex];
      await regeneratePreview(file);
      toasts.add("Ustawienia zostały zapisane", "success");
    }
  }

  function handleCheckboxChange(
    settingId: string | undefined,
    key: string,
    event: Event,
  ) {
    if (!settingId) return;
    const target = event.target as HTMLInputElement;
    if (target && target instanceof HTMLInputElement) {
      handleSettingChange(settingId, {
        [key]: target.checked,
      });
    }
  }

  function resetSettings() {
    pendingSettings = { ...lastSavedSettings };
    hasUnsavedChanges = false;
  }

  function resetToDefault() {
    pendingSettings = { ...DEFAULT_SETTINGS };
    hasUnsavedChanges =
      JSON.stringify(pendingSettings) !== JSON.stringify(lastSavedSettings);
  }

  // Function to get background name
  function getBackgroundName(
    settingId: string | undefined,
    backgroundId?: string,
  ) {
    if (isLoadingBackgrounds || !settingId) return null;

    const selectedBackground =
      backgroundId ||
      $videoSettings.find((s) => s.id === settingId)?.settings
        ?.selectedBackground;
    const background = backgrounds.find((bg) => bg.id === selectedBackground);
    return background?.name || backgrounds[0]?.name;
  }

  function handleBackgroundSelected(
    event: CustomEvent<{ backgroundId: string }>,
  ) {
    if (settingId) {
      handleSettingChange(settingId, {
        selectedBackground: event.detail.backgroundId,
      });
      showBackgroundDrawer = false;
    }
  }

  function handleCloseAttempt() {
    if (hasUnsavedChanges) {
      showCloseConfirmModal = true;
    } else {
      showDrawer = false;
    }
  }

  function handleConfirmedClose() {
    resetSettings();
    showCloseConfirmModal = false;
    showDrawer = false;
  }

  onMount(async () => {
    try {
      isLoadingBackgrounds = true;
      const response = await fetch(DATA.PATH_BACKGROUNDS_JSON);
      const data = await response.json();
      backgrounds = data.backgrounds;
    } catch (error) {
      console.error("Error loading backgrounds:", error);
      toasts.add("Błąd ładowania konfiguracji teł", "error");
    } finally {
      isLoadingBackgrounds = false;
    }
  });
</script>

<div class="drawer drawer-end z-[100]">
  <input
    type="checkbox"
    id="settings-drawer"
    class="drawer-toggle"
    bind:checked={showDrawer}
    on:change={(e) => {
      if (!e.currentTarget.checked && hasUnsavedChanges) {
        e.currentTarget.checked = true;
        showCloseConfirmModal = true;
      }
    }}
  />

  <div class="drawer-side">
    <label
      for="settings-drawer"
      aria-label="close sidebar"
      class="drawer-overlay"
      on:click|preventDefault={() => handleCloseAttempt()}
    ></label>
    <div
      class="p-4 w-96 min-h-full bg-base-200 text-base-content flex flex-col"
    >
      <!-- Sticky Drawer header -->
      <div class="sticky top-0 bg-base-200 z-[101] pb-4">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-bold text-lg">Ustawienia</h3>
            <p class="text-xs opacity-50">
              Dostosuj ustawienia dla wybranego pliku
            </p>
            {#if hasUnsavedChanges}
              <div class="mt-2">
                <span class="badge badge-warning gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Niezapisane zmiany
                </span>
              </div>
            {/if}
          </div>
          <button class="btn btn-square btn-sm" on:click={handleCloseAttempt}>
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
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto">
        <div class="grid grid-cols-1 gap-4">
          <label class="flex flex-col gap-2 p-4 bg-base-100 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="flex-1">Dodaj efekt dźwiękowy przejścia</span>
              <input
                type="checkbox"
                class="toggle toggle-success"
                checked={pendingSettings.addIntro}
                on:change={(e) =>
                  handleCheckboxChange(settingId, "addIntro", e)}
              />
            </div>
            <p class="text-xs text-base-content/70">
              Dodaje charakterystyczny dźwięk przejścia z serialu na początku
              wideo
            </p>
          </label>

          <label class="flex flex-col gap-2 p-4 bg-base-100 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="flex-1">Dodaj reakcję Boczka</span>
              <input
                type="checkbox"
                class="toggle toggle-success"
                checked={pendingSettings.addBoczek}
                on:change={(e) =>
                  handleCheckboxChange(settingId, "addBoczek", e)}
              />
            </div>
            <p class="text-xs text-base-content/70">
              Dodaje reakcję Boczka na końcu Twojego wideo
            </p>
          </label>

          <!-- Scale Controls -->
          <div class="p-4 bg-base-100 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium">Skale</span>
              <label class="flex items-center gap-2">
                <span class="text-sm">Synchronizuj skale</span>
                <input
                  type="checkbox"
                  class="toggle toggle-sm"
                  checked={pendingSettings.scalesLocked}
                  on:change={(e) => {
                    if (settingId) {
                      handleSettingChange(settingId, {
                        scalesLocked: e.currentTarget.checked,
                      });
                    }
                  }}
                />
              </label>
            </div>
            <p class="text-xs text-base-content/70 mb-4">
              Synchronizacja skal pozwala na jednoczesną zmianę rozmiaru obu
              elementów wideo
            </p>

            <!-- Boczek Scale -->
            <div class="mb-4">
              <div class="flex justify-between mb-2">
                <span>Skala Boczka</span>
                <span class="text-base-content/70">
                  {(pendingSettings.boczekScale * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="range range-sm"
                value={pendingSettings.boczekScale}
                on:input={(e) => {
                  if (settingId) {
                    const newScale = parseFloat(e.currentTarget.value);
                    handleSettingChange(settingId, {
                      boczekScale: newScale,
                      ...(pendingSettings.scalesLocked
                        ? { greenscreenScale: newScale }
                        : {}),
                    });
                  }
                }}
              />
              <p class="text-xs text-base-content/70 mt-2">
                Kontroluje rozmiar reakcji Boczka w końcowej scenie
              </p>
            </div>

            <!-- Greenscreen Scale -->
            <div>
              <div class="flex justify-between mb-2">
                <span>Skala Greenscreena</span>
                <span class="text-base-content/70">
                  {(pendingSettings.greenscreenScale * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="range range-sm"
                value={pendingSettings.greenscreenScale}
                on:input={(e) => {
                  if (settingId) {
                    const newScale = parseFloat(e.currentTarget.value);
                    handleSettingChange(settingId, {
                      greenscreenScale: newScale,
                      ...(pendingSettings.scalesLocked
                        ? { boczekScale: newScale }
                        : {}),
                    });
                  }
                }}
              />
              <p class="text-xs text-base-content/70 mt-2">
                Kontroluje rozmiar Twojego wideo w oknie telewizora
              </p>
            </div>
          </div>

          <!-- Boczek Fill Type Select -->
          {#if pendingSettings.addBoczek}
            <div class="flex flex-col gap-2 p-4 bg-base-100 rounded-lg">
              <div class="flex items-center justify-between">
                <span class="flex-1">Tryb dopasowania Boczka</span>
                <select
                  class="select select-bordered select-sm w-48"
                  value={pendingSettings.boczekFillType}
                  on:change={(e) => {
                    if (settingId) {
                      handleSettingChange(settingId, {
                        boczekFillType: e.currentTarget.value,
                      });
                    }
                  }}
                >
                  <option value="stretch">Rozciągnij</option>
                  <option value="blur-padding"
                    >Zachowaj proporcje z rozmyciem</option
                  >
                  <option value="black-padding"
                    >Zachowaj proporcje z czarnym tłem</option
                  >
                </select>
              </div>
              <p class="text-xs text-base-content/70">
                Określa sposób dopasowania reakcji Boczka do ekranu - możesz
                rozciągnąć lub zachować proporcje z wybranym tłem
              </p>
            </div>
          {/if}

          <!-- Greenscreen Fill Type Select -->
          <div class="flex flex-col gap-2 p-4 bg-base-100 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="flex-1">Tryb dopasowania do tła</span>
              <select
                class="select select-bordered select-sm w-48"
                value={pendingSettings.greenscreenFillType}
                on:change={(e) => {
                  if (settingId) {
                    handleSettingChange(settingId, {
                      greenscreenFillType: e.currentTarget.value,
                    });
                  }
                }}
              >
                <option value="black-padding"
                  >Zachowaj proporcje z czarnym tłem</option
                >
                <option value="stretch">Rozciągnij</option>
                <option value="blur-padding"
                  >Zachowaj proporcje z rozmyciem</option
                >
              </select>
            </div>
            <p class="text-xs text-base-content/70">
              Określa sposób dopasowania Twojego wideo do okna telewizora -
              możesz rozciągnąć lub zachować proporcje z wybranym tłem
            </p>
          </div>

          <!-- Background selector button -->
          <button
            class="w-full flex items-center justify-between gap-4 p-4 bg-base-100 rounded-lg hover:bg-base-200 transition-all relative {isLoadingBackgrounds
              ? 'cursor-wait'
              : ''}"
            on:click={() =>
              !isLoadingBackgrounds && (showBackgroundDrawer = true)}
            disabled={isLoadingBackgrounds}
          >
            <div class="flex items-center gap-4 flex-1">
              <span>Wybierz tło</span>
              {#if isLoadingBackgrounds}
                <div class="flex items-center gap-2">
                  <span class="loading loading-spinner loading-sm"></span>
                  <span class="text-base-content/70">Ładowanie...</span>
                </div>
              {:else if selectedFileIndex !== undefined && $videoSettings[selectedFileIndex] && $videoSettings[selectedFileIndex].id}
                <span class="text-base-content/70">
                  {getBackgroundName(
                    settingId,
                    pendingSettings.selectedBackground,
                  )}
                </span>
              {/if}
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 {isLoadingBackgrounds ? 'opacity-50' : ''}"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Footer with actions -->
      <div
        class="sticky bottom-0 bg-base-200 pt-4 mt-4 border-t border-base-300"
      >
        <div class="flex justify-between gap-2">
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" on:click={resetToDefault}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              Domyślne
            </button>
            <button
              class="btn btn-ghost btn-sm"
              on:click={resetSettings}
              disabled={!hasUnsavedChanges}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Cofnij zmiany
            </button>
          </div>
          <button
            class="btn btn-primary btn-sm"
            disabled={!hasUnsavedChanges}
            on:click={() => settingId && saveSettings(settingId)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Zapisz
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

{#if selectedFileIndex !== undefined && $videoSettings[selectedFileIndex] && $videoSettings[selectedFileIndex].id}
  {@const currentSettingId = $videoSettings[selectedFileIndex].id}
  <BackgroundSelector
    settingId={currentSettingId}
    bind:showDrawer={showBackgroundDrawer}
    selectedBackgroundId={pendingSettings.selectedBackground}
    on:backgroundSelected={handleBackgroundSelected}
  />
{/if}

<!-- Close confirmation modal -->
{#if showCloseConfirmModal}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Niezapisane zmiany</h3>
      <p class="py-4">
        Masz niezapisane zmiany. Czy na pewno chcesz zamknąć ustawienia?
        Wszystkie niezapisane zmiany zostaną utracone.
      </p>
      <div class="modal-action">
        <button
          class="btn btn-ghost"
          on:click={() => (showCloseConfirmModal = false)}
        >
          Anuluj
        </button>
        <button class="btn btn-error" on:click={handleConfirmedClose}>
          Zamknij bez zapisywania
        </button>
      </div>
    </div>
    <div
      class="modal-backdrop"
      on:click={() => (showCloseConfirmModal = false)}
    />
  </div>
{/if}
