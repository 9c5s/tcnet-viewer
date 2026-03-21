<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES, STATUS_MAP, statusClass } from "$lib/types.js";
  import NodeInfoBar from "./NodeInfoBar.svelte";
  import PacketLog from "./PacketLog.svelte";

  // テーブルに表示するデータ行の定義
  const ROW_DEFS = [
    "Status", "Name", "Track Title", "Artist", "BPM", "Speed",
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
        return metrics ? (metrics.bpm / 100).toFixed(2) : "-";
      case "Speed":
        return metrics ? (metrics.speed / 32768 * 100).toFixed(1) + "%" : "-";
      case "Position":
        return metrics ? formatMs(metrics.currentPosition) : "-";
      case "Length":
        return metrics ? formatMs(metrics.trackLength) : "-";
      case "Beat":
        return metrics ? `${metrics.beatNumber} [${metrics.beatMarker}/4]` : "-";
      case "Sync":
        return metrics ? (metrics.syncMaster === 1 ? "Master" : "Slave") : "-";
      case "OnAir":
        return timeInfo ? (timeInfo.onAir === 1 ? "ON" : "OFF") : "-";
      case "TrackID":
        return metrics ? String(metrics.trackID) : "-";
      default:
        return "-";
    }
  }

  // ミリ秒をMM:SS.mmm形式に変換する
  function formatMs(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const millis = ms % 1000;
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return (
      String(m).padStart(2, "0") + ":" +
      String(s).padStart(2, "0") + "." +
      String(millis).padStart(3, "0")
    );
  }

  // 変更検知用の前回値マップ: key = "row-layerIndex"
  let prevValues: Map<string, string> = new Map();
  let highlights: Record<string, boolean> = $state({});

  // 値の変更を検知してハイライトする
  function checkHighlight(row: string, layerIndex: number, value: string): boolean {
    const key = `${row}-${layerIndex}`;
    const prev = prevValues.get(key);
    if (prev !== undefined && prev !== value) {
      highlights[key] = true;
      setTimeout(() => {
        highlights[key] = false;
      }, 300);
    }
    prevValues.set(key, value);
    return highlights[key] ?? false;
  }
</script>

<div class="flex flex-col h-screen w-screen overflow-hidden">
  <NodeInfoBar />

  <div class="flex-1 overflow-auto">
    <table class="table table-xs table-fixed w-full">
      <thead>
        <tr class="sticky top-0 bg-base-300 z-10">
          <th class="text-left w-[100px]">Property</th>
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
            <td class="font-bold text-left text-xs uppercase text-base-content/60 bg-base-200">{row}</td>
            {#each LAYER_NAMES as _, i}
              {@const value = getCellValue(row, i)}
              {@const isHighlighted = checkHighlight(row, i, value)}
              <td
                class={[
                  "text-center tabular-nums",
                  row === "Status" ? `font-bold uppercase ${statusClass(store.layers[i].status)}` : "",
                  row === "OnAir" && value === "ON" ? "text-success font-bold" : "",
                  row === "Sync" && value === "Master" ? "text-warning font-bold" : "",
                  row === "BPM" && value !== "-" ? "text-accent font-bold" : "",
                  isHighlighted ? "bg-accent/20 transition-colors duration-300" : "transition-colors duration-300",
                ].filter(Boolean).join(" ")}
              >
                {value}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="h-[200px] flex-shrink-0 overflow-hidden">
    <PacketLog />
  </div>
</div>
