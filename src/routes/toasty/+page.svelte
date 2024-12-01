<script lang="ts">
  import { onMount } from "svelte";
  import { TOASTS_PATH, loadAndParseTxtFile, TOASTS } from "../../utils/toasts";

  import Typewriter from "svelte-typewriter";

  import CenteredContainer from "../../components/CenteredContainer.svelte";
  import Footer from "../../components/Footer.svelte";
  import NavBar from "../../components/NavBar.svelte";
  import ResponsiveContainer from "../../components/ResponsiveContainer.svelte";
  import DashedBox from "../DashedBox.svelte";
  import Header from "../Header.svelte";

  let currentToast = "";
  let previousToast = "";
  let isRolling = false;
  let isSuccess = false;

  let toasts = [];

  // Function to copy content to clipboard
  function copyToClipboard() {
    navigator.clipboard
      .writeText(currentToast)
      .then(() => {
        console.log("Text copied to clipboard");
        isSuccess = true;
        setTimeout(() => {
          isSuccess = false;
        }, 3000); // Reset after 3 seconds
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }

  function getRandomToast() {
    // console.log('getRandomToast() CALLED');
    isRolling = true;

    // console.log('currentToast BEFORE: ', currentToast);
    // console.log('previousToast BEFORE: ', previousToast);

    // Reroll until a different toast is picked
    let newToast;
    do {
      const randomIndex = Math.floor(Math.random() * toasts.length);
      newToast = toasts[randomIndex];
      console.log("newToast:", newToast);
    } while (toasts.length > 1 && newToast === currentToast);

    // Update the previous and current toasts
    // console.log('Breaking the loop');

    previousToast = currentToast;
    currentToast = newToast;

    // console.log('currentToast AFTER: ', currentToast);
    // console.log('previousToast AFTER: ', previousToast);

    // isRolling = false;
    // console.log('isRolling state:', isRolling);
  }

  onMount(() => {
    loadAndParseTxtFile(TOASTS_PATH)
      .then((parsed_content) => {
        // console.log('Parsed TOASTS:', parsed_content);
        toasts = parsed_content;
      })
      .catch((error) => {
        console.error("Error:", error);
        // Default to hardcoded values
        toasts = TOASTS;
      });
  });
</script>

<CenteredContainer>
  <NavBar></NavBar>

  <ResponsiveContainer>
    <Header
      title={'Toasty z "Kiepskich"'}
      description="Wylosuj kultowe toasty z popularnego polskiego sitcomu"
    ></Header>
    <DashedBox>
      <div class="p-4 bg-gray-200 rounded-md text-left text-wrap">
        {#if currentToast !== ""}
          <p class="text-gray-800 text-xl">No to....</p>

          <Typewriter
            cursor={false}
            on:done={() => {
              // release button
              isRolling = !isRolling;
            }}
          >
            <p class="text-gray-800 text-xl">{currentToast}</p>
          </Typewriter>
        {:else}
          <p class="text-gray-400 text-xl">Panie, na co pan czekasz...?</p>
        {/if}
      </div>

      <div class="text-center mt-4">
        {#if currentToast !== ""}
          <button
            on:click={copyToClipboard}
            class="btn btn-block {isSuccess ? 'btn-success' : 'btn-info'} mb-1"
            disabled={isRolling ? true : false}
          >
            <h4>{isSuccess ? "Skopiowano!" : "Kopiuj do schowka"}</h4>
            {#if isSuccess}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            {:else}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                />
              </svg>
            {/if}
          </button>
        {/if}
        <button
          on:click={getRandomToast}
          class="btn btn-primary btn-warning btn-block bg-yellow-500"
          disabled={isRolling ? true : false}
        >
          {#if isRolling}
            <span class="loading loading-spinner"></span>
          {/if}
          <h4>No to jedziem! 🍻</h4>
        </button>
      </div>
    </DashedBox>
  </ResponsiveContainer>

  <Footer></Footer>
</CenteredContainer>
