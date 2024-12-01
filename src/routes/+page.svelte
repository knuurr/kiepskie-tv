<script lang="ts">
  import NavBar from "../components/NavBar.svelte";
  import Footer from "../components/Footer.svelte";
  import CenteredContainer from "../components/CenteredContainer.svelte";
  import ResponsiveContainer from "../components/ResponsiveContainer.svelte";
  import Header from "./Header.svelte";
</script>

<CenteredContainer>
  <NavBar></NavBar>

  <ResponsiveContainer>
    <Header
      title={"Kiepskie-TV"}
      description={"Kolekcja różnych webowych aplikacji w ramach Kiepskie-TV"}
    ></Header>
    <div class="p-6 border-2 border-gray-300 rounded-lg text-center mt-4 mb-4">
      <div class="flex flex-col">
        <p class="text-2xl mb-2 font-bold">📺 Tiwi</p>
        <p class="text-base font-normal">
          Skonwertuj dowolne "wideło" i wyświetl je na ekranie legendarnego
          "Okiła". 100% offline!
        </p>
        <a
          href="/tiwi"
          class="btn btn-md btn-outline btn-block btn-primary mt-2 mb-2 btn-link"
          >Zobacz <svg
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
        </a>
        <p class="text-base font-normal mt-2">
          Podziel się wideo ze znajomymi na TikTok, Messenger, WhatsApp i inne,
          lub zapisz na urządzeniu
        </p>
      </div>
    </div>

    <div class="p-6 border-2 border-gray-300 rounded-lg text-center mt-4 mb-4">
      <div class="flex flex-col">
        <p class="text-2xl mb-2 font-bold">🥃 Toasty</p>
        <p class="text-base font-normal">
          Wylosuj jedne z najpopularniejszych toastów ze "Świata według
          Kiepskich"
        </p>
        <a
          href="/toasty"
          class="btn btn-md btn-outline btn-block btn-primary mt-2 mb-2 btn-link"
          >Zobacz <svg
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
          </svg></a
        >
        <p class="text-base font-normal mt-2">
          Z łatwością skopiuj swój ulubiony wylosowany toast do schowka
        </p>
      </div>
    </div>

    <div class="p-6 border-2 border-gray-300 rounded-lg text-center mt-4 mb-4">
      <div class="flex flex-col">
        <p class="text-2xl mb-2 font-bold">🌍 Judup</p>
        <p class="text-base font-normal">
          Oglądaj dowolny filmik z YouTube na ekranie legendarnego "Okiła"
        </p>
        <a
          href="#"
          class="btn btn-md btn-outline btn-block btn-primary mt-2 mb-2 btn-link btn-disabled"
          >Zobacz <svg
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
          </svg></a
        >
        <p class="text-base font-normal mt-2">(coming soon)</p>
      </div>
    </div>
  </ResponsiveContainer>
  <Footer></Footer>
</CenteredContainer>
