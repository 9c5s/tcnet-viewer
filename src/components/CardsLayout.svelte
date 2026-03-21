<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES } from "$lib/types.js";
  import type { LayerStatus } from "$lib/types.js";
  import NodeInfoBar from "./NodeInfoBar.svelte";
  import WaveformCanvas from "./WaveformCanvas.svelte";
  import PacketLog from "./PacketLog.svelte";

  // レイヤーステータスに応じた色を返す
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

  // アクティブ状態(PLAYING/LOOPING)かどうかを判定する
  function isActive(status: LayerStatus): boolean {
    return status === "PLAYING" || status === "LOOPING";
  }

  // BPM値をフォーマットする(100分の1単位の値を変換)
  function formatBPM(bpm: number): string {
    return (bpm / 100).toFixed(2);
  }

  // ミリ秒をMM:SS形式に変換する
  function formatPosition(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  // ミキサーの0-255値をパーセンテージに変換する
  function toPercent(val: number): string {
    return ((val / 255) * 100).toFixed(0);
  }
</script>

<div class="cards-layout">
  <NodeInfoBar />

  <div class="cards-grid">
    {#each store.layers as layer, i}
      {@const active = isActive(layer.status)}
      {@const metrics = store.metrics[i]}
      {@const metadata = store.metadata[i]}
      {@const timeInfo = store.time[i]}
      {@const waveform = store.waveformSmall[i]}
      {@const artworkBase64 = store.artwork[i]}

      <div class="card" class:active class:idle={layer.status === "IDLE"}>
        <div class="card-header">
          <span class="card-name">{LAYER_NAMES[i]}</span>
          <span class="card-status" style="color: {statusColor(layer.status)}">
            {layer.status}
          </span>
        </div>

        {#if layer.status !== "IDLE"}
          <div class="card-body">
            <!-- メタデータ表示 -->
            {#if metadata}
              <div class="card-meta">
                <div class="meta-row">
                  {#if artworkBase64}
                    <img
                      src="data:image/jpeg;base64,{artworkBase64}"
                      alt="Art"
                      class="mini-artwork"
                    />
                  {/if}
                  <div class="meta-text">
                    <div class="track-title">{metadata.trackTitle || "Unknown"}</div>
                    <div class="track-artist">{metadata.trackArtist || "Unknown"}</div>
                  </div>
                </div>
              </div>
            {/if}

            <!-- メトリクスサマリー -->
            {#if metrics}
              <div class="card-metrics">
                <div class="metric bpm">
                  <span class="metric-label">BPM</span>
                  <span class="metric-value">{formatBPM(metrics.bpm)}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Speed</span>
                  <span class="metric-value">{(metrics.speed / 32768 * 100).toFixed(1)}%</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Pos</span>
                  <span class="metric-value">{formatPosition(metrics.currentPosition)}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Beat</span>
                  <span class="metric-value">
                    {#each [1, 2, 3, 4] as b}
                      <span class="beat-pip" class:beat-active={metrics.beatMarker === b}></span>
                    {/each}
                  </span>
                </div>
              </div>
            {/if}

            <!-- ミニ波形 -->
            {#if active}
              <div class="card-waveform">
                <WaveformCanvas
                  bars={waveform}
                  currentPosition={timeInfo?.currentTimeMillis ?? 0}
                  trackLength={metrics?.trackLength ?? 0}
                />
              </div>
            {/if}

            <!-- OnAir / Sync -->
            <div class="card-footer-info">
              {#if timeInfo}
                <span class="info-badge" class:on-air={timeInfo.onAir === 1}>
                  {timeInfo.onAir === 1 ? "ON AIR" : "OFF AIR"}
                </span>
              {/if}
              {#if metrics}
                <span class="info-badge" class:sync-master={metrics.syncMaster === 1}>
                  {metrics.syncMaster === 1 ? "MASTER" : "SLAVE"}
                </span>
              {/if}
            </div>
          </div>
        {:else}
          <div class="card-idle">
            <span class="idle-text">No data</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- ミキサー情報バー -->
  {#if store.mixer}
    <div class="mixer-bar">
      <span class="mixer-label">MIXER</span>
      <span class="mixer-item">
        Master: {toPercent(store.mixer.masterAudioLevel as number)}%
      </span>
      <span class="mixer-sep">|</span>
      <span class="mixer-item">
        Fader: {toPercent(store.mixer.masterFaderLevel as number)}%
      </span>
      <span class="mixer-sep">|</span>
      <span class="mixer-item">
        XFader: {toPercent(store.mixer.crossFader as number)}%
      </span>
      <span class="mixer-sep">|</span>
      <span class="mixer-item" class:fx-active={store.mixer.beatFxOn}>
        BeatFX: {store.mixer.beatFxOn ? "ON" : "OFF"}
      </span>
    </div>
  {/if}

  <div class="cards-packet-log">
    <PacketLog />
  </div>
</div>

<style>
  .cards-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .cards-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 8px;
    padding: 8px;
    overflow: hidden;
    min-height: 0;
  }

  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .card.active {
    border-color: var(--accent);
    box-shadow: 0 0 8px rgba(88, 166, 255, 0.15);
  }

  .card.idle {
    opacity: 0.6;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    background: var(--bg-tertiary);
  }

  .card-name {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-primary);
  }

  .card-status {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: bold;
  }

  .card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 8px;
    overflow: hidden;
    min-height: 0;
  }

  .card-meta {
    flex-shrink: 0;
  }

  .meta-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .mini-artwork {
    width: 36px;
    height: 36px;
    border-radius: 3px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .meta-text {
    flex: 1;
    min-width: 0;
  }

  .track-title {
    font-size: 11px;
    color: var(--text-primary);
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .track-artist {
    font-size: 10px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 8px;
    flex-shrink: 0;
  }

  .metric {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1px 0;
  }

  .metric-label {
    font-size: 9px;
    color: var(--text-muted);
  }

  .metric-value {
    font-size: 10px;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .metric.bpm .metric-value {
    color: var(--accent);
    font-weight: bold;
  }

  .beat-pip {
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--bg-tertiary);
    margin-left: 1px;
  }

  .beat-pip.beat-active {
    background: var(--accent);
  }

  .card-waveform {
    flex-shrink: 0;
    /* WaveformCanvasのwrapper paddingを上書きする */
    margin: 0 -8px;
  }

  .card-waveform :global(.waveform-wrapper) {
    padding: 2px 4px;
  }

  .card-waveform :global(.waveform-canvas) {
    height: 40px;
  }

  .card-footer-info {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
    margin-top: auto;
  }

  .info-badge {
    font-size: 9px;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 1px 6px;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .info-badge.on-air {
    color: var(--green);
    background: rgba(63, 185, 80, 0.12);
  }

  .info-badge.sync-master {
    color: var(--yellow);
    background: rgba(210, 153, 34, 0.12);
  }

  .card-idle {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .idle-text {
    color: var(--text-muted);
    font-size: 10px;
    font-style: italic;
  }

  .mixer-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 12px;
    background: var(--bg-tertiary);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    font-size: 10px;
    flex-shrink: 0;
  }

  .mixer-label {
    color: var(--text-muted);
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .mixer-item {
    color: var(--text-secondary);
  }

  .mixer-sep {
    color: var(--text-muted);
  }

  .mixer-item.fx-active {
    color: var(--green);
    font-weight: bold;
  }

  .cards-packet-log {
    height: 180px;
    flex-shrink: 0;
    overflow: hidden;
  }
</style>
