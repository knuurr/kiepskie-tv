<script lang="ts">
  import NavBar from "../components/NavBar.svelte";
  import Footer from "../components/Footer.svelte";
  import CenteredContainer from "../components/CenteredContainer.svelte";

  // Import Heroicons
  import ArrowDownIcon from "virtual:icons/heroicons/arrow-down";
  import ChevronDoubleRightIcon from "virtual:icons/heroicons/chevron-double-right";
  // Import icons for apps
  import TvIcon from "virtual:icons/heroicons/tv";
  import FunnelIcon from "virtual:icons/heroicons/funnel";
  import TableCellsIcon from "virtual:icons/heroicons/table-cells";
  import ArrowPathIcon from "virtual:icons/heroicons/arrow-path";
  import VideoCameraIcon from "virtual:icons/heroicons/video-camera";

  const apps = [
    {
      title: "📺 Tiwi",
      description:
        'Skonwertuj dowolne "wideło" i wyświetl je na ekranie legendarnego "Okiła" a nstępnie zapisz lub podziel się z innymi',
      link: "/tiwi",
      // additionalInfo:
      //   "Podziel się wideo ze znajomymi na TikTok, Messenger, WhatsApp i inne, lub zapisz na urządzeniu",
      imageUrl: "/home/placeholder-tiwi.png",
      icon: TvIcon,
    },
    {
      title: "🥃 Toasty",
      description:
        'Wylosuj jedne z najpopularniejszych toastów ze "Świata według Kiepskich"',
      link: "/toasty",
      // additionalInfo:
      //   "Z łatwością skopiuj swój ulubiony wylosowany toast do schowka",
      imageUrl: "/home/placeholder-toasty.png",
      icon: FunnelIcon,
    },
    {
      title: "📊 Tabela",
      description:
        "Zobacz tabelę oddzinków Kiepskich, z zaawansowanym filtrowaniem wyników",
      link: "/tabela",
      // additionalInfo:
      //   "Użyj zaawansowanego filtrowania by precyzyjnie wyszukać odcinki",
      imageUrl: "/home/placeholder-tabela.png",
      icon: TableCellsIcon,
    },
    {
      title: "🎲 Generator",
      description: "Wylosuj odcinek Świata według Kiepskich do oglądania",
      link: "/generator",
      imageUrl: "/home/placeholder-generator.png",
      icon: ArrowPathIcon,
    },
    {
      title: "🌍 Judup",
      description:
        'Oglądaj dowolny filmik z YouTube na ekranie legendarnego "Okiła"',
      link: "#",
      additionalInfo: "(coming soon)",
      disabled: true,
      imageUrl: "/home/placeholder-judup.png",
      icon: VideoCameraIcon,
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
          <ArrowDownIcon
            class="w-8 h-8 transition-transform group-hover:translate-y-1"
          />
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
          class="block card bg-base-200 shadow-xl transition-all duration-300 overflow-hidden {app.disabled
            ? 'pointer-events-none'
            : 'hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(var(--p),0.5)] hover:shadow-primary/40'}"
          aria-disabled={app.disabled}
          tabindex={app.disabled ? -1 : 0}
        >
          <div class="relative h-48 flex">
            <!-- Left side with image and gradient -->
            <div class="w-1/2 relative">
              <img
                src={app.imageUrl}
                alt={app.title}
                class="h-full w-full object-cover"
              />
              <div
                class="absolute inset-0 bg-gradient-to-r from-transparent to-base-200"
              />
            </div>

            <!-- Right side with centered large icon -->
            <div class="w-1/2 flex items-center justify-center bg-base-200">
              <svelte:component
                this={app.icon}
                class="w-24 h-24 opacity-80 text-primary"
              />
            </div>
          </div>
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
                <ChevronDoubleRightIcon class="size-5" />
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
