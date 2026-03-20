<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES } from "$lib/types.js";
  import type { LayerStatus } from "$lib/types.js";
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

  // レイヤーの状態に応じたカラーを返す
  function statusColor(status: LayerStatus): string {
    switch (status) {
      case "PLAYING":
      case "LOOPING":
        return "var(--green)";
      case "PAUSED":
        return "var(--yellow)";
      case "STOPPED":
        return "var(--red)";
      default:
        return "var(--text-muted)";
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

<div class="table-layout">
  <NodeInfoBar />

  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th class="row-header-col">Property</th>
          {#each LAYER_NAMES as name, i}
            <th class="layer-col">
              <span
                class="layer-col-name"
                style="color: {statusColor(store.layers[i].status)}"
              >
                {name}
              </span>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each ROW_DEFS as row}
          <tr>
            <td class="row-header">{row}</td>
            {#each LAYER_NAMES as _, i}
              {@const value = getCellValue(row, i)}
              {@const isHighlighted = checkHighlight(row, i, value)}
              <td
                class="data-cell"
                class:highlight={isHighlighted}
                class:cell-status={row === "Status"}
                class:cell-on-air={row === "OnAir" && value === "ON"}
                class:cell-sync={row === "Sync" && value === "Master"}
                class:cell-bpm={row === "BPM" && value !== "-"}
                style={row === "Status" ? `color: ${statusColor(store.layers[i].status)}` : ""}
              >
                {value}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="table-packet-log">
    <PacketLog />
  </div>
</div>

<style>
  .table-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .table-container {
    flex: 1;
    overflow: auto;
    padding: 8px;
    min-height: 0;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 11px;
  }

  .data-table th,
  .data-table td {
    padding: 5px 8px;
    border: 1px solid var(--border);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .data-table thead {
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .data-table th {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .row-header-col {
    width: 100px;
    text-align: left !important;
  }

  .layer-col {
    width: calc((100% - 100px) / 8);
  }

  .layer-col-name {
    font-weight: bold;
  }

  .row-header {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-weight: bold;
    text-align: left !important;
    font-size: 10px;
    text-transform: uppercase;
  }

  .data-cell {
    background: var(--bg-primary);
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    transition: background-color 0.3s ease;
  }

  .data-cell.highlight {
    background-color: rgba(88, 166, 255, 0.2);
  }

  .data-cell.cell-status {
    font-weight: bold;
    text-transform: uppercase;
  }

  .data-cell.cell-on-air {
    color: var(--green);
    font-weight: bold;
  }

  .data-cell.cell-sync {
    color: var(--yellow);
    font-weight: bold;
  }

  .data-cell.cell-bpm {
    color: var(--accent);
    font-weight: bold;
  }

  .data-table tbody tr:hover .data-cell {
    background: var(--bg-tertiary);
  }

  .data-table tbody tr:hover .data-cell.highlight {
    background-color: rgba(88, 166, 255, 0.3);
  }

  .table-packet-log {
    height: 180px;
    flex-shrink: 0;
    overflow: hidden;
  }
</style>
