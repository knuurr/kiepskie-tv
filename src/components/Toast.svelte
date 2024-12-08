<script lang="ts">
  import { toasts } from "$lib/stores/toastStore";
  import { fade, fly } from "svelte/transition";
</script>

<div class="toast toast-end z-50">
  {#each $toasts as toast (toast.id)}
    <div
      class="alert {toast.type === 'success'
        ? 'alert-success'
        : toast.type === 'error'
          ? 'alert-error'
          : toast.type === 'warning'
            ? 'alert-warning'
            : 'alert-info'}"
      role="alert"
      in:fly={{ x: 100 }}
      out:fade
    >
      <span class="truncate max-w-[300px]">{toast.message}</span>
    </div>
  {/each}
</div>

<style>
  .toast {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: calc(100% - 2rem);
  }
</style>
