import { store } from "./stores.svelte.js";
import type { WSMessage } from "./types.js";
import { createHandlers, dispatchMessage } from "./message-handlers.js";

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout>;
const handlers = createHandlers(store);

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
      dispatchMessage(msg, handlers);
    } catch (err) {
      console.error("[WS] メッセージ処理に失敗:", err, msg);
    }
  };
}

export function disconnect(): void {
  clearTimeout(reconnectTimer);
  ws?.close();
}
