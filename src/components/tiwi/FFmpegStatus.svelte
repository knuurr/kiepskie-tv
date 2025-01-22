<!-- FFmpeg Status Indicator -->
<script lang="ts">
  import { ffmpegStore } from "$lib/stores/ffmpegStore";
  import type { FFmpegLoadingState } from "$lib/stores/ffmpegStore";

  // Icons
  import ArrowPathIcon from "virtual:icons/heroicons/arrow-path";
  import CheckCircleIcon from "virtual:icons/heroicons/check-circle";
  import ExclamationCircleIcon from "virtual:icons/heroicons/exclamation-circle";
  import CloudIcon from "virtual:icons/heroicons/cloud";
  import WifiIcon from "virtual:icons/heroicons/wifi";
  import SignalIcon from "virtual:icons/heroicons/signal";
  import InformationCircleIcon from "virtual:icons/heroicons/information-circle";

  export let onRetry: () => void;

  // State styling mapping
  const stateConfig: Record<
    FFmpegLoadingState,
    { color: string; text: string }
  > = {
    not_loaded: {
      color: "text-base-content",
      text: "FFmpeg nie jest załadowany",
    },
    loading: { color: "text-warning", text: "Ładowanie FFmpeg..." },
    loaded: { color: "text-success", text: "FFmpeg gotowy" },
    error: { color: "text-error", text: "Błąd ładowania FFmpeg" },
  };

  // Connection type messages
  type ConnectionType = "wifi" | "cellular" | "unknown";
  const connectionMessages: Record<ConnectionType, string> = {
    wifi: "Wykryto połączenie WiFi - szybkie pobieranie",
    cellular: "Wykryto połączenie komórkowe - może potrwać dłużej",
    unknown: "Sprawdź swoje połączenie internetowe",
  };

  // Get connection type on mount if available
  let connectionType: ConnectionType = "unknown";
  if (typeof navigator !== "undefined" && "connection" in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      connectionType = connection.type === "wifi" ? "wifi" : "cellular";
      ffmpegStore.setConnectionType(connectionType);

      // Listen for connection changes
      connection.addEventListener("change", () => {
        connectionType = connection.type === "wifi" ? "wifi" : "cellular";
        ffmpegStore.setConnectionType(connectionType);
      });
    }
  }
</script>

<div class="flex flex-col gap-2 p-4 bg-base-200 rounded-lg">
  <!-- Status indicator -->
  <div class="flex items-center gap-2">
    {#if $ffmpegStore.state === "loading"}
      <ArrowPathIcon
        class="h-5 w-5 animate-spin {stateConfig[$ffmpegStore.state].color}"
      />
    {:else if $ffmpegStore.state === "loaded"}
      <CheckCircleIcon
        class="h-5 w-5 {stateConfig[$ffmpegStore.state].color}"
      />
    {:else if $ffmpegStore.state === "error"}
      <ExclamationCircleIcon
        class="h-5 w-5 {stateConfig[$ffmpegStore.state].color}"
      />
    {:else}
      <CloudIcon class="h-5 w-5 {stateConfig[$ffmpegStore.state].color}" />
    {/if}

    <span class={stateConfig[$ffmpegStore.state].color}>
      {stateConfig[$ffmpegStore.state].text}
    </span>

    {#if $ffmpegStore.state === "error"}
      <button class="btn btn-error btn-sm gap-2" on:click={onRetry}>
        <ArrowPathIcon class="h-4 w-4" />
        Spróbuj ponownie
      </button>
    {/if}
  </div>

  <!-- Dependency info -->
  <div class="flex items-start gap-2 text-sm text-base-content/70">
    <InformationCircleIcon class="h-4 w-4 flex-shrink-0 mt-0.5" />
    <span>
      Aplikacja wymaga pobrania dodatkowych zależności (~25MB).
      {#if $ffmpegStore.state === "not_loaded" || $ffmpegStore.state === "loading"}
        Poczekaj na zakończenie pobierania by móc korzystać z funkcjonalności.
      {/if}
    </span>
  </div>

  <!-- Connection info -->
  {#if $ffmpegStore.state === "loading"}
    <div class="flex items-center gap-2 text-sm text-base-content/70">
      {#if connectionType === "wifi"}
        <WifiIcon class="h-4 w-4" />
      {:else if connectionType === "cellular"}
        <SignalIcon class="h-4 w-4" />
      {/if}
      {connectionMessages[connectionType]}
    </div>
  {/if}

  <!-- Error message if present -->
  {#if $ffmpegStore.error}
    <div class="text-sm text-error">
      {$ffmpegStore.error}
    </div>
  {/if}
</div>
