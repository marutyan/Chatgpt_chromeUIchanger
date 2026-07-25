namespace Cguic {
  const EXPLICIT_CONTENT_ROOT_SELECTOR = [
    "[data-message-content]",
    ".markdown",
    '[class~="markdown"]',
  ].join(",");

  const SEMANTIC_BLOCK_SELECTOR = [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "blockquote",
    "pre",
    "table",
    "figure",
    "details",
    "hr",
  ].join(",");

  const WIDE_CONTENT_SELECTOR = [
    "pre",
    "table",
    "figure",
    "img",
    "svg",
    "canvas",
    '[role="table"]',
    ".katex-display",
    '[data-testid*="research" i]',
    '[data-testid*="tool" i]',
  ].join(",");

  export interface ContentTargets {
    textBlocks: number;
    wideBlocks: number;
  }

  export function tagAssistantContent(message: HTMLElement): ContentTargets {
    const root = findContentRoot(message);
    clearContentClasses(message);
    root.classList.add("cguic-content-root");

    let textBlocks = 0;
    let wideBlocks = 0;

    for (const childElement of root.children) {
      const child = childElement as HTMLElement;

      if (isWideContent(child)) {
        child.classList.add("cguic-wide-block");
        wideBlocks += 1;
      } else {
        child.classList.add("cguic-text-block");
        textBlocks += 1;
      }
    }

    return { textBlocks, wideBlocks };
  }

  export function clearContentClasses(root: ParentNode): void {
    const rootClassList = (root as ParentNode & { classList?: DOMTokenList }).classList;

    for (const className of [
      "cguic-content-root",
      "cguic-text-block",
      "cguic-wide-block",
    ]) {
      rootClassList?.remove(className);
      for (const element of root.querySelectorAll<HTMLElement>(`.${className}`)) {
        element.classList.remove(className);
      }
    }
  }

  function findContentRoot(message: HTMLElement): HTMLElement {
    const explicit = message.querySelector<HTMLElement>(
      EXPLICIT_CONTENT_ROOT_SELECTOR,
    );
    if (explicit !== null) {
      return explicit;
    }

    let bestCandidate = message;
    let bestScore = scoreContentRoot(message);

    for (const candidate of message.querySelectorAll<HTMLElement>("div")) {
      const score = scoreContentRoot(candidate);
      if (score > bestScore) {
        bestCandidate = candidate;
        bestScore = score;
      }
    }

    return bestCandidate;
  }

  function scoreContentRoot(candidate: HTMLElement): number {
    let score = 0;

    for (const childElement of candidate.children) {
      const child = childElement as HTMLElement;

      if (child.matches(SEMANTIC_BLOCK_SELECTOR)) {
        score += 2;
      } else if (child.querySelector(SEMANTIC_BLOCK_SELECTOR) !== null) {
        score += 1;
      }

      if (isWideContent(child)) {
        score += 2;
      }
    }

    return score;
  }

  function isWideContent(element: HTMLElement): boolean {
    return element.matches(WIDE_CONTENT_SELECTOR)
      || element.querySelector(WIDE_CONTENT_SELECTOR) !== null;
  }
}
