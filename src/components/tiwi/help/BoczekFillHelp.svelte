<script lang="ts">
  const imagePath = "/tiwi/images/help/boczek-fill.webp";
</script>

<div class="prose">
  <p>
    Tryb dopasowania określa, w jaki sposób reakcja Boczka będzie wyświetlana na
    ekranie.
  </p>

  <ul>
    <li>
      <strong>Rozciągnij</strong> - wypełnia cały ekran, może zniekształcić obraz
    </li>
    <li>
      <strong>Zachowaj proporcje z rozmyciem</strong> - zachowuje proporcje obrazu,
      wypełniając boki rozmytym tłem
    </li>
    <li>
      <strong>Zachowaj proporcje z czarnym tłem</strong> - zachowuje proporcje obrazu
      z czarnymi paskami
    </li>
  </ul>

  {#if imagePath}
    <figure class="mt-4">
      <img
        src={imagePath}
        alt="Przykład trybów dopasowania Boczka"
        class="rounded-lg w-full"
        loading="lazy"
      />
      <figcaption class="text-center text-sm text-base-content/70 mt-2">
        Przykład różnych trybów dopasowania Boczka
      </figcaption>
    </figure>
  {/if}
</div>
