# Selector policy

## Priority

1. `data-message-author-role`、`data-testid`、`data-type`など意味を持つ属性
2. `main`、`article`、`form`、`pre`、`table`など意味要素
3. 親子関係と`closest()`による構造
4. `.markdown`など意味が安定しているclassを限定的なfallbackとして使用

ビルドごとに変化するhash class、深い`nth-child`、表示文言には依存しない。

## Fail closed

次のいずれかから`main`を確定できた場合だけ適用する。

- `data-message-author-role`を持つAssistantまたはUserメッセージ
- `form[data-type="unified-composer"]`
- `#prompt-textarea`または`contenteditable="true"`から到達できる`form`

設定、ライブラリ、GPT編集画面などでこれらを確認できない場合は適用しない。

## Wide content allowlist

次を含むcontent root直下要素をwide blockとして扱う。

- `pre`
- `table`または`role="table"`
- `figure`、`img`、`svg`、`canvas`
- `.katex-display`
- `data-testid`に`research`または`tool`を含む既知の大型カード

未知のカードはtext blockへフォールバックする。誤って操作UIを全幅化するより、幅が狭い状態を優先する。

## Maintenance

ChatGPT更新後に表示が効かない場合は、まずselector文字列を定義している`src/content/dom-queries.ts`と`src/content/content-targets.ts`を確認する（class付与は`src/content/layout-tagger.ts`、class名は`src/content/class-names.ts`）。selectorを追加する場合は、実DOMで複数種類の会話に共通することを確認し、模擬DOMテストを追加する。
