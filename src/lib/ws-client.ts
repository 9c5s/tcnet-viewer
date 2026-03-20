import { store } from "./stores.svelte.js";
import type { WSMessage } from "./types.js";
import { STATUS_MAP } from "./types.js";

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout>;

export function connect(): void {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${protocol}//${location.host}/ws`);

  ws.onopen = () => {
    store.connected = true;
  };

  ws.onclose = () => {
    store.connected = false;
    reconnectTimer = setTimeout(connect, 2000);
  };

  ws.onmessage = (event) => {
    try {
      const msg: WSMessage = JSON.parse(event.data as string);
      handleMessage(msg);
    } catch (err) {
      console.error("[WS] メッセージのパースに失敗:", err);
    }
  };
}

export function disconnect(): void {
  clearTimeout(reconnectTimer);
  ws?.close();
}

// サーバーから受信したメッセージをストアに反映する
function handleMessage(msg: WSMessage): void {
  const { type, data } = msg;
  const layer = "layer" in msg ? msg.layer : undefined;

  switch (type) {
    case "optin":
      store.node = {
        nodeName: data.nodeName as string,
        nodeType: data.nodeType as number,
        nodeId: data.nodeId as number,
        nodeCount: data.nodeCount as number,
        uptime: data.uptime as number,
        vendorName: data.vendorName as string,
        appName: data.appName as string,
        majorVersion: data.majorVersion as number,
        minorVersion: data.minorVersion as number,
        protocolVersion: `3.${data.protocolMinorVersion}`,
      };
      store.addLogEntry(type, undefined, `${data.nodeName} nodes=${data.nodeCount}`);
      break;

    case "status":
      if (data.layers) {
        const layers = data.layers as Array<{
          source: number;
          status: number;
          trackID: number;
          name: string;
        }>;
        for (let i = 0; i < layers.length; i++) {
          const l = layers[i];
          store.layers[i] = {
            source: l.source,
            status: STATUS_MAP[l.status] ?? "IDLE",
            trackID: l.trackID,
            name: l.name,
          };
        }
      }
      store.addLogEntry(type, undefined, `nodes=${data.nodeCount}`);
      break;

    case "time":
      if (data.layers) {
        const layers = data.layers as Array<Record<string, unknown>>;
        for (let i = 0; i < layers.length; i++) {
          store.time[i] = layers[i] as unknown as (typeof store.time)[number];
        }
      }
      store.generalSMPTEMode = data.generalSMPTEMode as number;
      store.addLogEntry(type, undefined, `smpte=${data.generalSMPTEMode}`);
      break;

    case "metrics":
      if (typeof layer === "number") {
        store.metrics[layer] = data as unknown as (typeof store.metrics)[number];
        store.addLogEntry(type, layer, `bpm=${((data.bpm as number) / 100).toFixed(2)}`);
      }
      break;

    case "metadata":
      if (typeof layer === "number") {
        store.metadata[layer] = data as unknown as (typeof store.metadata)[number];
        store.addLogEntry(type, layer, `"${data.trackTitle}"`);
      }
      break;

    case "cue":
      if (typeof layer === "number") {
        store.cues[layer] = data.cues as Array<
          Record<string, unknown>
        > as unknown as (typeof store.cues)[number];
        const cues = data.cues as Array<unknown> | undefined;
        store.addLogEntry(type, layer, `${cues?.length ?? 0} cues`);
      }
      break;

    case "waveform-small":
      if (typeof layer === "number") {
        store.waveformSmall[layer] = data.bars as Array<
          Record<string, unknown>
        > as unknown as (typeof store.waveformSmall)[number];
        const bars = data.bars as Array<unknown> | undefined;
        store.addLogEntry(type, layer, `${bars?.length ?? 0} bars`);
      }
      break;

    case "waveform-big":
      if (typeof layer === "number") {
        store.waveformBig[layer] = data.bars as Array<
          Record<string, unknown>
        > as unknown as (typeof store.waveformBig)[number];
        const bars = data.bars as Array<unknown> | undefined;
        store.addLogEntry(type, layer, `${bars?.length ?? 0} bars`);
      }
      break;

    case "mixer":
      store.mixer = data;
      store.addLogEntry(type, undefined, `master=${data.masterAudioLevel}`);
      break;

    case "artwork":
      if (typeof layer === "number") {
        store.artwork[layer] = data.base64 as string;
        store.addLogEntry(type, layer, `received`);
      }
      break;

    case "beatgrid":
      if (typeof layer === "number") {
        const entries = data.entries as Array<unknown> | undefined;
        store.addLogEntry(type, layer, `${entries?.length ?? 0} beats`);
      }
      break;

    case "optout":
      store.addLogEntry(type, undefined, `node left`);
      break;
  }
}
