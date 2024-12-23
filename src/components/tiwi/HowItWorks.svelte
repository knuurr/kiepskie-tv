<script lang="ts">
  import { fade } from "svelte/transition";
  import * as DATA from "../../routes/Constans.svelte";
</script>

<div transition:fade={{ duration: 200 }}>
  <div class="card bg-base-200">
    <div class="card-body space-y-6">
      <!-- Timeline Overview -->
      <div class="hidden lg:block">
        <ul class="steps steps-horizontal w-full">
          <li class="step step-primary" data-content="1">
            <div class="text-xs text-center max-w-[120px]">
              <span class="font-semibold">Wybierz pliki</span>
              <br />
              <span class="text-base-content/60"
                >Dodaj jedno lub więcej wideo</span
              >
            </div>
          </li>
          <li class="step step-primary" data-content="2">
            <div class="text-xs text-center max-w-[120px]">
              <span class="font-semibold">Dostosuj</span>
              <br />
              <span class="text-base-content/60"
                >Wybierz efekty i zobacz podgląd</span
              >
            </div>
          </li>
          <li class="step step-primary" data-content="3">
            <div class="text-xs text-center max-w-[120px]">
              <span class="font-semibold">Przetwórz</span>
              <br />
              <span class="text-base-content/60">Kliknij "Okiłizuj"</span>
            </div>
          </li>
          <li class="step step-primary" data-content="4">
            <div class="text-xs text-center max-w-[120px]">
              <span class="font-semibold">Gotowe!</span>
              <br />
              <span class="text-base-content/60">Pobierz lub udostępnij</span>
            </div>
          </li>
        </ul>
      </div>

      <!-- Mobile Timeline -->
      <div class="block lg:hidden">
        <ul class="steps steps-vertical min-h-[200px]">
          <li class="step step-primary">
            <div class="text-sm ml-2 text-left">
              <span class="font-semibold">1. Wybierz pliki</span>
              <br />
              <span class="text-base-content/60 text-xs"
                >Dodaj jedno lub więcej wideo</span
              >
            </div>
          </li>
          <li class="step step-primary">
            <div class="text-sm ml-2 text-left">
              <span class="font-semibold">2. Dostosuj</span>
              <br />
              <span class="text-base-content/60 text-xs"
                >Wybierz efekty i zobacz podgląd</span
              >
            </div>
          </li>
          <li class="step step-primary">
            <div class="text-sm ml-2 text-left">
              <span class="font-semibold">3. Przetwórz</span>
              <br />
              <span class="text-base-content/60 text-xs"
                >Kliknij "Okiłizuj"</span
              >
            </div>
          </li>
          <li class="step step-primary">
            <div class="text-sm ml-2 text-left">
              <span class="font-semibold">4. Gotowe!</span>
              <br />
              <span class="text-base-content/60 text-xs"
                >Pobierz lub udostępnij</span
              >
            </div>
          </li>
        </ul>
      </div>

      <div class="divider">Szczegółowa instrukcja</div>

      <!-- Desktop Two-Column Layout -->
      <div class="flex flex-col lg:flex-row lg:gap-8">
        <!-- Left Column (Instructions) -->
        <div class="lg:w-2/3">
          <h2 class="card-title text-2xl">Jak to działa?</h2>

          <!-- Steps 1-4 -->
          <div class="space-y-6 mt-4">
            <!-- Step 1 -->
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="badge badge-primary">1</div>
                <h3 class="text-lg font-semibold">Wybierz pliki</h3>
              </div>
              <p class="text-base-content/80">
                Wybierz jedno lub więcej wideo do przetworzenia. Możesz dodać
                kilka plików naraz - każdy zostanie przetworzony po kolei.
              </p>
            </div>

            <!-- Step 2 -->
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="badge badge-primary">2</div>
                <h3 class="text-lg font-semibold">Dostosuj ustawienia</h3>
              </div>
              <p class="text-base-content/80">
                Dla każdego wideo możesz wybrać efekty:
              </p>
              <ul class="list-disc list-inside ml-4 text-base-content/80">
                <li>Dodaj dźwięk przejścia z "Kiepskich"</li>
                <li>Dodaj reakcję Boczka na koniec</li>
              </ul>
              <p class="text-base-content/80">
                Przed przetworzeniem zobaczysz podgląd kilku klatek, jak będzie
                wyglądać efekt końcowy.
              </p>
            </div>

            <!-- Step 3 -->
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="badge badge-primary">3</div>
                <h3 class="text-lg font-semibold">Przetwórz wideo</h3>
              </div>
              <p class="text-base-content/80">
                Kliknij "Okiłizuj" aby rozpocząć przetwarzanie. Wszystko dzieje
                się lokalnie w twojej przeglądarce - żadne pliki nie są NIGDZIE
                na serwer.
              </p>
            </div>

            <!-- Step 4 -->
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="badge badge-primary">4</div>
                <h3 class="text-lg font-semibold">Pobierz lub udostępnij</h3>
              </div>
              <p class="text-base-content/80">Po przetworzeniu możesz:</p>
              <ul class="list-disc list-inside ml-4 text-base-content/80">
                <li>Pobrać wideo na urządzenie</li>
                <li>Udostępnić bezpośrednio przez menu udostępniania</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Right Column (Example Video) -->
        <div class="lg:w-1/3 mt-6 lg:mt-0">
          <div class="sticky top-4">
            <h3 class="text-lg font-semibold mb-2">Zobacz przykład:</h3>
            <div class="bg-base-300 rounded-lg overflow-hidden">
              <div class="aspect-video">
                <video
                  src={DATA.EXAMPLE_URL}
                  controls
                  class="w-full h-full object-contain"
                ></video>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
