# ChatGPT Chrome UI Changer

ChatGPTの会話画面を横長ディスプレイへ適応させる、ローカル利用向けChrome拡張です。

## 現在の状態

開発基盤のみを提供しています。レスポンシブな幅変更は後続Issueで実装します。

## 設計方針

- 対象は`https://chatgpt.com/*`のみ
- Manifest V3
- TypeScript
- 外部通信なし
- 会話内容・入力内容を保存しない
- Chrome権限は`storage`のみ
- 設定としてON/OFF状態だけを保存

## 開発

### 必要環境

- Node.js 22以上
- npm

### セットアップ

```bash
npm install
```

### 検証

```bash
npm run typecheck
npm test
```

### ビルド

```bash
npm run build
```

成果物は`dist/`へ生成されます。

## Chromeへの読み込み

1. `chrome://extensions/`を開く
2. 「デベロッパー モード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」を選ぶ
4. このリポジトリの`dist/`を指定する

更新後は`npm run build`を実行し、拡張機能一覧から再読み込みしてください。

## 削除

`chrome://extensions/`から本拡張を削除してください。ChatGPT側へデータや設定は書き込みません。

## Privacy

本拡張は外部サーバーへ通信しません。会話本文、入力内容、Cookie、認証情報、添付ファイルを収集・保存しません。
