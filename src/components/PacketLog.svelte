<script lang="ts">
  import { onDestroy } from "svelte";
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES, PACKET_TYPE_CLASSES, PACKET_FILTER_LABELS, type PacketLogEntry } from "$lib/types.js";

  // serverタイプはログレベルに応じた色を返す
  function getTypeClass(entry: PacketLogEntry): string {
    if (entry.type === "server") {
      if (entry.summary.startsWith("[ERROR]")) return "text-error";
      if (entry.summary.startsWith("[WARN]")) return "text-warning";
      return "text-info";
    }
    return PACKET_TYPE_CLASSES[entry.type as keyof typeof PACKET_TYPE_CLASSES] ?? "text-base-content/70";
  }

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

  let scrollRafId = 0;
  function onScroll(): void {
    if (scrollRafId) return;
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = 0;
      if (!logContainer) return;
      // 1行分 (約16px) の余裕を持たせて最下部判定する
      isAtBottom = logContainer.scrollHeight - logContainer.scrollTop - logContainer.clientHeight < 16;
    });
  }

  // コンポーネント破棄時にスクロールスロットル用RAFをキャンセルする
  onDestroy(() => {
    if (scrollRafId) {
      cancelAnimationFrame(scrollRafId);
    }
  });

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

  // ドラッグによるリサイズ
  let dragging = false;
  let startY = 0;
  let startHeight = 0;
  let minH = 0;
  let maxH = 0;

  function onDragStart(e: PointerEvent): void {
    dragging = true;
    startY = e.clientY;
    startHeight = store.packetLogHeight;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    // ドラッグ開始時に1回だけ計算する (zoom補正済みビューポート高さ)
    const visibleHeight = window.innerHeight / (parseFloat(getComputedStyle(document.documentElement).zoom) || 1);
    minH = visibleHeight * 0.1;
    maxH = visibleHeight * 0.5;
  }

  function onDragMove(e: PointerEvent): void {
    if (!dragging) return;
    // 上にドラッグ = 高さ増加 (ビューポートの10%~50%)
    const delta = startY - e.clientY;
    store.packetLogHeight = Math.max(minH, Math.min(maxH, startHeight + delta));
  }

  function onDragEnd(e: PointerEvent): void {
    dragging = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    try {
      localStorage.setItem("packetLogHeight", String(store.packetLogHeight));
    } catch {
      // localStorage書き込みに失敗しても動作は継続する
    }
  }
</script>

<div class="flex h-full flex-col overflow-hidden bg-base-200">
  <!-- リサイズハンドル -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="h-1 shrink-0 cursor-row-resize bg-base-300 transition-colors hover:bg-accent/30"
    onpointerdown={onDragStart}
    onpointermove={onDragMove}
    onpointerup={onDragEnd}
    onpointercancel={onDragEnd}
  ></div>
  <div class="flex shrink-0 items-center gap-2 border-b border-base-content/10 px-3 py-1">
    <h3 class="section-title font-bold">Packet Log</h3>
    <div class="ml-auto flex flex-wrap gap-2">
      {#each Object.keys(store.logFilters) as key}
        <label class="flex cursor-pointer items-center gap-1 text-[9px]">
          <input type="checkbox" class="checkbox checkbox-xs" checked={store.logFilters[key]} onchange={() => store.toggleLogFilter(key)} />
          <span class="{PACKET_TYPE_CLASSES[key as keyof typeof PACKET_TYPE_CLASSES] ?? 'text-base-content/70'}">{PACKET_FILTER_LABELS[key as keyof typeof PACKET_FILTER_LABELS] ?? key}</span>
        </label>
      {/each}
    </div>
  </div>
  <!-- tableを使用する理由: flex+spanだとブラウザのコピー時に各spanで改行が挿入されてしまう。
       tableは行単位のコピーを正しく扱い、セルはタブ区切り・行は改行区切りで貼り付けられる。 -->
  <div class="flex-1 overflow-y-auto text-[10px]" bind:this={logContainer} onscroll={onScroll}>
    <table class="w-full table-fixed">
      <tbody>
        {#each filteredLogs as entry (entry.id)}
          <tr class="hover:bg-base-content/5">
            <td class="w-[95px] py-px pr-1 pl-3 text-base-content/40 tabular-nums">{formatTimestamp(entry.timestamp)}</td>
            <td class="{getTypeClass(entry)} w-[100px] py-px pr-1 font-semibold">{entry.type}</td>
            <td class="w-[45px] py-px pr-1 text-base-content/50">{entry.layer !== undefined ? LAYER_NAMES[entry.layer] : "--"}</td>
            <td class="py-px pr-3 text-base-content/60"><span class="inline-block w-full truncate align-top">{entry.summary}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
