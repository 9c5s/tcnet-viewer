import type { Plugin, ViteDevServer } from "vite-plus";
import { WebSocketServer, WebSocket } from "ws";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";

// WSMessage型はtype-onlyなのでバンドルから除外される
export type WSMessage = {
  type: string;
  timestamp: number;
  layer?: number;
  data: Record<string, unknown>;
};

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
    const cacheKey = msg.layer !== undefined ? `${msg.type}-${msg.layer}` : msg.type;
    stateCache.set(cacheKey, json);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    }
  };

  return {
    name: "tcnet-websocket",
    async configureServer(server: ViteDevServer) {
      const iface = process.env.TCNET_INTERFACE;

      if (!iface) {
        console.error(
          "[TCNet Plugin] TCNET_INTERFACE required. Usage: TCNET_INTERFACE=10GbE npm run dev",
        );
        process.exit(1);
      }

      // ViteのHMR WebSocketと衝突しないよう、noServerモードで作成し
      // upgradeリクエストのパスが /ws の場合のみハンドルする
      wss = new WebSocketServer({ noServer: true });

      server.httpServer!.on("upgrade", (req, socket, head) => {
        if (req.url && req.url.startsWith("/ws")) {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
          });
        }
      });

      wss.on("connection", (ws) => {
        clients.add(ws);
        console.log(
          `[WS] Client connected (total: ${clients.size}), sending ${stateCache.size} cached messages`,
        );
        // キャッシュ済みの最新状態を新規クライアントに送信する
        for (const json of stateCache.values()) {
          ws.send(json);
        }
        ws.on("close", () => {
          clients.delete(ws);
          console.log(`[WS] Client disconnected (total: ${clients.size})`);
        });
      });

      // ViteのSSRモジュールローダーを使ってtcnet-bridgeをロードする
      // これによりViteのconfig bundling時にnode-tcnetのCJS依存が含まれるのを回避する
      const bridgePath = resolve(__dirname, "tcnet-bridge.ts");
      const bridgeModule = await server.ssrLoadModule(bridgePath);
      const TCNetBridge = bridgeModule.TCNetBridge;
      bridge = new TCNetBridge(iface, broadcast);
      bridge.connect().catch((err: Error) => {
        console.error("[TCNet] Connection failed:", err.message);
      });

      server.httpServer!.on("close", () => {
        bridge.disconnect();
        wss.close();
      });
    },
  };
}
