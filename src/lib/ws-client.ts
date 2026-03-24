import { store } from "./stores.svelte.js";
import type { WSMessage } from "./types.js";
import { STATUS_MAP } from "./types.js";
import { formatBPM } from "./formatting.js";

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
    store.tcnetConnected = false;
    reconnectTimer = setTimeout(connect, 2000);
  };

  ws.onmessage = (event) => {
    let msg: WSMessage;
    try {
      msg = JSON.parse(event.data as string) as WSMessage;
    } catch (err) {
      console.error("[WS] メッセージのパースに失敗:", err);
      return;
    }
    try {
      handleMessage(msg);
    } catch (err) {
      console.error("[WS] メッセージ処理に失敗:", err, msg);
    }
  };
}

export function disconnect(): void {
  clearTimeout(reconnectTimer);
  ws?.close();
}

// サーバーから受信したメッセージをストアに反映する
function handleMessage(msg: WSMessage): void {
  switch (msg.type) {
    case "optin":
      store.node = {
        nodeName: msg.data.nodeName,
        nodeType: msg.data.nodeType,
        nodeId: msg.data.nodeId,
        nodeCount: msg.data.nodeCount,
        uptime: msg.data.uptime,
        vendorName: msg.data.vendorName,
        appName: msg.data.appName,
        majorVersion: msg.data.majorVersion,
        minorVersion: msg.data.minorVersion,
        protocolVersion: `3.${msg.data.protocolMinorVersion}`,
      };
      store.addLogEntry(msg.type, undefined, `${msg.data.nodeName} nodes=${msg.data.nodeCount}`);
      break;

    case "optout":
      store.addLogEntry(msg.type, undefined, `node left`);
      break;

    case "status":
      for (let i = 0; i < msg.data.layers.length; i++) {
        const l = msg.data.layers[i];
        store.layers[i] = {
          source: l.source,
          status: STATUS_MAP[l.status] ?? "IDLE",
          trackID: l.trackID,
          name: l.name,
        };
      }
      store.addLogEntry(msg.type, undefined, `nodes=${msg.data.nodeCount}`);
      break;

    case "time":
      for (let i = 0; i < msg.data.layers.length; i++) {
        store.time[i] = msg.data.layers[i] as (typeof store.time)[number];
      }
      store.generalSMPTEMode = msg.data.generalSMPTEMode;
      store.addLogEntry(msg.type, undefined, `smpte=${msg.data.generalSMPTEMode}`);
      break;

    case "metrics":
      store.metrics[msg.layer] = msg.data;
      store.addLogEntry(
        msg.type,
        msg.layer,
        `bpm=${msg.data.bpm != null ? formatBPM(msg.data.bpm) : "N/A"}`,
      );
      break;

    case "metadata":
      store.metadata[msg.layer] = msg.data;
      store.addLogEntry(msg.type, msg.layer, `"${msg.data.trackTitle}"`);
      break;

    case "cue":
      store.cues[msg.layer] = msg.data.cues;
      store.addLogEntry(msg.type, msg.layer, `${msg.data.cues?.length ?? 0} cues`);
      break;

    case "waveform-small":
      store.waveformSmall[msg.layer] = msg.data.bars;
      store.addLogEntry(msg.type, msg.layer, `${msg.data.bars?.length ?? 0} bars`);
      break;

    case "waveform-big":
      store.waveformBig[msg.layer] = msg.data.bars;
      store.addLogEntry(msg.type, msg.layer, `${msg.data.bars?.length ?? 0} bars`);
      break;

    case "mixer":
      store.mixer = msg.data;
      store.addLogEntry(msg.type, undefined, `master=${msg.data.masterAudioLevel}`);
      break;

    case "artwork":
      // サーバー側のartworkパーサーは未実装だが、UIコンポーネントが表示機能を持つ
      store.artwork[msg.layer] = msg.data.base64;
      store.addLogEntry(msg.type, msg.layer, `received`);
      break;

    case "beatgrid":
      store.beatgrid[msg.layer] = msg.data.entries;
      store.addLogEntry(msg.type, msg.layer, `${msg.data.entries?.length ?? 0} beats`);
      break;

    case "tcnet-status":
      store.tcnetConnected = msg.connected;
      store.addLogEntry(
        msg.type,
        undefined,
        msg.connected ? "Bridge connected" : "Bridge disconnected",
      );
      break;

    default: {
      const _exhaustive: never = msg;
      console.warn("[WS] 未処理のメッセージ型:", _exhaustive);
    }
  }
}
