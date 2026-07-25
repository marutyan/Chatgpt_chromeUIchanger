# Architecture

## Responsibility

本拡張はChatGPT会話画面の横幅と配置だけを変更する。会話内容、フォント、色、送信処理、認証状態は変更しない。

## Layout model

ChatGPTの`main`要素の実測幅を`W`とする。

- 左右余白: `clamp(16px, 2.5% × W, 48px)`
- 会話キャンバス: `min(W - 2 × 左右余白, 1680px)`
- 本文: `min(会話キャンバス, clamp(1200px, 80% × W, 1400px))`

`W < 960px`では`compact`として幅上書きを停止する。

## Runtime flow

1. `chrome.storage.local`からON/OFFを読み込む
2. 会話メッセージまたはComposerを含む`main`を検出する
3. Assistant turn、User turn、Composerへ拡張固有classを付与する
4. Assistantのcontent root直下をtext blockまたはwide blockへ分類する
5. `ResizeObserver`で`main`幅を監視し、CSS変数を更新する
6. `MutationObserver`でElementの追加・削除を検出し、`requestAnimationFrame`単位で再適用する

## Width separation

- text block: 段落、見出し、箇条書きなど。本文幅を使用する
- wide block: コード、表、画像、グラフ、横長数式、既知の大型ツールカード。会話キャンバス幅を使用する
- User message: 外側のturnだけを会話キャンバスへ揃え、吹き出し自体の幅はChatGPT標準を維持する

## Failure behavior

会話画面を確実に特定できない場合はclassを付与せず、ChatGPT標準表示を維持する。未知のAssistant内要素はtext blockとして扱い、意図せず全幅化しない。
