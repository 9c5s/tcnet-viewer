<script lang="ts">
  import { store } from "$lib/stores.svelte.js";

  interface Props {
    layer: number;
  }
  let { layer }: Props = $props();

  let metadata = $derived(store.metadata[layer]);
  let artwork = $derived(store.artwork[layer]);
  let artworkFailed = $derived(store.artworkFailed[layer]);
</script>

<div class="border-b border-base-content/20 p-3">
  {#if metadata}
    <div class="flex items-start gap-3">
      {#if artwork}
        <div class="avatar">
          <div class="w-16 rounded-sm">
            <img src="data:{artwork.mimeType};base64,{artwork.base64}" alt="Artwork"
              onerror={() => { store.artwork[layer] = null; }} />
          </div>
        </div>
      {:else if artworkFailed}
        <div class="
          flex size-16 shrink-0 items-center justify-center rounded-sm border-1.5 border-error/50 bg-base-300
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(var(--er))" stroke-opacity="0.6" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
      {:else}
        <div class="
          flex size-16 shrink-0 items-center justify-center rounded-sm bg-base-300 text-2xl text-base-content/30
        ">&#9835;</div>
      {/if}
      <div class="min-w-0 flex-1">
        <div class="truncate text-[12px] font-bold text-base-content">{metadata.trackTitle || "Unknown"}</div>
        <div class="truncate text-[11px] text-base-content/70">{metadata.trackArtist || "Unknown"}</div>
        <div class="mt-2 space-y-0.5 text-[10px]">
          <div class="flex justify-between"><span class="text-base-content/40">ID</span><span class="
            ml-2 truncate text-base-content
          ">{metadata.trackID}</span></div>
          <div class="flex justify-between"><span class="text-base-content/40">Key</span><span class="
            text-base-content
          ">{metadata.trackKey || "-"}</span></div>
        </div>
      </div>
    </div>
  {:else}
    <div class="text-[11px] text-base-content/40">No metadata</div>
  {/if}
</div>
