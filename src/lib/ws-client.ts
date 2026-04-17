import { store } from "./stores.svelte.js";
import type { WSMessage } from "./types.js";
import { createHandlers, dispatchMessage } from "./message-handlers.js";
import { isMockMode, seedMockData } from "./mock-data.js";

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout>;
const handlers = createHandlers(store);

export function connect(): void {
  // ?mock を付けてアクセスした場合は WS 接続せずデザイン確認用モックを投入する
  if (isMockMode()) {
    seedMockData();
    return;
  }

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${protocol}//${location.host}/ws`);

  ws.onopen = () => {
    store.connected = true;
    // 再接続時に前セッションのレイヤーデータをクリアする
    // サーバーからキャッシュ済みデータが再送されるため、不整合を防止する
    store.resetLayerData();
  };

  ws.onerror = (event) => {
    console.error("[WS] エラー:", event);
  };

  ws.onclose = () => {
    store.connected = false;
    store.tcnetConnected = false;
    store.authState = "none";
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
  if (isMockMode()) return;
  clearTimeout(reconnectTimer);
  ws?.close();
}
