declare function require(name: string): any;

namespace LayoutStyleTests {
  const assert = require("node:assert/strict");
  const test = require("node:test");

  // スタイル属性の設定・取得・削除を追跡するためのテスト用スタイルオブジェクト。DOM要素のCSSプロパティ操作の検証に使用する。
  class FakeStyle {
    private readonly properties = new Map<string, string>();
    setPropertyCallCount = 0;

    setProperty(name: string, value: string): void {
      this.setPropertyCallCount++;
      this.properties.set(name, value);
    }

    removeProperty(name: string): void {
      this.properties.delete(name);
    }

    getPropertyValue(name: string): string {
      return this.properties.get(name) ?? "";
    }
  }

  // LayoutStyle による属性とインラインスタイルの変更をNode.js環境で検証するための擬似要素。
  class FakeStyleElement {
    readonly attributes = new Map<string, string>();
    readonly style = new FakeStyle();

    setAttribute(name: string, value: string): void {
      this.attributes.set(name, value);
    }

    removeAttribute(name: string): void {
      this.attributes.delete(name);
    }

    getAttribute(name: string): string | null {
      return this.attributes.get(name) ?? null;
    }
  }

  test("applyEnabled sets data-cguic-enabled attribute", () => {
    const layoutStyle = new Cguic.LayoutStyle();
    const element = new FakeStyleElement();

    layoutStyle.applyEnabled(element as unknown as HTMLElement);

    assert.equal(element.getAttribute("data-cguic-enabled"), "true");
  });

  test("applyLayoutMetrics sets layout attribute and css variables", () => {
    const layoutStyle = new Cguic.LayoutStyle();
    const element = new FakeStyleElement();
    const metrics: Cguic.LayoutMetrics = {
      mainWidthPx: 1400,
      gutterPx: 35,
      textWidthPx: 1120,
      canvasWidthPx: 1330,
      compact: false,
    };

    const applied = layoutStyle.applyLayoutMetrics(
      element as unknown as HTMLElement,
      metrics,
    );

    assert.equal(applied, true);
    assert.equal(element.getAttribute("data-cguic-layout"), "wide");
    assert.equal(element.style.getPropertyValue("--cguic-gutter"), "35px");
    assert.equal(element.style.getPropertyValue("--cguic-text-width"), "1120px");
    assert.equal(element.style.getPropertyValue("--cguic-canvas-width"), "1330px");
  });

  test("applyLayoutMetrics sets compact layout when metrics.compact is true", () => {
    const layoutStyle = new Cguic.LayoutStyle();
    const element = new FakeStyleElement();
    const compactMetrics: Cguic.LayoutMetrics = {
      mainWidthPx: 800,
      gutterPx: 20,
      textWidthPx: 640,
      canvasWidthPx: 760,
      compact: true,
    };

    const applied = layoutStyle.applyLayoutMetrics(
      element as unknown as HTMLElement,
      compactMetrics,
    );

    assert.equal(applied, true);
    assert.equal(element.getAttribute("data-cguic-layout"), "compact");
  });

  test("applyLayoutMetrics suppresses duplicate updates for identical metrics", () => {
    const layoutStyle = new Cguic.LayoutStyle();
    const element = new FakeStyleElement();
    const metrics: Cguic.LayoutMetrics = {
      mainWidthPx: 1400,
      gutterPx: 35,
      textWidthPx: 1120,
      canvasWidthPx: 1330,
      compact: false,
    };

    const firstResult = layoutStyle.applyLayoutMetrics(
      element as unknown as HTMLElement,
      metrics,
    );
    assert.equal(firstResult, true);
    const initialCallCount = element.style.setPropertyCallCount;

    const secondResult = layoutStyle.applyLayoutMetrics(
      element as unknown as HTMLElement,
      { ...metrics },
    );
    assert.equal(secondResult, false);
    assert.equal(element.style.setPropertyCallCount, initialCallCount);
  });

  test("clear removes attributes and css variables, and resets metrics cache", () => {
    const layoutStyle = new Cguic.LayoutStyle();
    const element = new FakeStyleElement();
    const metrics: Cguic.LayoutMetrics = {
      mainWidthPx: 1400,
      gutterPx: 35,
      textWidthPx: 1120,
      canvasWidthPx: 1330,
      compact: false,
    };

    layoutStyle.applyEnabled(element as unknown as HTMLElement);
    layoutStyle.applyLayoutMetrics(element as unknown as HTMLElement, metrics);

    layoutStyle.clear(element as unknown as HTMLElement);

    assert.equal(element.getAttribute("data-cguic-enabled"), null);
    assert.equal(element.getAttribute("data-cguic-layout"), null);
    assert.equal(element.style.getPropertyValue("--cguic-gutter"), "");
    assert.equal(element.style.getPropertyValue("--cguic-text-width"), "");
    assert.equal(element.style.getPropertyValue("--cguic-canvas-width"), "");

    const reapplyResult = layoutStyle.applyLayoutMetrics(
      element as unknown as HTMLElement,
      metrics,
    );
    assert.equal(reapplyResult, true);
    assert.equal(element.getAttribute("data-cguic-layout"), "wide");
  });
}
