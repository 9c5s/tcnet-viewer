<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES } from "$lib/types.js";

  // パケットタイプに応じた色を返す
  const TYPE_COLORS: Record<string, string> = {
    time: "var(--accent)",
    status: "var(--green)",
    metrics: "var(--yellow)",
    metadata: "#bc8cff",
    optin: "var(--text-muted)",
    optout: "var(--red)",
    cue: "#f0883e",
    mixer: "#39d353",
    "waveform-small": "var(--text-secondary)",
    "waveform-big": "var(--text-secondary)",
    artwork: "#bc8cff",
    beatgrid: "var(--text-muted)",
  };

  // タイムスタンプをHH:MM:SS.mmm形式に変換する
  function formatTimestamp(ts: number): string {
    const d = new Date(ts);
    return (
      String(d.getHours()).padStart(2, "0") +
      ":" +
      String(d.getMinutes()).padStart(2, "0") +
      ":" +
      String(d.getSeconds()).padStart(2, "0") +
      "." +
      String(d.getMilliseconds()).padStart(3, "0")
    );
  }

  // フィルタ条件に合致するログエントリだけを返す
  let filteredLogs = $derived(
    store.packetLog.filter((entry) => store.logFilters[entry.type] !== false)
  );

  // oxlint-ignore-next-line no-unassigned-vars -- Svelteのbind:thisで代入される
  let logContainer: HTMLDivElement;

  // 新しいログエントリ追加時に自動スクロールする
  $effect(() => {
    void filteredLogs.length;
    if (logContainer) {
      // requestAnimationFrameでDOM更新後にスクロールする
      requestAnimationFrame(() => {
        if (logContainer) {
          logContainer.scrollTop = logContainer.scrollHeight;
        }
      });
    }
  });

  // フィルタキーの表示名
  const filterLabels: Record<string, string> = {
    time: "Time",
    status: "Status",
    metrics: "Metrics",
    metadata: "Meta",
    optin: "OptIn",
    optout: "OptOut",
    cue: "Cue",
    beatgrid: "Beat",
    "waveform-small": "WfS",
    "waveform-big": "WfB",
    mixer: "Mixer",
    artwork: "Art",
  };
</script>

<div class="packet-log">
  <div class="log-header">
    <h3 class="section-title">PACKET LOG</h3>
    <div class="filters">
      {#each Object.keys(store.logFilters) as key}
        <label class="filter-label">
          <input
            type="checkbox"
            checked={store.logFilters[key]}
            onchange={() => (store.logFilters[key] = !store.logFilters[key])}
          />
          <span style="color: {TYPE_COLORS[key] ?? 'var(--text-secondary)'}">{filterLabels[key] ?? key}</span>
        </label>
      {/each}
    </div>
  </div>
  <div class="log-entries" bind:this={logContainer}>
    {#each filteredLogs as entry (entry.id)}
      <div class="log-entry">
        <span class="log-time">{formatTimestamp(entry.timestamp)}</span>
        <span class="log-type" style="color: {TYPE_COLORS[entry.type] ?? 'var(--text-secondary)'}">
          {entry.type}
        </span>
        {#if entry.layer !== undefined}
          <span class="log-layer">{LAYER_NAMES[entry.layer]}</span>
        {:else}
          <span class="log-layer">--</span>
        {/if}
        <span class="log-summary">{entry.summary}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .packet-log {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-top: 1px solid var(--border);
    background: var(--bg-secondary);
  }
  .log-header {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .section-title {
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 1px;
    margin-bottom: 6px;
    text-transform: uppercase;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .filter-label {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    cursor: pointer;
    user-select: none;
  }
  .filter-label input {
    width: 12px;
    height: 12px;
    accent-color: var(--accent);
  }
  .log-entries {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }
  .log-entry {
    display: flex;
    gap: 8px;
    padding: 2px 12px;
    font-size: 10px;
    line-height: 1.6;
  }
  .log-entry:hover {
    background: var(--bg-tertiary);
  }
  .log-time {
    color: var(--text-muted);
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }
  .log-type {
    min-width: 70px;
    flex-shrink: 0;
    text-transform: uppercase;
  }
  .log-layer {
    color: var(--text-secondary);
    min-width: 20px;
    flex-shrink: 0;
  }
  .log-summary {
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
