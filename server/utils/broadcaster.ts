import type { WSMessage } from "../types.ts";

// WebSocket互換のインターフェース (テスト時にモック可能にするため)
interface WSClient {
  readyState: number;
  send(data: string): void;
}

const WS_OPEN = 1;

export class WebSocketBroadcaster {
  private clients = new Set<WSClient>();
  private stateCache = new Map<string, string>();

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
    // メッセージをtype+layerでキャッシュする
    const cacheKey =
      "layer" in msg && msg.layer !== undefined ? `${msg.type}-${msg.layer}` : msg.type;
    this.stateCache.set(cacheKey, json);
    for (const client of this.clients) {
      if (client.readyState === WS_OPEN) {
        client.send(json);
      }
    }
  }

  broadcastServerLog(
    level: "log" | "warn" | "error",
    args: unknown[],
    stripAnsi: (s: string) => string,
    format: (...args: unknown[]) => string,
  ): void {
    if (this.clients.size === 0) return;
    let message: string;
    try {
      message = stripAnsi(format(...args));
    } catch {
      message = stripAnsi(args.map((a) => String(a)).join(" "));
    }
    const json = JSON.stringify({
      type: "server-log",
      timestamp: Date.now(),
      level,
      message,
    });
    for (const client of this.clients) {
      if (client.readyState === WS_OPEN) {
        client.send(json);
      }
    }
  }

  sendCachedState(ws: WSClient): void {
    for (const json of this.stateCache.values()) {
      ws.send(json);
    }
  }
}
