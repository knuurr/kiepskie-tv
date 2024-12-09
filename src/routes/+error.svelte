<script>
  import ErrorPage from "../components/ErrorPage.svelte";
  import { page } from "$app/stores";
</script>

<ErrorPage status={$page.status} message={$page.error?.message} />
