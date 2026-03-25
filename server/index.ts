import type { Plugin, ViteDevServer } from "vite-plus";
import type { WSMessage } from "./types.js";
import { WebSocketServer, WebSocket } from "ws";
import { format } from "node:util";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";

export type { WSMessage } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function tcnetPlugin(): Plugin {
  let wss: WebSocketServer;
  let bridge: { connect(): Promise<void>; disconnect(): Promise<void> };
  const clients = new Set<WebSocket>();
  // 最新メッセージをtype+layerでキャッシュし、新規クライアントに送信する
  const stateCache = new Map<string, string>();

  const broadcast = (msg: WSMessage) => {
    const json = JSON.stringify(msg);
    // メッセージをtype+layerでキャッシュする
    const cacheKey =
      "layer" in msg && msg.layer !== undefined ? `${msg.type}-${msg.layer}` : msg.type;
    stateCache.set(cacheKey, json);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    }
  };

  // ANSI制御シーケンスを除去する (Vite等の色付きログ対策)
  // oxlint-disable-next-line no-control-regex -- ANSI ESCを意図的にマッチさせている
  const stripAnsi = (s: string) => s.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");

  const broadcastServerLog = (level: "log" | "warn" | "error", args: unknown[]) => {
    if (clients.size === 0) return;
    let message: string;
    try {
      message = stripAnsi(format(...args));
    } catch {
      message = args.map((a) => String(a)).join(" ");
    }
    const json = JSON.stringify({
      type: "server-log",
      timestamp: Date.now(),
      level,
      message,
    });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    }
  };

  return {
    name: "tcnet-websocket",
    async configureServer(server: ViteDevServer) {
      // テスト環境ではhttpServerがnullのため、WSサーバーセットアップをスキップする
      if (!server.httpServer) {
        return;
      }

      // ViteのHMR WebSocketと衝突しないよう、noServerモードで作成し
      // upgradeリクエストのパスが /ws の場合のみハンドルする
      wss = new WebSocketServer({ noServer: true });

      server.httpServer.on("upgrade", (req, socket, head) => {
        if (req.url && req.url.startsWith("/ws")) {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
          });
        }
      });

      wss.on("connection", (ws) => {
        clients.add(ws);
        console.log(
          `[WS] クライアント接続 (合計: ${clients.size}), キャッシュ ${stateCache.size}件を送信`,
        );
        // キャッシュ済みの最新状態を新規クライアントに送信する
        for (const json of stateCache.values()) {
          ws.send(json);
        }
        ws.on("close", () => {
          clients.delete(ws);
          console.log(`[WS] クライアント切断 (合計: ${clients.size})`);
        });
      });

      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = (...args: unknown[]) => {
        originalLog(...args);
        broadcastServerLog("log", args);
      };
      console.warn = (...args: unknown[]) => {
        originalWarn(...args);
        broadcastServerLog("warn", args);
      };
      console.error = (...args: unknown[]) => {
        originalError(...args);
        broadcastServerLog("error", args);
      };

      // ViteのSSRモジュールローダーを使ってtcnet-bridgeをロードする
      // これによりViteのconfig bundling時にnode-tcnetのCJS依存が含まれるのを回避する
      const bridgePath = resolve(__dirname, "tcnet-bridge.ts");
      const bridgeModule = await server.ssrLoadModule(bridgePath);
      const TCNetBridge = bridgeModule.TCNetBridge;
      bridge = new TCNetBridge({
        broadcast,
        onStatusChange: (connected: boolean) => {
          broadcast({ type: "tcnet-status", connected, timestamp: Date.now() });
        },
      });
      bridge.connect().catch((err: unknown) => {
        console.error("[TCNet] 接続失敗:", err);
      });

      server.httpServer.on("close", () => {
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
        bridge.disconnect();
        wss.close();
      });
    },
  };
}
