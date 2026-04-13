<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { connect, disconnect } from "$lib/ws-client.js";
  import { store } from "$lib/stores.svelte.js";
  import Dashboard from "./components/Dashboard.svelte";
  import CardsLayout from "./components/CardsLayout.svelte";
  import TableLayout from "./components/TableLayout.svelte";
  import PlayerStatusLayout from "./components/player-status/PlayerStatusLayout.svelte";
  import LayoutSwitcher from "./components/LayoutSwitcher.svelte";

  $effect(() => {
    document.documentElement.dataset.theme = store.theme;
    localStorage.setItem("theme", store.theme);
  });


  onMount(() => connect());
  onDestroy(() => disconnect());
</script>

<LayoutSwitcher />

{#if store.layoutMode === "cards"}
  <CardsLayout />
{:else if store.layoutMode === "table"}
  <TableLayout />
{:else if store.layoutMode === "player-status"}
  <PlayerStatusLayout />
{:else}
  <Dashboard />
{/if}
