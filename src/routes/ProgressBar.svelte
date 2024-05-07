<script lang="ts">
  export let progress = 0; // Initial progress (0-100)
  export let max = 100; // Maximum progress value (default: 100)
</script>

<style>
  .progress {
    height: 10px; /* Adjust height as needed */
    background-color: #ddd; /* Background color for unfilled part */
    border-radius: 5px; /* Border radius for the progress bar */
  }

  .progress-fill {
    height: 100%; /* Match container height */
    background-color: #007bff; /* Adjust fill color */
    transition: width 0.2s ease-in-out;
    border-radius: inherit; /* Inherit border radius from .progress */
  }

  .progress-text {
    line-height: 10px; /* Match container height for vertical centering */
    text-align: center;
    color: #fff; /* Text color for progress value */
  }
</style>

<div class="progress">
  <div class="progress-fill" style="width: { (progress / max) * 100 }%"></div>
  <span class="progress-text">{progress.toFixed(0)}</span>
</div>
