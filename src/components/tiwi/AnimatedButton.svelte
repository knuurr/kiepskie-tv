<script lang="ts">
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;
</script>

<button
  class="animated-button btn {fullWidth ? 'w-full' : ''} {loading
    ? 'loading'
    : ''} {disabled ? 'btn-disabled' : ''}"
  {disabled}
  on:click
>
  <div class="gradient-container" class:disabled>
    <div class="gradient"></div>
  </div>
  <div class="flex items-center gap-2">
    <slot />
  </div>
</button>

<style lang="postcss">
  .animated-button {
    @apply relative overflow-hidden;
    z-index: 0;
    border: none;
    outline: none;
    transition: all 0.3s;
  }

  .animated-button::before {
    content: "";
    @apply absolute inset-[3px] rounded-[inherit] bg-base-100;
    z-index: 2;
  }

  .gradient-container {
    @apply absolute inset-0 overflow-hidden opacity-100 transition-opacity duration-200;
    border-radius: inherit;
    z-index: 1;
  }

  .gradient-container.disabled {
    @apply opacity-30;
  }

  .gradient {
    @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
    width: 200%;
    aspect-ratio: 1;
    border-radius: 100%;
    background-image: linear-gradient(
      90deg,
      hsl(226, 81%, 64%),
      hsl(271, 81%, 64%),
      hsl(316, 81%, 64%),
      hsl(1, 81%, 64%),
      hsl(46, 81%, 64%),
      hsl(91, 81%, 64%),
      hsl(136, 81%, 64%),
      hsl(181, 81%, 64%)
    );
    animation: rotate 3s linear infinite;
    filter: blur(15px);
  }

  .animated-button > div:last-child {
    @apply relative z-10;
  }

  @keyframes rotate {
    0% {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    100% {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }
</style>
