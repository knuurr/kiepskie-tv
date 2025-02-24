<script lang="ts">
  import "./app.css";
  import { SvelteToast } from "@zerodevx/svelte-toast";
  import { toastOptions } from "$lib/toast";

  import { APP_TITLE2 } from "./Constans.svelte"; // Import all from data.js
</script>

<svelte:head>
  <title>Dom | {APP_TITLE2}</title>
</svelte:head>

<SvelteToast options={toastOptions} />
<slot />

<style>
  :global(.toasts-container) {
    z-index: 9999;
  }
</style>
