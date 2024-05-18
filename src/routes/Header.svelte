<script>
  export let title = "";
  export let description = "";
</script>

<div class="p-8 text-center">
  <h1 class="text-4xl font-bold mb-4">{title}</h1>
  <p class="text-lg">{description}</p>
  <slot></slot>
</div>
