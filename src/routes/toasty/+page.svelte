<script lang="ts">
  import { onMount } from "svelte";
  import { TOASTS_PATH, loadAndParseTxtFile, TOASTS } from "../../utils/toasts";

  import Typewriter from "svelte-typewriter";

  import CenteredContainer from "../../components/CenteredContainer.svelte";
  import Footer from "../Footer.svelte";
  import NavBar from "../../components/NavBar.svelte";
  import ResponsiveContainer from "../../components/ResponsiveContainer.svelte";
  import DashedBox from "../DashedBox.svelte";
  import Header from "../Header.svelte";

  let currentToast = "";
  let previousToast = "";
  let isRolling = false;

  let toasts = [];

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
