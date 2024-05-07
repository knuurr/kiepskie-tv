<script lang="ts">
  import { onMount } from 'svelte';

  export let src: string; // Prop to specify the image source
  let isLoading = false;
  let error = false;

  async function loadImage() {
    isLoading = true;
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to load image: ${src}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      src = url; // Update the src prop directly (no need for reactive assignment)
    } catch (err) {
      console.error("Error loading image:", err);
      error = true;
    } finally {
      isLoading = false;
    }
  }

  onMount(loadImage);
</script>

<div class="image-container">
  <img src={src} alt="Ferdas" />
</div>
<!-- <img src={src} alt="Image" class="responsive-image" on:error={() => (error = true)} /> -->

<style>
  .image-container {
    /* Set desired padding for the image */
    padding: 10px; /* Adjust padding as needed */
    position: relative; /* Required for aspect ratio hack */
    width: 80%;
    display: block;
  }

  .image-container img {
    width: 100%; /* Ensures image fills the container width */
    height: auto;  /* Maintains aspect ratio */
    position: absolute; /* Required for aspect ratio hack */
    top: 0;
    left: 0;
  }
</style>
