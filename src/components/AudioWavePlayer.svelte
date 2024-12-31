<script lang="ts">
  export let audioFile: string | null;
  export let showText = true;
  export let disabled = false;
  let isPlaying = false;
  let audio: HTMLAudioElement;

  function togglePlayback() {
    if (!audioFile || disabled) return;

    if (!audio) {
      audio = new Audio(audioFile);
      audio.onended = () => {
        isPlaying = false;
      };
    }

    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      isPlaying = false;
    } else {
      audio.play();
      isPlaying = true;
    }
  }
</script>

{#if audioFile}
  <button
    class="btn btn-block {isPlaying ? 'btn-primary' : 'btn-secondary'} mt-4"
    on:click={togglePlayback}
    {disabled}
  >
    <div class="flex items-center justify-between w-full gap-4">
      <!-- Play/Pause Icon -->
      <div class="flex-none">
        {#if isPlaying}
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
              d="M6 18V6h4v12H6zm8-12h4v12h-4V6z"
            />
          </svg>
        {:else}
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
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        {/if}
      </div>

      <!-- Audio Wave Animation -->
      <div
        class="flex-1 flex items-center justify-center gap-1 h-6 overflow-hidden"
      >
        {#if isPlaying}
          {#each Array(12) as _, i}
            <div
              class="w-1 bg-current rounded-full transition-all duration-300"
              style="height: {Math.random() * 100}%; animation: wave {0.5 +
                Math.random() *
                  0.5}s ease-in-out infinite alternate; animation-delay: -{Math.random() *
                0.5}s"
            />
          {/each}
        {:else}
          {#each Array(12) as _}
            <div class="w-1 h-1 bg-current rounded-full opacity-50" />
          {/each}
        {/if}
      </div>

      <!-- Status Text -->
      {#if showText}
        <div class="flex-none text-sm">
          {isPlaying ? "Odtwarzam..." : "Odtwórz dźwięk"}
        </div>
      {/if}
    </div>
  </button>
{:else}
  <button class="btn btn-block btn-disabled mt-4">
    <div class="flex items-center justify-center gap-2">
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
          d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
        />
      </svg>
      {#if showText}
        <span class="text-sm">Dźwięk niedostępny</span>
      {/if}
    </div>
  </button>
{/if}

<style>
  @keyframes wave {
    from {
      height: 10%;
    }
    to {
      height: 100%;
    }
  }
</style>
