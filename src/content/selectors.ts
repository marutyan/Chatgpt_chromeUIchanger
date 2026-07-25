namespace Cguic {
  const MESSAGE_SELECTOR = [
    '[data-message-author-role="assistant"]',
    '[data-message-author-role="user"]',
  ].join(",");
  const TURN_SELECTOR = '[data-testid^="conversation-turn-"], article';
  const PRIMARY_COMPOSER_SELECTOR = 'form[data-type="unified-composer"]';
  const FALLBACK_COMPOSER_INPUT_SELECTOR = '#prompt-textarea, [contenteditable="true"]';

  const TARGET_CLASSES = [
    "cguic-turn",
    "cguic-assistant-turn",
    "cguic-user-turn",
    "cguic-turn-frame",
    "cguic-width-path",
    "cguic-assistant-message",
    "cguic-user-message",
    "cguic-composer",
    "cguic-composer-frame",
    "cguic-composer-path",
    "cguic-content-root",
    "cguic-text-block",
    "cguic-wide-block",
  ] as const;

  export interface TaggedTargets {
    assistantMessages: number;
    userMessages: number;
    composerFound: boolean;
  }

  export function findMainRegion(root: ParentNode = document): HTMLElement | null {
    const message = root.querySelector<HTMLElement>(MESSAGE_SELECTOR);
    if (message !== null) {
      return message.closest("main") as HTMLElement | null;
    }

    const composer = findComposer(root);
    return (composer?.closest("main") as HTMLElement | null) ?? null;
  }

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
      turn.classList.add("cguic-turn", `cguic-${role}-turn`);
      frame?.classList.add("cguic-turn-frame");
      tagWidthPath(message.parentElement, frame);
      message.classList.add(`cguic-${role}-message`);

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
      composer.classList.add("cguic-composer");
      composerFrame?.classList.add("cguic-composer-frame");
      tagClassPath(
        composer.parentElement,
        composerFrame,
        "cguic-composer-path",
      );
    }

    return {
      assistantMessages,
      userMessages,
      composerFound: composer !== null,
    };
  }

  export function clearTargetClasses(root: ParentNode): void {
    for (const className of TARGET_CLASSES) {
      for (const element of root.querySelectorAll<HTMLElement>(`.${className}`)) {
        element.classList.remove(className);
      }
    }
  }

  function findComposer(root: ParentNode): HTMLFormElement | null {
    const primary = root.querySelector<HTMLFormElement>(PRIMARY_COMPOSER_SELECTOR);
    if (primary !== null) {
      return primary;
    }

    const input = root.querySelector<HTMLElement>(FALLBACK_COMPOSER_INPUT_SELECTOR);
    return (input?.closest("form") as HTMLFormElement | null) ?? null;
  }

  function findComposerFrame(
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

  function findDirectChildUnder(
    ancestor: HTMLElement,
    descendant: HTMLElement,
  ): HTMLElement | null {
    let current: HTMLElement | null = descendant;

    while (current !== null && current.parentElement !== ancestor) {
      current = current.parentElement;
    }

    return current?.parentElement === ancestor ? current : null;
  }

  function tagWidthPath(
    start: HTMLElement | null,
    stopExclusive: HTMLElement | null,
  ): void {
    tagClassPath(start, stopExclusive, "cguic-width-path");
  }

  function tagClassPath(
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
