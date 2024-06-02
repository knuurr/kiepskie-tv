<script lang="ts">
  import {
    GH_BASE_URL,
    GH_ISSUE_URL,
    GH_PROJECT_URL,
    GH_REPO_URL,
  } from "./Constans.svelte"; // Import all from data.js
</script>

<footer class="footer footer-center p-10 bg-base-200 text-base-content rounded">
  <aside>
    <p class="font-bold f">Kiepskie TV (TiWi)</p>
    <p class="font-bold f">© Jakub Mikos 2024</p>
  </aside>
  <nav class="grid grid-flow-col gap-4">
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
    <p>
      Nazwa "Okił" nawiązuje do fikcyjnej marki telewizora w serialu "Świat
      Weług Kiepskich". Zbieżność nazw i nazwisk jest przypadkowa.
    </p>
    <p>
      Projekt nie jest w żaden sposób powiązany z serialem "Świat Według
      Kiepskich" autorstwa ATM GRUPA SPÓŁKA AKCYJNA ani Telewizja Polsat sp. z
      o.o.
    </p>
  </aside>
</footer>
