# tcnet-viewer

AGENTS.mdも参照すること。vite-plusのツールチェーンに関する詳細な規約が記載されている。

TCNetプロトコルのリアルタイムビューワー。
@9c5s/node-tcnet ライブラリを使用し、全パケットデータをブラウザで可視化する。

## 起動

```bash
vp install     # 初回のみ (依存解決 + prepare hookでvp configが自動実行)
vp dev
```

http://localhost:5180 で開く。ネットワークアダプタはTCNetトラフィックから自動検出される。
`pnpm dev` でも起動可能。

## テスト・チェック

```bash
vp test          # Vitestでテスト実行
vp check         # Oxfmt + Oxlint + TypeScript型チェック
vp check --fix   # 自動修正付き
```

## 技術スタック

- Svelte 5 + Vite 8 + TypeScript
- Tailwind CSS v4 + DaisyUI v5
- WebSocket (ws) によるリアルタイム通信
- Canvas API (波形描画)
- @9c5s/node-tcnet (GitHub依存: `github:9c5s/node-tcnet`)
- pnpm (パッケージマネージャー)
- vite-plus (CLIツールチェーン: dev/check/test)
- commitlint (Conventional Commits準拠)

## アーキテクチャ

単一プロセス構成。ViteカスタムプラグインでWebSocketサーバーとTCNet接続を同居させる。

```
TCNet UDP → server/tcnet-bridge.ts → WebSocket (/ws) → src/lib/ws-client.ts → Svelte stores → UI
```

### server/ (バックエンド、Vite SSRで実行)

- `index.ts` - Viteプラグイン。WebSocketServer (noServerモード、/wsパス) + ssrLoadModuleでtcnet-bridgeをロード
- `tcnet-bridge.ts` - TCNetClient接続管理。createRequireでCJS版node-tcnetをロード (ESM/CJS互換性のため)
- `types.ts` - WSMessage型定義 (全メッセージ型のdiscriminated union)、BroadcastFn
- `parsers/` - BeatGrid, CUE, Waveform, Mixer, Artwork, MultiPacketのバイナリパーサー
- `utils/` - ansi.ts (stripAnsi)、broadcaster.ts (WebSocketBroadcasterクラス)

### src/ (フロントエンド、Svelte 5)

- `lib/stores.svelte.ts` - $stateルーンによるリアクティブストア (拡張子は.svelte.tsが必須)
- `lib/ws-client.ts` - WebSocket接続 (/wsパス)、自動再接続、メッセージ→ストア反映
- `lib/message-handlers.ts` - WSメッセージハンドラ (createHandlers + dispatchMessage、ストアはDI可能)
- `lib/types.ts` - 型定義、LAYER_NAMES、STATUS_MAP
- `lib/formatting.ts` - 表示用フォーマット関数
- `components/` - 3つのレイアウトモード (Cards/Detail/Table) + 共用コンポーネント

`$lib` パスエイリアスが設定されており、`$lib/types` のようにインポート可能。

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
- @9c5s/node-tcnetはGitHub依存。ローカル開発時にnode-tcnetを修正する場合は`pnpm add link:../node-tcnet`で一時的にローカルリンクに切り替え可能
- vite-plusはimport元に`vite-plus`を使用する (`vite`ではなく`vite-plus`からimport)
- ESLintはTailwind CSS専用リンターとして使用する。JS/TSの一般リントはOxlint (`vp check`) が担当する
- `eslint.config.js` は `betterTailwindcss.rules` から全ルールを動的展開する。パッケージ更新で新ルールが自動有効化される
- `no-unknown-classes` の `ignore` リストはDaisyUI/カスタムクラス追加時に更新が必要
