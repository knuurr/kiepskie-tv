<script lang="ts">
  import cardBackground from "$lib/table/cardbg.jpeg";

  export let title: string;
  export let height: string = "h-24"; // Default height from EpisodeCard
  export let baseSize: number = 1; // Base size multiplier for text scaling

  // Function to calculate text size based on title length
  function calculateTextSize(title: string, baseSize: number): string {
    // Base size will be multiplied by these factors depending on length
    const length = title.length;
    if (length <= 15) return `${baseSize * 2.5}rem`;
    if (length <= 25) return `${baseSize * 2}rem`;
    if (length <= 35) return `${baseSize * 1.5}rem`;
    return `${baseSize}rem`;
  }

  $: titleSize = calculateTextSize(title, baseSize);
</script>

<div
  class="w-full {height} rounded-lg relative overflow-hidden"
  role="presentation"
>
  <img
    src={cardBackground}
    alt=""
    class="absolute inset-0 w-full h-full object-cover"
    aria-hidden="true"
  />
  <div class="absolute inset-0 flex items-center justify-center p-2">
    <p
      class="text-center font-bold break-words font-kiepscy"
      style="color: #228410; font-size: {titleSize}; line-height: 1.2; max-width: 100%; word-wrap: break-word;"
    >
      {title}
    </p>
  </div>
</div>
