<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import type { Toast } from "$lib/types/Toast";
  import toastsData from "$lib/toasts/toasts.json";
  import { pushState, replaceState } from "$app/navigation";
  import { page } from "$app/stores";
  import { Toast as ToastNotification } from "$lib/toast";
  import { ToastService } from "$lib/services/toasts";
  import { DatabaseService } from "$lib/services/db";

  import CenteredContainer from "../../components/CenteredContainer.svelte";
  import Footer from "../../components/Footer.svelte";
  import NavBar from "../../components/NavBar.svelte";
  import ResponsiveContainer from "../../components/ResponsiveContainer.svelte";
  import Header from "../Header.svelte";
  import FeedbackSection from "../../components/FeedbackSection.svelte";
  import AnimatedButton from "../../components/tiwi/AnimatedButton.svelte";
  import AudioWavePlayer from "../../components/AudioWavePlayer.svelte";
  import MissingMetadataInfo from "../../components/MissingMetadataInfo.svelte";
  import HistoryDrawer from "../../components/HistoryDrawer.svelte";

  import ClockIcon from "virtual:icons/heroicons/clock";
  import ClipboardIcon from "virtual:icons/heroicons/clipboard";
  import CheckIcon from "virtual:icons/heroicons/check";
  import ShareIcon from "virtual:icons/heroicons/share";
  import ArrowPathIcon from "virtual:icons/heroicons/arrow-path";
  import CalendarIcon from "virtual:icons/heroicons/calendar";
  import HashtagIcon from "virtual:icons/heroicons/hashtag";
  import ChevronLeftIcon from "virtual:icons/heroicons/chevron-left";
  import ChevronRightIcon from "virtual:icons/heroicons/chevron-right";

  import { tryShowDonationPopup } from "$lib/utils/donationPopup";
  import DonationModal from "../../components/DonationModal.svelte";

  // Initialize services
  const toastService = ToastService.getInstance();
  const dbService = DatabaseService.getInstance();

  // Get the stores from the service
  const currentToastStore = toastService.currentToast;
  const previousToastStore = toastService.previousToast;

  // Subscribe to toast stores
  $: currentToast = $currentToastStore;
  $: previousToast = $previousToastStore;

  let isRolling: boolean = false;
  let isSuccess: boolean = false;
  let isCopySuccess: boolean = false;
  let typewriterText: string = "";
  let typewriterInterval: ReturnType<typeof setInterval>;
  let activeHistoryIndex: number = 0;
  let isTypewriterComplete: boolean = false;
  let isInitializing: boolean = true;
  let showDetails: boolean = false;

  const MAX_HISTORY_SIZE = 6;
  const TOAST_LOADING_DELAY_MS = 800;
  let rollCount: number = 0;
  let toastHistory: { toast: Toast; episodeTimestamp: number }[] = [];
  let copyStates: { [key: number]: boolean } = {};
  let shareStates: { [key: number]: boolean } = {};

  let toasts = toastsData;
  let observer: IntersectionObserver;

  let isShareSuccess = false;
  let canShareOnDevice = false;
  let showHistoryDrawer = false;
  let showDonationPopup = false;

  // Compute history count for display
  $: historyCount = toastHistory.length;

  // Format date with timezone consideration
  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(date);
  }

  // Check if sharing is available
  function checkSharingCapability() {
    if (typeof navigator === "undefined") return;
    canShareOnDevice = "share" in navigator;
    console.debug("Share API available:", canShareOnDevice);
  }

  // Load history from IndexedDB
  async function loadHistory() {
    try {
      const history = await toastService.loadHistory();
      if (history.length > 0) {
        toastHistory = history.map((toast) => ({
          toast,
          episodeTimestamp: Date.now(), // We don't have the original timestamp, use current
        }));
        ToastNotification.success("Wczytano historię toastów");
      }
    } catch (error) {
      console.error("Failed to load history:", error);
      ToastNotification.error("Błąd podczas wczytywania historii");
    }
  }

  // Migrate existing history to IndexedDB
  async function migrateHistory() {
    if (toastHistory.length === 0) return;

    try {
      for (const entry of toastHistory) {
        await toastService.addToHistory(entry.toast);
      }
      console.debug("Successfully migrated history to IndexedDB");
    } catch (error) {
      console.error("Failed to migrate history:", error);
      ToastNotification.error("Błąd podczas migracji historii");
    }
  }

  // Modify keyboard handler to include arrow navigation
  function handleKeydown(event: KeyboardEvent) {
    // Ignore if user is typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    // Convert key to lowercase for case-insensitive comparison
    const key = event.key.toLowerCase();

    // Handle keyboard shortcuts
    if (event.shiftKey && key === "c" && currentToast && !isRolling) {
      event.preventDefault();
      copyToClipboard();
    } else if (event.shiftKey && key === "s" && currentToast && !isRolling) {
      event.preventDefault();
      shareToast();
    } else if (key === "r" && !isRolling) {
      event.preventDefault();
      getRandomToast();
    } else if (event.shiftKey && key === "h") {
      event.preventDefault();
      showHistoryDrawer = true;
    } else if (key === " " && !isRolling) {
      event.preventDefault();
      getRandomToast();
    } else if (toastHistory.length > 1) {
      // Handle history navigation
      if (event.key === "ArrowLeft" && !isRolling && activeHistoryIndex > 0) {
        event.preventDefault();
        navigateHistory("left");
      } else if (
        event.key === "ArrowRight" &&
        !isRolling &&
        activeHistoryIndex < toastHistory.length - 1
      ) {
        event.preventDefault();
        navigateHistory("right");
      }
    }
  }

  // Add navigation function
  function navigateHistory(direction: "left" | "right") {
    if (toastHistory.length <= 1) return;

    let newIndex = activeHistoryIndex;

    if (direction === "left" && activeHistoryIndex > 0) {
      newIndex = activeHistoryIndex - 1;
    } else if (
      direction === "right" &&
      activeHistoryIndex < toastHistory.length - 1
    ) {
      newIndex = activeHistoryIndex + 1;
    }

    if (newIndex !== activeHistoryIndex) {
      showDetails = false;
      setTimeout(() => {
        activeHistoryIndex = newIndex;
        currentToast = toastHistory[newIndex].toast;
        showDetails = true;
        startTypewriter(currentToast.text);
      }, 300); // Match ANIMATION_TIMING.SWIPE.DURATION
    }
  }

  // Typewriter effect implementation
  function startTypewriter(text: string, immediate = false) {
    clearInterval(typewriterInterval);

    if (immediate) {
      // Show text immediately without animation
      typewriterText = text;
      isTypewriterComplete = true;
      isSuccess = true;
      isRolling = false; // Reset rolling state for immediate display
      return;
    }

    typewriterText = "";
    isTypewriterComplete = false;
    let index = 0;

    // Add delay before starting the typewriter effect
    setTimeout(() => {
      typewriterInterval = setInterval(() => {
        if (index < text.length) {
          typewriterText += text[index];
          index++;
        } else {
          clearInterval(typewriterInterval);
          isTypewriterComplete = true;
          isSuccess = true;
          isRolling = false; // Only reset rolling state after typewriter is complete
        }
      }, 50);
    }, TOAST_LOADING_DELAY_MS);
  }

  async function handleHistoryClick(index: number) {
    try {
      const historyItem = toastHistory[index];
      if (!historyItem) return;

      // Update the current toast store
      currentToastStore.set(historyItem.toast);

      // Update active index
      activeHistoryIndex = index;

      // Reset states
      copyStates = {};
      shareStates = {};
    } catch (error) {
      console.error("Failed to load toast from history:", error);
      ToastNotification.error("Nie udało się załadować toastu z historii");
    }
  }

  async function copyToClipboard(event?: MouseEvent) {
    if (!currentToast) return;

    try {
      await navigator.clipboard.writeText(currentToast.text);
      isCopySuccess = true;
      ToastNotification.success("Skopiowano do schowka!");

      // Always ensure we reset the state
      setTimeout(() => {
        isCopySuccess = false;
      }, 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      ToastNotification.error("Nie udało się skopiować do schowka");
      // Reset state even on error
      isCopySuccess = false;
    }
  }

  async function shareToast(index?: number) {
    if (!canShareOnDevice) {
      ToastNotification.error(
        "Udostępnianie nie jest dostępne na tym urządzeniu",
      );
      return;
    }

    try {
      let textToShare: string;
      let shareUrl: string;

      if (typeof index === "number") {
        // Share from history
        const historyItem = toastHistory[index];
        if (!historyItem) return;
        textToShare = historyItem.toast.text;
        shareUrl = window.location.href;
      } else {
        // Share current toast
        if (!currentToast) return;
        textToShare = currentToast.text;
        shareUrl = $page.url.href;
      }

      const shareData = {
        title: "Toast z Kiepskich",
        text: textToShare,
        url: shareUrl,
      };

      await navigator.share(shareData);

      if (typeof index === "number") {
        shareStates[index] = true;
        setTimeout(() => {
          shareStates[index] = false;
        }, 2000);
      } else {
        isShareSuccess = true;
        setTimeout(() => {
          isShareSuccess = false;
        }, 2000);
      }

      ToastNotification.success("Udostępniono!");
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Failed to share:", error);
        ToastNotification.error("Nie udało się udostępnić");
      }
    }
  }

  // Add swipe-related variables
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartTime = 0;
  let isActuallyScrolling = false;
  const SWIPE_THRESHOLD = 50;
  const SWIPE_TIME_THRESHOLD = 300;
  const ANIMATION_TIMING = {
    SWIPE: {
      DURATION: 300,
    },
  };

  // Add touch handlers
  function handleTouchStart(event: TouchEvent) {
    touchStartX = event.touches[0].clientX;
    touchStartTime = Date.now();
    isActuallyScrolling = false;
  }

  function handleTouchMove(event: TouchEvent) {
    touchEndX = event.touches[0].clientX;
    if (Math.abs(touchEndX - touchStartX) > 10) {
      isActuallyScrolling = true;
    }
  }

  function handleTouchEnd() {
    const touchEndTime = Date.now();
    const swipeTime = touchEndTime - touchStartTime;
    const swipeDistance = touchEndX - touchStartX;

    if (
      isActuallyScrolling &&
      swipeTime < SWIPE_TIME_THRESHOLD &&
      Math.abs(swipeDistance) > SWIPE_THRESHOLD
    ) {
      if (swipeDistance > 0 && activeHistoryIndex > 0) {
        navigateHistory("left");
      } else if (
        swipeDistance < 0 &&
        activeHistoryIndex < toastHistory.length - 2
      ) {
        navigateHistory("right");
      }
    }

    touchStartX = 0;
    touchEndX = 0;
    touchStartTime = 0;
    isActuallyScrolling = false;
  }

  // Modify getRandomToast to include donation popup check
  async function getRandomToast() {
    if (isRolling) return;

    isRolling = true;
    isSuccess = false;
    isTypewriterComplete = false;
    rollCount++;

    try {
      const newToast = toastService.getRandomToast(
        toasts,
        currentToast || undefined,
      );

      await toastService.addToHistory(newToast);

      const history = await toastService.getHistory();
      toastHistory = history.map((toast) => ({
        toast,
        episodeTimestamp: Date.now(),
      }));

      // Reset states
      copyStates = {};
      shareStates = {};

      // Always move to the newest toast (index 0)
      activeHistoryIndex = 0;

      // Check if we should show donation popup
      await tryShowDonationPopup(() => {
        showDonationPopup = true;
      });

      // Start typewriter effect
      startTypewriter(newToast.text);
    } catch (error) {
      console.error("Failed to get random toast:", error);
      ToastNotification.error("Nie udało się wylosować toastu");
      rollCount--;
      isRolling = false;
    }
  }

  // Modified addToHistory to use service
  async function addToHistory(toast: Toast) {
    const newEntry = { toast, episodeTimestamp: Date.now() };

    // Update local state
    if (toastHistory.length >= MAX_HISTORY_SIZE) {
      toastHistory = [newEntry, ...toastHistory.slice(0, -1)];
    } else {
      toastHistory = [newEntry, ...toastHistory];
    }

    // Add to IndexedDB
    try {
      await toastService.addToHistory(toast);
    } catch (error) {
      console.error("Failed to add toast to history:", error);
      ToastNotification.error("Błąd podczas zapisywania historii");
    }
  }

  // Setup intersection observer for carousel items
  function setupCarouselObserver() {
    if (typeof window === "undefined") return;

    observer?.disconnect();

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const index = parseInt(id.replace("toast-", ""));
            if (!isNaN(index)) {
              activeHistoryIndex = index;
            }
          }
        });
      },
      {
        root: null,
        threshold: 0.5, // Trigger when item is 50% visible
      },
    );

    // Observe all carousel items
    document.querySelectorAll(".carousel-item").forEach((item) => {
      observer.observe(item);
    });
  }

  // Update active history index when hash changes
  function updateActiveHistoryIndex() {
    const hash = $page.url.hash;
    const match = hash.match(/^#toast-(\d+)$/);
    if (match) {
      activeHistoryIndex = parseInt(match[1]);
    }
  }

  // Initialize database and load history
  onMount(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      try {
        // Initialize database
        await dbService.init();

        // Artificial delay for loading state (800ms)
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Load history from service and convert to proper type
        const history = await toastService.getHistory();
        toastHistory = history.map((toast) => ({
          toast,
          episodeTimestamp: Date.now(),
        }));

        // Set initial roll count based on history length
        rollCount = history.length;

        // Show success toast if history was loaded
        if (history.length > 0) {
          ToastNotification.success(
            "Historia toastów została pomyślnie wczytana",
          );
        }

        // If there's history, set the current toast
        if (history.length > 0) {
          const mostRecent = history[0];
          currentToastStore.set(mostRecent);
          // Show initial toast immediately without animation
          startTypewriter(mostRecent.text, true);
        }

        // Check sharing capability
        canShareOnDevice =
          typeof navigator !== "undefined" && "share" in navigator;

        // Setup keyboard shortcuts
        document.addEventListener("keydown", handleKeydown);
        cleanup = () => document.removeEventListener("keydown", handleKeydown);
      } catch (error) {
        console.error("Failed to initialize:", error);
        ToastNotification.error(
          "Błąd podczas wczytywania historii. Sprawdź konsolę po więcej szczegółów.",
        );
      } finally {
        // Additional delay before removing loading state
        await new Promise((resolve) => setTimeout(resolve, 200));
        isInitializing = false;
      }
    };

    init();
    return () => cleanup?.();
  });

  if (typeof window !== "undefined") {
    window.addEventListener("hashchange", updateActiveHistoryIndex);
    updateActiveHistoryIndex();
    setupCarouselObserver();
  }

  // Watch toastHistory changes to re-setup observer when history updates
  $: if (toastHistory.length > 1) {
    // Use setTimeout to ensure DOM is updated before setting up observer
    setTimeout(setupCarouselObserver, 0);
  }

  // Event handlers for buttons
  const handleCopyClick = () => copyToClipboard();
  const handleShareClick = () => shareToast();

  // Remove the history counter update
  $: {
    if (toastHistory) {
      // Don't update rollCount here anymore
    }
  }

  let isClearingHistory = false;

  async function handleClearHistory() {
    if (!isClearingHistory) {
      isClearingHistory = true;
      return;
    }

    try {
      await toastService.clearHistory();
      toastHistory = [];
      copyStates = {};
      shareStates = {};
      rollCount = 0; // Reset roll count
      showHistoryDrawer = false;
      currentToastStore.set(null); // Clear current toast
      ToastNotification.success("Historia została wyczyszczona");
    } catch (error) {
      console.error("Failed to clear history:", error);
      ToastNotification.error("Błąd podczas czyszczenia historii");
    } finally {
      isClearingHistory = false;
    }
  }
</script>

<svelte:head>
  <title>Toasty z Kiepskich - Generator</title>
</svelte:head>

<CenteredContainer>
  <NavBar />

  <ResponsiveContainer>
    <Header
      title={'Toasty z "Kiepskich"'}
      description="Wylosuj kultowe toasty z popularnego polskiego sitcomu"
    />

    <div class="mb-8 card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex justify-between items-start mb-4">
          <div class="flex flex-col gap-1">
            <div class="badge badge-outline badge-lg">
              {#if isInitializing}
                <div class="loading loading-spinner loading-xs"></div>
              {:else}
                Losowań: {rollCount}
              {/if}
            </div>
            <div class="text-xs text-base-content/60 flex items-center gap-1">
              <CalendarIcon class="h-4 w-4" />
              <span>
                Wylosowano: {currentToast?.rollTimestamp
                  ? formatDate(currentToast.rollTimestamp)
                  : "nigdy"}
              </span>
            </div>
          </div>
          <button
            class="btn btn-ghost btn-sm gap-2"
            on:click={() => (showHistoryDrawer = true)}
          >
            <ClockIcon class="h-5 w-5" />
            Historia
            <div class="badge badge-sm badge-primary">
              {#if isInitializing}
                <div class="loading loading-spinner loading-xs"></div>
              {:else}
                {historyCount}/{MAX_HISTORY_SIZE}
              {/if}
            </div>
            <kbd class="kbd kbd-sm hidden md:inline-flex text-white">⇧</kbd>
            <kbd class="kbd kbd-sm hidden md:inline-flex text-white">h</kbd>
          </button>
        </div>
        <div class="mb-4 min-h-[2.5rem]">
          {#if currentToast}
            {#if isTypewriterComplete}
              <div transition:fade={{ duration: 300 }}>
                <MissingMetadataInfo toast={currentToast} />
              </div>
            {/if}
          {/if}
        </div>
        <div class="card bg-base-100 border-2 border-base-200">
          <div class="card-body">
            <!-- Add action buttons in the top-right corner -->
            <div class="absolute top-4 right-4 flex gap-2">
              <button
                on:click={handleCopyClick}
                class="btn btn-circle btn-sm btn-ghost {isCopySuccess
                  ? 'text-success'
                  : 'text-base-content/70 hover:text-base-content'}"
                disabled={isRolling || !currentToast}
                aria-label="Kopiuj do schowka"
              >
                {#if isCopySuccess}
                  <CheckIcon class="w-4 h-4" />
                {:else}
                  <ClipboardIcon class="w-4 h-4" />
                {/if}
              </button>

              <div
                class="tooltip tooltip-left"
                data-tip={!canShareOnDevice
                  ? "Udostępnianie nie jest dostępne w tej przeglądarce"
                  : ""}
              >
                <button
                  on:click={handleShareClick}
                  class="btn btn-circle btn-sm btn-ghost {isShareSuccess
                    ? 'text-success'
                    : 'text-base-content/70 hover:text-base-content'}"
                  disabled={isRolling || !currentToast || !canShareOnDevice}
                  aria-label="Udostępnij"
                >
                  {#if isShareSuccess}
                    <CheckIcon class="w-4 h-4" />
                  {:else}
                    <ShareIcon class="w-4 h-4" />
                  {/if}
                </button>
              </div>
            </div>

            <!-- Navigation controls -->
            {#if toastHistory.length > 1}
              <!-- Desktop navigation -->
              <div class="hidden md:block">
                <!-- Left arrow -->
                <button
                  class="btn btn-circle btn-ghost absolute left-4 top-1/2 -translate-y-1/2 {activeHistoryIndex ===
                  0
                    ? 'btn-disabled opacity-50'
                    : 'hover:bg-base-200'}"
                  on:click={() => navigateHistory("left")}
                  disabled={activeHistoryIndex === 0 || isRolling}
                  aria-label="Previous toast"
                >
                  <ChevronLeftIcon
                    class="h-6 w-6 {activeHistoryIndex === 0
                      ? ''
                      : 'animate-bounce-x'}"
                  />
                </button>

                <!-- Position indicator -->
                <div class="text-center mb-6">
                  <div class="text-sm text-base-content/70">
                    {activeHistoryIndex + 1} z {toastHistory.length}
                  </div>
                  <div class="flex justify-center gap-1 mt-1">
                    {#each Array(toastHistory.length) as _, i}
                      <div
                        class="w-2 h-2 rounded-full transition-all duration-200 {i ===
                        activeHistoryIndex
                          ? 'bg-primary scale-125'
                          : 'bg-base-300'}"
                      />
                    {/each}
                  </div>
                </div>

                <!-- Right arrow -->
                <button
                  class="btn btn-circle btn-ghost absolute right-4 top-1/2 -translate-y-1/2 {activeHistoryIndex ===
                  toastHistory.length - 1
                    ? 'btn-disabled opacity-50'
                    : 'hover:bg-base-200'}"
                  on:click={() => navigateHistory("right")}
                  disabled={activeHistoryIndex === toastHistory.length - 1 ||
                    isRolling}
                  aria-label="Next toast"
                >
                  <ChevronRightIcon
                    class="h-6 w-6 {activeHistoryIndex ===
                    toastHistory.length - 1
                      ? ''
                      : 'animate-bounce-x'}"
                  />
                </button>
              </div>

              <!-- Mobile navigation arrows -->
              <div class="md:hidden">
                <!-- Left arrow -->
                <button
                  class="fixed left-2 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost {activeHistoryIndex ===
                  0
                    ? 'btn-disabled opacity-50'
                    : 'hover:bg-base-200'} shadow-lg bg-base-100"
                  on:click={() => navigateHistory("left")}
                  disabled={activeHistoryIndex === 0 || isRolling}
                  aria-label="Previous toast"
                >
                  <ChevronLeftIcon
                    class="h-6 w-6 {activeHistoryIndex === 0
                      ? ''
                      : 'animate-bounce-x'}"
                  />
                </button>

                <!-- Right arrow -->
                <button
                  class="fixed right-2 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost {activeHistoryIndex ===
                  toastHistory.length - 1
                    ? 'btn-disabled opacity-50'
                    : 'hover:bg-base-200'} shadow-lg bg-base-100"
                  on:click={() => navigateHistory("right")}
                  disabled={activeHistoryIndex === toastHistory.length - 1 ||
                    isRolling}
                  aria-label="Next toast"
                >
                  <ChevronRightIcon
                    class="h-6 w-6 {activeHistoryIndex ===
                    toastHistory.length - 1
                      ? ''
                      : 'animate-bounce-x'}"
                  />
                </button>
              </div>
            {/if}

            <!-- Add touch handlers to the main content -->
            <div
              on:touchstart={handleTouchStart}
              on:touchmove={handleTouchMove}
              on:touchend={handleTouchEnd}
            >
              <div class="flex gap-2 mb-4">
                <div
                  class="badge badge-neutral {!currentToast
                    ? 'badge-ghost opacity-50'
                    : ''}"
                >
                  <HashtagIcon class="h-4 w-4" />
                  <span class="hidden md:inline ml-1">
                    Odcinek: {currentToast?.episodeNumber ?? "???"}
                  </span>
                  <span class="md:hidden">
                    {currentToast?.episodeNumber ?? "???"}
                  </span>
                </div>
                <div
                  class="badge badge-neutral {!currentToast
                    ? 'badge-ghost opacity-50'
                    : ''}"
                >
                  <ClockIcon class="h-4 w-4" />
                  <span class="hidden md:inline ml-1">
                    Czas: {currentToast?.episodeTimestamp ?? "??:??"}
                  </span>
                  <span class="md:hidden">
                    {currentToast?.episodeTimestamp ?? "??:??"}
                  </span>
                </div>
              </div>
              <div class="flex-1">
                <p class="text-xl opacity-70">No to....</p>
                <p class="text-2xl font-medium min-h-16">
                  {#if currentToast}
                    {#if typewriterText === ""}
                      <div class="flex flex-col gap-3">
                        <div
                          class="h-8 bg-base-300 rounded animate-pulse mt-1"
                        ></div>
                      </div>
                    {:else}
                      {typewriterText}
                    {/if}
                  {:else}
                    <span class="opacity-50">Panie, na co pan czekasz...?</span>
                  {/if}
                </p>

                <div class="mt-4 {!currentToast ? 'opacity-50' : ''}">
                  <AudioWavePlayer
                    audioFile={currentToast?.audioFile ?? null}
                    disabled={!currentToast}
                    showText={true}
                  />
                </div>
              </div>
            </div>

            <!-- Desktop roll button - restore to original position -->
            <div class="hidden md:flex flex-col gap-2 mt-4">
              <AnimatedButton
                on:click={getRandomToast}
                disabled={isRolling || isInitializing}
                fullWidth={true}
              >
                {#if currentToast}
                  Losuj ponownie 🎲
                {:else}
                  No to jedziem! 🍻
                {/if}
                <kbd class="kbd kbd-sm text-white">r</kbd>
              </AnimatedButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ResponsiveContainer>
  <FeedbackSection />
  <Footer />

  <HistoryDrawer
    bind:showDrawer={showHistoryDrawer}
    {toastHistory}
    bind:copyStates
    bind:shareStates
    bind:canShareOnDevice
  />

  <!-- Mobile bottom navbar -->
  <div
    class="md:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 shadow-lg z-50"
  >
    <div class="container mx-auto px-4 py-4">
      <div class="flex flex-col items-center justify-between gap-4">
        <!-- Position indicator -->
        {#if toastHistory.length > 0}
          <div class="flex-1 text-center">
            <div class="text-sm font-medium text-base-content/70">
              {activeHistoryIndex + 1} z {toastHistory.length}
            </div>
            <div class="flex gap-1 mt-1 justify-center">
              {#each Array(toastHistory.length) as _, i}
                <div
                  class="w-1.5 h-1.5 rounded-full transition-all duration-200 {i ===
                  activeHistoryIndex
                    ? 'bg-primary scale-125'
                    : 'bg-base-300'}"
                />
              {/each}
            </div>
          </div>
        {/if}

        <!-- Mobile roll button -->
        <div class="w-full">
          <AnimatedButton
            on:click={getRandomToast}
            disabled={isRolling || isInitializing}
            fullWidth={true}
          >
            {#if currentToast}
              Losuj ponownie 🎲
            {:else}
              No to jedziem! 🍻
            {/if}
          </AnimatedButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Remove the floating desktop button since we restored it to the card -->
  <style>
    /* Add bounce animation for arrows */
    @keyframes bounce-x {
      0%,
      100% {
        transform: translateX(0);
      }
      50% {
        transform: translateX(25%);
      }
    }

    .animate-bounce-x {
      animation: bounce-x 1s infinite;
    }

    /* Adjust bottom padding since we removed buttons from navbar */
    :global(body) {
      padding-bottom: calc(env(safe-area-inset-bottom) + 8rem);
    }

    @media (min-width: 768px) {
      :global(body) {
        padding-bottom: calc(env(safe-area-inset-bottom) + 5rem);
      }
    }
  </style>

  <DonationModal bind:isOpen={showDonationPopup} />
</CenteredContainer>
