<!-- DonationModal.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { donationPopupStore } from "$lib/stores/donationPopup";
  import IconX from "~icons/heroicons/x-mark";
  import IconHeart from "~icons/heroicons/heart";
  import IconCup from "~icons/heroicons/beaker";

  const isDev = import.meta.env.DEV;
  export let isOpen = false;
  let canClose = false;

  function handleClose() {
    if (!canClose) return;
    isOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && isOpen && canClose) {
      if (isDev) console.debug("[DonationModal] ESC key pressed");
      handleClose();
    }
  }

  // Reset canClose when modal opens
  $: if (isOpen) {
    if (isDev)
      console.debug("[DonationModal] Modal opened, setting close delay");
    canClose = false;
    setTimeout(() => {
      canClose = true;
      if (isDev) console.debug("[DonationModal] Modal can now be closed");
    }, 1000);
  }

  onMount(() => {
    if (isDev) console.debug("[DonationModal] Adding keyboard listener");
    document.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    if (isDev) console.debug("[DonationModal] Removing keyboard listener");
    document.removeEventListener("keydown", handleKeydown);
  });

  // Donation URL - replace with your actual BuyMeACoffee link
  const DONATION_URL = "https://www.buymeacoffee.com/your-username";
</script>

<dialog class="modal" class:modal-open={isOpen}>
  <div class="modal-box relative max-w-md">
    <!-- Close button -->
    <button
      class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
      on:click={handleClose}
      disabled={!canClose}
      class:opacity-50={!canClose}
    >
      <IconX class="w-5 h-5" />
    </button>

    <!-- Content -->
    <div class="flex flex-col items-center gap-4 py-4">
      <div class="flex items-center gap-2">
        <IconCup class="w-8 h-8 text-amber-500" />
        <IconHeart class="w-6 h-6 text-red-500 animate-pulse" />
      </div>

      <h3 class="font-bold text-lg text-center">Podoba Ci się Kiepscy TV?</h3>

      <p class="text-center">
        Jeśli podoba Ci się ten projekt, rozważ wsparcie jego rozwoju poprzez
        symboliczną kawę! Nawet mała kwota pomaga utrzymać serwery i motywuje do
        dalszego rozwoju.
      </p>

      <div class="flex gap-4 mt-2">
        <a
          href={DONATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary"
        >
          Postaw kawę ☕
        </a>
        <button
          class="btn btn-ghost"
          on:click={handleClose}
          disabled={!canClose}
          class:opacity-50={!canClose}
        >
          {#if canClose}
            Może później
          {:else}
            Proszę czekać...
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Backdrop -->
  <div
    class="modal-backdrop"
    on:click={handleClose}
    class:pointer-events-none={!canClose}
  ></div>
</dialog>

<style>
  /* Optional: Add custom animations */
  .modal-box {
    animation: modal-pop 0.2s ease-out;
  }

  @keyframes modal-pop {
    0% {
      opacity: 0;
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
