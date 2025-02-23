<script lang="ts">
  import TableCellsIcon from "virtual:icons/heroicons/table-cells";
  import Squares2x2Icon from "virtual:icons/heroicons/squares-2x2";
  import ClockIcon from "virtual:icons/heroicons/clock";
  import XMarkIcon from "virtual:icons/heroicons/x-mark";

  export let isOpen: boolean;
  export let onClose: () => void;

  const views = [
    {
      name: "Siatka",
      icon: Squares2x2Icon,
      description:
        "Wizualny przegląd odcinków z kartami zawierającymi tytuły i podstawowe informacje. Idealny do szybkiego przeglądania i odkrywania nowych odcinków.",
      features: [
        "Wizualne karty z tytułami",
        "Szybki podgląd podstawowych informacji",
        "Łatwe przeglądanie i odkrywanie",
      ],
    },
    {
      name: "Tabela",
      icon: TableCellsIcon,
      description:
        "Szczegółowy widok tabelaryczny ze wszystkimi informacjami o odcinkach. Najlepszy do analizy i wyszukiwania konkretnych informacji.",
      features: [
        "Pełne informacje o każdym odcinku",
        "Sortowanie i filtrowanie",
        "Kompaktowy widok wszystkich danych",
      ],
    },
    {
      name: "Oś czasu",
      icon: ClockIcon,
      description:
        "Chronologiczna prezentacja odcinków na osi czasu. Pozwala zobaczyć jak serial ewoluował przez lata i sezony.",
      features: [
        "Chronologiczna perspektywa",
        "Grupowanie po sezonach i latach",
        "Wizualizacja odstępów między odcinkami",
      ],
    },
  ];
</script>

<div class="modal modal-bottom sm:modal-middle {isOpen ? 'modal-open' : ''}">
  <div class="modal-box relative">
    <button
      class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
      on:click={onClose}
    >
      <XMarkIcon class="w-5 h-5" />
    </button>

    <h3 class="font-bold text-lg mb-4">Dostępne widoki</h3>

    <div class="space-y-8">
      {#each views as view}
        <div class="card bg-base-200">
          <div class="card-body">
            <div class="flex items-center gap-3 mb-2">
              <svelte:component this={view.icon} class="w-6 h-6 text-primary" />
              <h4 class="card-title text-primary">{view.name}</h4>
            </div>
            <p class="text-base-content/70">{view.description}</p>
            <ul class="mt-3 space-y-1">
              {#each view.features as feature}
                <li class="flex items-center gap-2 text-sm">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                  {feature}
                </li>
              {/each}
            </ul>
          </div>
        </div>
      {/each}
    </div>

    <div class="modal-action">
      <button class="btn" on:click={onClose}>Zamknij</button>
    </div>
  </div>
  <div class="modal-backdrop" on:click={onClose}></div>
</div>

<style>
  .modal-backdrop {
    @apply bg-black/50;
  }
</style>
