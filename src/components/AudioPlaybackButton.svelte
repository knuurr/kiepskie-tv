<script lang="ts">
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
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
      class="h-4 w-4"
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
</button>
