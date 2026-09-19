namespace Cguic {
  // 会話のメッセージ要素（assistantまたはuser）を特定するためのセレクタ文字列。
  // メイン領域の判定やタグ付け対象メッセージの走査に利用する。
  export const MESSAGE_SELECTOR = [
    '[data-message-author-role="assistant"]',
    '[data-message-author-role="user"]',
  ].join(",");

  // 各発言の会話ターン（article等）を特定するためのセレクタ文字列。
  // 発言を包含する親行を検出しキャンバス幅を適用するために利用する。
  export const TURN_SELECTOR = '[data-testid^="conversation-turn-"], article';

  // 入力欄の親フォーム要素（Unified Composer）を検出するためのセレクタ文字列。
  // 標準的なChatGPT画面構成において入力欄フォームを直接特定するために利用する。
  const PRIMARY_COMPOSER_SELECTOR = 'form[data-type="unified-composer"]';

  // 入力欄の入力フィールド要素を検出するための代替セレクタ文字列。
  // Composerの構造変化時にも祖先フォーム要素をフォールバック特定するために利用する。
  const FALLBACK_COMPOSER_INPUT_SELECTOR = '#prompt-textarea, [contenteditable="true"]';

  // 会話メッセージまたはComposerを含むmain要素を検出する。
  // 拡張機能がレイアウト制御を行うべき会話画面の主領域を特定するために使用する。
  export function findMainRegion(root: ParentNode = document): HTMLElement | null {
    const message = root.querySelector<HTMLElement>(MESSAGE_SELECTOR);
    if (message !== null) {
      return message.closest("main") as HTMLElement | null;
    }

    const composer = findComposer(root);
    return (composer?.closest("main") as HTMLElement | null) ?? null;
  }

  // メイン領域または指定ノード内の入力フォーム要素を検出する。
  // 入力欄およびその外側フレームの探索とタグ付けを行うために使用する。
  export function findComposer(root: ParentNode): HTMLFormElement | null {
    const primary = root.querySelector<HTMLFormElement>(PRIMARY_COMPOSER_SELECTOR);
    if (primary !== null) {
      return primary;
    }

    const input = root.querySelector<HTMLElement>(FALLBACK_COMPOSER_INPUT_SELECTOR);
    return (input?.closest("form") as HTMLFormElement | null) ?? null;
  }

  // Composerからmain直下の幅制御境界となる親フレーム要素を探索する。
  // 入力欄の外側コンテナに幅制御用クラスを付与するために使用する。
  export function findComposerFrame(
    mainRegion: HTMLElement,
    composer: HTMLFormElement,
  ): HTMLElement | null {
    let current = composer.parentElement;
    let frame = current;
    let depth = 0;

    while (current !== null && current !== mainRegion && depth < 5) {
      const parent = current.parentElement;
      if (
        parent === null
        || parent === mainRegion
        || parent.querySelector(MESSAGE_SELECTOR) !== null
      ) {
        break;
      }

      frame = parent;
      current = parent;
      depth += 1;
    }

    return frame;
  }

  // 指定された祖先要素の直下にある子要素のうち、特定の子孫を含むものを探索する。
  // ターン要素直下のフレーム要素を特定して幅制御クラスを付与するために使用する。
  export function findDirectChildUnder(
    ancestor: HTMLElement,
    descendant: HTMLElement,
  ): HTMLElement | null {
    let current: HTMLElement | null = descendant;

    while (current !== null && current.parentElement !== ancestor) {
      current = current.parentElement;
    }

    return current?.parentElement === ancestor ? current : null;
  }
}
