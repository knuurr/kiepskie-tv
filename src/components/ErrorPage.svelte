<script lang="ts">
  export let status = 404;
  export let message = "Nie znaleziono strony";

  const defaultMessages: Record<number, string> = {
    404: "Nie znaleziono strony",
    500: "Błąd serwera",
    403: "Dostęp zabroniony",
    401: "Brak autoryzacji",
  };

  let countdown = 5;
  let intervalId: ReturnType<typeof setInterval>;

  $: displayMessage = message || defaultMessages[status] || "Wystąpił błąd";

  const startCountdown = () => {
    intervalId = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(intervalId);
        window.location.href = "/";
      }
    }, 1000);
  };

  import { onMount, onDestroy } from "svelte";

  onMount(() => {
    startCountdown();
  });

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
  });
</script>

<div class="min-h-screen flex items-center justify-center">
  <div class="text-center">
    <img src="/images/error.jpg" alt="Błąd" class="w-48 mx-auto mb-8" />
    <h1 class="text-9xl font-bold text-primary">{status}</h1>
    <p class="text-2xl mt-4 mb-2">{displayMessage}</p>
    <p class="text-lg mb-8">
      Przekierowanie na stronę główną za {countdown} sekund
    </p>
    <a href="/" class="btn btn-primary">Wróć do strony głównej</a>
  </div>
</div>
