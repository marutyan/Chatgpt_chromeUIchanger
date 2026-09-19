declare function require(name: string): any;

namespace LayoutControllerTests {
  const assert = require("node:assert/strict");
  const test = require("node:test");

  // DOM要素のclassList操作を模倣するテスト用クラス。クラスの追加・削除・含有確認を記録する。
  class FakeClassList {
    private readonly values = new Set<string>();
    add(...names: string[]) { for (const n of names) this.values.add(n); }
    remove(...names: string[]) { for (const n of names) this.values.delete(n); }
    contains(name: string) { return this.values.has(name); }
  }

  // DOM要素のstyleオブジェクトを模倣するテスト用クラス。CSSプロパティの設定・削除を追跡する。
  class FakeStyle {
    private readonly properties = new Map<string, string>();
    setProperty(name: string, value: string) { this.properties.set(name, value); }
    removeProperty(name: string) { this.properties.delete(name); }
    getPropertyValue(name: string) { return this.properties.get(name) ?? ""; }
  }

  // LayoutControllerのターゲット要素（html要素相当）を模倣するテスト用要素。属性やCSS変数の変更を追跡する。
  class FakeTargetElement {
    readonly attributes = new Map<string, string>();
    readonly style = new FakeStyle();
    setAttribute(name: string, value: string) { this.attributes.set(name, value); }
    removeAttribute(name: string) { this.attributes.delete(name); }
    getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  }

  // 会話のメイン領域（main要素）を模倣するテスト用要素。レイアウトクラスの付与と削除を検証する。
  class FakeMainElement {
    readonly classList = new FakeClassList();
    clientWidth = 1400;
    querySelectorAll() { return []; }
    querySelector() { return null; }
  }

  // LayoutStyleの呼び出し状況を監視するためのスパイ用クラス。
  class SpyLayoutStyle extends Cguic.LayoutStyle {
    applyEnabledCallCount = 0;
    override applyEnabled(element: HTMLElement): void {
      this.applyEnabledCallCount++;
      super.applyEnabled(element);
    }
  }

  let currentMain: FakeMainElement | null = null;
  let observeMutationCount = 0;

  // テスト実行に必要な最小限のブラウザ環境グローバルをスタブし、テスト後に元の状態へ復元するクリーンアップ関数を返す。
  function setupBrowserGlobals(): () => void {
    const original = {
      document: (globalThis as any).document,
      Node: (globalThis as any).Node,
      MutationObserver: (globalThis as any).MutationObserver,
      ResizeObserver: (globalThis as any).ResizeObserver,
      requestAnimationFrame: (globalThis as any).requestAnimationFrame,
      cancelAnimationFrame: (globalThis as any).cancelAnimationFrame,
      chrome: (globalThis as any).chrome,
    };

    (globalThis as any).Node = { ELEMENT_NODE: 1 };
    (globalThis as any).MutationObserver = class {
      observe() { observeMutationCount++; }
      disconnect() {}
    };
    (globalThis as any).ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    (globalThis as any).requestAnimationFrame = () => 1;
    (globalThis as any).cancelAnimationFrame = () => {};
    (globalThis as any).chrome = {
      storage: {
        local: { get: async () => ({}) },
        onChanged: { addListener: () => {} },
      },
    };
    (globalThis as any).document = {
      body: {},
      documentElement: {},
      querySelector: (selector: string) => {
        if (currentMain !== null && selector === Cguic.MESSAGE_SELECTOR) {
          return { closest: (tag: string) => (tag === "main" ? currentMain : null) };
        }
        return null;
      },
    };

    return () => {
      currentMain = null;
      observeMutationCount = 0;
      (globalThis as any).document = original.document;
      (globalThis as any).Node = original.Node;
      (globalThis as any).MutationObserver = original.MutationObserver;
      (globalThis as any).ResizeObserver = original.ResizeObserver;
      (globalThis as any).requestAnimationFrame = original.requestAnimationFrame;
      (globalThis as any).cancelAnimationFrame = original.cancelAnimationFrame;
      (globalThis as any).chrome = original.chrome;
    };
  }

  test("setEnabled(true) when already enabled only refreshes without re-enabling", () => {
    const restore = setupBrowserGlobals();
    try {
      const target = new FakeTargetElement();
      const layoutStyle = new SpyLayoutStyle();
      const main = new FakeMainElement();
      main.clientWidth = 1400;
      currentMain = main;

      const controller = new Cguic.LayoutController(
        target as unknown as HTMLElement,
        layoutStyle,
      );

      controller.setEnabled(true);
      assert.equal(layoutStyle.applyEnabledCallCount, 1);
      assert.equal(observeMutationCount, 1);
      assert.equal(target.getAttribute("data-cguic-enabled"), "true");
      assert.equal(target.getAttribute("data-cguic-layout"), "wide");
      assert.equal(target.style.getPropertyValue("--cguic-canvas-width"), "1330px");

      // clientWidth を compact 相当に変更して再実行
      main.clientWidth = 800;
      controller.setEnabled(true);

      // enable は再実行されず、refresh のみが行われてレイアウトが更新される
      assert.equal(layoutStyle.applyEnabledCallCount, 1);
      assert.equal(observeMutationCount, 1);
      assert.equal(target.getAttribute("data-cguic-layout"), "compact");
      assert.equal(target.style.getPropertyValue("--cguic-canvas-width"), "760px");
    } finally {
      restore();
    }
  });

  test("removes main classes when main region is not found on refresh", () => {
    const restore = setupBrowserGlobals();
    try {
      const target = new FakeTargetElement();
      const main = new FakeMainElement();
      main.classList.add("cguic-turn");
      currentMain = main;

      const controller = new Cguic.LayoutController(target as unknown as HTMLElement);
      controller.setEnabled(true);

      assert.equal(main.classList.contains("cguic-turn"), true);

      // main が見つからなくなった状態で refresh
      currentMain = null;
      controller.refresh();

      assert.equal(main.classList.contains("cguic-turn"), false);
    } finally {
      restore();
    }
  });

  test("setEnabled(false) removes target attributes, css variables, and main classes", () => {
    const restore = setupBrowserGlobals();
    try {
      const target = new FakeTargetElement();
      const main = new FakeMainElement();
      main.classList.add("cguic-turn");
      currentMain = main;

      const controller = new Cguic.LayoutController(target as unknown as HTMLElement);
      controller.setEnabled(true);

      assert.equal(target.getAttribute("data-cguic-enabled"), "true");
      assert.equal(target.getAttribute("data-cguic-layout"), "wide");
      assert.notEqual(target.style.getPropertyValue("--cguic-text-width"), "");
      assert.equal(main.classList.contains("cguic-turn"), true);

      controller.setEnabled(false);

      assert.equal(target.getAttribute("data-cguic-enabled"), null);
      assert.equal(target.getAttribute("data-cguic-layout"), null);
      assert.equal(target.style.getPropertyValue("--cguic-gutter"), "");
      assert.equal(target.style.getPropertyValue("--cguic-text-width"), "");
      assert.equal(target.style.getPropertyValue("--cguic-canvas-width"), "");
      assert.equal(main.classList.contains("cguic-turn"), false);
    } finally {
      restore();
    }
  });
}
