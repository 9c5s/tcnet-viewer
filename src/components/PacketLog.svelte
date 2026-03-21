<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES } from "$lib/types.js";

  // パケットタイプに応じたTailwindセマンティックカラークラスのマッピング
  const TYPE_CLASSES: Record<string, string> = {
    time: "text-accent",
    status: "text-success",
    metrics: "text-warning",
    metadata: "text-secondary",
    optin: "text-base-content/40",
    optout: "text-error",
    cue: "text-warning",
    mixer: "text-success",
    "waveform-small": "text-base-content/70",
    "waveform-big": "text-base-content/70",
    artwork: "text-secondary",
    beatgrid: "text-base-content/40",
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

  // oxlint-disable-next-line no-unassigned-vars -- Svelteのbind:thisで代入される
  let logContainer: HTMLDivElement;

  // 最下部付近にいる場合のみ自動スクロールする
  let isAtBottom = true;

  function onScroll(): void {
    if (!logContainer) return;
    isAtBottom = logContainer.scrollHeight - logContainer.scrollTop - logContainer.clientHeight < 1;
  }

  $effect(() => {
    void filteredLogs.length;
    if (logContainer && isAtBottom) {
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

<div class="flex flex-col h-full bg-base-200 border-t border-base-content/10 overflow-hidden">
  <div class="flex items-center gap-2 px-3 py-1 border-b border-base-content/10 flex-shrink-0">
    <h3 class="text-[10px] text-base-content/40 font-bold uppercase tracking-wider">Packet Log</h3>
    <div class="flex gap-2 ml-auto flex-wrap">
      {#each Object.keys(store.logFilters) as key}
        <label class="flex items-center gap-1 cursor-pointer text-[9px]">
          <input type="checkbox" class="checkbox checkbox-xs" checked={store.logFilters[key]} onchange={() => (store.logFilters[key] = !store.logFilters[key])} />
          <span class="{TYPE_CLASSES[key] ?? 'text-base-content/70'}">{filterLabels[key] ?? key}</span>
        </label>
      {/each}
    </div>
  </div>
  <div class="flex-1 overflow-y-auto text-[10px]" bind:this={logContainer} onscroll={onScroll}>
    {#each filteredLogs as entry (entry.id)}
      <div class="flex gap-2 px-3 py-px hover:bg-base-content/5">
        <span class="text-base-content/40 min-w-[85px]" style="font-variant-numeric: tabular-nums">{formatTimestamp(entry.timestamp)}</span>
        <span class="{TYPE_CLASSES[entry.type] ?? 'text-base-content/70'} min-w-[65px] font-semibold">{entry.type}</span>
        <span class="text-base-content/50 min-w-[55px]">{entry.layer !== undefined ? LAYER_NAMES[entry.layer] : "--"}</span>
        <span class="text-base-content/60 flex-1 truncate">{entry.summary}</span>
      </div>
    {/each}
  </div>
</div>
