<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import type { LayoutMode, Theme } from "$lib/stores.svelte.js";

  const modes: { key: LayoutMode; label: string; icon: string }[] = [
    { key: "cards", label: "Cards", icon: "\u25A6" },
    { key: "detail", label: "Detail", icon: "\u25A3" },
    { key: "table", label: "Table", icon: "\u2261" },
  ];

  const themes: { key: Theme; label: string }[] = [
    { key: "tokyo-night", label: "Night" },
    { key: "tokyo-night-storm", label: "Storm" },
    { key: "tokyo-night-light", label: "Light" },
  ];
</script>

<div class="fixed top-2 right-2 z-[1000] flex items-center gap-2">
  <div class="join">
    {#each modes as mode}
      <button
        class="join-item btn btn-xs {store.layoutMode === mode.key ? 'btn-accent' : 'btn-ghost'}"
        onclick={() => (store.layoutMode = mode.key)}
        title="{mode.label} layout"
      >
        <span class="text-sm leading-none">{mode.icon}</span>
        <span class="text-[10px] uppercase tracking-wider">{mode.label}</span>
      </button>
    {/each}
  </div>

  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-xs btn-ghost">
      <span class="text-[10px] uppercase tracking-wider">
        {themes.find((t) => t.key === store.theme)?.label ?? "Night"}
      </span>
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <ul tabindex="0" class="dropdown-content menu bg-base-200 rounded-box z-1 w-28 p-1 shadow-lg border border-base-content/20">
      {#each themes as t}
        <li>
          <button
            class="text-[11px] {store.theme === t.key ? 'active' : ''}"
            onclick={() => (store.theme = t.key)}
          >
            {t.label}
          </button>
        </li>
      {/each}
    </ul>
  </div>
</div>
