<script>
  export let title = "";
  export let description = "";
</script>

<div class="p-8 text-center">
  <h1 class="text-2xl md:text-4xl font-bold mb-4">{title}</h1>
  <p class="text-base md:text-lg">{description}</p>
  <slot></slot>
</div>
