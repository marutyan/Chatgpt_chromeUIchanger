declare function require(name: string): any;

namespace SelectorTests {
  const assert = require("node:assert/strict");
  const test = require("node:test");

  class FakeClassList {
    private readonly values = new Set<string>();

    add(...names: string[]): void {
      for (const name of names) this.values.add(name);
    }

    remove(...names: string[]): void {
      for (const name of names) this.values.delete(name);
    }

    contains(name: string): boolean {
      return this.values.has(name);
    }
  }

  class FakeElement {
    readonly children: FakeElement[] = [];
    readonly classList = new FakeClassList();
    readonly dataset: Record<string, string> = {};
    parentElement: FakeElement | null = null;

    constructor(
      readonly tagName: string,
      readonly attributes: Record<string, string> = {},
    ) {
      const role = attributes["data-message-author-role"];
      if (role !== undefined) this.dataset["messageAuthorRole"] = role;
    }

    append(child: FakeElement): FakeElement {
      child.parentElement = this;
      this.children.push(child);
      return child;
    }

    contains(candidate: FakeElement): boolean {
      return candidate === this || this.children.some((child) => child.contains(candidate));
    }

    querySelector<T>(_selector: string): T | null {
      return (this.querySelectorAll(_selector)[0] as T | undefined) ?? null;
    }

    querySelectorAll<T>(selector: string): T[] {
      const matches: FakeElement[] = [];
      const visit = (element: FakeElement): void => {
        if (element.matches(selector)) matches.push(element);
        for (const child of element.children) visit(child);
      };
      for (const child of this.children) visit(child);
      return matches as T[];
    }

    closest<T>(selector: string): T | null {
      let current: FakeElement | null = this;
      while (current !== null) {
        if (current.matches(selector)) return current as T;
        current = current.parentElement;
      }
      return null;
    }

    private matches(selectorList: string): boolean {
      return selectorList.split(",").some((raw) => {
        const selector = raw.trim();
        if (selector === "main") return this.tagName === "main";
        if (selector === "article") return this.tagName === "article";
        if (selector === "form") return this.tagName === "form";
        if (selector.startsWith(".")) return this.classList.contains(selector.slice(1));
        if (selector === '[data-message-author-role="assistant"]') {
          return this.attributes["data-message-author-role"] === "assistant";
        }
        if (selector === '[data-message-author-role="user"]') {
          return this.attributes["data-message-author-role"] === "user";
        }
        if (selector === '[data-testid^="conversation-turn-"]') {
          return this.attributes["data-testid"]?.startsWith("conversation-turn-") ?? false;
        }
        if (selector === 'form[data-type="unified-composer"]') {
          return this.tagName === "form" && this.attributes["data-type"] === "unified-composer";
        }
        if (selector === "#prompt-textarea") {
          return this.attributes["id"] === "prompt-textarea";
        }
        if (selector === '[contenteditable="true"]') {
          return this.attributes["contenteditable"] === "true";
        }
        return false;
      });
    }
  }

  test("tags assistant, user, and composer without widening the user bubble", () => {
    const main = new FakeElement("main");
    const assistantTurn = main.append(new FakeElement("article", { "data-testid": "conversation-turn-1" }));
    const assistantFrame = assistantTurn.append(new FakeElement("div"));
    const assistantInner = assistantFrame.append(new FakeElement("div"));
    const assistant = assistantInner.append(new FakeElement("div", { "data-message-author-role": "assistant" }));

    const userTurn = main.append(new FakeElement("article", { "data-testid": "conversation-turn-2" }));
    const userFrame = userTurn.append(new FakeElement("div"));
    const userInner = userFrame.append(new FakeElement("div"));
    const user = userInner.append(new FakeElement("div", { "data-message-author-role": "user" }));

    const composerFrame = main.append(new FakeElement("div"));
    const composer = composerFrame.append(new FakeElement("form", { "data-type": "unified-composer" }));

    const result = Cguic.tagLayoutTargets(main as unknown as HTMLElement);

    assert.deepEqual(result, {
      assistantMessages: 1,
      userMessages: 1,
      composerFound: true,
    });
    assert.equal(assistant.classList.contains("cguic-assistant-message"), true);
    assert.equal(assistantFrame.classList.contains("cguic-turn-frame"), true);
    assert.equal(user.classList.contains("cguic-user-message"), true);
    assert.equal(user.classList.contains("cguic-width-path"), false);
    assert.equal(userFrame.classList.contains("cguic-turn-frame"), true);
    assert.equal(composer.classList.contains("cguic-composer"), true);
    assert.equal(composerFrame.classList.contains("cguic-composer-frame"), true);
  });
}
