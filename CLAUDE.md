# tcnet-viewer

TCNetプロトコルのリアルタイムデバッグビューワー。
@s0/node-tcnet ライブラリを使用し、全パケットデータをブラウザで可視化する。

## 起動

```bash
TCNET_INTERFACE=10GbE npm run dev
```

http://localhost:5180 で開く。`TCNET_INTERFACE` は必須 (ネットワークインターフェース名)。

## 技術スタック

- Svelte 5 + Vite 6 + TypeScript
- WebSocket (ws) によるリアルタイム通信
- Canvas API (波形描画)
- @s0/node-tcnet (ローカル依存: `file:../node-tcnet`)

## アーキテクチャ

単一プロセス構成。ViteカスタムプラグインでWebSocketサーバーとTCNet接続を同居させる。

```
TCNet UDP → server/tcnet-bridge.ts → WebSocket (/ws) → src/lib/ws-client.ts → Svelte stores → UI
```

### server/ (バックエンド、Vite SSRで実行)

- `index.ts` - Viteプラグイン。WebSocketServer (noServerモード、/wsパス) + ssrLoadModuleでtcnet-bridgeをロード
- `tcnet-bridge.ts` - TCNetClient接続管理。createRequireでCJS版node-tcnetをロード (ESM/CJS互換性のため)
- `parsers/` - BeatGrid, CUE, Waveform, Mixer, Artworkのバイナリパーサー

### src/ (フロントエンド、Svelte 5)

- `lib/stores.svelte.ts` - $stateルーンによるリアクティブストア (拡張子は.svelte.tsが必須)
- `lib/ws-client.ts` - WebSocket接続 (/wsパス)、自動再接続、メッセージ→ストア反映
- `lib/types.ts` - 型定義、LAYER_NAMES、STATUS_MAP
- `components/` - 3つのレイアウトモード (Cards/Detail/Table) + 共用コンポーネント

## レイアウトモード

右上のボタンで切替。store.layoutModeで管理。

- **Cards** - 8レイヤーのカードグリッド (CardsLayout.svelte)
- **Detail** - サイドバー + マスターディテール (Dashboard.svelte)
- **Table** - 全レイヤーの全データをテーブル表示 (TableLayout.svelte)

## 注意事項

- ViteのHMR WebSocketと衝突するため、アプリのWSはnoServerモード + /wsパスで分離している
- node-tcnetのESM importはVite SSR変換と非互換。createRequireでCJS版をロードする
- Svelte 5の$stateルーンは.svelte.tsファイルでのみ使用可能
- Bridgeは曲変更直後のメタデータリクエストに空を返すことがある。500ms間隔で最大6回リトライする
- stateCache (server/index.ts) で最新メッセージをキャッシュし、新規WSクライアントに即送信する
- @s0/node-tcnetはローカルパス依存。src/network.tsのTCNetDataPacketsで未実装タイプをTCNetDataPacket基底クラスに変更済み
