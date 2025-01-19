<script lang="ts">
  const imagePath = "/tiwi/images/help/greenscreen-fill.webp";
</script>

<div class="prose">
  <p>
    Tryb dopasowania określa, jak Twoje wideo będzie wyświetlane w oknie
    telewizora.
  </p>

  <ul>
    <li>
      <strong>Zachowaj proporcje z czarnym tłem</strong> - zachowuje oryginalne proporcje
      wideo, dodając czarne paski
    </li>
    <li>
      <strong>Rozciągnij</strong> - wypełnia całe okno telewizora, może zniekształcić
      obraz
    </li>
    <li>
      <strong>Zachowaj proporcje z rozmyciem</strong> - zachowuje proporcje wideo,
      wypełniając pozostałą przestrzeń rozmytym tłem
    </li>
  </ul>

  {#if imagePath}
    <figure class="mt-4">
      <img
        src={imagePath}
        alt="Przykład trybów dopasowania do tła"
        class="rounded-lg w-full"
        loading="lazy"
      />
      <figcaption class="text-center text-sm text-base-content/70 mt-2">
        Przykład różnych trybów dopasowania do tła
      </figcaption>
    </figure>
  {/if}
</div>
