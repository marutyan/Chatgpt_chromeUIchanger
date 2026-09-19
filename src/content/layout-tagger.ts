namespace Cguic {
  // レイアウト対象要素へのクラス付与結果を集計したインターフェース。
  // メッセージ件数やComposer検出状況を呼び出し元へ通知するために使用する。
  export interface TaggedTargets {
    assistantMessages: number;
    userMessages: number;
    composerFound: boolean;
  }

  // main要素配下のターン、メッセージ、Composerおよびその経路要素にレイアウト用クラスを付与する。
  // CSSの横幅制御ルールを適用するために必要なクラス群をDOMへ付与するために使用する。
  export function tagLayoutTargets(mainRegion: HTMLElement): TaggedTargets {
    let assistantMessages = 0;
    let userMessages = 0;

    for (const message of mainRegion.querySelectorAll<HTMLElement>(MESSAGE_SELECTOR)) {
      const role = message.dataset["messageAuthorRole"];
      if (role !== "assistant" && role !== "user") {
        continue;
      }

      const turn = message.closest(TURN_SELECTOR) as HTMLElement | null;
      if (turn === null || !mainRegion.contains(turn)) {
        continue;
      }

      const frame = findDirectChildUnder(turn, message);
      turn.classList.add(CLASS_NAMES.turn, CLASS_NAMES.roleTurn[role]);
      frame?.classList.add(CLASS_NAMES.turnFrame);
      tagClassPath(message.parentElement, frame, CLASS_NAMES.widthPath);
      message.classList.add(CLASS_NAMES.roleMessage[role]);

      if (role === "assistant") {
        tagAssistantContent(message);
        assistantMessages += 1;
      } else {
        userMessages += 1;
      }
    }

    const composer = findComposer(mainRegion);
    if (composer !== null) {
      const composerFrame = findComposerFrame(mainRegion, composer);
      composer.classList.add(CLASS_NAMES.composer);
      composerFrame?.classList.add(CLASS_NAMES.composerFrame);
      tagClassPath(
        composer.parentElement,
        composerFrame,
        CLASS_NAMES.composerPath,
      );
    }

    return {
      assistantMessages,
      userMessages,
      composerFound: composer !== null,
    };
  }

  // 開始要素から終了要素の直前までの祖先経路上の各要素に指定のCSSクラスを付与する。
  // 幅制約を持つ途中のラッパー要素群の幅を全幅化してレイアウト崩れを防ぐために使用する。
  export function tagClassPath(
    start: HTMLElement | null,
    stopExclusive: HTMLElement | null,
    className: string,
  ): void {
    let current = start;

    while (current !== null && current !== stopExclusive) {
      current.classList.add(className);
      current = current.parentElement;
    }
  }
}
