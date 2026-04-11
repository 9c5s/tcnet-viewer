import { store } from "$lib/stores.svelte.js";

const DEFAULT_LOG_FILTERS: Record<string, boolean> = {
  time: false,
  status: false,
  metrics: true,
  metadata: true,
  optin: false,
  optout: true,
  cue: true,
  beatgrid: true,
  "waveform-small": true,
  "waveform-big": true,
  mixer: true,
  artwork: true,
  server: true,
  "tcnet-error": true,
  appdata: true,
};

// ストアを初期状態にリセットする
export function resetStore(): void {
  store.node = null;
  store.connected = false;
  store.tcnetConnected = false;
  store.authState = "none";
  store.hideIdleLayers = false;
  store.packetLogHeight = 200;
  store.mixer = null;
  store.generalSMPTEMode = 0;
  store.selectedLayer = 0;
  store.packetLog.splice(0, store.packetLog.length);

  for (const key of Object.keys(store.logFilters)) {
    store.logFilters[key] = DEFAULT_LOG_FILTERS[key] ?? true;
  }

  for (let i = 0; i < 8; i++) {
    store.layers[i] = { source: 0, status: "IDLE", trackID: 0, name: "" };
    store.time[i] = null;
    store.metrics[i] = null;
    store.metadata[i] = null;
    store.cues[i] = null;
    store.waveformSmall[i] = null;
    store.waveformBig[i] = null;
    store.artwork[i] = null;
    store.beatgrid[i] = null;
  }
}
