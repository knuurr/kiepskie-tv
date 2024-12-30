<script lang="ts">
  export let title: string;
  export let description: string;
  export let link: string;
  export let imageUrl: string = "/placeholder.png"; // Default placeholder
  export let additionalInfo: string = "";
  export let disabled: boolean = false;

  function handleClick() {
    if (!disabled && link !== "#") {
      window.location.href = link;
    }
  }
</script>

<div
  class="card w-full bg-base-100 border border-base-300 shadow-xl hover:shadow-2xl transition-all cursor-pointer {disabled
    ? 'opacity-70'
    : 'hover:scale-[1.02]'}"
  on:click={handleClick}
  on:keydown={(e) => e.key === "Enter" && handleClick()}
  role="button"
  tabindex="0"
>
  <figure class="px-6 pt-6">
    <img
      src={imageUrl}
      alt={title}
      class="rounded-xl h-48 w-full object-cover"
    />
  </figure>
  <div class="card-body items-center text-center">
    <h2 class="card-title text-2xl font-normal font-kiepscy">{title}</h2>
    <p class="text-base font-normal">{description}</p>
    <div class="card-actions justify-end mt-2">
      <button
        class="btn btn-primary btn-block {disabled ? 'btn-disabled' : ''}"
      >
        Zobacz
        <svg
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
      </button>
    </div>
    {#if additionalInfo}
      <p class="text-base font-normal mt-2">{additionalInfo}</p>
    {/if}
  </div>
</div>

<style>
  /* Prevent text selection when clicking the card */
  div {
    user-select: none;
  }
</style>
