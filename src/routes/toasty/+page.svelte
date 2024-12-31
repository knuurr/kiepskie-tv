<script lang="ts">
  import { onMount } from "svelte";
  import type { Toast } from "$lib/types/Toast";

  import CenteredContainer from "../../components/CenteredContainer.svelte";
  import Footer from "../../components/Footer.svelte";
  import NavBar from "../../components/NavBar.svelte";
  import ResponsiveContainer from "../../components/ResponsiveContainer.svelte";
  import Header from "../Header.svelte";
  import FeedbackSection from "../../components/FeedbackSection.svelte";
  import AnimatedButton from "../../components/tiwi/AnimatedButton.svelte";
  import AudioWavePlayer from "../../components/AudioWavePlayer.svelte";
  import MissingMetadataInfo from "../../components/MissingMetadataInfo.svelte";

  let currentToast: Toast | null = null;
  let previousToast: Toast | null = null;
  let isRolling: boolean = false;
  let isSuccess: boolean = false;
  let typewriterText: string = "";
  let typewriterInterval: ReturnType<typeof setInterval>;
  let activeHistoryIndex: number = 0;

  let rollCount: number = 0;
  let toastHistory: { toast: Toast; episodeTimestamp: number }[] = [];
  let copyStates: { [key: number]: boolean } = {};
  let shareStates: { [key: number]: boolean } = {};

  let toasts: Toast[] = [];
  let isLoading = true;
  let observer: IntersectionObserver;

  let isShareSuccess = false;
  let canShareOnDevice = false;

  // Check if sharing is available on mount
  function checkSharingCapability() {
    if (typeof navigator === "undefined") return;

    canShareOnDevice = "share" in navigator;
    console.log("Share API available:", canShareOnDevice);
  }

  // Keyboard shortcuts handler
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
      event.preventDefault(); // Prevent default browser behavior
      copyToClipboard();
    } else if (event.shiftKey && key === "s" && currentToast && !isRolling) {
      event.preventDefault(); // Prevent default browser behavior
      shareToast();
    } else if (key === "r" && !isRolling) {
      event.preventDefault(); // Prevent default browser behavior
      getRandomToast();
    } else if (toastHistory.length > 1) {
      // Handle history navigation
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateHistory("left");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateHistory("right");
      }
    }
  }

  // History navigation function
  function navigateHistory(direction: "left" | "right") {
    const historyLength = toastHistory.slice(1).length;
    if (historyLength <= 1) return; // No navigation needed for single item

    let newIndex = activeHistoryIndex;

    if (direction === "left" && activeHistoryIndex > 0) {
      newIndex = activeHistoryIndex - 1;
    } else if (
      direction === "right" &&
      activeHistoryIndex < historyLength - 1
    ) {
      newIndex = activeHistoryIndex + 1;
    }

    // Only navigate if index changed
    if (newIndex !== activeHistoryIndex) {
      window.location.hash = `#toast-${newIndex}`;
      activeHistoryIndex = newIndex;
    }
  }

  // Typewriter effect implementation
  function startTypewriter(text: string) {
    let index = 0;
    clearInterval(typewriterInterval);
    typewriterText = "";

    typewriterInterval = setInterval(() => {
      if (index < text.length) {
        typewriterText += text[index];
        index++;
      } else {
        clearInterval(typewriterInterval);
        isRolling = false;
      }
    }, 50);
  }

  function copyToClipboard() {
    if (!currentToast) return;

    navigator.clipboard
      .writeText(currentToast.text)
      .then(() => {
        isSuccess = true;
        setTimeout(() => {
          isSuccess = false;
        }, 3000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }

  function copyHistoryToast(episodeTimestamp: number) {
    const entry = toastHistory.find(
      (t) => t.episodeTimestamp === episodeTimestamp,
    );
    if (!entry) return;

    navigator.clipboard
      .writeText(entry.toast.text)
      .then(() => {
        copyStates[episodeTimestamp] = true;
        setTimeout(() => {
          copyStates[episodeTimestamp] = false;
        }, 3000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }

  function getRandomToast() {
    isRolling = true;
    let newToast: Toast;

    do {
      const randomIndex = Math.floor(Math.random() * toasts.length);
      newToast = toasts[randomIndex];
    } while (toasts.length > 1 && newToast === currentToast);

    previousToast = currentToast;
    currentToast = newToast;

    rollCount++;
    toastHistory = [
      { toast: newToast, episodeTimestamp: Date.now() },
      ...toastHistory.slice(0, 3),
    ];

    startTypewriter(newToast.text);
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
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const match = hash.match(/^#toast-(\d+)$/);
      if (match) {
        activeHistoryIndex = parseInt(match[1]);
      }
    }
  }

  // Add share function
  async function shareToast() {
    if (!currentToast) return;

    const shareData = {
      title: "Toast z Kiepskich",
      text: currentToast.text,
      url: window.location.href,
    };

    try {
      // First check if we can share this data
      if (!navigator.canShare(shareData)) {
        console.log("Content cannot be shared:", shareData);
        return;
      }

      console.log("Attempting to share:", shareData);
      await navigator.share(shareData);
      console.log("Share successful");
      isShareSuccess = true;
      setTimeout(() => {
        isShareSuccess = false;
      }, 3000);
    } catch (err: unknown) {
      console.error("Error sharing:", err);
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Share was aborted by user");
      }
    }
  }

  // Add share history toast function
  async function shareHistoryToast(entry: {
    toast: Toast;
    episodeTimestamp: number;
  }) {
    const shareData = {
      title: "Toast z Kiepskich",
      text: entry.toast.text,
      url: `${window.location.href}#toast-${toastHistory.slice(1).findIndex((t) => t.episodeTimestamp === entry.episodeTimestamp)}`,
    };

    try {
      // First check if we can share this data
      if (!navigator.canShare(shareData)) {
        console.log("History content cannot be shared:", shareData);
        return;
      }

      console.log("Attempting to share history toast:", shareData);
      await navigator.share(shareData);
      console.log("Share successful");
      shareStates[entry.episodeTimestamp] = true;
      setTimeout(() => {
        shareStates[entry.episodeTimestamp] = false;
      }, 3000);
    } catch (err: unknown) {
      console.error("Error sharing:", err);
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Share was aborted by user");
      }
    }
  }

  onMount(async () => {
    checkSharingCapability();
    try {
      const response = await fetch("/toasts/toasts.json");
      if (!response.ok) throw new Error("Failed to load toasts data");
      toasts = await response.json();
    } catch (error) {
      console.error("Error loading toasts:", error);
      toasts = [];
    } finally {
      isLoading = false;
    }

    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", updateActiveHistoryIndex);
      updateActiveHistoryIndex();
      setupCarouselObserver();
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      clearInterval(typewriterInterval);
      window.removeEventListener("keydown", handleKeydown);
      if (typeof window !== "undefined") {
        window.removeEventListener("hashchange", updateActiveHistoryIndex);
        observer?.disconnect();
      }
    };
  });

  // Watch toastHistory changes to re-setup observer when history updates
  $: if (toastHistory.length > 1) {
    // Use setTimeout to ensure DOM is updated before setting up observer
    setTimeout(setupCarouselObserver, 0);
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
        <div class="flex justify-between items-center mb-4">
          <div class="badge badge-outline badge-lg">Losowań: {rollCount}</div>
        </div>
        {#if currentToast}
          <MissingMetadataInfo toast={currentToast} />
        {/if}
        <div class="card bg-base-100 border-2 border-base-200">
          <div class="card-body">
            <div class="flex gap-2 mb-4">
              <div
                class="badge badge-neutral {!currentToast
                  ? 'badge-ghost opacity-50'
                  : ''}"
              >
                Odcinek: {currentToast?.episodeNumber ?? "???"}
              </div>
              <div
                class="badge badge-neutral {!currentToast
                  ? 'badge-ghost opacity-50'
                  : ''}"
              >
                Czas: {currentToast?.episodeTimestamp ?? "??:??"}
              </div>
            </div>
            <div class="flex-1">
              <p class="text-xl opacity-70">No to....</p>
              <p class="text-2xl font-medium min-h-16">
                {#if currentToast}
                  {typewriterText}
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
        </div>

        <div class="flex flex-col gap-2 mt-4">
          <AnimatedButton
            on:click={getRandomToast}
            disabled={isRolling || isLoading}
            loading={isRolling || isLoading}
            fullWidth={true}
          >
            <span class="flex items-center gap-2">
              {#if isLoading}
                Ładowanie toastów...
              {:else}
                No to jedziem! 🍻
                <kbd class="kbd kbd-sm hidden md:inline-flex text-white">r</kbd>
              {/if}
            </span>
          </AnimatedButton>
          <div class="grid grid-cols-2 gap-2">
            <button
              on:click={copyToClipboard}
              class="btn btn-outline {isSuccess ? 'btn-success' : 'btn-info'}"
              disabled={isRolling || !currentToast}
              aria-label="Kopiuj do schowka"
            >
              {#if isSuccess}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-5 h-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-5 h-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                  />
                </svg>
              {/if}
              <span class="hidden">Kopiuj do schowka</span>
              <div class="hidden md:flex items-center gap-1">
                <kbd class="kbd kbd-sm">shift</kbd>
                <span>+</span>
                <kbd class="kbd kbd-sm">c</kbd>
              </div>
            </button>

            <!-- Share button -->
            <div
              class="tooltip tooltip-bottom"
              data-tip={!canShareOnDevice
                ? "Udostępnianie nie jest dostępne w tej przeglądarce"
                : ""}
            >
              <button
                on:click={shareToast}
                class="btn btn-outline w-full {isShareSuccess
                  ? 'btn-success'
                  : 'btn-accent'}"
                disabled={isRolling || !currentToast || !canShareOnDevice}
                aria-label="Udostępnij"
              >
                {#if isShareSuccess}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                {:else}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                    />
                  </svg>
                {/if}
                <span class="hidden">Udostępnij</span>
                <div class="hidden md:flex items-center gap-1">
                  <kbd class="kbd kbd-sm">shift</kbd>
                  <span>+</span>
                  <kbd class="kbd kbd-sm">s</kbd>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- History Section -->
        <div class="divider mt-6">Historia</div>

        {#if toastHistory.length > 1}
          <div class="w-full">
            <div class="carousel w-full">
              {#each toastHistory.slice(1) as entry, i (entry.episodeTimestamp)}
                <div id="toast-{i}" class="carousel-item relative w-full">
                  <div class="card bg-base-200 w-full">
                    <!-- Navigation arrows -->
                    <div class="absolute inset-y-0 left-0 flex items-center">
                      {#if i > 0}
                        <div class="hidden md:flex items-center gap-2 pl-2">
                          <kbd class="kbd kbd-sm">←</kbd>
                        </div>
                        <button
                          class="md:hidden btn btn-circle btn-sm btn-ghost opacity-50"
                          on:click={() => navigateHistory("left")}
                          aria-label="Previous toast"
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
                              d="M15.75 19.5 8.25 12l7.5-7.5"
                            />
                          </svg>
                        </button>
                      {/if}
                    </div>
                    <div class="absolute inset-y-0 right-0 flex items-center">
                      {#if i < toastHistory.slice(1).length - 1}
                        <div class="hidden md:flex items-center gap-2 pr-2">
                          <kbd class="kbd kbd-sm">→</kbd>
                        </div>
                        <button
                          class="md:hidden btn btn-circle btn-sm btn-ghost opacity-50"
                          on:click={() => navigateHistory("right")}
                          aria-label="Next toast"
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
                              d="m8.25 4.5 7.5 7.5-7.5 7.5"
                            />
                          </svg>
                        </button>
                      {/if}
                    </div>
                    <div class="card-body p-4">
                      <div class="flex flex-col h-full">
                        <div class="flex flex-row justify-between">
                          <div class="badge badge-sm mb-2 opacity-60">
                            #{rollCount - i - 1}
                          </div>
                          <div class="badge badge-sm">
                            {entry.toast.episodeNumber ?? "???"}
                          </div>
                          <div class="badge badge-sm">
                            {entry.toast.episodeTimestamp ?? "??:??"}
                          </div>
                        </div>

                        <p class="text-lg flex-1">{entry.toast.text}</p>

                        <div class="flex flex-col gap-2">
                          <AudioWavePlayer
                            audioFile={entry.toast.audioFile}
                            showText={false}
                          />

                          <div class="grid grid-cols-2 gap-2">
                            <button
                              on:click={() =>
                                copyHistoryToast(entry.episodeTimestamp)}
                              class="btn btn-sm {copyStates[
                                entry.episodeTimestamp
                              ]
                                ? 'btn-success'
                                : 'btn-ghost'}"
                              aria-label="Kopiuj do schowka"
                            >
                              {#if copyStates[entry.episodeTimestamp]}
                                <span class="flex items-center gap-1">
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
                                      d="m4.5 12.75 6 6 9-13.5"
                                    />
                                  </svg>
                                </span>
                              {:else}
                                <span class="flex items-center gap-1">
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
                                      d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                                    />
                                  </svg>
                                </span>
                              {/if}
                            </button>

                            <div
                              class="tooltip tooltip-bottom"
                              data-tip={!canShareOnDevice
                                ? "Udostępnianie nie jest dostępne w tej przeglądarce"
                                : ""}
                            >
                              <button
                                on:click={() => shareHistoryToast(entry)}
                                class="btn btn-sm w-full {shareStates[
                                  entry.episodeTimestamp
                                ]
                                  ? 'btn-success'
                                  : 'btn-ghost'}"
                                disabled={!canShareOnDevice}
                                aria-label="Udostępnij"
                              >
                                {#if shareStates[entry.episodeTimestamp]}
                                  <span class="flex items-center gap-1">
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
                                        d="m4.5 12.75 6 6 9-13.5"
                                      />
                                    </svg>
                                  </span>
                                {:else}
                                  <span class="flex items-center gap-1">
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
                                        d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                                      />
                                    </svg>
                                  </span>
                                {/if}
                                <span class="hidden">Udostępnij</span>
                                <div class="hidden md:flex items-center gap-1">
                                  <kbd class="kbd kbd-sm">shift</kbd>
                                  <span>+</span>
                                  <kbd class="kbd kbd-sm">s</kbd>
                                </div>
                              </button>
                            </div>
                          </div>

                          <MissingMetadataInfo
                            toast={entry.toast}
                            compact={true}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>

            <!-- Navigation dots -->
            <div class="flex justify-center w-full py-2 gap-2">
              {#each Array(3) as _, i}
                {#if i < toastHistory.slice(1).length}
                  <a
                    href="#toast-{i}"
                    class="btn btn-xs transition-all duration-300 ease-in-out"
                    class:btn-circle={i !== activeHistoryIndex}
                    class:btn-primary={i === activeHistoryIndex}
                    class:active-dot={i === activeHistoryIndex}
                    aria-label="Navigate to toast {i + 1}"
                  >
                    {i + 1}
                  </a>
                {:else}
                  <button
                    class="btn btn-xs btn-circle btn-disabled opacity-50 transition-all duration-300"
                    disabled
                    aria-label="History slot {i + 1} not yet available"
                  >
                    {i + 1}
                  </button>
                {/if}
              {/each}
            </div>

            <style lang="postcss">
              .active-dot {
                @apply min-w-[3rem] scale-110;
                border-radius: 1rem;
                transform-origin: center;
                animation: inflate 0.3s ease-out;
              }

              @keyframes inflate {
                0% {
                  transform: scale(0.9);
                }
                50% {
                  transform: scale(1.15);
                }
                100% {
                  transform: scale(1.1);
                }
              }
            </style>

            <!-- Swipe indicator for mobile -->
            <div
              class="flex items-center justify-center gap-1 text-sm opacity-50 md:hidden"
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
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
              <span>Przewiń w lewo/prawo</span>
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
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
          </div>
        {:else}
          <div class="card bg-base-200 shadow-lg p-4 text-center">
            <div class="card-body">
              <h2 class="text-lg font-semibold">Tutaj będzie Twoja historia</h2>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </ResponsiveContainer>
  <FeedbackSection />
  <Footer />
</CenteredContainer>
