<script lang="ts">
  import {
    GH_BASE_URL,
    GH_ISSUE_URL,
    GH_PROJECT_URL,
    GH_REPO_URL,
    LI_URL,
  } from "../routes/Constans.svelte";
  import BriefcaseIcon from "virtual:icons/heroicons/briefcase";

  // Build information
  const isDev = import.meta.env.DEV;
  const buildTime = import.meta.env.VITE_BUILD_TIME || "Development";
  const commitHash = import.meta.env.VITE_GIT_COMMIT_HASH || "Development";
  const commitUrl =
    commitHash !== "Development"
      ? `${GH_BASE_URL}${GH_PROJECT_URL}/commit/${commitHash}`
      : null;

  // Copyright years
  const startYear = 2024;
  const currentYear = new Date().getFullYear();
  const copyrightYears =
    startYear === currentYear
      ? startYear.toString()
      : `${startYear} - ${currentYear}`;
</script>

<footer class="footer p-4 bg-base-200 text-base-content">
  <div class="max-w-7xl mx-auto w-full">
    <!-- Main footer content -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-4">
      <!-- Brand section -->
      <div class="flex flex-col items-center md:items-start">
        <h2 class="font-bold text-lg font-kiepscy">Kiepskie TV (TiWi)</h2>
        <p class="text-sm">© {copyrightYears} Jakub Mikos</p>
        <div class="text-xs mt-2 text-gray-500">
          <p>Build: {isDev ? "Development" : "Production"}</p>
          <p>
            Commit: {#if commitUrl}
              <a href={commitUrl} class="link link-hover underline"
                >{commitHash}</a
              >
            {:else}
              {commitHash}
            {/if}
          </p>
          <p>Build: {buildTime}</p>
        </div>
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
          <BriefcaseIcon class="w-4 h-4" />
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
    <!-- Made with love message -->
    <div class="w-full text-center mb-4">
      <p class="text-lg font-kiepscy">
        Made with <span class="text-yellow-300">💛</span> to Kiepscy
      </p>
    </div>
  </div>
</footer>
