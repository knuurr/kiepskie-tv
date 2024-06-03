<script lang="ts">
  import {
    GH_BASE_URL,
    GH_ISSUE_URL,
    GH_PROJECT_URL,
    GH_REPO_URL,
    LI_URL,
  } from "./Constans.svelte"; // Import all from data.js
</script>

<footer class="footer footer-center p-10 bg-base-200 text-base-content rounded">
  <aside>
    <p class="font-bold f">Kiepskie TV (TiWi)</p>
    <p class="font-bold f">© Jakub Mikos 2024</p>
  </aside>
  <aside>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="size-6"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
      />
    </svg>
    <a href={LI_URL} target="_blank" class="link link-hover text-orange-300">
      Biznesowe sprawy / kontakt z autorem</a
    >
  </aside>
  <nav class="grid grid-flow-col gap-3">
    <a
      href={GH_BASE_URL + GH_PROJECT_URL}
      class="link link-hover text-yellow-200">Repozytorium projektu</a
    >
    <a href={GH_BASE_URL + GH_ISSUE_URL} class="link link-hover text-yellow-200"
      >Zgłoś błąd/ficzer</a
    >
    <a href={GH_BASE_URL + GH_REPO_URL} class="link link-hover text-yellow-200"
      >Inne projekty</a
    >
  </nav>

  <aside>
    <p class="text-gray-500">
      Nazwa "Okił" nawiązuje do fikcyjnej marki telewizora w serialu "Świat
      Weług Kiepskich". Zbieżność nazw i nazwisk jest przypadkowa.
    </p>
    <p class="text-gray-500">
      Projekt nie jest w żaden sposób powiązany z serialem "Świat Według
      Kiepskich" autorstwa ATM GRUPA SPÓŁKA AKCYJNA ani Telewizja Polsat sp. z
      o.o.
    </p>
  </aside>
</footer>
