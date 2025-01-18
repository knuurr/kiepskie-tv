<script lang="ts">
  import ChevronDoubleRightIcon from "virtual:icons/heroicons/chevron-double-right";

  export let title: string;
  export let description: string;
  export let link: string;
  export let imageUrl: string = "/placeholder.png"; // Default placeholder
  export let additionalInfo: string = "";
  export let disabled: boolean = false;
</script>

<a
  href={disabled ? "#" : link}
  class="block card w-full bg-base-100 border border-base-300 shadow-xl hover:shadow-2xl transition-all {disabled
    ? 'pointer-events-none'
    : 'hover:scale-[1.02]'}"
  aria-disabled={disabled}
  tabindex={disabled ? -1 : 0}
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
        <ChevronDoubleRightIcon class="size-5" />
      </button>
    </div>
    {#if additionalInfo}
      <p class="text-base font-normal mt-2">{additionalInfo}</p>
    {/if}
  </div>
</a>

<style>
  /* Prevent text selection when clicking the card */
  a {
    user-select: none;
    text-decoration: none;
    color: inherit;
  }
</style>
