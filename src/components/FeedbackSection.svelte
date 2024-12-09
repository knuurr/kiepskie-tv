<script lang="ts">
  export let facebookGroupUrl = "https://www.facebook.com/groups/kiepscy";
</script>

<div class="bg-green-100 dark:bg-green-900 rounded-lg p-6 shadow-lg">
  <div class="flex items-center gap-4">
    <div class="bg-green-200 dark:bg-green-800 p-3 rounded-full">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 text-green-700 dark:text-green-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
        />
      </svg>
    </div>
    <div>
      <h3 class="text-lg font-semibold text-green-800 dark:text-green-200">
        Pomóż ulepszyć projekt!
      </h3>
      <p class="text-green-700 dark:text-green-300 mt-1">
        Znalazłeś błąd lub masz pomysł na ulepszenie? Napisz do mnie na
        <a
          href={facebookGroupUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="link link-primary font-medium hover:underline"
        >
          "Pośredniawce"
        </a>
        lub wyślij wiadomość prywatną. Każda opinia się liczy 🍺!
      </p>
    </div>
  </div>
</div>
