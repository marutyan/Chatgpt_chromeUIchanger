namespace Cguic {
  // 会話メッセージの送信者ロールを表す型。
  // 送信者ごとに異なるスタイル適用と要素識別のために使用する。
  export type MessageRole = "assistant" | "user";

  // 拡張機能がDOM要素へ付与するCSSクラス名の一覧。
  // クラス名の文字列リテラルを一元管理し、付与箇所の分散や命名ブレを防ぐために定義する。
  export const CLASS_NAMES = {
    turn: "cguic-turn",
    assistantTurn: "cguic-assistant-turn",
    userTurn: "cguic-user-turn",
    turnFrame: "cguic-turn-frame",
    widthPath: "cguic-width-path",
    assistantMessage: "cguic-assistant-message",
    userMessage: "cguic-user-message",
    composer: "cguic-composer",
    composerFrame: "cguic-composer-frame",
    composerPath: "cguic-composer-path",
    contentRoot: "cguic-content-root",
    textBlock: "cguic-text-block",
    wideBlock: "cguic-wide-block",
  } as const;

  // ロール別のターン要素に付与するCSSクラス名の対応表。
  // ロールに応じたクラス名を動的組み立てなしで安全に参照するために定義する。
  export const ROLE_TURN_CLASSES = {
    assistant: CLASS_NAMES.assistantTurn,
    user: CLASS_NAMES.userTurn,
  } as const;

  // ロール別のメッセージ要素に付与するCSSクラス名の対応表。
  // ロールに応じたクラス名を動的組み立てなしで安全に参照するために定義する。
  export const ROLE_MESSAGE_CLASSES = {
    assistant: CLASS_NAMES.assistantMessage,
    user: CLASS_NAMES.userMessage,
  } as const;

  // アシスタントメッセージ本文内の要素に付与されるCSSクラス名群。
  // メッセージの更新時に本文領域のクラスのみを先行して安全に初期化するために使用する。
  export const CONTENT_CLASSES = [
    CLASS_NAMES.contentRoot,
    CLASS_NAMES.textBlock,
    CLASS_NAMES.wideBlock,
  ] as const;

  // 拡張機能が付与するすべてのCSSクラス名の配列。
  // 拡張機能の無効化時やメイン領域デタッチ時に、DOMから拡張の変更を完全に除去するために使用する。
  export const ALL_CGUIC_CLASSES: readonly string[] = Object.values(CLASS_NAMES);

  // 指定されたルート要素自身およびその子孫要素から、指定されたクラス群を除去する。
  // DOMの再タグ付け時やクリーンアップ時に、以前付与したクラスの残留を防ぐために使用する。
  export function removeClasses(
    root: ParentNode,
    classNames: readonly string[],
  ): void {
    const rootClassList = (root as ParentNode & { classList?: DOMTokenList }).classList;
    for (const className of classNames) {
      rootClassList?.remove(className);
      for (const element of root.querySelectorAll<HTMLElement>(`.${className}`)) {
        element.classList.remove(className);
      }
    }
  }

  // 拡張機能が付与した全クラスをルート要素自身およびその子孫から除去する。
  // 拡張機能の停止時や会話画面の切り替え時に標準状態のレイアウトへ復帰させるために使用する。
  export function clearTargetClasses(root: ParentNode): void {
    removeClasses(root, ALL_CGUIC_CLASSES);
  }
}
