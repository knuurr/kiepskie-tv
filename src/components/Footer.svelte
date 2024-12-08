<script lang="ts">
  import {
    GH_BASE_URL,
    GH_ISSUE_URL,
    GH_PROJECT_URL,
    GH_REPO_URL,
    LI_URL,
  } from "../routes/Constans.svelte";
</script>

<footer class="footer p-4 bg-base-200 text-base-content">
  <div class="max-w-7xl mx-auto w-full">
    <!-- Main footer content -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-4">
      <!-- Brand section -->
      <div class="flex flex-col items-center md:items-start">
        <h2 class="font-bold text-lg">Kiepskie TV (TiWi)</h2>
        <p class="text-sm">© Jakub Mikos 2024</p>
      </div>

      <!-- Links section -->
      <div class="flex flex-col items-center md:items-start gap-2">
        <h3 class="font-semibold mb-2">Linki</h3>
        <a
          href={GH_BASE_URL + GH_PROJECT_URL}
          class="link link-hover text-yellow-200 text-sm"
          >Repozytorium projektu</a
        >
        <a
          href={GH_BASE_URL + GH_ISSUE_URL}
          class="link link-hover text-yellow-200 text-sm">Zgłoś błąd/ficzer</a
        >
        <a
          href={GH_BASE_URL + GH_REPO_URL}
          class="link link-hover text-yellow-200 text-sm">Inne projekty</a
        >
      </div>

      <!-- Contact section -->
      <div class="flex flex-col items-center md:items-start gap-2">
        <h3 class="font-semibold mb-2">Kontakt</h3>
        <a
          href={LI_URL}
          class="link link-hover text-orange-300 text-sm flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
            />
          </svg>
          Biznesowe sprawy / kontakt z autorem
        </a>
      </div>

      <!-- Legal section -->
      <div class="flex flex-col items-center md:items-start">
        <h3 class="font-semibold mb-2">Informacje prawne</h3>
        <p class="text-gray-500 text-sm">
          Nazwa "Okił" nawiązuje do fikcyjnej marki telewizora w serialu "Świat
          Według Kiepskich". Zbieżność nazw i nazwisk jest przypadkowa.
        </p>
        <p class="text-gray-500 text-sm mt-2">
          Projekt nie jest powiązany z serialem "Świat Według Kiepskich"
          autorstwa ATM GRUPA SPÓŁKA AKCYJNA ani Telewizja Polsat sp. z o.o.
        </p>
      </div>
    </div>
  </div>
</footer>
