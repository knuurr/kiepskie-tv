<script lang="ts">
  const imagePath = "/tiwi/images/help/video-scale.webp";
</script>

<div class="prose">
  <p>Skalowanie określa, jak duże będzie Twoje wideo w oknie telewizora.</p>

  <ul>
    <li>
      <strong>Brak skalowania</strong> - wideo wypełnia całe okno
    </li>
    <li>
      <strong>Delikatne skalowanie</strong> - tworzy delikatną ramkę wokół wideo
    </li>
    <li>
      <strong>Mocne skalowanie</strong> - tworzy wyraźną ramkę wokół wideo, podkreślając
      efekt starego telewizora
    </li>
  </ul>

  {#if imagePath}
    <figure class="mt-4">
      <img
        src={imagePath}
        alt="Przykład różnych skal wideo"
        class="rounded-lg w-full"
        loading="lazy"
      />
      <figcaption class="text-center text-sm text-base-content/70 mt-2">
        Przykład różnych opcji skalowania wideo
      </figcaption>
    </figure>
  {/if}
</div>
