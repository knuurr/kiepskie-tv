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
        'Skonwertuj dowolne "wideło" i wyświetl je na ekranie legendarnego "Okiła". 100% offline!',
      link: "/tiwi",
      additionalInfo:
        "Podziel się wideo ze znajomymi na TikTok, Messenger, WhatsApp i inne, lub zapisz na urządzeniu",
      imageUrl: "/placeholder-tiwi.png",
    },
    {
      title: "🥃 Toasty",
      description:
        'Wylosuj jedne z najpopularniejszych toastów ze "Świata według Kiepskich"',
      link: "/toasty",
      additionalInfo:
        "Z łatwością skopiuj swój ulubiony wylosowany toast do schowka",
      imageUrl: "/placeholder-toasty.png",
    },
    {
      title: "📊 Tabela",
      description: "Zobacz tabelę oddzinków Kiepskich",
      link: "/tabela",
      additionalInfo:
        "Użyj zaawansowanego filtrowania by precyzyjnie wyszukać odcinki",
      imageUrl: "/placeholder-tabela.png",
    },
    {
      title: "🌍 Judup",
      description:
        'Oglądaj dowolny filmik z YouTube na ekranie legendarnego "Okiła"',
      link: "#",
      additionalInfo: "(coming soon)",
      disabled: true,
      imageUrl: "/placeholder-judup.png",
    },
  ];
</script>

<CenteredContainer>
  <NavBar />

  <div class="container mx-auto px-4">
    <Header
      title={"Kiepskie-TV"}
      description={"Kolekcja różnych webowych aplikacji w ramach Kiepskie-TV"}
    />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
      {#each apps as app}
        <AppCard {...app} />
      {/each}
    </div>
  </div>

  <Footer />
</CenteredContainer>
