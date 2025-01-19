<script lang="ts">
  const imagePath = "/tiwi/images/help/crt-effects.webp";
</script>

<div class="prose">
  <p>
    Efekty CRT pozwalają na symulację wyglądu starego telewizora kineskopowego.
  </p>

  <ul>
    <li>
      <strong>Efekt CRT</strong> - dodaje charakterystyczne zniekształcenie obrazu
      typowe dla telewizorów CRT
    </li>
    <li>
      <strong>Poświata</strong> - tworzy delikatną poświatę wokół obrazu, typową
      dla kineskopów
    </li>
    <li>
      <strong>Przeplot</strong> - symuluje efekt przeplotu linii, charakterystyczny
      dla starych telewizorów
    </li>
  </ul>

  {#if imagePath}
    <figure class="mt-4">
      <img
        src={imagePath}
        alt="Przykład efektów CRT"
        class="rounded-lg w-full"
        loading="lazy"
      />
      <figcaption class="text-center text-sm text-base-content/70 mt-2">
        Przykład zastosowania efektów CRT
      </figcaption>
    </figure>
  {/if}
</div>
