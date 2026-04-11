import { type Plugin, type ViteDevServer, loadEnv } from "vite-plus";
import type { WSMessage, AuthState } from "./types.ts";
import { WebSocketServer } from "ws";
import { format } from "node:util";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import { WebSocketBroadcaster } from "./utils/broadcaster.ts";
import { stripAnsi } from "./utils/ansi.ts";

export type { WSMessage } from "./types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function tcnetPlugin(): Plugin {
  let wss: WebSocketServer;
  let bridge: { connect(): Promise<void>; disconnect(): Promise<void> };
  const broadcaster = new WebSocketBroadcaster({ stripAnsi, format });

  return {
    name: "tcnet-websocket",
    config(_, { mode }) {
      // .envファイルの変数をprocess.envに反映する (VITE_プレフィックスなしも含む)
      // node-tcnetのTCNetConfigurationがprocess.env.TCNET_XTEA_CIPHERTEXTを参照するため必要
      const env = loadEnv(mode, process.cwd(), "");
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    },
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
        broadcaster.addClient(ws);
        console.log(
          `[WS] クライアント接続 (合計: ${broadcaster.getClientCount()}), キャッシュ ${broadcaster.getCachedState().size}件を送信`,
        );
        broadcaster.sendCachedState(ws);
        ws.on("close", () => {
          broadcaster.removeClient(ws);
          console.log(`[WS] クライアント切断 (合計: ${broadcaster.getClientCount()})`);
        });
      });

      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = (...args: unknown[]) => {
        originalLog(...args);
        broadcaster.broadcastServerLog("log", args);
      };
      console.warn = (...args: unknown[]) => {
        originalWarn(...args);
        broadcaster.broadcastServerLog("warn", args);
      };
      console.error = (...args: unknown[]) => {
        originalError(...args);
        broadcaster.broadcastServerLog("error", args);
      };

      const restoreConsole = () => {
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
      };

      // ViteのSSRモジュールローダーを使ってtcnet-bridgeをロードする
      try {
        const bridgePath = resolve(__dirname, "tcnet-bridge.ts");
        const bridgeModule = await server.ssrLoadModule(bridgePath);
        const TCNetBridge = bridgeModule.TCNetBridge;
        bridge = new TCNetBridge({
          broadcast: (msg: WSMessage) => broadcaster.broadcast(msg),
          onStatusChange: (connected: boolean, authState: AuthState) => {
            broadcaster.broadcast({
              type: "tcnet-status",
              connected,
              authState,
              timestamp: Date.now(),
            });
          },
        });
      } catch (err) {
        restoreConsole();
        throw err;
      }
      bridge.connect().catch((err: unknown) => {
        console.error("[TCNet] 接続失敗:", err);
      });

      let cleanupCalled = false;
      const cleanup = async () => {
        if (cleanupCalled) return;
        cleanupCalled = true;
        restoreConsole();
        await bridge.disconnect();
        wss.close();
      };

      server.httpServer.on("close", () => {
        cleanup().catch((err) => {
          console.error("[Cleanup] クリーンアップ中にエラーが発生しました:", err);
        });
      });

      // taskkill (Windows) や kill (Unix) でプロセスが終了する際にも
      // TCNetクライアントの切断パケットを送信する
      for (const signal of ["SIGINT", "SIGTERM"] as const) {
        process.on(signal, () => {
          cleanup()
            .catch((err) => {
              console.error("[Cleanup] クリーンアップ中にエラーが発生しました:", err);
            })
            .finally(() => process.exit(0));
        });
      }
    },
  };
}
