<script lang="ts">
  import PauseIcon from "virtual:icons/heroicons/pause";
  import PlayCircleIcon from "virtual:icons/heroicons/play-circle";
  import SpeakerXMarkIcon from "virtual:icons/heroicons/speaker-x-mark";

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
          <PauseIcon class="h-6 w-6" />
        {:else}
          <PlayCircleIcon class="h-6 w-6" />
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
      <SpeakerXMarkIcon class="h-6 w-6" />
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
