<script lang="ts">
  import ChatBubbleLeftIcon from "virtual:icons/heroicons/chat-bubble-left";
  export let facebookGroupUrl = "https://www.facebook.com/groups/kiepscy";
</script>

<div class="bg-green-100 dark:bg-green-900 rounded-lg p-6 shadow-lg">
  <div class="flex items-center gap-4">
    <div class="bg-green-200 dark:bg-green-800 p-3 rounded-full">
      <ChatBubbleLeftIcon class="h-6 w-6 text-green-700 dark:text-green-300" />
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
