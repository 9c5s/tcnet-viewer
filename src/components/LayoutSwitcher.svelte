<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import type { LayoutMode, Theme } from "$lib/stores.svelte.js";

  const modes: { key: LayoutMode; label: string; icon: string }[] = [
    { key: "detail", label: "Detail", icon: "\u25A3" },
    { key: "cards", label: "Cards", icon: "\u25A6" },
    { key: "table", label: "Table", icon: "\u2261" },
  ];

  const themes: { key: Theme; label: string; icon: string }[] = [
    { key: "tokyo-night", label: "Night", icon: "\u263D" },
    { key: "tokyo-night-storm", label: "Storm", icon: "\u2601" },
    { key: "tokyo-night-light", label: "Light", icon: "\u2600" },
  ];
</script>

<div class="fixed top-1 right-2 z-1000 flex items-center gap-2">
  <div class="join">
    {#each modes as mode}
      <button
        class="btn join-item btn-xs {store.layoutMode === mode.key ? 'btn-accent' : 'btn-ghost'}"
        onclick={() => (store.layoutMode = mode.key)}
        title="{mode.label} layout"
      >
        <span class="text-sm leading-none">{mode.icon}</span>
        <span class="text-[10px] tracking-wider uppercase">{mode.label}</span>
      </button>
    {/each}
  </div>

  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-xs">
      <span class="text-sm leading-none">{themes.find((t) => t.key === store.theme)?.icon ?? "\u263D"}</span>
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <ul tabindex="0" class="
      dropdown-content menu z-1 w-28 rounded-box border border-base-content/20 bg-base-200 p-1 shadow-lg
    ">
      {#each themes as t}
        <li>
          <button
            class="text-[11px] {store.theme === t.key ? 'active' : ''}"
            onclick={() => (store.theme = t.key)}
          >
            {t.icon} {t.label}
          </button>
        </li>
      {/each}
    </ul>
  </div>
</div>
