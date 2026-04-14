<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES, statusClass } from "$lib/types.js";
  import { formatMmSs, formatBPM, formatSpeedPercent } from "$lib/formatting.js";
  import NodeInfoBar from "./NodeInfoBar.svelte";
  import PacketLog from "./PacketLog.svelte";

  // テーブルに表示するデータ行の定義
  const ROW_DEFS = [
    "Status", "Name", "Artwork", "Track Title", "Artist", "BPM", "Speed",
    "Position", "Length", "Beat", "Sync", "OnAir", "TrackID",
  ] as const;

  // 各レイヤー・各行のセル値を取得する
  function getCellValue(row: string, layerIndex: number): string {
    const layer = store.layers[layerIndex];
    const metrics = store.metrics[layerIndex];
    const metadata = store.metadata[layerIndex];
    const timeInfo = store.time[layerIndex];

    switch (row) {
      case "Status":
        return layer.status;
      case "Name":
        return layer.name || "-";
      case "Track Title":
        return metadata?.trackTitle || "-";
      case "Artist":
        return metadata?.trackArtist || "-";
      case "BPM":
        return metrics?.bpm != null ? formatBPM(metrics.bpm) : "-";
      case "Speed":
        return metrics?.speed != null ? formatSpeedPercent(metrics.speed) : "-";
      case "Position":
        return metrics?.currentPosition != null ? formatMmSs(metrics.currentPosition) : "-";
      case "Length":
        return metrics?.trackLength != null ? formatMmSs(metrics.trackLength) : "-";
      case "Beat":
        return metrics?.beatNumber != null && metrics?.beatMarker != null ? `${metrics.beatNumber} [${metrics.beatMarker}/4]` : "-";
      case "Sync":
        // syncMaster はmaster deckの player number (1-4) を各layerに共通配信する
        return metrics?.syncMaster != null
          ? (metrics.syncMaster === layerIndex + 1 ? "Master" : "Slave")
          : "-";
      case "OnAir":
        return timeInfo ? (timeInfo.onAir === 1 ? "ON" : "OFF") : "-";
      case "TrackID":
        return metrics?.trackID != null ? String(metrics.trackID) : "-";
      default:
        return "-";
    }
  }

</script>

<div class="flex size-full flex-col overflow-hidden">
  <NodeInfoBar />

  <div class="flex-1 overflow-auto">
    <table class="table w-full table-fixed table-xs">
      <thead>
        <tr class="sticky top-0 z-10 bg-base-300">
          <th class="w-[100px] text-left">Property</th>
          {#each LAYER_NAMES as name, i}
            <th class="text-center">
              <span class={`font-bold ${statusClass(store.layers[i].status)}`}>
                {name}
              </span>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each ROW_DEFS as row}
          <tr>
            <td class="bg-base-200 text-left text-xs font-bold text-base-content/60 uppercase">{row}</td>
            {#each LAYER_NAMES as _, i}
              {#if row === "Artwork"}
                <td class="text-center">
                  {#if store.artwork[i]}
                    <img
                      src="data:{store.artwork[i]!.mimeType};base64,{store.artwork[i]!.base64}"
                      alt="Art"
                      onerror={() => { store.artwork[i] = null; }}
                      class="mx-auto size-8 rounded-sm object-cover"
                    />
                  {:else}
                    <span class="text-base-content/30">-</span>
                  {/if}
                </td>
              {:else}
                {@const value = getCellValue(row, i)}
                <td
                  class={[
                    "text-center tabular-nums",
                    row === "Status" ? `font-bold uppercase ${statusClass(store.layers[i].status)}` : "",
                    row === "OnAir" && value === "ON" ? "text-success font-bold" : "",
                    row === "Sync" && value === "Master" ? "text-warning font-bold" : "",
                    row === "BPM" && value !== "-" ? "text-accent font-bold" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {value}
                </td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="shrink-0 overflow-hidden" style:height="{store.packetLogHeight}px">
    <PacketLog />
  </div>
</div>
