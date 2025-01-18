<script lang="ts">
  import PauseIcon from "virtual:icons/heroicons/pause";
  import PlayCircleIcon from "virtual:icons/heroicons/play-circle";

  export let audioFile: string | null;
  let isPlaying = false;
  let audio: HTMLAudioElement;

  function togglePlayback() {
    if (!audioFile) return;

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

<button
  class="btn btn-circle btn-sm {audioFile
    ? isPlaying
      ? 'btn-primary'
      : 'btn-secondary'
    : 'btn-disabled'}"
  on:click={togglePlayback}
  disabled={!audioFile}
  title={audioFile ? "Odtwórz dźwięk" : "Dźwięk niedostępny"}
>
  {#if isPlaying}
    <PauseIcon class="h-4 w-4" />
  {:else}
    <PlayCircleIcon class="h-4 w-4" />
  {/if}
</button>
