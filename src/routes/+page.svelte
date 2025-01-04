<script lang="ts">
  import NavBar from "../components/NavBar.svelte";
  import Footer from "../components/Footer.svelte";
  import CenteredContainer from "../components/CenteredContainer.svelte";
  import Header from "./Header.svelte";
  import AppCard from "../components/AppCard.svelte";

  const apps = [
    {
      title: "📺 Tiwi",
      description:
        'Skonwertuj dowolne "wideło" i wyświetl je na ekranie legendarnego "Okiła" a nstępnie zapisz lub podziel się z innymi',
      link: "/tiwi",
      // additionalInfo:
      //   "Podziel się wideo ze znajomymi na TikTok, Messenger, WhatsApp i inne, lub zapisz na urządzeniu",
      imageUrl: "/home/placeholder-tiwi.png",
    },
    {
      title: "🥃 Toasty",
      description:
        'Wylosuj jedne z najpopularniejszych toastów ze "Świata według Kiepskich"',
      link: "/toasty",
      // additionalInfo:
      //   "Z łatwością skopiuj swój ulubiony wylosowany toast do schowka",
      imageUrl: "/home/placeholder-toasty.png",
    },
    {
      title: "📊 Tabela",
      description:
        "Zobacz tabelę oddzinków Kiepskich, z zaawansowanym filtrowaniem wyników",
      link: "/tabela",
      // additionalInfo:
      //   "Użyj zaawansowanego filtrowania by precyzyjnie wyszukać odcinki",
      imageUrl: "/home/placeholder-tabela.png",
    },
    {
      title: "🎲 Generator",
      description: "Wylosuj odcinek Świata według Kiepskich do oglądania",
      link: "/generator",
      imageUrl: "/home/placeholder-generator.png",
    },
    {
      title: "🌍 Judup",
      description:
        'Oglądaj dowolny filmik z YouTube na ekranie legendarnego "Okiła"',
      link: "#",
      additionalInfo: "(coming soon)",
      disabled: true,
      imageUrl: "/home/placeholder-judup.png",
    },
  ];
</script>

<CenteredContainer>
  <NavBar />

  <!-- Hero Section -->
  <div class="hero min-h-[70vh] bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-3xl">
        <h1 class="text-5xl font-kiepscy mb-8">Kiepskie-TV</h1>
        <p class="text-xl mb-8">
          Odkryj świat Ferdka Kiepskiego w zupełnie nowy sposób! Kolekcja
          interaktywnych aplikacji inspirowanych kultowym serialem.
        </p>
        <a
          href="#apps"
          class="btn btn-circle btn-primary btn-lg animate-bounce group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2.5"
            stroke="currentColor"
            class="w-8 h-8 transition-transform group-hover:translate-y-1"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
            />
          </svg>
        </a>
      </div>
    </div>
  </div>

  <!-- Apps Section -->
  <div class="container mx-auto px-4 py-16" id="apps">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-kiepscy mb-4">Aplikacje</h2>
      <p class="text-lg opacity-90">Odkryj zabawę z "Kiepskich" na nowo</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each apps as app}
        <a
          href={app.disabled ? "#" : app.link}
          class="block card bg-base-200 shadow-xl transition-all duration-300 hover:shadow-2xl {app.disabled
            ? 'pointer-events-none'
            : 'hover:scale-[1.02]'}"
          aria-disabled={app.disabled}
          tabindex={app.disabled ? -1 : 0}
        >
          <figure class="px-4 pt-4">
            <img
              src={app.imageUrl}
              alt={app.title}
              class="rounded-xl h-48 w-full object-cover"
            />
          </figure>
          <div class="card-body">
            <h2 class="card-title font-kiepscy">{app.title}</h2>
            <p>{app.description}</p>
            {#if app.additionalInfo}
              <p class="text-sm opacity-75">{app.additionalInfo}</p>
            {/if}
            <div class="card-actions justify-end mt-4">
              <span
                class="btn btn-primary {app.disabled ? 'btn-disabled' : ''}"
              >
                Otwórz
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  </div>

  <!-- Features Section -->
  <div class="bg-base-200 py-16">
    <div class="container mx-auto px-4">
      <div class="stats shadow w-full">
        <div class="stat">
          <div class="stat-figure text-primary text-4xl">📺</div>
          <div class="stat-title">Aplikacje</div>
          <div class="stat-value">{apps.length}</div>
        </div>
        <div class="stat">
          <div class="stat-figure text-primary text-4xl">🎬</div>
          <div class="stat-title">Zabawa</div>
          <div class="stat-value">100%</div>
        </div>
        <div class="stat">
          <div class="stat-figure text-primary text-4xl">💻</div>
          <div class="stat-title">Darmowe</div>
          <div class="stat-value">Zawsze</div>
        </div>
      </div>
    </div>
  </div>

  <Footer />
</CenteredContainer>

<style>
  /* Prevent text selection when clicking the card and maintain proper link styling */
  .card {
    user-select: none;
    text-decoration: none;
    color: inherit;
  }
</style>
