<script lang="ts">
  import { store } from "$lib/stores.svelte.js";

  interface Props {
    layer: number;
  }
  let { layer }: Props = $props();

  let metadata = $derived(store.metadata[layer]);
  let artworkBase64 = $derived(store.artwork[layer]);
</script>

<div class="p-3 border-b border-base-content/20">
  {#if metadata}
    <div class="flex gap-3 items-start">
      {#if artworkBase64}
        <div class="avatar">
          <div class="w-16 rounded">
            <img src="data:image/jpeg;base64,{artworkBase64}" alt="Artwork" />
          </div>
        </div>
      {:else}
        <div class="w-16 h-16 rounded bg-base-300 flex items-center justify-center text-base-content/30 text-2xl flex-shrink-0">&#9835;</div>
      {/if}
      <div class="flex-1 min-w-0">
        <div class="font-bold text-base-content text-[12px] truncate">{metadata.trackTitle || "Unknown"}</div>
        <div class="text-base-content/70 text-[11px] truncate">{metadata.trackArtist || "Unknown"}</div>
        <div class="mt-2 space-y-0.5 text-[10px]">
          <div class="flex justify-between"><span class="text-base-content/40">ID</span><span class="text-base-content truncate ml-2">{metadata.trackID}</span></div>
          <div class="flex justify-between"><span class="text-base-content/40">Key</span><span class="text-base-content">{metadata.trackKey || "-"}</span></div>
        </div>
      </div>
    </div>
  {:else}
    <div class="text-base-content/40 text-[11px]">No metadata</div>
  {/if}
</div>
