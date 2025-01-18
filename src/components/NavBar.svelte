<script>
  import { GH_BASE_URL, GH_PROJECT_URL } from "../routes/Constans.svelte";
  // Import Heroicons
  import Bars3Icon from "virtual:icons/heroicons/bars-3";
  import UserGroupIcon from "virtual:icons/heroicons/user-group";
  import LinkIcon from "virtual:icons/heroicons/link";

  let isOpen = false;
  let isSocialOpen = false;
  let isCommunityOpen = false;

  const toggleDropdown = () => {
    isOpen = !isOpen;
  };

  // Build information
  const isDev = import.meta.env.DEV;
  const buildTime = import.meta.env.VITE_BUILD_TIME || "Development";
  const commitHash = import.meta.env.VITE_GIT_COMMIT_HASH || "Development";
  const commitUrl =
    commitHash !== "Development"
      ? `${GH_BASE_URL}${GH_PROJECT_URL}/commit/${commitHash}`
      : null;
</script>

<div class="navbar bg-base-100">
  <div class="navbar-start">
    <div class="dropdown">
      <div
        tabindex="0"
        role="button"
        class="btn btn-ghost lg:hidden"
        on:click={toggleDropdown}
      >
        <Bars3Icon class="h-5 w-5" />
      </div>
      <ul
        tabindex="0"
        class="menu dropdown-content mt-3 z-[1] p-1 shadow bg-base-100 rounded-box w-52"
        class:hidden={!isOpen}
      >
        <!-- Routes section -->
        <li><a href="/tiwi">TiWi</a></li>
        <li><a href="/toasty">Toasty</a></li>
        <li><a href="/tabela">Tabela</a></li>
        <li><a href="/generator">Generator</a></li>
        <div class="divider my-0"></div>

        <!-- Build info section -->
        <li class="text-xs opacity-50">
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
        </li>
      </ul>
    </div>
    <a href="/" class="btn btn-ghost text-2xl font-normal font-kiepscy"
      >Kiepskie TV</a
    >
  </div>

  <!-- Desktop menu -->
  <div class="navbar-center hidden lg:flex">
    <ul class="menu menu-horizontal px-1">
      <li><a href="/tiwi">TiWi</a></li>
      <li><a href="/toasty">Toasty</a></li>
      <li><a href="/tabela">Tabela</a></li>
      <li><a href="/generator">Generator</a></li>
    </ul>
  </div>

  <div class="navbar-end">
    <!-- Community Links -->
    <div class="dropdown dropdown-end">
      <div
        tabindex="0"
        role="button"
        class="btn btn-ghost"
        on:click={() => (isCommunityOpen = !isCommunityOpen)}
      >
        <UserGroupIcon class="h-5 w-5" />
        <span class="hidden lg:inline">Społeczność</span>
      </div>
      <ul
        tabindex="0"
        class="menu dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box w-52 mt-4"
        class:hidden={!isCommunityOpen}
      >
        <li>
          <a
            href="https://forum.kiepscy.org.pl/"
            target="_blank"
            rel="noopener noreferrer">Forum kiepscy.org.pl</a
          >
        </li>
        <li>
          <a
            href="https://www.facebook.com/groups/227062558151644"
            target="_blank"
            rel="noopener noreferrer">"Pośredniawka" na FB</a
          >
        </li>
        <li>
          <a
            href="https://kiepscy.fandom.com/wiki/Strona_g%C5%82%C3%B3wna"
            target="_blank"
            rel="noopener noreferrer">Kiepscy Wiki</a
          >
        </li>
      </ul>
    </div>

    <!-- Social Links -->
    <div class="dropdown dropdown-end">
      <div
        tabindex="0"
        role="button"
        class="btn btn-ghost"
        on:click={() => (isSocialOpen = !isSocialOpen)}
      >
        <LinkIcon class="h-5 w-5" />
        <span class="hidden lg:inline">O mnie</span>
      </div>
      <ul
        tabindex="0"
        class="menu dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box w-52 mt-4"
        class:hidden={!isSocialOpen}
      >
        <li>
          <a
            href="https://github.com/knuurr/kiepskie-tv/"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </li>
        <li>
          <a
            href="https://www.linkedin.com/in/jakub-mikos/"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </li>
      </ul>
    </div>
  </div>
</div>
