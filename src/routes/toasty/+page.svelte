<script lang="ts">
  import { onMount } from "svelte";
  import { TOASTS_PATH, loadAndParseTxtFile, TOASTS } from "../../utils/toasts";

  import CenteredContainer from "../../components/CenteredContainer.svelte";
  import Footer from "../../components/Footer.svelte";
  import NavBar from "../../components/NavBar.svelte";
  import ResponsiveContainer from "../../components/ResponsiveContainer.svelte";
  import Header from "../Header.svelte";
  import FeedbackSection from "../../components/FeedbackSection.svelte";
  import AnimatedButton from "../../components/tiwi/AnimatedButton.svelte";

  let currentToast: string = "";
  let previousToast: string = "";
  let isRolling: boolean = false;
  let isSuccess: boolean = false;
  let typewriterText: string = "";
  let typewriterInterval: ReturnType<typeof setInterval>;

  let rollCount: number = 0;
  let toastHistory: { text: string; timestamp: number }[] = [];
  let copyStates: { [key: number]: boolean } = {};

  let toasts: string[] = [];

  // Keyboard shortcuts handler
  function handleKeydown(event: KeyboardEvent) {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return; // Ignore if user is typing in an input
    }

    if (event.key === "c" && currentToast && !isRolling) {
      copyToClipboard();
    } else if (event.key === "r" && !isRolling) {
      getRandomToast();
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
    navigator.clipboard
      .writeText(currentToast)
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

  function copyHistoryToast(timestamp: number) {
    const toast = toastHistory.find((t) => t.timestamp === timestamp);
    if (!toast) return;

    navigator.clipboard
      .writeText(toast.text)
      .then(() => {
        copyStates[timestamp] = true;
        setTimeout(() => {
          copyStates[timestamp] = false;
        }, 3000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }

  function getRandomToast() {
    isRolling = true;
    let newToast: string;

    do {
      const randomIndex = Math.floor(Math.random() * toasts.length);
      newToast = toasts[randomIndex];
    } while (toasts.length > 1 && newToast === currentToast);

    previousToast = currentToast;
    currentToast = newToast;

    rollCount++;
    toastHistory = [
      { text: newToast, timestamp: Date.now() },
      ...toastHistory.slice(0, 3),
    ];

    startTypewriter(newToast);
  }

  onMount(() => {
    loadAndParseTxtFile(TOASTS_PATH)
      .then((parsed_content: string[]) => {
        toasts = parsed_content;
      })
      .catch((error) => {
        console.error("Error:", error);
        toasts = TOASTS;
      });

    window.addEventListener("keydown", handleKeydown);
    return () => {
      clearInterval(typewriterInterval);
      window.removeEventListener("keydown", handleKeydown);
    };
  });
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

        <div class="card bg-base-100 border-2 border-base-200">
          <div class="card-body">
            {#if currentToast !== ""}
              <p class="text-xl opacity-70">No to....</p>
              <p class="text-2xl font-medium min-h-16">{typewriterText}</p>
            {:else}
              <p class="text-xl opacity-50">Panie, na co pan czekasz...?</p>
            {/if}
          </div>
        </div>

        <div class="flex flex-col gap-2 mt-4">
          {#if currentToast !== ""}
            <button
              on:click={copyToClipboard}
              class="btn btn-block {isSuccess ? 'btn-success' : 'btn-info'}"
              disabled={isRolling}
            >
              {#if isSuccess}
                <span class="flex items-center gap-2">
                  Skopiowano!
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
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </span>
              {:else}
                <span class="flex items-center gap-2">
                  Kopiuj do schowka
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
                  <kbd class="kbd kbd-sm hidden md:inline-flex">c</kbd>
                </span>
              {/if}
            </button>
          {/if}

          <AnimatedButton
            class="btn btn-warning btn-block"
            on:click={getRandomToast}
            disabled={isRolling}
          >
            {#if isRolling}
              <span class="loading loading-spinner loading-md"></span>
            {:else}
              <span class="flex items-center gap-2">
                No to jedziem! 🍻
                <kbd class="kbd kbd-sm hidden md:inline-flex text-white">r</kbd>
              </span>
            {/if}
          </AnimatedButton>
        </div>

        <!-- History Section -->
        <div class="divider mt-6">Historia</div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {#if toastHistory.length > 1}
            {#each toastHistory.slice(1) as toast, i (toast.timestamp)}
              <div class="card bg-base-200 h-full">
                <div class="card-body p-4">
                  <div class="flex flex-col h-full">
                    <div class="badge badge-sm mb-2 opacity-60">
                      #{rollCount - i - 1}
                    </div>
                    <p class="text-lg flex-1">{toast.text}</p>
                    <div class="flex justify-end mt-3">
                      <button
                        on:click={() => copyHistoryToast(toast.timestamp)}
                        class="btn btn-sm {copyStates[toast.timestamp]
                          ? 'btn-success'
                          : 'btn-ghost'}"
                      >
                        {#if copyStates[toast.timestamp]}
                          <span class="flex items-center gap-1">
                            Skopiowano
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
                            Kopiuj
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
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          {:else}
            {#each Array(2) as _, i}
              <div class="card bg-base-200 h-full opacity-50">
                <div class="card-body p-4">
                  <div class="flex flex-col h-full">
                    <div
                      class="badge badge-sm mb-2 opacity-60 skeleton w-8"
                    ></div>
                    <div class="flex-1">
                      <div class="skeleton h-4 w-3/4 mb-2"></div>
                      <div class="skeleton h-4 w-1/2"></div>
                    </div>
                    <div class="flex justify-end mt-3">
                      <div class="skeleton w-20 h-8 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
            <div
              class="card bg-base-200 h-full flex items-center justify-center p-4 text-center opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-12 h-12 mb-2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                />
              </svg>
              <p class="text-sm">Tutaj pojawią się poprzednie toasty</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </ResponsiveContainer>
  <FeedbackSection />
  <Footer />
</CenteredContainer>
