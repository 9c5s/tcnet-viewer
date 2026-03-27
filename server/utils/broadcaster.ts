import type { WSMessage } from "../types.ts";

// WebSocket互換のインターフェース (テスト時にモック可能にするため)
// readyState: 1=OPEN (WebSocket.OPEN相当), 3=CLOSED (WebSocket.CLOSED相当)
interface WSClient {
  readyState: number;
  send(data: string): void;
}

const WS_OPEN = 1;

export type BroadcasterOptions = {
  stripAnsi: (s: string) => string;
  format: (...args: unknown[]) => string;
};

export class WebSocketBroadcaster {
  // キャッシュ対象外の一過性メッセージタイプ
  private static readonly TRANSIENT_TYPES: ReadonlySet<string> = new Set([
    "tcnet-error",
    "appdata",
  ]);

  private clients = new Set<WSClient>();
  private stateCache = new Map<string, string>();
  private readonly stripAnsi: (s: string) => string;
  private readonly format: (...args: unknown[]) => string;

  constructor(options: BroadcasterOptions) {
    this.stripAnsi = options.stripAnsi;
    this.format = options.format;
  }

  addClient(ws: WSClient): void {
    this.clients.add(ws);
  }

  removeClient(ws: WSClient): void {
    this.clients.delete(ws);
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getCachedState(): ReadonlyMap<string, string> {
    return this.stateCache;
  }

  broadcast(msg: WSMessage): void {
    const json = JSON.stringify(msg);
    if (!WebSocketBroadcaster.TRANSIENT_TYPES.has(msg.type)) {
      // 一過性でないメッセージのみtype+layerでキャッシュする
      const cacheKey =
        "layer" in msg && msg.layer !== undefined ? `${msg.type}-${msg.layer}` : msg.type;
      this.stateCache.set(cacheKey, json);
    }
    this.sendToAll(json);
  }

  broadcastServerLog(level: "log" | "warn" | "error", args: unknown[]): void {
    if (this.clients.size === 0) return;
    let message: string;
    try {
      message = this.stripAnsi(this.format(...args));
    } catch {
      message = this.stripAnsi(args.map((a) => String(a)).join(" "));
    }
    this.sendToAll(JSON.stringify({ type: "server-log", timestamp: Date.now(), level, message }));
  }

  sendCachedState(ws: WSClient): void {
    if (ws.readyState !== WS_OPEN) return;
    for (const json of this.stateCache.values()) {
      ws.send(json);
    }
  }

  private sendToAll(json: string): void {
    for (const client of this.clients) {
      if (client.readyState === WS_OPEN) {
        client.send(json);
      }
    }
  }
}
