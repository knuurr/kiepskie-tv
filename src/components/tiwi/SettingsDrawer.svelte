<script lang="ts">
  import { onMount } from "svelte";
  import { videoSettings } from "$lib/stores/videoSettingsStore";
  import {
    DEFAULT_SETTINGS,
    FEATURES,
    GREENSCREEN_SCALE_PRESETS,
  } from "$lib/constants";
  import { toasts } from "$lib/stores/toastStore";
  import BackgroundSelector from "./BackgroundSelector.svelte";
  import * as DATA from "../../routes/Constans.svelte";
  import backgroundsData from "$lib/tiwi/backgrounds.json";
  import XMarkIcon from "virtual:icons/heroicons/x-mark";
  import ExclamationTriangleIcon from "virtual:icons/heroicons/exclamation-triangle";
  import ChevronDownIcon from "virtual:icons/heroicons/chevron-down";
  import ArrowUturnLeftIcon from "virtual:icons/heroicons/arrow-uturn-left";
  import ArrowPathIcon from "virtual:icons/heroicons/arrow-path";
  import CheckIcon from "virtual:icons/heroicons/check";

  import type { VideoSettings } from "$lib/types/VideoSettings";
  import { HELP_CONTENT } from "$lib/tiwi/helpContent";
  import HelpModal from "./HelpModal.svelte";

  export let showDrawer = false;
  export let selectedFileIndex: number | undefined;
  export let settingId: string | undefined;
  export let regeneratePreview: (file: File) => Promise<void>;
  export let files: FileList;

  let isLoadingBackgrounds = true;
  let backgrounds = backgroundsData.backgrounds;
  let hasUnsavedChanges = false;
  let pendingSettings: VideoSettings["settings"] = { ...DEFAULT_SETTINGS };
  let lastSavedSettings: VideoSettings["settings"] = { ...DEFAULT_SETTINGS };
  let showBackgroundDrawer = false;
  let showCloseConfirmModal = false;
  let currentHelpContent: {
    title: string;
    description?: string;
    imagePath?: string;
    component?: typeof SvelteComponent;
  } | null = null;
  let showHelpModal = false;

  let selectedBackground = backgrounds.find((bg) => {
    if (selectedFileIndex === undefined) return false;
    return (
      bg.id === $videoSettings[selectedFileIndex]?.settings?.selectedBackground
    );
  });

  $: {
    selectedBackground = backgrounds.find((bg) => {
      if (selectedFileIndex === undefined) return false;
      return (
        bg.id ===
        $videoSettings[selectedFileIndex]?.settings?.selectedBackground
      );
    });
  }

  // Reset to last saved state whenever file changes or drawer opens
  $: if (selectedFileIndex !== undefined && $videoSettings[selectedFileIndex]) {
    lastSavedSettings = { ...$videoSettings[selectedFileIndex].settings };
    pendingSettings = { ...lastSavedSettings };
    hasUnsavedChanges = false;
  }

  // Also reset when drawer opens
  $: if (
    showDrawer &&
    selectedFileIndex !== undefined &&
    $videoSettings[selectedFileIndex]
  ) {
    lastSavedSettings = { ...$videoSettings[selectedFileIndex].settings };
    pendingSettings = { ...lastSavedSettings };
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

  function showHelp(contentKey: keyof typeof HELP_CONTENT) {
    currentHelpContent = HELP_CONTENT[contentKey];
    showHelpModal = true;
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
                  <ExclamationTriangleIcon class="h-3 w-3" />
                  Niezapisane zmiany
                </span>
              </div>
            {/if}
          </div>
          <button class="btn btn-square btn-sm" on:click={handleCloseAttempt}>
            <XMarkIcon class="h-6 w-6" />
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
          {#if FEATURES.ENABLE_SCALE_CONTROLS}
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
          {/if}

          <!-- CRT Effects Section -->
          <div class="flex flex-col gap-2 p-4 bg-base-100 rounded-lg">
            <div class="flex flex-col gap-1">
              <h3 class="font-medium">Efekty CRT</h3>
              <button
                class="text-xs text-base-content/90 hover:text-primary transition-colors flex items-center gap-1"
                on:click={() => showHelp("CRT_EFFECTS")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-4 h-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  />
                </svg>
                Dowiedz się więcej o efektach CRT
              </button>
            </div>
            <div class="grid grid-cols-1 gap-4">
              <label class="flex items-center justify-between gap-2">
                <div>
                  <span class="flex-1">Efekt CRT</span>
                  <p class="text-xs text-base-content/70">
                    Dodaje zniekształcenie soczewki CRT
                  </p>
                </div>
                <input
                  type="checkbox"
                  class="toggle toggle-success"
                  checked={pendingSettings?.enableCRT ?? false}
                  on:change={(e) =>
                    handleSettingChange(settingId, {
                      enableCRT: e.currentTarget.checked,
                    })}
                />
              </label>

              <label class="flex items-center justify-between gap-2">
                <div>
                  <span class="flex-1">Poświata</span>
                  <p class="text-xs text-base-content/70">
                    Dodaje efekt poświaty wokół obrazu
                  </p>
                </div>
                <input
                  type="checkbox"
                  class="toggle toggle-success"
                  checked={pendingSettings?.enableBloom ?? false}
                  on:change={(e) =>
                    handleSettingChange(settingId, {
                      enableBloom: e.currentTarget.checked,
                    })}
                />
              </label>

              <label class="flex items-center justify-between gap-2">
                <div>
                  <span class="flex-1">Przeplot</span>
                  <p class="text-xs text-base-content/70">
                    Symuluje efekt przeplotu starego telewizora
                  </p>
                </div>
                <input
                  type="checkbox"
                  class="toggle toggle-success"
                  checked={pendingSettings?.enableInterlaced ?? false}
                  on:change={(e) =>
                    handleSettingChange(settingId, {
                      enableInterlaced: e.currentTarget.checked,
                    })}
                />
              </label>

              {#if FEATURES.ENABLE_RGB}
                <label class="flex items-center justify-between gap-2">
                  <div>
                    <span class="flex-1">Efekt RGB</span>
                    <p class="text-xs text-base-content/70">
                      Dodaje efekt aberracji chromatycznej RGB
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    class="toggle toggle-success"
                    checked={pendingSettings?.enableRGB ?? false}
                    on:change={(e) =>
                      handleSettingChange(settingId, {
                        enableRGB: e.currentTarget.checked,
                      })}
                  />
                </label>
              {/if}

              {#if FEATURES.ENABLE_HIGHLIGHT}
                <label class="flex items-center justify-between gap-2">
                  <div>
                    <span class="flex-1">Odbłysk</span>
                    <p class="text-xs text-base-content/70">
                      Dodaje efekt odbłysku na ekranie
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    class="toggle toggle-success"
                    checked={pendingSettings?.enableHighlight ?? false}
                    on:change={(e) =>
                      handleSettingChange(settingId, {
                        enableHighlight: e.currentTarget.checked,
                      })}
                  />
                </label>
              {/if}
            </div>
          </div>

          <!-- Boczek Fill Type Select -->
          {#if pendingSettings.addBoczek}
            <div class="flex flex-col gap-2 p-4 bg-base-100 rounded-lg">
              <div class="flex flex-col gap-1">
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
                <button
                  class="text-xs text-base-content/90 hover:text-primary transition-colors flex items-center gap-1"
                  on:click={() => showHelp("BOCZEK_FILL")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-4 h-4"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                    />
                  </svg>
                  Dowiedz się więcej o trybach dopasowania
                </button>
              </div>
              <p class="text-xs text-base-content/70">
                Określa sposób dopasowania reakcji Boczka do ekranu - możesz
                rozciągnąć lub zachować proporcje z wybranym tłem
              </p>
            </div>
          {/if}

          <!-- Greenscreen Scale Presets -->
          <div class="flex flex-col gap-2 p-4 bg-base-100 rounded-lg">
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="flex-1">Skalowanie wideo</span>
              </div>
              <button
                class="text-xs text-base-content/90 hover:text-primary transition-colors flex items-center gap-1"
                on:click={() => showHelp("VIDEO_SCALE")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-4 h-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  />
                </svg>
                Dowiedz się więcej o skalowaniu wideo
              </button>
            </div>
            <p class="text-xs text-base-content/70 mb-2">
              Określa wielkość wideo względem okna telewizora
            </p>
            <div class="flex flex-col gap-2">
              {#each Object.entries(GREENSCREEN_SCALE_PRESETS) as [key, preset]}
                <div class="flex items-center gap-2">
                  <input
                    type="radio"
                    name="greenscreen-scale"
                    class="radio radio-sm radio-primary"
                    value={preset.value}
                    checked={pendingSettings.greenscreenScale === preset.value}
                    on:change={(e) => {
                      if (settingId) {
                        handleSettingChange(settingId, {
                          greenscreenScale: parseFloat(e.currentTarget.value),
                        });
                      }
                    }}
                  />
                  <label class="text-sm">{preset.label}</label>
                </div>
              {/each}
            </div>
          </div>

          <!-- Greenscreen Fill Type Select -->
          <div class="flex flex-col gap-2 p-4 bg-base-100 rounded-lg">
            <div class="flex flex-col gap-1">
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
              <button
                class="text-xs text-base-content/90 hover:text-primary transition-colors flex items-center gap-1"
                on:click={() => showHelp("GREENSCREEN_FILL")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-4 h-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  />
                </svg>
                Dowiedz się więcej o trybach dopasowania do tła
              </button>
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
            <ChevronDownIcon
              class="h-5 w-5 {isLoadingBackgrounds ? 'opacity-50' : ''}"
            />
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
              <ArrowUturnLeftIcon class="h-4 w-4" />
              Domyślne
            </button>
            <button
              class="btn btn-ghost btn-sm"
              on:click={resetSettings}
              disabled={!hasUnsavedChanges}
            >
              <ArrowPathIcon class="h-4 w-4" />
              Cofnij zmiany
            </button>
          </div>
          <button
            class="btn btn-primary btn-sm"
            disabled={!hasUnsavedChanges}
            on:click={() => settingId && saveSettings(settingId)}
          >
            <CheckIcon class="h-4 w-4" />
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

<!-- Help Modal -->
{#if currentHelpContent}
  <HelpModal
    bind:showModal={showHelpModal}
    title={currentHelpContent.title}
    description={currentHelpContent.description}
    imagePath={currentHelpContent.imagePath}
    ContentComponent={currentHelpContent.component}
  />
{/if}
