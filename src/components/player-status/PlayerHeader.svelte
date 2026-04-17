<script lang="ts">
  import type { LayerInfo, MetadataData, MetricsData } from "$lib/types.js";
  import { formatPosition } from "$lib/formatting.js";
  import { isMetadataConsistent, isMetricsConsistent } from "$lib/player-status/track-consistency.js";
  import ArtworkErrorIcon from "../ArtworkErrorIcon.svelte";

  interface Props {
    layer: LayerInfo;
    playerNumber: number;
    metadata: MetadataData | null;
    metrics: MetricsData | null;
    artwork: { base64: string; mimeType: string } | null;
    artworkFailed: boolean;
  }
  let { layer, playerNumber, metadata, metrics, artwork, artworkFailed }: Props = $props();

  let metaOk = $derived(isMetadataConsistent(layer, metadata));
  let metricsOk = $derived(isMetricsConsistent(layer, metrics));
  let boxColor = $derived(
    layer.status === "PLAYING" || layer.status === "LOOPING"
      ? "text-success border-success"
      : "text-base-content/40 border-base-content/40",
  );
</script>

<div class="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-base-content/20 p-2.5 pl-6">
  <div class="avatar">
    <div class="size-14 rounded-md bg-linear-to-br from-primary to-secondary">
      {#if artwork}
        <img src="data:{artwork.mimeType};base64,{artwork.base64}" alt="artwork" />
      {:else if artworkFailed}
        <ArtworkErrorIcon />
      {:else}
        <div class="flex size-full items-center justify-center text-xl text-base-100">♫</div>
      {/if}
    </div>
  </div>

  <div class="min-w-0">
    <div class="truncate text-sm font-semibold text-base-content">
      {metaOk ? metadata!.trackTitle || "—" : "—"}
    </div>
    <div class="truncate text-xs text-primary">
      {metaOk ? metadata!.trackArtist || "—" : "—"}
    </div>
    <div class="mt-0.5 flex flex-wrap gap-1">
      {#if metaOk}
        <span class="badge badge-ghost badge-xs">ID {metadata!.trackID}</span>
      {/if}
      {#if metricsOk && (metrics?.trackLength ?? 0) > 0}
        <span class="badge badge-ghost badge-xs">{formatPosition(metrics!.trackLength!)}</span>
      {/if}
      {#if metaOk}
        <span class="badge badge-ghost badge-xs text-warning">Key {metadata!.trackKey}</span>
      {/if}
    </div>
  </div>

  <div
    data-testid="player-box"
    class="flex min-w-14 flex-col items-center rounded-md border-2 px-2.5 py-1 font-mono {boxColor}"
  >
    <span class="text-[8px] tracking-widest uppercase opacity-70">Player</span>
    <span class="text-[22px] leading-none font-bold">{playerNumber}</span>
  </div>
</div>
